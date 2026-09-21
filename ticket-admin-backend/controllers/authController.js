const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../config/db');

// POST /api/auth/login
async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'ກະລຸນາປ້ອນ Username ແລະ Password' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('username', sql.NVarChar(50), username)
            .query('SELECT * FROM AdminUsers WHERE username = @username');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ message: 'Username ຫຼື Password ບໍ່ຖືກຕ້ອງ' });
        }

        if (user.status === 'Disabled') {
            return res.status(403).json({ message: 'ບັນຊີນີ້ຖືກໂຈະການນຳໃຊ້ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ' });
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Username ຫຼື Password ບໍ່ຖືກຕ້ອງ' });
        }

        // ອັບເດດເວລາ login ຫຼ້າສຸດ
        await pool.request()
            .input('id', sql.Int, user.id)
            .query('UPDATE AdminUsers SET lastLogin = GETDATE() WHERE id = @id');

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ', error: err.message });
    }
}

module.exports = { login };
