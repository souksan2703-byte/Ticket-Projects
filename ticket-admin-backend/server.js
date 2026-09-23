require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const ticketRoutes = require('./routes/tickets');
const authRoutes = require('./routes/auth');
const adminUserRoutes = require('./routes/adminUsers');
const ticketCodeRoutes = require('./routes/ticketCodes');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const publicRoutes = require('./routes/public');
const uploadRoutes = require('./routes/upload');

const app = express();

app.use(cors()); // ให้ React (localhost:3000/5173) เรียก API นี้ได้
app.use(express.json());

// สร้างโฟลเดอร์ /uploads อัตโนมัติถ้ายังไม่มี (กันพังตอน deploy ครั้งแรกที่ยังไม่มีโฟลเดอร์นี้)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// เปิดให้เข้าถึงไฟล์ที่อัปโหลดแล้วผ่าน URL ตรงๆ เช่น http://localhost:5000/uploads/xxxx.jpg
app.use('/uploads', express.static(uploadsDir));

// Route กลุ่มต่างๆ
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);             // Sign in (Admin/Staff)
app.use('/api/admin-users', adminUserRoutes); // Admin users
app.use('/api/ticket-codes', ticketCodeRoutes); // Ticket codes
app.use('/api/reports', reportRoutes);        // Reports
app.use('/api/dashboard', dashboardRoutes);   // Dashboard
app.use('/api/public', publicRoutes);         // หน้าร้านสำหรับลูกค้า (ไม่ต้อง login)
app.use('/api/upload', uploadRoutes);         // อัปโหลดรูปภาพ (ใช้ Multer)

app.get('/', (req, res) => {
    res.json({ message: 'Ticket Admin API กำลังทำงานอยู่' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server รันอยู่ที่ http://localhost:${PORT}`);
});
