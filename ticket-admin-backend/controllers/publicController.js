const { sql, getPool } = require('../config/db');

// GET /api/public/events -> รายการอีเวนต์ที่เปิดขายอยู่ (สำหรับหน้าโฮมเพจ)
async function getEvents(req, res) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT tickid, Title, Price, Stock, Location, DateEvent, Description, Logo
            FROM TicketCodeMaster
            WHERE RTRIM(Status) = 'Open' AND Stock > 0
            ORDER BY OrderNo ASC, tickid DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ดึงข้อมูลอีเวนต์ไม่สำเร็จ', error: err.message });
    }
}

// GET /api/public/events/:id -> รายละเอียดอีเวนต์เดียว (สำหรับหน้ารายละเอียด)
async function getEventById(req, res) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT tickid, Title, Price, Stock, Location, DateEvent, Description, Logo
                FROM TicketCodeMaster
                WHERE tickid = @id AND RTRIM(Status) = 'Open'
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'ไม่พบอีเวนต์นี้ หรือปิดการขายแล้ว' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ดึงข้อมูลอีเวนต์ไม่สำเร็จ', error: err.message });
    }
}

function generateTransactionId() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `TXN-${datePart}-${randomPart}`;
}

// POST /api/public/checkout -> จำลองการชำระเงินสำเร็จแล้วออกตั๋วจริง
// body: { buyerName, buyerPhone, items: [{ tickid, quantity }] }
async function checkout(req, res) {
    try {
        const { buyerName, buyerPhone, items } = req.body;

        if (!buyerName || !buyerPhone || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'ข้อมูลไม่ครบ กรุณากรอกชื่อ เบอร์โทร และเลือกตั๋วอย่างน้อย 1 รายการ' });
        }

        const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
        if (totalQty < 1 || totalQty > 20) {
            return res.status(400).json({ message: 'จำนวนตั๋วต่อคำสั่งซื้อต้องอยู่ระหว่าง 1-20 ใบ' });
        }

        const pool = await getPool();
        const tranid = generateTransactionId();
        const tickets = [];

        for (const item of items) {
            const qty = Number(item.quantity) || 0;
            for (let i = 0; i < qty; i++) {
                const result = await pool.request()
                    .input('tickid', sql.Int, item.tickid)
                    .input('owner', sql.NVarChar(50), buyerPhone)
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
                    return res.status(409).json({
                        message: 'ขออภัย ตั๋วบางรายการหมดระหว่างทำรายการ กรุณาลองใหม่อีกครั้ง',
                        partialTickets: tickets,
                    });
                }

                const sold = result.recordset[0];
                const eventResult = await pool.request()
                    .input('tickid', sql.Int, sold.tickid)
                    .query('SELECT Title, Price, Location, DateEvent FROM TicketCodeMaster WHERE tickid = @tickid');

                const event = eventResult.recordset[0];
                tickets.push({
                    code: sold.code,
                    eventName: event.Title,
                    price: event.Price,
                    location: event.Location,
                    dateEvent: event.DateEvent,
                });
            }
        }

        res.status(201).json({ tranid, buyerName, buyerPhone, tickets });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ทำรายการไม่สำเร็จ', error: err.message });
    }
}

module.exports = { getEvents, getEventById, checkout };
