const { extractUsername, profileUrl, fetchHtml } = require('../../utils/social');
const cheerio = require('cheerio');
const instagramOAuth = require('./instagramOAuth');
const {
  getCookieValue,
  serializeOAuthStateCookie
} = require('../auth/oauthState');

const SOCIAL_PLATFORMS = ['instagram', 'twitter', 'linkedin', 'youtube'];
const CONNECTABLE_PLATFORMS = [...SOCIAL_PLATFORMS, 'slack', 'tiktok'];

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
 * Generates a code and links a social profile without verifying.
 */
const linkSocial = async (req, res, next) => {
  try {
    const { platform, url } = req.body;

    if (platform === 'instagram') {
      return res.status(410).json({ success: false, message: 'Connect Instagram with Instagram Login.' });
    }
    if (!SOCIAL_PLATFORMS.includes(platform) || !url) {
      return res.status(400).json({ success: false, message: "platform and url required" });
    }

    const username = extractUsername(url, platform);
    if (!username) {
      return res.status(400).json({ success: false, message: "Invalid profile URL" });
    }

    const code = "CRHQ_" + Math.random().toString(36).slice(2, 7).toUpperCase();

    const user = await getIntegrationUser(req.user.id, req.supabase);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.socials = asObject(user.socials);

    user.socials[platform] = {
      url,
      username,
      code,
      verified: false // ALWAYS false initially
    };

    await saveIntegrationUser(req.user.id, user, req.supabase);

    return res.json({
      success: true,
      verified: false,
      code,
      message: `Linked @${username}. Add code to bio, then verify.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/integrations/verify
 * Scrapes the profile to find the verification code.
 */
const verifySocial = async (req, res, next) => {
  try {
    const { platform, url, code } = req.body;

    if (platform === 'instagram') {
      return res.status(410).json({ success: false, verified: false, message: 'Connect Instagram with Instagram Login.' });
    }
    if (!SOCIAL_PLATFORMS.includes(platform) || !url || typeof code !== 'string' || !code) {
      return res.status(400).json({ success: false, verified: false, message: "platform, url, code required" });
    }

    const username = extractUsername(url, platform);
    if (!username) {
      return res.status(400).json({ success: false, verified: false, message: "Invalid profile URL" });
    }

    const user = await getIntegrationUser(req.user.id, req.supabase);
    if (!user) return res.status(404).json({ success: false, verified: false, message: "User not found" });
    const record = user.socials ? user.socials[platform] : null;

    if (!record || record.username !== username) {
      return res.status(400).json({ success: false, verified: false, message: "Link first before verifying" });
    }

    // Security check: ensure the code provided matches what we assigned
    if (record.code !== code) {
       return res.status(400).json({ success: false, verified: false, message: "Verification code mismatch" });
    }

    // Idempotent success
    if (record.verified === true) {
      return res.json({ success: true, verified: true, message: "Already verified" });
    }

    const cleanCode = code.trim().toUpperCase();
    let found = false;
    let lookupUnavailable = false;

    try {
      const html = await fetchHtml(profileUrl(platform, username));
      if (html) {
        const $ = cheerio.load(html);
        const metaDescription = ($('meta[property="og:description"]').attr('content') || "").toUpperCase();
        const bodyText = (html || "").toUpperCase();
        const pageTitle = ($('title').text() || "").toUpperCase();

        found = metaDescription.includes(cleanCode) ||
                bodyText.includes(cleanCode) ||
                pageTitle.includes(cleanCode);
      }
    } catch (e) {
      lookupUnavailable = true;
    }

    if (!found) {
      return res.status(lookupUnavailable ? 503 : 400).json({
        success: false,
        verified: false,
        message: lookupUnavailable
          ? 'The public profile could not be checked. Make sure it is public and try again.'
          : 'Verification code was not found on the public profile.'
      });
    }

    user.socials = asObject(user.socials);
    record.verified = true;
    record.verifiedAt = new Date();

    if (user.integrations instanceof Map) {
      user.integrations.set(platform, true);
    } else {
      user.integrations = { ...asObject(user.integrations), [platform]: true };
    }
    await saveIntegrationUser(req.user.id, user, req.supabase);

    return res.json({
      success: true,
      verified: true,
      message: "Verification successful! Ownership confirmed."
    });
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

    const profileVerified = Object.fromEntries(SOCIAL_PLATFORMS.map(platform => [
      platform,
      platform === 'instagram' ? false : user.socials?.[platform]?.verified === true
    ]));
    const connected = Object.fromEntries(CONNECTABLE_PLATFORMS.map(platform => [platform, false]));

    res.json({
      success: true,
      data: {
        ...connected,
        instagram: instagram.status === 'connected',
        instagramStatus: instagram.status,
        instagramUsername: instagram.username,
        profileVerified
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

    if (SOCIAL_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: `${platform} requires manual bio-verification via /link and /verify.`
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
  disconnectInstagram,
  getIntegrations,
  instagramOAuthCallback,
  linkSocial,
  startInstagramOAuth,
  verifySocial
};
