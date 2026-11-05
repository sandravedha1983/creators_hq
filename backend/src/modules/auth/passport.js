const passport = require('passport');
const User = require('./models');
const Analytics = require('../analytics/models');
const jwt = require('jsonwebtoken');

// ─── Google OAuth ────────────────────────────────────────────────────────────
try {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "dummy_google_client_id",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy_google_client_secret",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    scope: ['profile', 'email']
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const emailRaw = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!emailRaw) {
          return done(new Error("Google account must have a verified email address attached."), null);
        }
        const email = emailRaw.trim().toLowerCase();
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName || "Google User",
            email,
            role: 'creator',
            isVerified: true,
            password_hash: Math.random().toString(36).substring(7)
          });
          await Analytics.create({ userId: user._id });
        } else if (!user.isVerified) {
          user.isVerified = true;
          await user.save();
        }

        const token = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return done(null, { token });
      } catch (err) {
        return done(err, null);
      }
    }
  ));
  console.log('[PASSPORT] Google OAuth strategy registered.');
} catch (err) {
  console.error('[PASSPORT ERROR] Failed to register Google OAuth strategy:', err.message || err);
}

// ─── LinkedIn OAuth ──────────────────────────────────────────────────────────
try {
  const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID || "dummy_linkedin_client_id",
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "dummy_linkedin_client_secret",
    callbackURL: process.env.LINKEDIN_CALLBACK_URL || "http://localhost:5000/api/auth/linkedin/callback",
    scope: ['openid', 'profile', 'email']
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const emailRaw = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!emailRaw) {
          return done(new Error("LinkedIn account must have a verified email address attached."), null);
        }
        const email = emailRaw.trim().toLowerCase();
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName || "LinkedIn User",
            email,
            role: 'brand',
            isVerified: true,
            password_hash: Math.random().toString(36).substring(7)
          });
          await Analytics.create({ userId: user._id });
        } else if (!user.isVerified) {
          user.isVerified = true;
          await user.save();
        }

        const token = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return done(null, { token });
      } catch (err) {
        return done(err, null);
      }
    }
  ));
  console.log('[PASSPORT] LinkedIn OAuth strategy registered.');
} catch (err) {
  console.error('[PASSPORT ERROR] Failed to register LinkedIn OAuth strategy:', err.message || err);
}

module.exports = passport;
