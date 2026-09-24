const { sql, getPool } = require('../config/db');

// GET /api/public/events -> ລາຍການອີເວັນທີ່ເປີດຂາຍຢູ່ (ສຳລັບໜ້າໂຮມເພຈ)
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
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນອີເວັນບໍ່ສຳເລັດ', error: err.message });
    }
}

// GET /api/public/events/:id -> ລາຍລະອຽດອີເວັນດຽວ (ສຳລັບໜ້າລາຍລະອຽດ)
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
            return res.status(404).json({ message: 'ບໍ່ພົບອີເວັນນີ້ ຫຼືປິດການຂາຍແລ້ວ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນອີເວັນບໍ່ສຳເລັດ', error: err.message });
    }
}

function generateTransactionId() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `TXN-${datePart}-${randomPart}`;
}

// POST /api/public/checkout -> ຈຳລອງການຊຳລະເງິນສຳເລັດແລ້ວອອກຕົ໋ວແທ້
// body: { buyerName, buyerPhone, items: [{ tickid, quantity }] }
async function checkout(req, res) {
    try {
        const { buyerName, buyerPhone, items } = req.body;

        if (!buyerName || !buyerPhone || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'ຂໍ້ມູນບໍ່ຄົບ ກະລຸນາປ້ອນຊື່ ເບີໂທ ແລະເລືອກຕົ໋ວຢ່າງໜ້ອຍ 1 ລາຍການ' });
        }

        const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
        if (totalQty < 1 || totalQty > 20) {
            return res.status(400).json({ message: 'ຈຳນວນຕົ໋ວຕໍ່ຄຳສັ່ງຊື້ຕ້ອງຢູ່ລະຫວ່າງ 1-20 ໃບ' });
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
                        message: 'ຂໍອະໄພ ຕົ໋ວບາງລາຍການໝົດໄລຍະເຮັດລາຍການ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ',
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
        res.status(500).json({ message: 'ເຮັດລາຍການບໍ່ສຳເລັດ', error: err.message });
    }
}

