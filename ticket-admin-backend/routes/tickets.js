const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth); // ต้อง login ก่อนถึงจะดูรายการอีเวนต์ได้ (User หรือ Admin ก็ได้)

router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);

// สร้าง/แก้ไข/ลบอีเวนต์ เป็นสิทธิ์เชิงโครงสร้าง จำกัดเฉพาะ Admin เท่านั้น
router.post('/', requireAdmin, ticketController.createTicket);
router.put('/:id', requireAdmin, ticketController.updateTicket);
router.patch('/:id/status', requireAdmin, ticketController.toggleTicketStatus);
router.delete('/:id', requireAdmin, ticketController.deleteTicket);

module.exports = router;
