require('dotenv').config();
const express = require('express');
const cors = require('cors');

const ticketRoutes = require('./routes/tickets');
const authRoutes = require('./routes/auth');
const adminUserRoutes = require('./routes/adminUsers');
const ticketCodeRoutes = require('./routes/ticketCodes');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const publicRoutes = require('./routes/public');

const app = express();

app.use(cors()); // ໃຫ້ React (localhost:3000/5173) ເອີ້ນ API ນີ້ໄດ້
app.use(express.json());

// Route ກຸ່ມຕ່າງໆ
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);             // Sign in
app.use('/api/admin-users', adminUserRoutes); // Admin users
app.use('/api/ticket-codes', ticketCodeRoutes); // Ticket codes
app.use('/api/reports', reportRoutes);        // Reports
app.use('/api/dashboard', dashboardRoutes);   // Dashboard
app.use('/api/public', publicRoutes);         // ໜ້າຮ້ານສຳລັບລູກຄ້າ (ບໍ່ຕ້ອງ login)

app.get('/', (req, res) => {
    res.json({ message: 'Ticket Admin API ກຳລັງເຮັດວຽກຢູ່' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ແລ່ນຢູ່ທີ່ http://localhost:${PORT}`);
});
