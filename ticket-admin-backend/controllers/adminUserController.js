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

    if (diffMins < 1) return 'ບໍ່ດົນມານີ້';
    if (diffHours < 1) return `${diffMins} ນາທີທີ່ຜ່ານມາ`;
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
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນ admin users ບໍ່ສຳເລັດ', error: err.message });
    }
}

// POST /api/admin-users -> ເພີ່ມ admin user ໃໝ່
async function createUser(req, res) {
    try {
        const { name, username, password, role } = req.body;

        if (!name || !username || !password) {
            return res.status(400).json({ message: 'ກະລຸນາປ້ອນ Name, Username ແລະ Password ໃຫ້ຄົບ' });
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
            return res.status(409).json({ message: 'Username ນີ້ຖືກໃຊ້ໄປແລ້ວ ກະລຸນາໃຊ້ຊື່ອື່ນ' });
        }
        res.status(500).json({ message: 'ເພີ່ມ admin user ບໍ່ສຳເລັດ', error: err.message });
    }
}

// PUT /api/admin-users/:id -> ແກ້ໄຂຂໍ້ມູນ (name, role)
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
            return res.status(404).json({ message: 'ບໍ່ພົບຜູ້ໃຊ້ທີ່ຕ້ອງການແກ້ໄຂ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ແກ້ໄຂຂໍ້ມູນບໍ່ສຳເລັດ', error: err.message });
    }
}

// PATCH /api/admin-users/:id/reset-password
async function resetPassword(req, res) {
    try {
        const { newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ message: 'ກະລຸນາກຳນົດລະຫັດຜ່ານໃໝ່' });
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
            return res.status(404).json({ message: 'ບໍ່ພົບຜູ້ໃຊ້ທີ່ຕ້ອງການ' });
        }
        res.json({ message: 'ຣີເຊັດລະຫັດຜ່ານຮຽບຮ້ອຍແລ້ວ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ຣີເຊັດລະຫັດຜ່ານບໍ່ສຳເລັດ', error: err.message });
    }
}

// PATCH /api/admin-users/:id/status -> toggle Active/Disabled
async function toggleStatus(req, res) {
    try {
        const { status } = req.body; // "Active" ຫຼື "Disabled"

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
            return res.status(404).json({ message: 'ບໍ່ພົບຜູ້ໃຊ້ທີ່ຕ້ອງການ' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ປ່ຽນສະຖານະບໍ່ສຳເລັດ', error: err.message });
    }
}

// PATCH /api/admin-users/me/password -> ຜູ້ໃຊ້ປ່ຽນລະຫັດຜ່ານຂອງຕົນເອງ
// (ບໍ່ບັງຄັບໃສ່ລະຫັດເກົ່າ ເພາະຢືນຢັນຕົວຕົນຜ່ານ JWT token ຢູ່ແລ້ວວ່າ login ເປັນຄົນນີ້ແທ້)
async function changeOwnPassword(req, res) {
    try {
        const { newPassword } = req.body;
        const userId = req.user.id; // ມາຈາກ JWT token ທີ່ຜ່ານ requireAuth ແລ້ວ

        if (!newPassword) {
            return res.status(400).json({ message: 'ກະລຸນາປ້ອນລະຫັດຜ່ານໃໝ່' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ໂຕອັກສອນ' });
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
            return res.status(404).json({ message: 'ບໍ່ພົບບັນຊີຜູ້ໃຊ້' });
        }

        res.json({ message: 'ປ່ຽນລະຫັດຜ່ານຮຽບຮ້ອຍແລ້ວ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ປ່ຽນລະຫັດຜ່ານບໍ່ສຳເລັດ', error: err.message });
    }
}

module.exports = { getAllUsers, createUser, updateUser, resetPassword, toggleStatus, changeOwnPassword };
