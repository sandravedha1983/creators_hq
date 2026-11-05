const express = require('express');
const { processPayment, createPaymentIntent, getHistory } = require('./controllers');
const { authenticate } = require('../../middleware/auth');
const router = express.Router();

router.post('/create-intent', authenticate, createPaymentIntent);
router.post('/pay', authenticate, processPayment);
router.get('/history', authenticate, getHistory);

module.exports = router;
