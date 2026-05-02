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

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

    await Otp.findOneAndUpdate(
      { email: user.email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await sendOTPEmail(user.email, otp);
    console.log(`[AUTH] Registration OTP sent to ${user.email}`);

    res.status(201).json({ 
        success: true, 
        message: 'Registration successful. OTP sent.',
        user: {
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await authService.login(validatedData);
    
    // Credentials valid, now send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

    console.log(`[AUTH] Saving OTP for ${user.email}...`);
    await Otp.findOneAndUpdate(
      { email: user.email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    console.log(`[AUTH] Sending Email to ${user.email}...`);
    // Attempt to send email, but don't let it hang the whole request
    sendOTPEmail(user.email, otp).catch(err => {
        console.error(`[MAIL ERROR] Failed to send to ${user.email}:`, err.message);
    });

    console.log(`[AUTH] Login success response for ${user.email}`);

    res.json({ 
        success: true, 
        message: 'Credentials verified. OTP sent.',
        user: {
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
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

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otp);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

const resendOTP = async (req, res, next) => {
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

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Mark as verified if not already
    if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
    }

    await Otp.deleteOne({ _id: otpRecord._id });

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
