const authService = require('./services');
const axios = require('axios');
const { registerSchema, loginSchema } = require('./validations');
const Analytics = require('../analytics/models');
const Otp = require('./Otp');
const jwt = require('jsonwebtoken');
const { sendOTP: sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail, generateResetToken } = require('../../utils/mailer');
const User = require('./models');
const bcrypt = require('bcrypt');

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

    sendOTPEmail(user.email, otp).catch(err => {
        console.error(`[MAIL ERROR] Registration OTP email failed for ${user.email}:`, err.message);
    });
    console.log(`[AUTH] Registration OTP generated for ${user.email} (OTP: ${otp})`);

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
    const user = await User.findById(req.user.id).select('-password_hash -resetToken -resetTokenExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'avatar', 'isOnboarded'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password_hash -resetToken -resetTokenExpiry');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
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

    // Mark as verified if not already + send welcome email on first verification
    const isFirstVerification = !user.isVerified;
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

    // Send welcome email on first-ever verification (non-blocking)
    if (isFirstVerification) {
      sendWelcomeEmail(user.email, user.name).catch(err => {
        console.error(`[MAIL] Welcome email failed for ${user.email}:`, err.message);
      });
    }

    res.json({ 
      success: true, 
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan || 'free',
        isOnboarded: user.isOnboarded || false,
        avatar: user.avatar || ''
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

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether the email exists — return success either way
      return res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 30 * 60000); // 30 minutes

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    await sendPasswordResetEmail(email, resetToken);
    console.log(`[AUTH] Password reset email sent to ${email}`);

    res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, token, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email, resetToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (new Date() > user.resetTokenExpiry) {
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
    }

    // Update password
    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    console.log(`[AUTH] Password reset successful for ${email}`);

    res.json({ success: true, message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (error) {
    next(error);
  }
};

const facebookCallback = async (req, res, next) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("No code received from Facebook");
  }

  try {
    // 1. Exchange the authorization code for an access token
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

    // 2. Fetch user profile
    const userResponse = await axios.get("https://graph.facebook.com/me", {
      params: {
        fields: "id,name,email",
        access_token: accessToken,
      },
    });

    const { name, email } = userResponse.data;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Facebook account must have a verified email." 
      });
    }

    // 3. Find or Create User
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        role: 'creator',
        isVerified: true, 
        password_hash: Math.random().toString(36).substring(7)
      });

      // Initialize Analytics for new user
      await Analytics.create({ userId: user._id });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5. Redirect to Frontend
    const getFrontendUrl = (req) => {
        if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
            return 'http://localhost:5173';
        }
        return process.env.FRONTEND_URL || 'http://localhost:5173';
    };
    const redirectUrl = getFrontendUrl(req);
    res.redirect(`${redirectUrl}/dashboard-redirect?token=${token}`);

  } catch (error) {
    console.error("Facebook OAuth Error:", error.response?.data || error.message);
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile, sendOTP, resendOTP, verifyOTP, adminLogin, forgotPassword, resetPassword, facebookCallback };

