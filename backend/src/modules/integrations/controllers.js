const { extractUsername, profileUrl, fetchHtml } = require('../../utils/social');
const cheerio = require('cheerio');
const axios = require('axios');

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

    // 1. Try Instagram Web Profile API if platform is instagram
    if (platform === 'instagram') {
      try {
        const igRes = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "x-ig-app-id": "936619743392459"
          },
          timeout: 8000
        });
        const bio = (igRes.data?.data?.user?.biography || "").toUpperCase();
        const fullName = (igRes.data?.data?.user?.full_name || "").toUpperCase();
        if (bio.includes(cleanCode) || fullName.includes(cleanCode)) {
          found = true;
        }
      } catch (igErr) {
        lookupUnavailable = true;
      }
    }

    // 2. HTML Scrape attempt if not found via API
    if (!found) {
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

    const profileVerified = Object.fromEntries(SOCIAL_PLATFORMS.map(platform => [
      platform,
      user.socials?.[platform]?.verified === true
    ]));
    const connected = Object.fromEntries(CONNECTABLE_PLATFORMS.map(platform => [platform, false]));

    res.json({ success: true, data: { ...connected, profileVerified } });
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

module.exports = { linkSocial, verifySocial, getIntegrations, connectPlatform };
