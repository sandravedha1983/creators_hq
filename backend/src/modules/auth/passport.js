const passport = require('passport');
const User = require('./models');
const Analytics = require('../analytics/models');
const jwt = require('jsonwebtoken');

// ─── Google OAuth ────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
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
} else {
  console.warn('[PASSPORT] Google OAuth DISABLED — GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing.');
}

// ─── LinkedIn OAuth ──────────────────────────────────────────────────────────
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL,
    scope: ['openid', 'profile', 'email']
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
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
} else {
  console.warn('[PASSPORT] LinkedIn OAuth DISABLED — LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET missing.');
}

module.exports = passport;
