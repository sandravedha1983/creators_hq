const express = require('express');
const controllers = require('./controllers');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.post('/instagram/start', authenticate, controllers.startInstagramOAuth);
router.get('/instagram/authorize', controllers.authorizeInstagramOAuth);
router.get('/instagram/callback', controllers.instagramOAuthCallback);
router.delete('/instagram', authenticate, controllers.disconnectInstagram);

// Legacy/Generic connect
router.post('/connect', authenticate, controllers.connectPlatform);

// Unified Social Verification Flow
router.post('/link', authenticate, controllers.linkSocial);
router.post('/verify', authenticate, controllers.verifySocial);

// Status
router.get('/', authenticate, controllers.getIntegrations);

module.exports = router;
