const nodemailer = require("nodemailer");
const crypto = require("crypto");

// SMTP Transport Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

// Verify SMTP connection on startup
transporter.verify()
  .then(() => console.log("[MAIL] SMTP connection verified ✅"))
  .catch((err) => console.error("[MAIL] SMTP connection failed ❌:", err.message));

/**
 * Send with retry — attempts once, retries once after 2s delay on failure.
 */
const sendWithRetry = async (mailOptions, retries = 1) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[MAIL] Sent to ${mailOptions.to} | MessageId: ${info.messageId}`);
      return info;
    } catch (err) {
      console.error(`[MAIL] Attempt ${attempt + 1} failed for ${mailOptions.to}:`, err.message);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay before retry
      } else {
        throw err;
      }
    }
  }
};

/**
 * Sends an OTP to the specified email.
 */
const sendOTP = async (email, otp) => {
  await sendWithRetry({
    from: `"CreatorsHQ" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Verification Code — CreatorsHQ",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0A0F1D; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CreatorsHQ</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
        </div>
        <div style="padding: 40px 32px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">Use the following code to complete your authentication. This code expires in <strong style="color: #fff;">5 minutes</strong>.</p>
          <div style="background: rgba(99,102,241,0.1); border: 2px dashed rgba(99,102,241,0.3); border-radius: 16px; padding: 24px; margin: 0 0 24px;">
            <span style="font-size: 36px; font-weight: 800; color: #818CF8; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
          </div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">If you didn't request this code, please ignore this email.</p>
        </div>
        <div style="background: rgba(255,255,255,0.02); padding: 16px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
          <p style="color: #4B5563; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">© CreatorsHQ — Secure Access</p>
        </div>
      </div>
    `
  });
};

/**
 * Sends a welcome email after first successful verification.
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    await sendWithRetry({
      from: `"CreatorsHQ" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to CreatorsHQ 🚀",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0A0F1D; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 32px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 800;">Welcome, ${name || 'Creator'}! 🎉</h1>
          </div>
          <div style="padding: 40px 32px; text-align: center;">
            <p style="color: #D1D5DB; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">Your account is now verified and ready. Here's what you can do next:</p>
            <div style="text-align: left; padding: 0 16px;">
              <p style="color: #9CA3AF; font-size: 14px; margin: 8px 0;">✅ Connect your Instagram profile</p>
              <p style="color: #9CA3AF; font-size: 14px; margin: 8px 0;">✅ Use AI Studio for viral content</p>
              <p style="color: #9CA3AF; font-size: 14px; margin: 8px 0;">✅ Browse brand campaigns</p>
            </div>
          </div>
          <div style="background: rgba(255,255,255,0.02); padding: 16px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
            <p style="color: #4B5563; font-size: 10px; margin: 0;">© CreatorsHQ</p>
          </div>
        </div>
      `
    });
    console.log(`[MAIL] Welcome email sent to ${email}`);
  } catch (err) {
    // Non-blocking — don't let welcome email failure break the flow
    console.error(`[MAIL] Welcome email failed for ${email}:`, err.message);
  }
};

/**
 * Sends a password reset link email.
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  await sendWithRetry({
    from: `"CreatorsHQ" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password — CreatorsHQ",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0A0F1D; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
        <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">Password Reset</h1>
        </div>
        <div style="padding: 40px 32px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">Click the button below to reset your password. This link expires in <strong style="color: #fff;">30 minutes</strong>.</p>
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 14px; letter-spacing: 1px;">RESET PASSWORD</a>
          <p style="color: #6B7280; font-size: 11px; margin: 24px 0 0; line-height: 1.5;">If you didn't request a password reset, ignore this email. Your password won't be changed.</p>
        </div>
      </div>
    `
  });
};

/**
 * Generate a secure random token for password resets.
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = { sendOTP, sendWelcomeEmail, sendPasswordResetEmail, generateResetToken };
