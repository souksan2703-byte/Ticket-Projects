const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../config/db');

// POST /api/auth/login
async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'กรุณากรอก Username และ Password' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('username', sql.NVarChar(50), username)
            .query('SELECT * FROM AdminUsers WHERE username = @username');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ message: 'Username หรือ Password ไม่ถูกต้อง' });
        }

        if (user.status === 'Disabled') {
            return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Username หรือ Password ไม่ถูกต้อง' });
        }

        // อัปเดตเวลา login ล่าสุด
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
        res.status(500).json({ message: 'เข้าสู่ระบบไม่สำเร็จ', error: err.message });
    }
}
// POST /api/auth/logout
async function logout(req, res) {
    try {
        // JWT เป็นระบบ stateless
        // การ logout จริง ๆ จะให้ Frontend ลบ token ออกจาก storage

        res.json({
            message: 'ออกจากระบบสำเร็จ'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'ออกจากระบบไม่สำเร็จ',
            error: err.message
        });
    }
}
module.exports = { login, logout };
