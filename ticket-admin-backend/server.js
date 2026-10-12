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

app.use(cors()); // ໃຫ້ React (localhost:3000/5173) ເອີ້ນ API ນີ້ໄດ້
app.use(express.json());

// ສ້າງໂຟນເດີ /uploads ໂດຍອັດຕະໂນມັດຖ້າມັນຍັງບໍ່ມີຢູ່ (ເພື່ອປ້ອງກັນການເສຍຫາຍໃນລະຫວ່າງການນຳໃຊ້ຄັ້ງທຳອິດເມື່ອໂຟນເດີນີ້ບໍ່ມີຢູ່)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ອະນຸຍາດໃຫ້ເຂົ້າເຖິງໄຟລ໌ທີ່ອັບໂຫລດຜ່ານ URL ໂດຍກົງ, ເຊັ່ນ: http://localhost:5000/uploads/xxxx.jpg
app.use('/uploads', express.static(uploadsDir));

// Route กลุ่มต่างๆ
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);             // Sign in (Admin/Staff)
app.use('/api/admin-users', adminUserRoutes); // Admin users
app.use('/api/ticket-codes', ticketCodeRoutes); // Ticket codes
app.use('/api/reports', reportRoutes);        // Reports
app.use('/api/dashboard', dashboardRoutes);   // Dashboard
app.use('/api/public', publicRoutes);         // ໜ້າຮ້ານສຳລັບລູກຄ້າ (ບໍ່ຕ້ອງ login)
app.use('/api/upload', uploadRoutes);         // ອັບໂຫລດຮູບພາບ (ໃຊ້ Multer)


app.get('/', (req, res) => {
    res.json({ message: 'Ticket Admin API ກຳລັງໃຊ້ງານຢູ່' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ລັນຢູ່ທີ່ http://localhost:${PORT}`);
});