// POST /api/public/check-ticket -> ໃຊ້ຕອນສະແກນ QR ຄັ້ງທຳອິດ ພຽງແຕ່ກວດສະຖານະ ບໍ່ໝາຍວ່າຮັບຕົ໋ວ
// body: { code: "<ຄ່າທີ່ສະແກນໄດ້ຈາກ QR>" }
async function checkTicket(req, res) {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ result: 'invalid', message: 'ບໍ່ພົບຂໍ້ມູນລະຫັດທີ່ສະແກນ' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('code', sql.NVarChar(50), code.trim())
            .query(`
                SELECT tc.id, tc.code, tc.status, tc.myticket, tc.owner, tc.tranid,
                       m.Title AS eventName, m.Location AS eventLocation, m.DateEvent AS eventDate
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

        if (ticket.status === true || ticket.status === 1) {
            return res.status(409).json({
                result: 'not_sold',
                message: `ລະຫັດນີ້ຍັງບໍ່ໄດ້ຂາຍ (${ticket.eventName}) ບໍ່ສາມາດຮັບຕົ໋ວໄດ້`,
                ticket: { code: ticket.code, eventName: ticket.eventName },
            });
        }

        if (ticket.myticket === true || ticket.myticket === 1) {
            return res.status(409).json({
                result: 'already_used',
                message: `ຕົ໋ວໃບນີ້ຖືກຮັບໄປແລ້ວກ່ອນໜ້ານີ້ (${ticket.eventName})`,
                ticket: { code: ticket.code, eventName: ticket.eventName, owner: ticket.owner },
            });
        }

        // ຂາຍແລ້ວ ຍັງບໍ່ຮັບ -> ພ້ອມໃຫ້ກົດຢືນຢັນຮັບຕົ໋ວໃນໜ້າຖັດໄປ
        return res.json({
            result: 'ok',
            message: `ພົບຂໍ້ມູນຕົ໋ວ: ${ticket.eventName}`,
            ticket: {
                code: ticket.code,
                eventName: ticket.eventName,
                owner: ticket.owner,
                tranid: ticket.tranid,
                eventLocation: ticket.eventLocation,
                eventDate: ticket.eventDate,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: 'error', message: 'ກວດສອບບໍ່ສຳເລັດ', error: err.message });
    }
}

// POST /api/public/receive-ticket -> ໃຊ້ຫຼັງພະນັກງານກົດປຸ່ມຢືນຢັນໃນໜ້າລາຍລະອຽດ ໝາຍວ່າຮັບຕົ໋ວແລ້ວແທ້
// body: { code: "<ລະຫັດຕົ໋ວດຽວກັບທີ່ກວດໄປຕອນ check-ticket>" }
async function receiveTicket(req, res) {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ result: 'invalid', message: 'ບໍ່ພົບຂໍ້ມູນລະຫັດທີ່ຈະຢືນຢັນ' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('code', sql.NVarChar(50), code.trim())
            .query(`
                SELECT tc.id, tc.code, tc.status, tc.myticket, tc.owner, m.Title AS eventName
                FROM TicketCode tc
                JOIN TicketCodeMaster m ON m.tickid = tc.tickid
                WHERE tc.code = @code
            `);

        const ticket = result.recordset[0];

        if (!ticket) {
            return res.status(404).json({ result: 'invalid', message: 'ບໍ່ພົບລະຫັດນີ້ໃນລະບົບ' });
        }
        if (ticket.status === true || ticket.status === 1) {
            return res.status(409).json({ result: 'not_sold', message: 'ລະຫັດນີ້ຍັງບໍ່ໄດ້ຂາຍ ບໍ່ສາມາດຮັບຕົ໋ວໄດ້' });
        }
        if (ticket.myticket === true || ticket.myticket === 1) {
            return res.status(409).json({ result: 'already_used', message: 'ຕົ໋ວໃບນີ້ຖືກຮັບໄປແລ້ວກ່ອນໜ້ານີ້' });
        }

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
        res.status(500).json({ result: 'error', message: 'ຢືນຢັນຮັບຕົ໋ວບໍ່ສຳເລັດ', error: err.message });
    }
}

// GET /api/public/tickets-not-received?tickid=24 -> ລາຍຊື່ຄົນທີ່ຊື້ແລ້ວແຕ່ຍັງບໍ່ມາຮັບຕົ໋ວ ຂອງອີເວັນນັ້ນໆ
async function getNotReceived(req, res) {
    try {
        const { tickid } = req.query;
        if (!tickid) {
            return res.status(400).json({ status: false, message: 'ກະລຸນາລະບຸ tickid' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('tickid', sql.Int, tickid)
            .query(`
                SELECT tc.owner, tc.code
                FROM TicketCode tc
                WHERE tc.tickid = @tickid AND tc.status = 0 AND tc.myticket = 0
                ORDER BY tc.id DESC
            `);

        res.json({
            status: true,
            data: result.recordset.map((r) => ({
                owner: r.owner,
                code: r.code,
                status: 'ລໍຖ້າການຮັບບັດ',
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'ດຶງຂໍ້ມູນບໍ່ສຳເລັດ', error: err.message });
    }
}

// GET /api/public/tickets-received?tickid=24 -> ລາຍຊື່ຄົນທີ່ຮັບຕົ໋ວໄປແລ້ວ ຂອງອີເວັນນັ້ນໆ
async function getReceived(req, res) {
    try {
        const { tickid } = req.query;
        if (!tickid) {
            return res.status(400).json({ status: false, message: 'ກະລຸນາລະບຸ tickid' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('tickid', sql.Int, tickid)
            .query(`
                SELECT tc.owner, tc.code
                FROM TicketCode tc
                WHERE tc.tickid = @tickid AND tc.status = 0 AND tc.myticket = 1
                ORDER BY tc.id DESC
            `);

        res.json({
            status: true,
            data: result.recordset.map((r) => ({
                owner: r.owner,
                code: r.code,
                status: 'ຮັບບັດແລ້ວ',
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, message: 'ດຶງຂໍ້ມູນບໍ່ສຳເລັດ', error: err.message });
    }
}

module.exports = { getEvents, getEventById, checkout, checkTicket, receiveTicket, getNotReceived, getReceived };