const express = require('express');
const router = express.Router();
const ticketCodeController = require('../controllers/ticketCodeController');
const { requireAuth } = require('../middleware/auth');

// QR code image ไม่ต้อง login ก่อนดู เพราะแค่ re-encode โค้ดที่รู้อยู่แล้วเป็นรูปภาพ
// (ใช้กับ <img src> โดยตรงจากฝั่ง client ซึ่งแนบ Authorization header ไม่ได้)
router.get('/qrcode/:code', ticketCodeController.getQrCode);

router.use(requireAuth); // ที่เหลือต้อง login ก่อนถึงจะดู/สร้าง/สแกนโค้ดตั๋วได้

router.get('/', ticketCodeController.getAllCodes);
router.get('/stats', ticketCodeController.getStats);
router.post('/generate', ticketCodeController.generateCodes);
router.post('/sell', ticketCodeController.sellCode);
router.post('/scan', ticketCodeController.scanCode);
router.patch('/:id/receive', ticketCodeController.markReceived);

module.exports = router;
