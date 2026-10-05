const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);

        const filename =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1E9) +
            ext;

        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('อนุญาตเฉพาะไฟล์ JPG, PNG และ WEBP เท่านั้น'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

module.exports = upload;