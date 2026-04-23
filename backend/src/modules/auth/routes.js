
const express = require('express');
const authController = require('./controllers');
const { authenticate } = require('../../middleware/auth');
const router = express.Router();
console.log("Auth routes loaded");


const passport = require('./passport');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/verify-otp', authController.verifyOTP);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const { token } = req.user;
    const frontendURL = (process.env.FRONTEND_URL || 'https://creators-hq.onrender.com').replace(/\/$/, '');
    res.redirect(`${frontendURL}/dashboard-redirect?token=${token}`);
  }
);

// LinkedIn OAuth
router.get('/linkedin', passport.authenticate('linkedin', { scope: ['r_liteprofile', 'r_emailaddress'], state: 'SOME_STATE' }));
router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const { token } = req.user;
    const frontendURL = (process.env.FRONTEND_URL || 'https://creators-hq.onrender.com').replace(/\/$/, '');
    res.redirect(`${frontendURL}/dashboard-redirect?token=${token}`);
  }
);

router.get('/profile', authenticate, authController.getProfile);

module.exports = router;

