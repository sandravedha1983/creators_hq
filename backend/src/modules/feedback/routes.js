const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const { authenticate, authorize } = require('../../middleware/auth');

// Public or authenticated feedback submission
router.post('/', (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (authHeader) {
    return authenticate(req, res, () => controllers.submitFeedback(req, res, next));
  }
  controllers.submitFeedback(req, res, next);
});

// Admin-only review endpoints
router.get('/', authenticate, authorize('admin'), controllers.getAllFeedback);
router.patch('/:id', authenticate, authorize('admin'), controllers.updateFeedbackStatus);

module.exports = router;
