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
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນຕົ໋ວບໍ່ສຳເລັດ', error: err.message });
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
            return res.status(404).json({ message: 'ບໍ່ພົບຕົ໋ວທີ່ຕ້ອງການ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນຕົ໋ວບໍ່ສຳເລັດ', error: err.message });
    }
}

// POST /api/tickets -> ເພີ່ມຕົ໋ວໃໝ່ (ໜ້າ Add ticket)
// ສ້າງລະຫັດຕົ໋ວຈຳນວນ = Stock ໃຫ້ອັດຕະໂນມັດທັນທີ (ສະຖານະ Available ທັງໝົດ)
// ເພື່ອໃຫ້ໜ້າ Ticket codes ມີລະຫັດຄົບຕາມຈຳນວນທີ່ຕັ້ງໄວ້ ບໍ່ຕ້ອງມາກົດປຸ່ມ Generate codes ແຍກອີກເທື່ອ
async function createTicket(req, res) {
    try {
        const {
            title, price, stock, location, dateEvent,
            description, groups, orderNo, logo, gps, status,
        } = req.body;

        if (!title || price == null || stock == null) {
            return res.status(400).json({ message: 'ກະລຸນາປ້ອນ Title, Price ແລະ Stock ໃຫ້ຄົບ' });
        }
        if (stock > 1000) {
            return res.status(400).json({ message: 'ສ້າງໄດ້ຄັ້ງລະບໍ່ເກີນ 1000 ໃບ (Stock ຕ້ອງບໍ່ເກີນ 1000)' });
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

        // ສ້າງລະຫັດຕົ໋ວໃຫ້ຄົບຕາມຈຳນວນ Stock ທີ່ຕັ້ງໄວ້ (ຖ້າ Stock = 0 ກໍ່ພຽງແຕ່ບໍ່ສ້າງລະຫັດເລີຍ ບໍ່ error)
        if (stock > 0) {
            await generateCodesForEvent(pool, newTickid, stock, prefixFromTitle(title));
        }

        // ດຶງຂໍ້ມູນຫຼ້າສຸດກັບໄປສະແດງ (Stock ຕອນນີ້ຈະຖືກອັບເດດໂດຍ trigger ແລ້ວໃຫ້ກົງກັບຈຳນວນລະຫັດທີ່ສ້າງແທ້ຈິງ)
        const finalResult = await pool.request()
            .input('id', sql.Int, newTickid)
            .query('SELECT * FROM TicketCodeMaster WHERE tickid = @id');

        res.status(201).json(finalResult.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ເພີ່ມຕົ໋ວບໍ່ສຳເລັດ', error: err.message });
    }
}

// PUT /api/tickets/:id -> ແກ້ໄຂຕົ໋ວ (ໜ້າ Edit)
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
            return res.status(404).json({ message: 'ບໍ່ພົບຕົ໋ວທີ່ຕ້ອງການແກ້ໄຂ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ແກ້ໄຂຕົ໋ວບໍ່ສຳເລັດ', error: err.message });
    }
}

// PATCH /api/tickets/:id/status -> ເປີດ/ປິດການຂາຍ (toggle Open/OFF)
async function toggleTicketStatus(req, res) {
    try {
        const { status } = req.body; // "Open" ຫຼື "OFF"

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
            return res.status(404).json({ message: 'ບໍ່ພົບຕົ໋ວທີ່ຕ້ອງການ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ປ່ຽນສະຖານະບໍ່ສຳເລັດ', error: err.message });
    }
}

// DELETE /api/tickets/:id -> ລຶບຕົ໋ວ
async function deleteTicket(req, res) {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM TicketCodeMaster WHERE tickid = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'ບໍ່ພົບຕົ໋ວທີ່ຕ້ອງການລຶບ' });
        }
        res.json({ message: 'ລຶບຕົ໋ວຮຽບຮ້ອຍແລ້ວ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ລຶບຕົ໋ວບໍ່ສຳເລັດ', error: err.message });
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
