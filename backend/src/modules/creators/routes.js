const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const { getMyProfile, updateMyProfile, getGrowthScore, getPublicCreators } = require('./controllers');
const { getMyBrandProfile, updateMyBrandProfile } = require('./brandController');

// ─── Creator routes ───────────────────────────────────────────────────────────
router.get('/profile', authenticate, authorize('creator'), getMyProfile);
router.put('/profile', authenticate, authorize('creator'), updateMyProfile);
router.get('/growth-score', authenticate, authorize('creator'), getGrowthScore);
router.get('/public', getPublicCreators);  // public — no auth required for brand browsing

// ─── Brand profile routes ─────────────────────────────────────────────────────
router.get('/brand-profile', authenticate, authorize('brand'), getMyBrandProfile);
router.put('/brand-profile', authenticate, authorize('brand'), updateMyBrandProfile);

module.exports = router;
