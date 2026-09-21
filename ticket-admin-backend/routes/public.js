const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// ไม่มี requireAuth เลยในไฟล์นี้ เพราะเป็น API สำหรับลูกค้าทั่วไปที่ไม่ต้อง login
router.get('/events', publicController.getEvents);
router.get('/events/:id', publicController.getEventById);
router.post('/checkout', publicController.checkout);

// สำหรับเครื่องสแกน QR หน้างานโดยเฉพาะ (ไม่ต้อง login) แบ่งเป็น 2 ขั้นตอน:
// 1) check-ticket   -> สแกนแล้วเช็คสถานะอย่างเดียว ไม่มาร์คว่ารับตั๋ว
// 2) receive-ticket -> พนักงานกดยืนยันในหน้ารายละเอียดแล้วค่อยมาร์คว่ารับตั๋วจริง
router.post('/check-ticket', publicController.checkTicket);
router.post('/receive-ticket', publicController.receiveTicket);

// GET /api/public/tickets-not-received?tickid=24 -> ใช้กับหน้า "ลูกค้าที่ยังไม่รับบัตร"
router.get('/tickets-not-received', publicController.getNotReceived);
// GET /api/public/tickets-received?tickid=24 -> รายชื่อคนที่รับตั๋วไปแล้ว
router.get('/tickets-received', publicController.getReceived);

module.exports = router;