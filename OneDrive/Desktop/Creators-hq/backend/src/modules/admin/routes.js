const express = require('express');
const adminController = require('./controllers');
const { authenticate, authorize } = require('../../middleware/auth');
const router = express.Router();

router.get('/users', authenticate, authorize('admin'), adminController.getAllUsers);
router.delete('/user/:id', authenticate, authorize('admin'), adminController.deleteUser);
router.patch('/user/:id/block', authenticate, authorize('admin'), adminController.blockUser);
router.get('/campaigns', authenticate, authorize('admin'), adminController.getCampaigns);
router.get('/leads', authenticate, authorize('admin'), adminController.getLeads);

module.exports = router;
