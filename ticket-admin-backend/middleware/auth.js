const jwt = require('jsonwebtoken');

// ກວດສອບວ່າມີ token ທີ່ຖືກຕ້ອງແນບມາບໍ (ໃສ່ໃນ header: Authorization: Bearer <token>)
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນນຳໃຊ້' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, username, role }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token ບໍ່ຖືກຕ້ອງ ຫຼືໝົດອາຍຸ ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່' });
    }
}

// ໃຊ້ຕໍ່ຈາກ requireAuth ເພື່ອຈຳກັດສະເພາະ role Admin ເທົ່ານັ້ນ
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'ຕ້ອງເປັນຜູ້ດູແລລະບົບ (Admin) ເທົ່ານັ້ນຈຶ່ງຈະເຮັດລາຍການນີ້ໄດ້' });
    }
    next();
}

module.exports = { requireAuth, requireAdmin };
