const jwt = require('jsonwebtoken');
const { supabase, createUserClient } = require('../config/supabase');

/**
 * Authentication Middleware
 *
 * Primary: Verifies Supabase Auth JWT access tokens via `supabase.auth.getUser(token)`.
 * Fallback: Allows signed legacy JWTs, but still requires the authoritative
 * public.profiles record for role and account status. Admin authority comes
 * only from the current profile, never from a potentially stale JWT claim.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // 1. Primary Auth: Supabase Auth Verification
    let user = null;
    let profile = null;

    if (supabase && process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('dummy-creatorshq')) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          user = data.user;
        }
      } catch {
        console.error('[AUTH SUPABASE VERIFICATION ERROR]');
      }
    }

    // 2. If Supabase token was verified
    if (user) {
      let profileResult;
      try {
        profileResult = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
      } catch {
        console.error('[AUTH PROFILE LOOKUP ERROR]');
        return res.status(503).json({ error: 'Unable to verify account profile.' });
      }

      if (profileResult.error) {
        console.error('[AUTH PROFILE LOOKUP ERROR]');
        return res.status(503).json({ error: 'Unable to verify account profile.' });
      }
      profile = profileResult.data;
      if (!profile) {
        return res.status(403).json({ error: 'An authoritative account profile is required.' });
      }

      if (profile.is_blocked || profile.is_suspended) {
        return res.status(403).json({ error: "Your account is suspended or blocked. Please contact support." });
      }

      let userClient;
      try {
        userClient = createUserClient(token);
      } catch (configError) {
        console.error('[SUPABASE USER CLIENT CONFIG ERROR]');
        return res.status(503).json({ error: configError.message });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: profile.role === 'admin'
          ? 'admin'
          : profile.role === 'brand' ? 'brand' : 'creator',
        plan: profile.plan || 'free',
        isVerified: profile.is_verified || false,
        isOnboarded: profile.is_onboarded || false
      };
      req.supabase = userClient;
      return next();
    }

    // 3. Fallback: JWT verification for legacy tokens. The JWT role is never trusted.
    if (process.env.JWT_SECRET) {
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: "Invalid or expired authentication token." });
      }

      const userId = decoded.id || decoded.userId || decoded._id;
      if (!userId) {
        return res.status(401).json({ error: "Invalid or expired authentication token." });
      }

      let profileResult;
      try {
        profileResult = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
      } catch {
        console.error('[AUTH PROFILE LOOKUP ERROR]');
        return res.status(503).json({ error: 'Unable to verify account profile.' });
      }

      if (profileResult.error) {
        console.error('[AUTH PROFILE LOOKUP ERROR]');
        return res.status(503).json({ error: 'Unable to verify account profile.' });
      }
      profile = profileResult.data;
      if (!profile) {
        return res.status(403).json({ error: 'An authoritative account profile is required.' });
      }
      if (profile.is_blocked || profile.is_suspended) {
        return res.status(403).json({ error: "Your account is suspended or blocked. Please contact support." });
      }

      let userClient;
      try {
        userClient = createUserClient(token);
      } catch (configError) {
        console.error('[SUPABASE USER CLIENT CONFIG ERROR]');
        return res.status(503).json({ error: configError.message });
      }
      req.user = {
        id: userId,
        email: profile.email || decoded.email || '',
        role: profile.role === 'admin' ? 'admin' : profile.role === 'brand' ? 'brand' : 'creator',
        plan: profile.plan || 'free',
        isVerified: profile.is_verified || false,
        isOnboarded: profile.is_onboarded || false
      };
      req.supabase = userClient;
      return next();
    }

    return res.status(401).json({ error: "Invalid or expired authentication token." });
  } catch (ex) {
    console.error('[AUTHENTICATION ERROR]');
    return res.status(503).json({ error: "Authentication could not be completed." });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "User not authenticated." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden. Insufficient permissions." });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
