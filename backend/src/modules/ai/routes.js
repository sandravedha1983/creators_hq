const express = require('express');
const router = express.Router();
const aiController = require('./controllers');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/usage', aiController.getUsage);
router.get('/history', aiController.getHistory);
router.post('/content', aiController.generateContent);
router.post('/chat', aiController.chat);
router.post('/suggestions', aiController.getGrowthSuggestions);

module.exports = router;
