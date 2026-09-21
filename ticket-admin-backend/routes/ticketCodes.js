const express = require('express');
const router = express.Router();
const ticketCodeController = require('../controllers/ticketCodeController');
const { requireAuth } = require('../middleware/auth');

// QR code image ບໍ່ຕ້ອງ login ກ່ອນເບິ່ງ ເພາະພຽງແຕ່ re-encode ລະຫັດທີ່ຮູ້ຢູ່ແລ້ວເປັນຮູບພາບ
// (ໃຊ້ກັບ <img src> ໂດຍກົງຈາກຝັ່ງ client ເຊິ່ງແນບ Authorization header ບໍ່ໄດ້)
router.get('/qrcode/:code', ticketCodeController.getQrCode);

router.use(requireAuth); // ທີ່ເຫຼືອຕ້ອງ login ກ່ອນຈຶ່ງຈະເບິ່ງ/ສ້າງ/ສະແກນລະຫັດຕົ໋ວໄດ້

router.get('/', ticketCodeController.getAllCodes);
router.get('/stats', ticketCodeController.getStats);
router.post('/generate', ticketCodeController.generateCodes);
router.post('/sell', ticketCodeController.sellCode);
router.post('/scan', ticketCodeController.scanCode);
router.patch('/:id/receive', ticketCodeController.markReceived);

module.exports = router;
