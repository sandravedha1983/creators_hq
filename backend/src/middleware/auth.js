const { supabase, createUserClient } = require('../config/supabase');

const authenticate = async (req, res, next) => {
  const authorization = req.header('Authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  if (
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL.includes('dummy-creatorshq') ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.SUPABASE_ANON_KEY
  ) {
    return res.status(503).json({ error: 'Supabase authentication is not configured.' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, plan, is_verified, is_onboarded, is_blocked, is_suspended')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[AUTH PROFILE LOOKUP ERROR]', profileError.message);
      return res.status(503).json({ error: 'Unable to verify account profile.' });
    }
    if (!profile) {
      return res.status(403).json({ error: 'An authoritative account profile is required.' });
    }
    if (profile.is_blocked || profile.is_suspended) {
      return res.status(403).json({ error: 'Your account is suspended or blocked. Please contact support.' });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email || profile.email || '',
      role: profile.role,
      plan: profile.plan || 'free',
      isVerified: profile.is_verified,
      isOnboarded: profile.is_onboarded
    };
    req.supabase = createUserClient(token);
    return next();
  } catch (error) {
    console.error('[AUTHENTICATION ERROR]', error.message || error);
    return res.status(503).json({ error: 'Authentication could not be completed.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'User not authenticated.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
  }
  return next();
};

module.exports = { authenticate, authorize };
