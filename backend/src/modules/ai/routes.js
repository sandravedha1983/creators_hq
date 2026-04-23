const express = require('express');
const router = express.Router();
const aiController = require('./controllers');
const { authenticate } = require('../../middleware/auth');

router.post('/content', authenticate, aiController.generateContent);
router.post('/suggestions', authenticate, aiController.getGrowthSuggestions);

module.exports = router;
