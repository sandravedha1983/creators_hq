
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
router.post('/admin-login', authController.adminLogin);

router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
