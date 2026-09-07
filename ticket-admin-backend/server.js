require('dotenv').config();
const express = require('express');
const cors = require('cors');

const ticketRoutes = require('./routes/tickets');
const authRoutes = require('./routes/auth');
const adminUserRoutes = require('./routes/adminUsers');
const ticketCodeRoutes = require('./routes/ticketCodes');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors()); // ให้ React (localhost:3000/5173) เรียก API นี้ได้
app.use(express.json());

// Route กลุ่มต่างๆ
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);             // Sign in
app.use('/api/admin-users', adminUserRoutes); // Admin users
app.use('/api/ticket-codes', ticketCodeRoutes); // Ticket codes
app.use('/api/reports', reportRoutes);        // Reports
app.use('/api/dashboard', dashboardRoutes);   // Dashboard

app.get('/', (req, res) => {
    res.json({ message: 'Ticket Admin API กำลังทำงานอยู่' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server รันอยู่ที่ http://localhost:${PORT}`);
});
