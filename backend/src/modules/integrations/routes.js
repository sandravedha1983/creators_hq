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

router.post('/link', authenticate, controllers.linkSocial);
router.delete('/link/:platform', authenticate, controllers.disconnectSocial);

// Status
router.get('/', authenticate, controllers.getIntegrations);

module.exports = router;
