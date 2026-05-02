const authService = require('./services');
const { registerSchema, loginSchema } = require('./validations');
const Analytics = require('../analytics/models');
const Otp = require('./Otp');
const jwt = require('jsonwebtoken');
const { sendOTP: sendOTPEmail } = require('../../utils/mailer');
const User = require('./models');

const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.register(validatedData);
    
    // Initialize empty Analytics for the new user
    await Analytics.create({
      userId: user._id
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

const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // Check if user exists (Optional: user might want to sign up with OTP)
    // For now, let's assume they must be registered as per current logic
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

    // Save in DB (Replace existing if any)
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otp);
    console.log(`[AUTH] Secure OTP generated and sent to ${email}`);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

const resendOTP = async (req, res, next) => {
  // Re-using sendOTP logic for resend
  return sendOTP(req, res, next);
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and Code required' });

    const otpRecord = await Otp.findOne({ email, otp });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP Expired' });
    }

    // Match found and valid
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Delete OTP after success
    await Otp.deleteOne({ _id: otpRecord._id });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      success: true, 
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'Authentication Successful' 
    });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { id: 'admin', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.json({ success: true, token, user: { email, role: 'admin' } });
    }
    res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, sendOTP, resendOTP, verifyOTP, adminLogin };
