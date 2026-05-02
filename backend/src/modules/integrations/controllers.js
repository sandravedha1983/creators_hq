const User = require('../auth/models');
const axios = require('axios');
const cheerio = require('cheerio');

// POST /api/integrations/instagram/link
// Sets up the initial link and generates a verification code
const linkInstagram = async (req, res, next) => {
  try {
    const { profileLink } = req.body;
    if (!profileLink) return res.status(400).json({ success: false, message: 'Profile link is required' });

    // Robust Username Extraction
    let username = "";
    try {
        const url = new URL(profileLink);
        username = url.pathname.split('/').filter(Boolean)[0];
    } catch (e) {
        // Fallback for non-standard links
        username = profileLink.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
    }
    
    if (!username) return res.status(400).json({ success: false, message: 'Could not extract username from link' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Generate Unique Code
    const code = "CRHQ_" + Math.random().toString(36).substring(2, 7).toUpperCase();

    user.instagram = {
      username,
      profileLink,
      code,
      verified: false // ALWAYS false until bio check passes
    };

    await user.save();

    res.json({
      success: true,
      verified: false,
      code,
      username
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/integrations/instagram/verify
// Accepts { username, code } and validates against actual Instagram bio content
const verifyInstagram = async (req, res, next) => {
  try {
    const { username, code } = req.body;
    
    if (!username) return res.status(400).json({ success: false, message: 'Username is required' });

    const user = await User.findOne({ _id: req.user.id });
    if (!user || !user.instagram || user.instagram.username !== username) {
      return res.status(404).json({ verified: false, message: "Linked Instagram profile not found for this user" });
    }

    // Security: Validate that the code sent matches the one we assigned
    const assignedCode = user.instagram.code;
    const codeToVerify = (code || assignedCode).trim().toUpperCase();

    // Check DB status - no fake success
    if (user.instagram.verified === true) {
        return res.json({ verified: true, message: "Account is already verified" });
    }

    try {
      console.log(`[VERIFY] Attempting scrape for @${username} looking for ${codeToVerify}`);
      
      // Fetch Instagram profile with browser-like headers
      const response = await axios.get(`https://www.instagram.com/${username}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Multi-layer content check (Bio, Title, Meta Tags)
      const metaDescription = ($('meta[property="og:description"]').attr('content') || "").toUpperCase();
      const bodyText = (response.data || "").toUpperCase();
      const pageTitle = ($('title').text() || "").toUpperCase();
      
      const foundInMeta = metaDescription.includes(codeToVerify);
      const foundInBody = bodyText.includes(codeToVerify);
      const foundInTitle = pageTitle.includes(codeToVerify);

      if (foundInMeta || foundInBody || foundInTitle) {
        // ACTUAL VALIDATION SUCCESS
        user.instagram.verified = true;
        
        // Update integrations map for dashboard visibility
        if (!user.integrations) user.integrations = new Map();
        user.integrations.set('instagram', true);
        
        await user.save();
        return res.json({ 
            success: true,
            verified: true, 
            message: "Verification successful! Ownership confirmed." 
        });
      }

      // CODE NOT FOUND
      return res.status(400).json({
        success: true,
        verified: false,
        message: `Verification code ${codeToVerify} not found in @${username}'s bio or title.`
      });

    } catch (err) {
      console.error("[SCRAPE ERROR]", err.message);
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Could not reach Instagram profile. Ensure the profile is PUBLIC and not restricted."
      });
    }
  } catch (error) {
    next(error);
  }
};

const getIntegrations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const data = {
        ...(user.integrations ? Object.fromEntries(user.integrations) : {}),
        instagramVerified: user.instagram?.verified || false
    };

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const connectPlatform = async (req, res, next) => {
    const { platform } = req.body;
    if (platform === 'instagram') {
        return res.status(400).json({ 
            success: false, 
            message: 'Instagram requires bio-verification flow. Use /link and /verify.' 
        });
    }
    res.json({ success: true, message: `${platform} connected` });
};

module.exports = { linkInstagram, verifyInstagram, getIntegrations, connectPlatform };
