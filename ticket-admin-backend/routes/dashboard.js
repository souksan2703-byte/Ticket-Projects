const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/summary', dashboardController.getSummary);
router.get('/sold-by-event', dashboardController.getSoldByEvent);
router.get('/ticket-mix', dashboardController.getTicketMix);
router.get('/transactions', dashboardController.getTransactionSeries);

module.exports = router;
