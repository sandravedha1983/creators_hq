const express = require('express');
const controllers = require('./controllers');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/connect', controllers.connectPlatform);
router.post('/instagram/link', controllers.linkInstagram);
router.post('/instagram/verify', controllers.verifyInstagram);
router.get('/', controllers.getIntegrations);

module.exports = router;
