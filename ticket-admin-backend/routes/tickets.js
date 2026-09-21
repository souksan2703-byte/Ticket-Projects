const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth); // ຕ້ອງ login ກ່ອນຈຶ່ງຈະເບິ່ງລາຍການອີເວັນໄດ້ (User ຫຼື Admin ກໍ່ໄດ້)

router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);

// ສ້າງ/ແກ້ໄຂ/ລຶບອີເວັນ ເປັນສິດທິ໌ເຊິງໂຄງສ້າງ ຈຳກັດສະເພາະ Admin ເທົ່ານັ້ນ
router.post('/', requireAdmin, ticketController.createTicket);
router.put('/:id', requireAdmin, ticketController.updateTicket);
router.patch('/:id/status', requireAdmin, ticketController.toggleTicketStatus);
router.delete('/:id', requireAdmin, ticketController.deleteTicket);

module.exports = router;
