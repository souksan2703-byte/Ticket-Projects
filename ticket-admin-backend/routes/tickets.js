const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/', ticketController.createTicket);
router.put('/:id', ticketController.updateTicket);
router.patch('/:id/status', ticketController.toggleTicketStatus);
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;
