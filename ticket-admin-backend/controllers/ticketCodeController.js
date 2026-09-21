const QRCode = require('qrcode');
const { sql, getPool } = require('../config/db');
const { generateCodesForEvent } = require('../utils/ticketCodeGenerator');

// ແປງ status(bit) + myticket(bit) ໃນຖານຂໍ້ມູນ ໃຫ້ເປັນສະຖານະທີ່ສະແດງຜົນໄດ້ກົງກັບ UI
// status=1            -> Available (ຍັງບໍ່ຂາຍ)
// status=0, myticket=0 -> Sold (ຂາຍແລ້ວ ຍັງບໍ່ມາຮັບຕົ໋ວ)
// status=0, myticket=1 -> Used (ຂາຍແລ້ວແລະຮັບຕົ໋ວໄປແລ້ວ)
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
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນລະຫັດຕົ໋ວບໍ່ສຳເລັດ', error: err.message });
    }
}

// GET /api/ticket-codes/stats?tickid= -> ສະຫຼຸບຕົວເລກສຳລັບກາດດ້ານເທິງ
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
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນສະຫຼຸບບໍ່ສຳເລັດ', error: err.message });
    }
}

// POST /api/ticket-codes/generate -> ສ້າງລະຫັດຕົ໋ວໃໝ່ເປັນຊຸດ (bulk) ສຳລັບ 1 ອີເວັນທີ່ມີຢູ່ແລ້ວ
// ໃຊ້ຕອນຢາກເພີ່ມຈຳນວນຕົ໋ວໃຫ້ອີເວັນທີ່ສ້າງໄປແລ້ວ (ຕອນສ້າງອີເວັນໃໝ່ລະບົບຈະສ້າງໃຫ້ອັດຕະໂນມັດຕາມ Stock ຢູ່ແລ້ວ)
async function generateCodes(req, res) {
    try {
        const { tickid, quantity, prefix } = req.body;

        if (!tickid || !quantity || quantity < 1) {
            return res.status(400).json({ message: 'ກະລຸນາລະບຸອີເວັນແລະຈຳນວນລະຫັດທີ່ຕ້ອງການສ້າງ' });
        }
        if (quantity > 1000) {
            return res.status(400).json({ message: 'ສ້າງໄດ້ຄັ້ງລະບໍ່ເກີນ 1000 ລະຫັດ' });
        }

        const pool = await getPool();
        const createdCodes = await generateCodesForEvent(pool, tickid, quantity, prefix);

        res.status(201).json({
            message: `ສ້າງລະຫັດຕົ໋ວສຳເລັດ ${createdCodes.length} ໃບ`,
            codes: createdCodes,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ສ້າງລະຫັດຕົ໋ວບໍ່ສຳເລັດ', error: err.message });
    }
}

// ສ້າງ transaction ID ອັດຕະໂນມັດ ເຊັ່ນ TXN-20260904-4821
function generateTransactionId() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `TXN-${datePart}-${randomPart}`;
}

// POST /api/ticket-codes/sell -> ໜ້າ "Sell ticket": ຂາຍຕົ໋ວ 1 ໃບໃຫ້ລູກຄ້າ
// ຫຍິບລະຫັດທີ່ຍັງວ່າງ (Available) ມາ 1 ໃບແບບ atomic (ກັນບັນຫາຂາຍຊ້ຳຖ້າມີຄົນກົດພ້ອມກັນ)
// ແລ້ວປ່ຽນເປັນ Sold ພ້ອມຜູກ owner/transaction ID ເຂົ້າໄປ
async function sellCode(req, res) {
    try {
        const { tickid, owner } = req.body;
        let { tranid } = req.body;

        if (!tickid || !owner) {
            return res.status(400).json({ message: 'ກະລຸນາເລືອກອີເວັນແລະປ້ອນຂໍ້ມູນຜູ້ຊື້' });
        }
        if (!tranid) {
            tranid = generateTransactionId();
        }

        const pool = await getPool();

        // UPDATE TOP (1) ແບບ atomic ປ້ອງກັນບັນຫາລະຫັດດຽວກັນຖືກຂາຍຊ້ຳຊ້ອນຖ້າມີການກົດຂາຍພ້ອມກັນຫຼາຍຄົນ
        // ໝາຍເຫດ: ຕາຕະລາງ TicketCode ມີ trigger ຕິດຢູ່ (InsertTicketStock, UpdateTicketStock)
        // SQL Server ບໍ່ອະນຸຍາດໃຫ້ໃຊ້ OUTPUT ສົ່ງຄ່າກັບຄືນກົງໆ ກັບຕາຕະລາງທີ່ມີ trigger
        // ຕ້ອງໃຊ້ OUTPUT ... INTO ຕົວແປຕາຕະລາງຊົ່ວຄາວກ່ອນ ແລ້ວຄ່ອຍ SELECT ອອກມາທີຫຼັງ
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
            return res.status(409).json({ message: 'ຕົ໋ວສຳລັບອີເວັນນີ້ໝົດແລ້ວ (ບໍ່ມີລະຫັດວ່າງເຫຼືອ)' });
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
        res.status(500).json({ message: 'ຂາຍຕົ໋ວບໍ່ສຳເລັດ', error: err.message });
    }
}

// PATCH /api/ticket-codes/:id/receive -> ເຮັດເຄື່ອງໝາຍວ່າລູກຄ້າມາຮັບຕົ໋ວແລ້ວ
async function markReceived(req, res) {
    try {
        const pool = await getPool();
        // ຕາຕະລາງ TicketCode ມີ trigger ຕິດຢູ່ ຕ້ອງໃຊ້ OUTPUT ... INTO ແທນ OUTPUT ກົງໆ (ເຫດຜົນດຽວກັບ sellCode)
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
            return res.status(404).json({ message: 'ບໍ່ພົບລະຫັດນີ້ ຫຼືລະຫັດຍັງບໍ່ໄດ້ຂາຍ' });
        }
        res.json({ message: 'ບັນທຶກການຮັບຕົ໋ວຮຽບຮ້ອຍແລ້ວ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ບັນທຶກບໍ່ສຳເລັດ', error: err.message });
    }
}

