const { sql, getPool } = require('../config/db');
const { generateCodesForEvent, prefixFromTitle } = require('../utils/ticketCodeGenerator');

// GET /api/tickets  -> ລາຍການທັງໝົດ (ໜ້າ Manage tickets)
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
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນຕັ້ວບໍ່ສຳເລັດ', error: err.message });
    }
}

// GET /api/tickets/:id -> ລາຍລະອຽດຕົ໋ວໃບດຽວ (ໜ້າ View)

async function getTicketById(req, res) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM TicketCodeMaster WHERE tickid = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'ບໍ່ພົບປີ້ທີ່ຕ້ອງການ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນຕັ້ວບໍ່ສຳເລັດ', error: err.message });
    }
}

// POST /api/tickets -> ເພີ່ມຕັ້ວໃໝ່ (ຫນ້າ Add ticket)
// ສ້າງຄຳສຳລັບຕັ້ວຈຳນວນ = Stock ທີ່ໃຫ້ອັດຕະໂນມັດທັນທີ (ສະຖານະ Available ທັງຫມົດ)
async function createTicket(req, res) {
    try {
        const {
            title, price, stock, location, dateEvent,
            description, groups, orderNo, logo, gps, status,
        } = req.body;

        if (!title || price == null || stock == null) {
            return res.status(400).json({ message: 'ກະລຸນາເພີ່ມຂໍ້ມູນ Title, Price ແລະ Stock ໃຫ້ຄົບ' });
        }
        if (stock > 1000) {
            return res.status(400).json({ message: 'ເພີ່ມໄດ້ບໍ່ເກີນ 1000 ໃບຕໍ່ຄັ້ງ (Stock ຕ້ອງບໍ່ເກີນ 1000)' });
        }

        const pool = await getPool();

        // ສ້າງ master record ກ່ອນ ໂດຍຕັ້ງ Stock = 0 ໄວ້ກ່ອນ
        // (ຄ່າ Stock ແທ້ຈິງຈະຖືກປັບໃຫ້ກົງກັບຈຳນວນລະຫັດທີ່ generate ຢູ່ລຸ່ມນີ້ໂດຍ trigger InsertTicketStock ໂດຍອັດຕະໂນມັດ)
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

        if (stock > 0) {
            await generateCodesForEvent(pool, newTickid, stock, prefixFromTitle(title));
        }

        const finalResult = await pool.request()
            .input('id', sql.Int, newTickid)
            .query('SELECT * FROM TicketCodeMaster WHERE tickid = @id');

        res.status(201).json(finalResult.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ເພີ່ມປີ້ບໍ່ສຳເລັດ', error: err.message });
    }
}

// PUT /api/tickets/:id -> ແກ້ໄຂຕັ໋ວ (ໜ້າ Edit)
// ໃນໜ້າ Edit ຈະໃຊ້ additionalTickets ສຳລັບເພີ່ມປີ້ໃໝ່
//
// ຕົວຢ່າງ:
// Stock ປັດຈຸບັນ = 50
// Add Tickets = 100
// -> ສ້າງ TicketCode ໃໝ່ 100 ໃບ
// -> Stock ຈະເປັນ 150 ໃບ
//
// ຖ້າ Add Tickets = 0
// -> ບໍ່ສ້າງປີ້ໃໝ່
//
// ບໍ່ມີການລົດ Stock ໂດຍກົງ
// ເພາະ Stock ຖືກຄວບຄຸມຕາມ TicketCode ໂດຍ Trigger

async function updateTicket(req, res) {
    try {
        const {
            title,
            price,
            location,
            dateEvent,
            description,
            status,
            logo,
            additionalTickets,
        } = req.body;

        const pool = await getPool();

        // 1. ກວດສອບວ່າ Event ມີຢູ່ບໍ່
        const currentResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT Stock, Title
                FROM TicketCodeMaster
                WHERE tickid = @id
            `);

        if (currentResult.recordset.length === 0) {
            return res.status(404).json({
                message: 'ບໍ່ພົບປີ້ທີ່ຕ້ອງການແກ້ໄຂ',
            });
        }

        const currentStock = Number(
            currentResult.recordset[0].Stock || 0
        );

        // 2. ຈຳນວນປີ້ທີ່ຕ້ອງການເພີ່ມ
        const addQuantity = Number(additionalTickets || 0);

        // 3. ກວດສອບຄ່າ Add Tickets
        if (!Number.isInteger(addQuantity) || addQuantity < 0) {
            return res.status(400).json({
                message: 'ຈຳນວນປີ້ທີ່ເພີ່ມຕ້ອງເປັນຈຳນວນເຕັມ 0 ຫຼືຫຼາຍກວ່າ',
            });
        }

        // 4. ຈຳກັດການເພີ່ມສູງສຸດ 1000 ໃບຕໍ່ຄັ້ງ
        if (addQuantity > 1000) {
            return res.status(400).json({
                message: 'ເພີ່ມປີ້ໄດ້ບໍ່ເກີນ 1000 ໃບຕໍ່ຄັ້ງ',
            });
        }

        // 5. ອັບເດດຂໍ້ມູນ Event
        // ບໍ່ແຕະ Stock ໂດຍກົງ
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('Title', sql.NVarChar(100), title)
            .input('Price', sql.Int, price)
            .input('Location', sql.NVarChar(100), location || null)
            .input('DateEvent', sql.NVarChar(100), dateEvent || null)
            .input('Description', sql.NVarChar(200), description || null)
            .input('Logo', sql.NVarChar(255), logo || null)
            .input('Status', sql.Char(100), status || 'Open')
            .query(`
                UPDATE TicketCodeMaster
                SET Title = @Title,
                    Price = @Price,
                    Location = @Location,
                    DateEvent = @DateEvent,
                    Description = @Description,
                    Logo = @Logo,
                    Status = @Status
                WHERE tickid = @id
            `);

        // 6. ຖ້າມີການເພີ່ມປີ້
        if (addQuantity > 0) {

            console.log(
                `Adding ${addQuantity} tickets to tickid=${req.params.id}`
            );

            await generateCodesForEvent(
                pool,
                req.params.id,
                addQuantity,
                prefixFromTitle(title)
            );
        }

        // 7. ດຶງຂໍ້ມູນຫຼ້າສຸດຈາກ SQL Server
        const finalResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT *
                FROM TicketCodeMaster
                WHERE tickid = @id
            `);

        const finalStock = Number(
            finalResult.recordset[0]?.Stock || 0
        );

        console.log(
            `Ticket updated: tickid=${req.params.id}, ` +
            `oldStock=${currentStock}, ` +
            `added=${addQuantity}, ` +
            `newStock=${finalStock}`
        );

        res.json(finalResult.recordset[0]);

    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'ແກ້ໄຂປີ້ບໍ່ສຳເລັດ',
            error: err.message,
        });
    }
}

// PATCH /api/tickets/:id/status -> เปิด/ปิดการขาย (toggle Open/OFF)
async function toggleTicketStatus(req, res) {
    try {
        const { status } = req.body;

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
            return res.status(404).json({ message: 'ບໍ່ພົບປີ້ທີ່ຕ້ອງການ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ປ່ຽນສະຖານະບໍ່ສຳເລັດ', error: err.message });
    }
}

// DELETE /api/tickets/:id -> ลบตั๋ว
async function deleteTicket(req, res) {
    try {
        const pool = await getPool();

        // ต้องลบโค้ดตั๋วที่ผูกกับอีเวนต์นี้ก่อน (ตาราง TicketCode) ไม่งั้นจะเหลือข้อมูลกำพร้าอยู่
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM TicketCode WHERE tickid = @id');

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM TicketCodeMaster WHERE tickid = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'ບໍ່ພົບປີ້ທີ່ຕ້ອງການລົບ' });
        }
        res.json({ message: 'ລົບປີ້ສຳເລັດ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ລົບປີ້ບໍ່ສຳເລັດ', error: err.message });
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