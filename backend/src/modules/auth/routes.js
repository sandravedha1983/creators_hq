
const express = require('express');
const axios = require('axios');
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
router.post('/admin-login', authController.adminLogin);

// Google OAuth
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = req.user.token;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${FRONTEND_URL}/dashboard-redirect?token=${token}`);
  }
);

// LinkedIn OAuth
router.get("/linkedin",
  passport.authenticate("linkedin", { scope: ["openid", "profile", "email"], state: 'SOME_STATE' })
);

router.get("/linkedin/callback",
  passport.authenticate("linkedin", { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = req.user.token;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${FRONTEND_URL}/dashboard-redirect?token=${token}`);
  }
);

// Facebook OAuth Callback
router.get("/facebook/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("No code received");
  }

  try {
    const tokenResponse = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          client_id: process.env.APP_ID,
          client_secret: process.env.APP_SECRET,
          redirect_uri: process.env.REDIRECT_URI,
          code: code,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    res.send("Access Token: " + accessToken);

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send("Error getting token");
  }
});

router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
