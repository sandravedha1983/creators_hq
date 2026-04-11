const Transaction = require('./models');

const processPayment = async (req, res, next) => {
  try {
    const { amount, cardNumber, cvv, expiryDate, cardHolder, userId } = req.body;

    // Simulate realistic processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    if (!cardNumber || cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
      return res.status(400).json({ success: false, message: "Invalid payment details" });
    }

    if (!cvv || cvv.length !== 3 || !/^\d+$/.test(cvv)) {
      return res.status(400).json({ success: false, message: "Invalid payment details" });
    }

    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      return res.status(400).json({ success: false, message: "Invalid payment details" });
    }

    if (!cardHolder || cardHolder.trim() === "") {
      return res.status(400).json({ success: false, message: "Invalid payment details" });
    }

    // Simulate failure for specific case (e.g. card ends in 9999)
    if (cardNumber.endsWith('9999')) {
      return res.status(402).json({ success: false, message: "Payment Failed: Insufficient funds or declined by bank" });
    }

    // Mock processing - assume success
    const payment = await Transaction.create({
      sender_id: userId || req.user.id,
      recipient_id: req.user.id, // For self-billing/mocking
      amount,
      currency: req.body.currency || 'INR',
      status: 'paid'
    });

    res.status(201).json({ 
      success: true, 
      message: "Payment successful", 
      amount,
      data: payment 
    });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const history = await Transaction.getHistoryByUserId(req.user.id);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

module.exports = { processPayment, getHistory };
