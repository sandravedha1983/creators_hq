const authService = require('./services');
const { registerSchema, loginSchema } = require('./validations');
const Analytics = require('../analytics/models');

const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.register(validatedData);
    
    // Initialize Analytics for the new user
    await Analytics.create({
      userId: user._id,
      followers: 1200,
      engagement: 8.5,
      earnings: 2500,
      growthScore: 78
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { token, user } = await authService.login(validatedData);
    res.json({ success: true, token, user });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const { sendOTPEmail } = require('../../utils/mailer');

const User = require('./models');

const sendOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await sendOTPEmail(email, otp);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent abuse: 60-second timer check
    const now = new Date();
    if (user.last_otp_resend && (now - user.last_otp_resend) < 60000) {
      const waitTime = Math.ceil((60000 - (now - user.last_otp_resend)) / 1000);
      return res.status(429).json({ 
        success: false, 
        message: `Please wait ${waitTime} seconds before resending` 
      });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Update in DB
    user.otp = newOtp;
    user.otp_expiry = otpExpiry;
    user.last_otp_resend = now;
    await user.save();

    // Send email
    await sendOTPEmail(email, newOtp);

    res.json({ 
      success: true, 
      message: 'Verification code sent successfully',
      otp: newOtp // Return for frontend sync
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, sendOTP, resendOTP };
