const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/summary', reportController.getSummary);
router.get('/revenue-by-event', reportController.getRevenueByEvent);
router.get('/transactions', reportController.getTransactions);

module.exports = router;
