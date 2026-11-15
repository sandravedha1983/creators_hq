const express = require('express');
const { getMyCollaborations, getByBrand, getByCreator, updateStatus, createRequest } = require('./controllers');
const { authenticate, authorize } = require('../../middleware/auth');
const { requireVerified } = require('../../middleware/requireVerified');
const router = express.Router();

router.get('/mine', authenticate, getMyCollaborations);
router.post('/request', authenticate, authorize('brand', 'creator'), requireVerified, createRequest);
router.patch('/:id/status', authenticate, requireVerified, updateStatus);
router.get('/brand/:brandId', authenticate, authorize('brand', 'admin'), getByBrand);
router.get('/creator/:creatorId', authenticate, authorize('creator', 'admin'), getByCreator);

module.exports = router;
