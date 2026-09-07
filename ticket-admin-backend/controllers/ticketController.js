const { sql, getPool } = require('../config/db');
const { generateCodesForEvent, prefixFromTitle } = require('../utils/ticketCodeGenerator');

// GET /api/tickets  -> รายการทั้งหมด (หน้า Manage tickets)
async function getAllTickets(req, res) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT tickid, [Day], Price, Stock, Logo, Description,
                   Groups, OrderNo, Title, Location, DateEvent, GPS, Status
            FROM TicketCodeMaster
            ORDER BY OrderNo ASC, tickid ASC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ดึงข้อมูลตั๋วไม่สำเร็จ', error: err.message });
    }
}

// GET /api/tickets/:id -> รายละเอียดตั๋วใบเดียว (หน้า View)
async function getTicketById(req, res) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM TicketCodeMaster WHERE tickid = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'ไม่พบตั๋วที่ต้องการ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ดึงข้อมูลตั๋วไม่สำเร็จ', error: err.message });
    }
}

// POST /api/tickets -> เพิ่มตั๋วใหม่ (หน้า Add ticket)
// สร้างโค้ดตั๋วจำนวน = Stock ให้อัตโนมัติทันที (สถานะ Available ทั้งหมด)
// เพื่อให้หน้า Ticket codes มีโค้ดครบตามจำนวนที่ตั้งไว้ ไม่ต้องมากดปุ่ม Generate codes แยกอีกที
async function createTicket(req, res) {
    try {
        const {
            title, price, stock, location, dateEvent,
            description, groups, orderNo, logo, gps, status,
        } = req.body;

        if (!title || price == null || stock == null) {
            return res.status(400).json({ message: 'กรุณากรอก Title, Price และ Stock ให้ครบ' });
        }
        if (stock > 1000) {
            return res.status(400).json({ message: 'สร้างได้ครั้งละไม่เกิน 1000 ใบ (Stock ต้องไม่เกิน 1000)' });
        }

        const pool = await getPool();

        // สร้าง master record ก่อน โดยตั้ง Stock = 0 ไว้ก่อน
        // (ค่า Stock จริงจะถูกปรับให้ตรงกับจำนวนโค้ดที่ generate ด้านล่างโดย trigger InsertTicketStock โดยอัตโนมัติ)
        const insertResult = await pool.request()
            .input('Title', sql.NVarChar(100), title)
            .input('Price', sql.Int, price)
            .input('Location', sql.NVarChar(100), location || null)
            .input('DateEvent', sql.NVarChar(100), dateEvent || null)
            .input('Description', sql.NVarChar(200), description || null)
            .input('Groups', sql.NVarChar(50), groups || null)
            .input('OrderNo', sql.Int, orderNo || 0)
            .input('Logo', sql.NVarChar(255), logo || null)
            .input('GPS', sql.NVarChar(100), gps || null)
            .input('Status', sql.Char(100), status || 'Open')
            .query(`
                INSERT INTO TicketCodeMaster
                    (Title, Price, Stock, Location, DateEvent, Description, Groups, OrderNo, Logo, GPS, Status)
                OUTPUT INSERTED.tickid
                VALUES
                    (@Title, @Price, 0, @Location, @DateEvent, @Description, @Groups, @OrderNo, @Logo, @GPS, @Status)
            `);

        const newTickid = insertResult.recordset[0].tickid;

        // สร้างโค้ดตั๋วให้ครบตามจำนวน Stock ที่ตั้งไว้ (ถ้า Stock = 0 ก็แค่ไม่สร้างโค้ดเลย ไม่ error)
        if (stock > 0) {
            await generateCodesForEvent(pool, newTickid, stock, prefixFromTitle(title));
        }

        // ดึงข้อมูลล่าสุดกลับไปแสดง (Stock ตอนนี้จะถูกอัปเดตโดย trigger แล้วให้ตรงกับจำนวนโค้ดที่สร้างจริง)
        const finalResult = await pool.request()
            .input('id', sql.Int, newTickid)
            .query('SELECT * FROM TicketCodeMaster WHERE tickid = @id');

        res.status(201).json(finalResult.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เพิ่มตั๋วไม่สำเร็จ', error: err.message });
    }
}

// PUT /api/tickets/:id -> แก้ไขตั๋ว (หน้า Edit)
async function updateTicket(req, res) {
    try {
        const { title, price, stock, location, dateEvent, description, status } = req.body;

        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('Title', sql.NVarChar(100), title)
            .input('Price', sql.Int, price)
            .input('Stock', sql.Int, stock)
            .input('Location', sql.NVarChar(100), location || null)
            .input('DateEvent', sql.NVarChar(100), dateEvent || null)
            .input('Description', sql.NVarChar(200), description || null)
            .input('Status', sql.Char(100), status)
            .query(`
                UPDATE TicketCodeMaster
                SET Title = @Title,
                    Price = @Price,
                    Stock = @Stock,
                    Location = @Location,
                    DateEvent = @DateEvent,
                    Description = @Description,
                    Status = @Status
                OUTPUT INSERTED.*
                WHERE tickid = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'ไม่พบตั๋วที่ต้องการแก้ไข' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'แก้ไขตั๋วไม่สำเร็จ', error: err.message });
    }
}

// PATCH /api/tickets/:id/status -> เปิด/ปิดการขาย (toggle Open/OFF)
async function toggleTicketStatus(req, res) {
    try {
        const { status } = req.body; // "Open" หรือ "OFF"

        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('Status', sql.Char(100), status)
            .query(`
                UPDATE TicketCodeMaster
                SET Status = @Status
                OUTPUT INSERTED.*
                WHERE tickid = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'ไม่พบตั๋วที่ต้องการ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เปลี่ยนสถานะไม่สำเร็จ', error: err.message });
    }
}

// DELETE /api/tickets/:id -> ลบตั๋ว
async function deleteTicket(req, res) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM TicketCodeMaster WHERE tickid = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'ไม่พบตั๋วที่ต้องการลบ' });
        }
        res.json({ message: 'ลบตั๋วเรียบร้อยแล้ว' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ลบตั๋วไม่สำเร็จ', error: err.message });
    }
}

module.exports = {
    getAllTickets,
    getTicketById,
    createTicket,
    updateTicket,
    toggleTicketStatus,
    deleteTicket,
};
