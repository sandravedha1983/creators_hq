
const express = require('express');
const { searchCreators, getCreator, createProfile } = require('./controllers');
const { authenticate, authorize } = require('../../middleware/auth');
const router = express.Router();

router.get('/search', authenticate, searchCreators);
router.post('/create', authenticate, authorize('creator', 'admin'), createProfile);
router.get('/:id', authenticate, getCreator);

module.exports = router;

