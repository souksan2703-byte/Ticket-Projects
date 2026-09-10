const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// ไม่มี requireAuth เลยในไฟล์นี้ เพราะเป็น API สำหรับลูกค้าทั่วไปที่ไม่ต้อง login
router.get('/events', publicController.getEvents);
router.get('/events/:id', publicController.getEventById);
router.post('/checkout', publicController.checkout);

module.exports = router;
