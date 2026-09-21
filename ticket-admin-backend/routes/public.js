const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// ບໍ່ມີ requireAuth ເລີຍໃນໄຟລ໌ນີ້ ເພາະເປັນ API ສຳລັບລູກຄ້າທົ່ວໄປທີ່ບໍ່ຕ້ອງ login
router.get('/events', publicController.getEvents);
router.get('/events/:id', publicController.getEventById);
router.post('/checkout', publicController.checkout);

// ສຳລັບເຄື່ອງສະແກນ QR ໜ້າງານໂດຍສະເພາະ (ບໍ່ຕ້ອງ login) ແບ່ງເປັນ 2 ຂັ້ນຕອນ:
// 1) check-ticket   -> ສະແກນແລ້ວກວດສະຖານະຢ່າງດຽວ ບໍ່ໝາຍວ່າຮັບຕົ໋ວ
// 2) receive-ticket -> ພະນັກງານກົດຢືນຢັນໃນໜ້າລາຍລະອຽດແລ້ວຄ່ອຍໝາຍວ່າຮັບຕົ໋ວແທ້
router.post('/check-ticket', publicController.checkTicket);
router.post('/receive-ticket', publicController.receiveTicket);

// GET /api/public/tickets-not-received?tickid=24 -> ໃຊ້ກັບໜ້າ "ລູກຄ້າທີ່ຍັງບໍ່ຮັບບັດ"
router.get('/tickets-not-received', publicController.getNotReceived);
// GET /api/public/tickets-received?tickid=24 -> ລາຍຊື່ຄົນທີ່ຮັບຕົ໋ວໄປແລ້ວ
router.get('/tickets-received', publicController.getReceived);

module.exports = router;