const bcrypt = require('bcryptjs');
const { sql, getPool } = require('../config/db');

function formatLastLogin(date) {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffHours < 1) return `${diffMins} นาทีที่แล้ว`;
    if (diffDays < 1) return `Today, ${d.toTimeString().slice(0, 5)}`;
    if (diffDays === 1) return `Yesterday, ${d.toTimeString().slice(0, 5)}`;
    if (diffDays < 14) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
}

// GET /api/admin-users
async function getAllUsers(req, res) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT id, name, username, role, status, lastLogin
            FROM AdminUsers
            ORDER BY id ASC
        `);

        const users = result.recordset.map((u) => ({
            ...u,
            last: formatLastLogin(u.lastLogin),
        }));

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ดึงข้อมูล admin users ไม่สำเร็จ', error: err.message });
    }
}

// POST /api/admin-users -> เพิ่ม admin user ใหม่
async function createUser(req, res) {
    try {
        const { name, username, password, role } = req.body;

        if (!name || !username || !password) {
            return res.status(400).json({ message: 'กรุณากรอก Name, Username และ Password ให้ครบ' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const pool = await getPool();
        const result = await pool.request()
            .input('name', sql.NVarChar(100), name)
            .input('username', sql.NVarChar(50), username)
            .input('passwordHash', sql.NVarChar(255), passwordHash)
            .input('role', sql.NVarChar(20), role || 'User')
            .query(`
                INSERT INTO AdminUsers (name, username, passwordHash, role, status)
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.username, INSERTED.role, INSERTED.status, INSERTED.lastLogin
                VALUES (@name, @username, @passwordHash, @role, 'Active')
            `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        if (err.message.includes('IX_AdminUsers_username')) {
            return res.status(409).json({ message: 'Username นี้ถูกใช้ไปแล้ว กรุณาใช้ชื่ออื่น' });
        }
        res.status(500).json({ message: 'เพิ่ม admin user ไม่สำเร็จ', error: err.message });
    }
}

// PUT /api/admin-users/:id -> แก้ไขข้อมูล (name, role)
async function updateUser(req, res) {
    try {
        const { name, role } = req.body;

        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('name', sql.NVarChar(100), name)
            .input('role', sql.NVarChar(20), role)
            .query(`
                UPDATE AdminUsers
                SET name = @name, role = @role
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.username, INSERTED.role, INSERTED.status, INSERTED.lastLogin
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ต้องการแก้ไข' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'แก้ไขข้อมูลไม่สำเร็จ', error: err.message });
    }
}

// PATCH /api/admin-users/:id/reset-password
async function resetPassword(req, res) {
    try {
        const { newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ message: 'กรุณากำหนดรหัสผ่านใหม่' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('passwordHash', sql.NVarChar(255), passwordHash)
            .query(`
                UPDATE AdminUsers SET passwordHash = @passwordHash
                OUTPUT INSERTED.id
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ต้องการ' });
        }
        res.json({ message: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'รีเซ็ตรหัสผ่านไม่สำเร็จ', error: err.message });
    }
}

// PATCH /api/admin-users/:id/status -> toggle Active/Disabled
async function toggleStatus(req, res) {
    try {
        const { status } = req.body; // "Active" หรือ "Disabled"

        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('status', sql.NVarChar(20), status)
            .query(`
                UPDATE AdminUsers SET status = @status
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.username, INSERTED.role, INSERTED.status, INSERTED.lastLogin
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ต้องการ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เปลี่ยนสถานะไม่สำเร็จ', error: err.message });
    }
}

// PATCH /api/admin-users/me/password -> ผู้ใช้เปลี่ยนรหัสผ่านของตัวเอง
// (ไม่บังคับใส่รหัสเดิม เพราะยืนยันตัวตนผ่าน JWT token อยู่แล้วว่า login เป็นคนนี้จริง)
async function changeOwnPassword(req, res) {
    try {
        const { newPassword } = req.body;
        const userId = req.user.id; // มาจาก JWT token ที่ผ่าน requireAuth แล้ว

        if (!newPassword) {
            return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านใหม่' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
        }

        const pool = await getPool();
        const newHash = await bcrypt.hash(newPassword, 10);
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .input('passwordHash', sql.NVarChar(255), newHash)
            .query(`
                UPDATE AdminUsers SET passwordHash = @passwordHash
                OUTPUT INSERTED.id
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้' });
        }

        res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ', error: err.message });
    }
}

module.exports = { getAllUsers, createUser, updateUser, resetPassword, toggleStatus, changeOwnPassword };
