const express = require('express');
const { getBrandDashboard, getCreatorDashboard } = require('./controllers');
const { authenticate, authorize } = require('../../middleware/auth');
const { verificationGuard } = require('../../middleware/verificationGuard');
const router = express.Router();

router.get('/brand', authenticate, authorize('brand', 'admin'), verificationGuard, getBrandDashboard);
router.get('/creator', authenticate, authorize('creator', 'admin'), verificationGuard, getCreatorDashboard);

module.exports = router;
