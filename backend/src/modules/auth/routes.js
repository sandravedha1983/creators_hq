
const express = require('express');
const axios = require('axios');
const authController = require('./controllers');
const { authenticate } = require('../../middleware/auth');
const router = express.Router();
console.log("Auth routes loaded");


const passport = require('./passport');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const getFrontendUrl = (req) => {
    if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
        return 'http://localhost:5173';
    }
    return process.env.FRONTEND_URL || 'http://localhost:5173';
};
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/admin-login', authController.adminLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Google OAuth
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const redirectUrl = getFrontendUrl(req);
    return res.redirect(`${redirectUrl}/login?error=google_not_configured`);
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const redirectUrl = getFrontendUrl(req);
    return res.redirect(`${redirectUrl}/login?error=google_not_configured`);
  }
  const frontendUrl = getFrontendUrl(req);
  passport.authenticate("google", { session: false, failureRedirect: `${frontendUrl}/login?error=oauth_failed` }, (err, user) => {
    if (err || !user) {
      console.error('[OAUTH] Google callback error:', err?.message || 'No user returned');
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
    const token = user.token;
    res.redirect(`${frontendUrl}/dashboard-redirect?token=${token}`);
  })(req, res, next);
});

// LinkedIn OAuth
router.get("/linkedin", (req, res, next) => {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    const redirectUrl = getFrontendUrl(req);
    return res.redirect(`${redirectUrl}/login?error=linkedin_not_configured`);
  }
  passport.authenticate("linkedin", { scope: ["openid", "profile", "email"], state: 'SOME_STATE' })(req, res, next);
});

router.get("/linkedin/callback", (req, res, next) => {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    const redirectUrl = getFrontendUrl(req);
    return res.redirect(`${redirectUrl}/login?error=linkedin_not_configured`);
  }
  const frontendUrl = getFrontendUrl(req);
  passport.authenticate("linkedin", { session: false, failureRedirect: `${frontendUrl}/login?error=oauth_failed` }, (err, user) => {
    if (err || !user) {
      console.error('[OAUTH] LinkedIn callback error:', err?.message || 'No user returned');
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
    const token = user.token;
    res.redirect(`${frontendUrl}/dashboard-redirect?token=${token}`);
  })(req, res, next);
});

// Facebook OAuth
router.get("/facebook", (req, res) => {
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.APP_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=email`;
  res.redirect(url);
});

// Facebook OAuth Callback
router.get("/facebook/callback", authController.facebookCallback);

router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;
