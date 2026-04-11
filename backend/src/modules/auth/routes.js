
const express = require('express');
const authController = require('./controllers');
const { authenticate } = require('../../middleware/auth');
const router = express.Router();
console.log("Auth routes loaded");


const passport = require('passport');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOTP);
router.post('/resend-otp', authController.resendOTP);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const { token } = req.user;
    res.redirect(`http://localhost:5173/dashboard-redirect?token=${token}`);
  }
);

// LinkedIn OAuth
router.get('/linkedin', passport.authenticate('linkedin', { state: 'SOME_STATE' }));
router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  (req, res) => {
    const { token } = req.user;
    res.redirect(`http://localhost:5173/dashboard-redirect?token=${token}`);
  }
);

router.get('/profile', authenticate, authController.getProfile);

module.exports = router;