// POST /api/ticket-codes/scan -> ໃຊ້ກັບເຄື່ອງສະແກນ QR ໜ້າງານ
// ຮັບ code ທີ່ສະແກນໄດ້ ກວດສອບສະຖານະ ແລ້ວຢືນຢັນການຮັບຕົ໋ວໃຫ້ອັດຕະໂນມັດຖ້າຖືກຕ້ອງ
async function scanCode(req, res) {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'ບໍ່ພົບຂໍ້ມູນລະຫັດທີ່ສະແກນ' });
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
                message: 'ບໍ່ພົບລະຫັດນີ້ໃນລະບົບ ກະລຸນາກວດສອບຕົ໋ວອີກຄັ້ງ',
            });
        }

        // ກໍລະນີທີ 1: ຍັງບໍ່ຂາຍ (status = 1) -> ຫ້າມໃຫ້ຮັບຕົ໋ວ
        if (ticket.status === true || ticket.status === 1) {
            return res.status(409).json({
                result: 'not_sold',
                message: `ລະຫັດນີ້ຍັງບໍ່ໄດ້ຂາຍ (${ticket.eventName}) ບໍ່ສາມາດຮັບຕົ໋ວໄດ້`,
                ticket: { code: ticket.code, eventName: ticket.eventName },
            });
        }

        // ກໍລະນີທີ 2: ຂາຍແລ້ວແລະຮັບຕົ໋ວໄປແລ້ວ (Used) -> ແຈ້ງເຕືອນກັນຮັບຊ້ຳ
        if (ticket.myticket === true || ticket.myticket === 1) {
            return res.status(409).json({
                result: 'already_used',
                message: `ຕົ໋ວໃບນີ້ຖືກຮັບໄປແລ້ວກ່ອນໜ້ານີ້ (${ticket.eventName})`,
                ticket: { code: ticket.code, eventName: ticket.eventName, owner: ticket.owner },
            });
        }

        // ກໍລະນີທີ 3: ຂາຍແລ້ວ ລໍຖ້າຮັບ -> ຢືນຢັນຮັບຕົ໋ວໃຫ້ທັນທີ
        await pool.request()
            .input('id', sql.Int, ticket.id)
            .query(`
                UPDATE TicketCode
                SET myticket = 1, getTicket_date = GETDATE(), updated = GETDATE()
                WHERE id = @id
            `);

        res.json({
            result: 'success',
            message: `ຢືນຢັນຮັບຕົ໋ວສຳເລັດ: ${ticket.eventName}`,
            ticket: { code: ticket.code, eventName: ticket.eventName, owner: ticket.owner },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: 'error', message: 'ສະແກນບໍ່ສຳເລັດ', error: err.message });
    }
}

// GET /api/ticket-codes/qrcode/:code -> ສົ່ງຄືນຮູບ QR (PNG) ທີ່ encode ລະຫັດຕົ໋ວນີ້ໄວ້
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
        res.status(500).json({ message: 'ສ້າງ QR code ບໍ່ສຳເລັດ', error: err.message });
    }
}

module.exports = { getAllCodes, getStats, generateCodes, sellCode, markReceived, scanCode, getQrCode };