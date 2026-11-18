const { extractUsername } = require('../../utils/social');
const instagramOAuth = require('./instagramOAuth');
const {
  getCookieValue,
  serializeOAuthStateCookie
} = require('../auth/oauthState');

const PROFILE_LINK_PLATFORMS = ['linkedin', 'youtube', 'facebook'];
const CONNECTABLE_PLATFORMS = ['instagram', ...PROFILE_LINK_PLATFORMS, 'twitter', 'slack', 'tiktok'];

const getIntegrationUser = async (userId, client) => {
  const { data, error } = await client
    .from('profiles')
    .select('id, integrations, socials')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const saveIntegrationUser = async (userId, user, client) => {
  const { error } = await client
    .from('profiles')
    .update({ socials: user.socials, integrations: user.integrations })
    .eq('id', userId);
  if (error) throw error;
};

const asObject = (value) => {
  if (value instanceof Map) return Object.fromEntries(value);
  return value && typeof value === 'object' ? { ...value } : {};
};

/**
 * POST /api/integrations/link
 * Saves a public social profile URL without ownership verification.
 */
const linkSocial = async (req, res, next) => {
  try {
    const { platform, url } = req.body;

    if (!PROFILE_LINK_PLATFORMS.includes(platform) || !url) {
      return res.status(400).json({ success: false, message: "platform and url required" });
    }

    const username = extractUsername(url, platform);
    if (!username) {
      return res.status(400).json({ success: false, message: "Invalid profile URL" });
    }

    const user = await getIntegrationUser(req.user.id, req.supabase);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.socials = asObject(user.socials);

    user.socials[platform] = {
      url,
      username,
      linkedAt: new Date()
    };

    await saveIntegrationUser(req.user.id, user, req.supabase);

    return res.json({
      success: true,
      linked: true,
      message: `${platform} profile linked.`
    });
  } catch (error) {
    next(error);
  }
};

const disconnectSocial = async (req, res, next) => {
  try {
    const { platform } = req.params;
    if (!PROFILE_LINK_PLATFORMS.includes(platform)) {
      return res.status(400).json({ success: false, message: 'Unsupported profile platform.' });
    }
    const user = await getIntegrationUser(req.user.id, req.supabase);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.socials = asObject(user.socials);
    delete user.socials[platform];
    await saveIntegrationUser(req.user.id, user, req.supabase);
    return res.json({ success: true, linked: false });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/integrations
 * Returns current connection status
 */
const getIntegrations = async (req, res, next) => {
  try {
    const user = await getIntegrationUser(req.user.id, req.supabase);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const instagram = await instagramOAuth.getConnectionStatus(req.user.id);

    const connected = Object.fromEntries(CONNECTABLE_PLATFORMS.map(platform => [platform, false]));
    for (const platform of PROFILE_LINK_PLATFORMS) {
      connected[platform] = typeof user.socials?.[platform]?.url === 'string';
    }

    res.json({
      success: true,
      data: {
        ...connected,
        instagram: instagram.status === 'connected',
        instagramStatus: instagram.status,
        instagramUsername: instagram.username
      }
    });
  } catch (error) {
    next(error);
  }
};

const connectPlatform = async (req, res, next) => {
  try {
    const { platform } = req.body;
    if (!CONNECTABLE_PLATFORMS.includes(platform)) {
      return res.status(400).json({ success: false, message: 'Unsupported integration platform.' });
    }

    if (platform === 'instagram') {
      return res.status(400).json({
        success: false,
        message: 'Start Instagram Login with /instagram/start.'
      });
    }

    if (PROFILE_LINK_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: `${platform} must be linked with a public profile URL.`
      });
    }

    return res.status(501).json({
      success: false,
      message: `${platform} OAuth is not implemented. No provider account was connected.`
    });
  } catch (error) {
    return next(error);
  }
};

const instagramBindingCookie = 'creatorshq_instagram_oauth_binding';
const frontendIntegrationsUrl = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${frontendUrl.replace(/\/+$/, '')}/integrations`;
};
const clearInstagramBindingCookie = res => {
  res.append('Set-Cookie', serializeOAuthStateCookie('', {
    cookieName: instagramBindingCookie,
    path: '/api/integrations/instagram',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 0
  }));
};
const instagramResultRedirect = result => `${frontendIntegrationsUrl()}?instagram=${result}`;

const startInstagramOAuth = async (req, res, next) => {
  try {
    const attempt = await instagramOAuth.createOAuthAttempt(req.user.id);
    res.append('Set-Cookie', serializeOAuthStateCookie(attempt.bindingSecret, {
      cookieName: instagramBindingCookie,
      path: '/api/integrations/instagram',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 600
    }));
    return res.json({ success: true, authorizationUrl: attempt.authorizationUrl });
  } catch (error) {
    return next(error);
  }
};

const authorizeInstagramOAuth = async (req, res, next) => {
  try {
    const state = typeof req.query?.state === 'string' ? req.query.state : '';
    const binding = getCookieValue(req.headers.cookie || '', instagramBindingCookie);
    if (!await instagramOAuth.isPendingOAuthAttempt(state, binding)) {
      await instagramOAuth.discardOAuthAttempt(binding);
      clearInstagramBindingCookie(res);
      return res.redirect(instagramResultRedirect('error'));
    }
    return res.redirect(instagramOAuth.buildAuthorizationUrl(state));
  } catch (error) {
    return next(error);
  }
};

const instagramOAuthCallback = async (req, res) => {
  const state = typeof req.query?.state === 'string' ? req.query.state : '';
  const binding = getCookieValue(req.headers.cookie || '', instagramBindingCookie);
  clearInstagramBindingCookie(res);
  let userId = null;

  try {
    const attempt = await instagramOAuth.consumeOAuthAttempt(state, binding);
    if (!attempt) {
      await instagramOAuth.discardOAuthAttempt(binding);
      return res.redirect(instagramResultRedirect('error'));
    }
    userId = attempt.user_id;
    if (typeof req.query?.error === 'string') {
      if (req.query.error === 'access_denied') {
        return res.redirect(instagramResultRedirect('cancelled'));
      }
      await instagramOAuth.updateConnectionStatus(attempt.user_id, 'error');
      return res.redirect(instagramResultRedirect('error'));
    }
    if (typeof req.query?.code !== 'string') {
      await instagramOAuth.updateConnectionStatus(attempt.user_id, 'error');
      return res.redirect(instagramResultRedirect('error'));
    }

    const connection = await instagramOAuth.exchangeAuthorizationCode(req.query.code);
    await instagramOAuth.persistConnection(attempt.user_id, connection);
    return res.redirect(instagramResultRedirect('connected'));
  } catch {
    if (userId) {
      try {
        await instagramOAuth.updateConnectionStatus(userId, 'error');
      } catch {
        console.error('[INSTAGRAM OAUTH] Failed to record callback failure.');
      }
    }
    console.error('[INSTAGRAM OAUTH] Callback failed; provider details were omitted.');
    return res.redirect(instagramResultRedirect('error'));
  }
};

const disconnectInstagram = async (req, res, next) => {
  try {
    await instagramOAuth.disconnectConnection(req.user.id);
    return res.json({ success: true, status: 'disconnected' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  authorizeInstagramOAuth,
  connectPlatform,
  disconnectSocial,
  disconnectInstagram,
  getIntegrations,
  instagramOAuthCallback,
  linkSocial,
  startInstagramOAuth
};
