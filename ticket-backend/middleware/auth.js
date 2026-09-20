const jwt = require('jsonwebtoken');

// ตรวจสอบว่ามี token ที่ถูกต้องแนบมาไหม (ใส่ใน header: Authorization: Bearer <token>)
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, username, role }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
}

// ใช้ต่อจาก requireAuth เพื่อจำกัดเฉพาะ role Admin เท่านั้น
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'ต้องเป็นผู้ดูแลระบบ (Admin) เท่านั้นถึงจะทำรายการนี้ได้' });
    }
    next();
}

module.exports = { requireAuth, requireAdmin };
