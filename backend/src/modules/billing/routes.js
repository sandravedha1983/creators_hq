
const express = require('express');
const { processPayment, getHistory } = require('./controllers');
const { authenticate } = require('../../middleware/auth');
const router = express.Router();

router.post('/pay', authenticate, processPayment);
router.get('/history', authenticate, getHistory);

module.exports = router;

