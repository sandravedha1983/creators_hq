const express = require('express');
const adminController = require('./controllers');
const { authenticate, authorize } = require('../../middleware/auth');
const router = express.Router();

router.get('/users', authenticate, authorize('admin'), adminController.getAllUsers);
router.delete('/user/:id', authenticate, authorize('admin'), adminController.deleteUser);
router.patch('/user/:id/block', authenticate, authorize('admin'), adminController.blockUser);

module.exports = router;
