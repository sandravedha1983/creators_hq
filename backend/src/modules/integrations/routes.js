const express = require('express');
const controllers = require('./controllers');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Legacy/Generic connect
router.post('/connect', controllers.connectPlatform);

// Unified Social Verification Flow
router.post('/link', controllers.linkSocial);
router.post('/verify', controllers.verifySocial);

// Status
router.get('/', controllers.getIntegrations);

module.exports = router;
