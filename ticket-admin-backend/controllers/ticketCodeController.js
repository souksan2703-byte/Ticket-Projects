const QRCode = require('qrcode');
const { sql, getPool } = require('../config/db');
const { generateCodesForEvent } = require('../utils/ticketCodeGenerator');

// แปลง status(bit) + myticket(bit) ในฐานข้อมูล ให้เป็นสถานะที่แสดงผลได้ตรงกับ UI
// status=1            -> Available (ยังไม่ขาย)
// status=0, myticket=0 -> Sold (ขายแล้ว ยังไม่มารับตั๋ว)
// status=0, myticket=1 -> Used (ขายแล้วและรับตั๋วไปแล้ว)
const STATUS_CASE_SQL = `
    CASE
        WHEN tc.status = 1 THEN 'Available'
        WHEN tc.status = 0 AND tc.myticket = 1 THEN 'Used'
        ELSE 'Sold'
    END
`;

// GET /api/ticket-codes?tickid=&status=&search=
async function getAllCodes(req, res) {
    try {
        const { tickid, status, search } = req.query;
        const pool = await getPool();
        const request = pool.request();

        let where = '1=1';
        if (tickid) {
            request.input('tickid', sql.Int, tickid);
            where += ' AND tc.tickid = @tickid';
        }
        if (status && status !== 'All') {
            request.input('status', sql.NVarChar(20), status);
            where += ` AND (${STATUS_CASE_SQL}) = @status`;
        }
        if (search) {
            request.input('search', sql.NVarChar(100), `%${search}%`);
            where += ' AND (tc.owner LIKE @search OR tc.tranid LIKE @search OR tc.code LIKE @search)';
        }

        const result = await request.query(`
            SELECT
                tc.id, tc.code, tc.tickid, m.Title AS eventName,
                tc.owner, tc.tranid,
                CASE WHEN tc.myticket = 1 THEN 'Yes' WHEN tc.status = 1 THEN '-' ELSE 'No' END AS received,
                ${STATUS_CASE_SQL} AS status
            FROM TicketCode tc
            JOIN TicketCodeMaster m ON m.tickid = tc.tickid
            WHERE ${where}
            ORDER BY tc.id DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ดึงข้อมูลโค้ดตั๋วไม่สำเร็จ', error: err.message });
    }
}

// GET /api/ticket-codes/stats?tickid= -> สรุปตัวเลขสำหรับการ์ดด้านบน
async function getStats(req, res) {
    try {
        const { tickid } = req.query;
        const pool = await getPool();
        const request = pool.request();

        let where = '1=1';
        if (tickid) {
            request.input('tickid', sql.Int, tickid);
            where = 'tickid = @tickid';
        }

        const result = await request.query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS sold,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS remaining,
                SUM(CASE WHEN myticket = 1 THEN 1 ELSE 0 END) AS received
            FROM TicketCode
            WHERE ${where}
        `);

        const row = result.recordset[0];
        res.json({
            total: row.total || 0,
            sold: row.sold || 0,
            remaining: row.remaining || 0,
            received: row.received || 0,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ดึงข้อมูลสรุปไม่สำเร็จ', error: err.message });
    }
}

// POST /api/ticket-codes/generate -> สร้างโค้ดตั๋วใหม่เป็นชุด (bulk) สำหรับ 1 อีเวนต์ที่มีอยู่แล้ว
// ใช้ตอนอยากเพิ่มจำนวนตั๋วให้อีเวนต์ที่สร้างไปแล้ว (ตอนสร้างอีเวนต์ใหม่ระบบจะสร้างให้อัตโนมัติตาม Stock อยู่แล้ว)
async function generateCodes(req, res) {
    try {
        const { tickid, quantity, prefix } = req.body;

        if (!tickid || !quantity || quantity < 1) {
            return res.status(400).json({ message: 'กรุณาระบุอีเวนต์และจำนวนโค้ดที่ต้องการสร้าง' });
        }
        if (quantity > 1000) {
            return res.status(400).json({ message: 'สร้างได้ครั้งละไม่เกิน 1000 โค้ด' });
        }

        const pool = await getPool();
        const createdCodes = await generateCodesForEvent(pool, tickid, quantity, prefix);

        res.status(201).json({
            message: `สร้างโค้ดตั๋วสำเร็จ ${createdCodes.length} ใบ`,
            codes: createdCodes,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'สร้างโค้ดตั๋วไม่สำเร็จ', error: err.message });
    }
}

// สร้าง transaction ID อัตโนมัติ เช่น TXN-20260904-4821
function generateTransactionId() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `TXN-${datePart}-${randomPart}`;
}

// POST /api/ticket-codes/sell -> หน้า "Sell ticket": ขายตั๋ว 1 ใบให้ลูกค้า
// หยิบโค้ดที่ยังว่าง (Available) มา 1 ใบแบบ atomic (กันปัญหาขายซ้ำถ้ามีคนกดพร้อมกัน)
// แล้วเปลี่ยนเป็น Sold พร้อมผูก owner/transaction ID เข้าไป
async function sellCode(req, res) {
    try {
        const { tickid, owner } = req.body;
        let { tranid } = req.body;

        if (!tickid || !owner) {
            return res.status(400).json({ message: 'กรุณาเลือกอีเวนต์และกรอกข้อมูลผู้ซื้อ' });
        }
        if (!tranid) {
            tranid = generateTransactionId();
        }

        const pool = await getPool();

        // UPDATE TOP (1) แบบ atomic ป้องกันปัญหาโค้ดเดียวกันถูกขายซ้ำซ้อนถ้ามีการกดขายพร้อมกันหลายคน
        // หมายเหตุ: ตาราง TicketCode มี trigger ติดอยู่ (InsertTicketStock, UpdateTicketStock)
        // SQL Server ไม่อนุญาตให้ใช้ OUTPUT ส่งค่ากลับตรงๆ กับตารางที่มี trigger
        // ต้องใช้ OUTPUT ... INTO ตัวแปรตารางชั่วคราวก่อน แล้วค่อย SELECT ออกมาทีหลัง
        const result = await pool.request()
            .input('tickid', sql.Int, tickid)
            .input('owner', sql.NVarChar(50), owner)
            .input('tranid', sql.NVarChar(50), tranid)
            .query(`
                DECLARE @Sold TABLE (id INT, code NVARCHAR(50), tickid INT);

                UPDATE TOP (1) TicketCode
                SET status = 0, owner = @owner, tranid = @tranid, soldAt = GETDATE(), updated = GETDATE()
                OUTPUT INSERTED.id, INSERTED.code, INSERTED.tickid INTO @Sold
                WHERE tickid = @tickid AND status = 1;

                SELECT * FROM @Sold;
            `);

        if (result.recordset.length === 0) {
            return res.status(409).json({ message: 'ตั๋วสำหรับอีเวนต์นี้หมดแล้ว (ไม่มีโค้ดว่างเหลือ)' });
        }

        const sold = result.recordset[0];

        const eventResult = await pool.request()
            .input('tickid', sql.Int, sold.tickid)
            .query('SELECT Title, Price FROM TicketCodeMaster WHERE tickid = @tickid');

        res.status(201).json({
            code: sold.code,
            owner,
            tranid,
            eventName: eventResult.recordset[0]?.Title,
            price: eventResult.recordset[0]?.Price,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ขายตั๋วไม่สำเร็จ', error: err.message });
    }
}

// PATCH /api/ticket-codes/:id/receive -> ทำเครื่องหมายว่าลูกค้ามารับตั๋วแล้ว
async function markReceived(req, res) {
    try {
        const pool = await getPool();
        // ตาราง TicketCode มี trigger ติดอยู่ ต้องใช้ OUTPUT ... INTO แทน OUTPUT ตรงๆ (เหตุผลเดียวกับ sellCode)
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                DECLARE @Updated TABLE (id INT);

                UPDATE TicketCode
                SET myticket = 1, getTicket_date = GETDATE(), updated = GETDATE()
                OUTPUT INSERTED.id INTO @Updated
                WHERE id = @id AND status = 0;

                SELECT * FROM @Updated;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'ไม่พบโค้ดนี้ หรือโค้ดยังไม่ถูกขาย' });
        }
        res.json({ message: 'บันทึกการรับตั๋วเรียบร้อยแล้ว' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'บันทึกไม่สำเร็จ', error: err.message });
    }
}

