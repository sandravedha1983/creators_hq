const User = require('../auth/models');
const { extractUsername, profileUrl, fetchHtml } = require('../../utils/social');
const cheerio = require('cheerio');

/**
 * POST /api/integrations/link
 * Generates a code and links a social profile without verifying.
 */
const linkSocial = async (req, res, next) => {
  try {
    const { platform, url } = req.body;

    if (!platform || !url) {
      return res.status(400).json({ success: false, message: "platform and url required" });
    }

    const username = extractUsername(url, platform);
    if (!username) {
      return res.status(400).json({ success: false, message: "Invalid profile URL" });
    }

    const code = "CRHQ_" + Math.random().toString(36).slice(2, 7).toUpperCase();

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Initialize socials map if missing (though schema has it)
    if (!user.socials) user.socials = {};

    user.socials[platform] = {
      url,
      username,
      code,
      verified: false // ALWAYS false initially
    };

    // Mark as modified for Map/Nested objects if necessary (Mongoose requirement)
    user.markModified(`socials.${platform}`);
    await user.save();

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

    if (!platform || !url || !code) {
      return res.status(400).json({ success: false, verified: false, message: "platform, url, code required" });
    }

    const username = extractUsername(url, platform);
    if (!username) {
      return res.status(400).json({ success: false, verified: false, message: "Invalid profile URL" });
    }

    const user = await User.findById(req.user.id);
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

    let html;
    try {
      html = await fetchHtml(profileUrl(platform, username));
    } catch (e) {
      return res.status(502).json({
        success: false,
        verified: false,
        message: "Failed to fetch profile. Ensure profile is public and try again."
      });
    }

    if (!html) {
      return res.status(502).json({
        success: false,
        verified: false,
        message: "Empty response from social platform."
      });
    }

    const $ = cheerio.load(html);
    const cleanCode = code.trim().toUpperCase();

    // Multi-layer search: Bio (Meta tags), Title, and Body
    const metaDescription = ($('meta[property="og:description"]').attr('content') || "").toUpperCase();
    const bodyText = (html || "").toUpperCase();
    const pageTitle = ($('title').text() || "").toUpperCase();

    const found = metaDescription.includes(cleanCode) || 
                  bodyText.includes(cleanCode) || 
                  pageTitle.includes(cleanCode);

    if (!found) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: `Verification code ${cleanCode} not found in @${username}'s profile`
      });
    }

    // ACTUAL SUCCESS
    record.verified = true;
    record.verifiedAt = new Date();

    // Legacy sync
    if (!user.integrations) user.integrations = new Map();
    user.integrations.set(platform, true);

    user.markModified(`socials.${platform}`);
    await user.save();

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
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Combine Map and nested socials for comprehensive response
    const legacyData = user.integrations ? Object.fromEntries(user.integrations) : {};
    const socialsData = {};
    
    if (user.socials) {
        Object.keys(user.socials).forEach(platform => {
            socialsData[`${platform}Verified`] = user.socials[platform].verified;
            if (user.socials[platform].verified) {
                legacyData[platform] = true;
            }
        });
    }

    res.json({ success: true, data: { ...legacyData, ...socialsData } });
  } catch (error) {
    next(error);
  }
};

const connectPlatform = async (req, res, next) => {
    const { platform } = req.body;
    const restricted = ['instagram', 'twitter', 'linkedin', 'youtube'];
    
    if (restricted.includes(platform)) {
        return res.status(400).json({ 
            success: false, 
            message: `${platform} requires manual bio-verification via /link and /verify.` 
        });
    }

    // Generic connection for other platforms (Slack, etc)
    const user = await User.findById(req.user.id);
    if (!user.integrations) user.integrations = new Map();
    user.integrations.set(platform, true);
    await user.save();
    
    res.json({ success: true, message: `${platform} connected` });
};

module.exports = { linkSocial, verifySocial, getIntegrations, connectPlatform };
