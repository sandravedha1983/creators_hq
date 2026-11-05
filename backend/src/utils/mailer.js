const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { Resend } = require("resend");

// ─── Startup Diagnostics ────────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM_EMAIL;

if (RESEND_API_KEY && RESEND_FROM) {
  console.log("[MAIL] Resend configuration detected ✅");
} else {
  if (!RESEND_API_KEY) {
    console.error("[MAIL] Resend API key missing ❌");
  }
  if (!RESEND_FROM) {
    console.error("[MAIL] RESEND_FROM_EMAIL environment variable missing ❌");
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error("Critical Configuration Error: Both RESEND_API_KEY and RESEND_FROM_EMAIL are required in production.");
  }
}

// ─── Resend Client (Primary — used for all OTP emails) ──────────────────────
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// ─── SMTP Transport (used only for optional non-critical welcome email) ──────
const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: String(process.env.SMTP_PORT) === "465",
  family: 4,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
  },
  connectionTimeout: 3000,
  greetingTimeout: 3000,
  socketTimeout: 3000,
});

// ─── OTP Email (Resend ONLY — no SMTP fallback) ─────────────────────────────
/**
 * Sends an OTP to the specified email via Resend.
 * THROWS if Resend is not configured or if the send fails.
 * The caller must handle the error and return a failure response.
 */
const sendOTP = async (email, otp) => {
  if (!resend || !RESEND_FROM) {
    throw new Error("Email service is not fully configured. Both RESEND_API_KEY and RESEND_FROM_EMAIL are required.");
  }

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1***$2");
  console.log(`[MAIL] Sending OTP via Resend to ${maskedEmail}...`);

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: email,
    subject: "Your CreatorsHQ Verification Code",
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
          <p style="color: #6B7280; font-size: 12px; margin: 0;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <div style="background: rgba(255,255,255,0.02); padding: 16px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
          <p style="color: #4B5563; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">© CreatorsHQ — Secure Access</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error(`[MAIL ERROR] Resend rejected OTP email to ${maskedEmail}:`, error.message || JSON.stringify(error));
    throw new Error(`Email delivery failed: ${error.message || "Resend API error"}`);
  }

  console.log(`[MAIL] OTP email sent successfully ✅`);
  console.log(`[MAIL] Resend email ID: ${data?.id}`);
};

// ─── Welcome Email (best-effort — tries Resend first, SMTP fallback) ─────────
/**
 * Sends a welcome email after first successful OTP verification.
 * Non-blocking — failures are logged but never propagated to the caller.
 */
const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0A0F1D; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 800;">Welcome, ${name || "Creator"}! 🎉</h1>
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
  `;

  // Try Resend first
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: "Welcome to CreatorsHQ 🚀",
        html,
      });
      if (error) throw new Error(error.message);
      console.log(`[MAIL] Welcome email sent via Resend | ID: ${data?.id}`);
      return;
    } catch (err) {
      console.warn(`[MAIL] Welcome email via Resend failed, trying SMTP:`, err.message);
    }
  }

  // SMTP fallback for welcome email only
  try {
    await smtpTransporter.sendMail({
      from: `"CreatorsHQ" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to CreatorsHQ 🚀",
      html,
    });
    console.log(`[MAIL] Welcome email sent via SMTP to ${email}`);
  } catch (err) {
    console.error(`[MAIL] Welcome email failed for ${email}:`, err.message);
  }
};

// ─── Password Reset Email ────────────────────────────────────────────────────
const sendPasswordResetEmail = async (email, resetToken) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const html = `
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
  `;

  // Try Resend first
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: "Reset Your Password — CreatorsHQ",
        html,
      });
      if (error) throw new Error(error.message);
      console.log(`[MAIL] Password reset email sent via Resend | ID: ${data?.id}`);
      return;
    } catch (err) {
      console.warn(`[MAIL] Password reset via Resend failed, trying SMTP:`, err.message);
    }
  }

  // SMTP fallback for password reset
  await smtpTransporter.sendMail({
    from: `"CreatorsHQ" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password — CreatorsHQ",
    html,
  });
};

// ─── Generate reset token ────────────────────────────────────────────────────
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = { sendOTP, sendWelcomeEmail, sendPasswordResetEmail, generateResetToken };