// POST /api/ticket-codes/scan -> ใช้กับเครื่องสแกน QR หน้างาน
// รับ code ที่สแกนได้ ตรวจสอบสถานะ แล้วยืนยันการรับตั๋วให้อัตโนมัติถ้าถูกต้อง
async function scanCode(req, res) {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'ไม่พบข้อมูลโค้ดที่สแกน' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('code', sql.NVarChar(50), code.trim())
            .query(`
                SELECT tc.id, tc.code, tc.status, tc.myticket, tc.owner, tc.tranid, m.Title AS eventName
                FROM TicketCode tc
                JOIN TicketCodeMaster m ON m.tickid = tc.tickid
                WHERE tc.code = @code
            `);

        const ticket = result.recordset[0];

        if (!ticket) {
            return res.status(404).json({
                result: 'invalid',
                message: 'ไม่พบโค้ดนี้ในระบบ กรุณาตรวจสอบตั๋วอีกครั้ง',
            });
        }

        // กรณีที่ 1: ยังไม่ขาย (status = 1) -> ห้ามให้รับตั๋ว
        if (ticket.status === true || ticket.status === 1) {
            return res.status(409).json({
                result: 'not_sold',
                message: `โค้ดนี้ยังไม่ถูกขาย (${ticket.eventName}) ไม่สามารถรับตั๋วได้`,
                ticket: { code: ticket.code, eventName: ticket.eventName },
            });
        }

        // กรณีที่ 2: ขายแล้วและรับตั๋วไปแล้ว (Used) -> แจ้งเตือนกันรับซ้ำ
        if (ticket.myticket === true || ticket.myticket === 1) {
            return res.status(409).json({
                result: 'already_used',
                message: `ตั๋วใบนี้ถูกรับไปแล้วก่อนหน้านี้ (${ticket.eventName})`,
                ticket: { code: ticket.code, eventName: ticket.eventName, owner: ticket.owner },
            });
        }

        // กรณีที่ 3: ขายแล้ว รอรับ -> ยืนยันรับตั๋วให้ทันที
        await pool.request()
            .input('id', sql.Int, ticket.id)
            .query(`
                UPDATE TicketCode
                SET myticket = 1, getTicket_date = GETDATE(), updated = GETDATE()
                WHERE id = @id
            `);

        res.json({
            result: 'success',
            message: `ยืนยันรับตั๋วสำเร็จ: ${ticket.eventName}`,
            ticket: { code: ticket.code, eventName: ticket.eventName, owner: ticket.owner },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: 'error', message: 'สแกนไม่สำเร็จ', error: err.message });
    }
}

// GET /api/ticket-codes/qrcode/:code -> คืนภาพ QR (PNG) ที่ encode โค้ดตั๋วนี้ไว้
async function getQrCode(req, res) {
    try {
        const { code } = req.params;
        const pngBuffer = await QRCode.toBuffer(code, {
            type: 'png',
            width: 300,
            margin: 2,
        });
        res.set('Content-Type', 'image/png');
        res.send(pngBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'สร้าง QR code ไม่สำเร็จ', error: err.message });
    }
}

module.exports = { getAllCodes, getStats, generateCodes, sellCode, markReceived, scanCode, getQrCode };