const express = require('express');
const { getBrandDashboard, getCreatorDashboard } = require('./controllers');
const { authenticate, authorize } = require('../../middleware/auth');
const router = express.Router();

// verificationGuard REMOVED — OTP verification is sufficient for dashboard access.
// Social profile verification (verificationStatus) is a separate concern for integrations.
router.get('/brand', authenticate, authorize('brand', 'admin'), getBrandDashboard);
router.get('/creator', authenticate, authorize('creator', 'admin'), getCreatorDashboard);

module.exports = router;
