const express = require('express');
const {
  apply,
  listAdminWaitlist,
  updateWaitlistStatus,
  createInvitation,
  acceptInvitation
} = require('./controllers');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();

router.post('/apply', apply);
router.get('/admin', authenticate, authorize('admin'), listAdminWaitlist);
router.patch('/:id/status', authenticate, authorize('admin'), updateWaitlistStatus);
router.post('/:id/invite', authenticate, authorize('admin'), createInvitation);
router.post('/accept', acceptInvitation);

module.exports = router;
