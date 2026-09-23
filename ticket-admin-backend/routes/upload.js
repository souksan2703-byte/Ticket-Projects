const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ตั้งค่า multer ให้เก็บไฟล์ลงโฟลเดอร์ /uploads บนดิสก์
// ตั้งชื่อไฟล์ใหม่แบบสุ่ม กันชื่อไฟล์ซ้ำและกันปัญหาชื่อไฟล์ภาษาไทย/อักขระพิเศษ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueName}${ext}`);
    },
});

// กรองให้รับเฉพาะไฟล์รูปภาพเท่านั้น (กัน upload ไฟล์อันตราย เช่น .exe, .php)
function fileFilter(req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF) เท่านั้น'));
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไฟล์ไม่เกิน 5MB
});

// POST /api/upload/image -> อัปโหลดรูป 1 ไฟล์ คืนค่า URL ที่ใช้เรียกดูรูปนั้นกลับมา
// จำกัดเฉพาะ Admin เท่านั้น (ใช้ตอนสร้าง/แก้ไขอีเวนต์ในหน้า Manage tickets)
router.post('/image', requireAuth, requireAdmin, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 5MB)' });
            }
            return res.status(400).json({ message: 'อัปโหลดไฟล์ไม่สำเร็จ', error: err.message });
        }
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
        }

        // คืน path แบบ relative ให้ frontend เอาไปต่อกับ base URL เอง (เก็บลง DB แบบ path เฉยๆ ไม่ผูกกับ host)
        const relativePath = `/uploads/${req.file.filename}`;
        res.status(201).json({ path: relativePath });
    });
});

module.exports = router;
