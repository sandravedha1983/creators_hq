const express = require('express');
const controllers = require('./controllers');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/connect', controllers.connectPlatform);
router.get('/', controllers.getIntegrations);

module.exports = router;
