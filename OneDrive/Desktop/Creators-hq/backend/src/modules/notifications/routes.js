const express = require('express');
const { getNotifications, markAsRead, markAllAsRead } = require('./controllers');
const { authenticate } = require('../../middleware/auth');
const router = express.Router();

router.use(authenticate);
router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
