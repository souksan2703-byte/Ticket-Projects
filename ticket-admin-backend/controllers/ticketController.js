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

// PUT /api/tickets/:id -> แก้ไขตั๋ว (หน้า Edit)
// ถ้าตัวเลข Stock ที่กรอกใหม่ "มากกว่า" ค่าปัจจุบัน จะสร้างโค้ดตั๋วเพิ่มให้เท่ากับส่วนต่างอัตโนมัติ
// ถ้ากรอกน้อยกว่าเดิม จะไม่ลดอะไร (ไม่ลบโค้ดที่มีอยู่แล้ว เพราะบางใบอาจขายไปแล้ว) ตัวเลขจะกลับไปเป็นค่าจริงตามเดิม
async function updateTicket(req, res) {
    try {
        const { title, price, stock, location, dateEvent, description, status } = req.body;

        const pool = await getPool();

        // 1. เช็ค Stock ปัจจุบันก่อน (ค่าจริงที่ trigger ดูแลอยู่ ไม่ใช่ค่าที่ผู้ใช้พิมพ์)
        const currentResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT Stock, Title FROM TicketCodeMaster WHERE tickid = @id');

        if (currentResult.recordset.length === 0) {
            return res.status(404).json({ message: 'ບໍ່ພົບປີ້ທີ່ຕ້ອງການແກ້ໄຂ' });
        }
        const currentStock = currentResult.recordset[0].Stock || 0;
        const requestedStock = Number(stock);

        // 2. อัปเดตข้อมูลทั่วไป (ไม่แตะ Stock ตรงๆ ในคำสั่งนี้ ปล่อยให้ trigger เป็นคนดูแลค่า Stock จริง)
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('Title', sql.NVarChar(100), title)
            .input('Price', sql.Int, price)
            .input('Location', sql.NVarChar(100), location || null)
            .input('DateEvent', sql.NVarChar(100), dateEvent || null)
            .input('Description', sql.NVarChar(200), description || null)
            .input('Status', sql.Char(100), status)
            .query(`
                UPDATE TicketCodeMaster
                SET Title = @Title,
                    Price = @Price,
                    Location = @Location,
                    DateEvent = @DateEvent,
                    Description = @Description,
                    Status = @Status
                WHERE tickid = @id
            `);

        // 3. ถ้าขอเพิ่มจำนวนตั๋ว (ตัวเลขใหม่ > ของเดิม) ให้สร้างโค้ดเพิ่มเท่าส่วนต่าง
        if (requestedStock > currentStock) {
            const additionalQty = requestedStock - currentStock;
            if (additionalQty > 1000) {
                return res.status(400).json({ message: 'ເພີ່ມໄດ້ບໍ່ເກີນ 1000 ໃບຕໍ່ຄັ້ງ' });
            }
            await generateCodesForEvent(pool, req.params.id, additionalQty, prefixFromTitle(title));
        }
        // ถ้า requestedStock <= currentStock จะไม่ทำอะไรเพิ่ม (ไม่ลดจำนวนโค้ดที่มีอยู่แล้ว)

        // 4. ดึงข้อมูลล่าสุดกลับไปแสดง (Stock ตอนนี้ตรงกับจำนวนโค้ด Available จริงเสมอ)
        const finalResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM TicketCodeMaster WHERE tickid = @id');

        res.json(finalResult.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ແກ້ໄຂປີ້ບໍ່ສຳເລັດ', error: err.message });
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