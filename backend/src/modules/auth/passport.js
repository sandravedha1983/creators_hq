const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('./models');
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    console.log("Google Callback URL: https://creators-hq-wz85.onrender.com/auth/google/callback");
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          role: 'creator', // Default role for social login
          password_hash: Math.random().toString(36).substring(7) // Placeholder for required field
        });
      }
      
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return done(null, { user, token });
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL,
    scope: ['r_liteprofile', 'r_emailaddress']
  },
  async (accessToken, refreshToken, profile, done) => {
    console.log("LinkedIn Redirect URL:", process.env.LINKEDIN_CALLBACK_URL);
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ email });
      
      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email: email,
          role: 'brand', // Default role for LinkedIn brands? Or creator.
          password_hash: Math.random().toString(36).substring(7)
        });
      }
      
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return done(null, { user, token });
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((data, done) => {
  done(null, data);
});

passport.deserializeUser((data, done) => {
  done(null, data);
});

module.exports = passport;
