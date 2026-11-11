const axios = require("axios");

/**
 * Extract username from profile URL based on platform patterns
 */
function extractUsername(url, platform) {
  const hosts = {
    instagram: ['instagram.com', 'www.instagram.com'],
    twitter: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
    linkedin: ['linkedin.com', 'www.linkedin.com'],
    youtube: ['youtube.com', 'www.youtube.com']
  };
  const allowedHosts = hosts[platform];
  if (!allowedHosts || typeof url !== 'string') return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:' || !allowedHosts.includes(parsedUrl.hostname.toLowerCase())) {
      return null;
    }

    const path = parsedUrl.pathname;
    const patterns = {
      instagram: /^\/([^/]+)\/?$/,
      twitter: /^\/([^/]+)\/?$/,
      linkedin: /^\/in\/([^/]+)\/?$/,
      youtube: /^\/@([^/]+)\/?$/
    };
    const match = path.match(patterns[platform]);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Build the public profile URL for scraping
 */
function profileUrl(platform, username) {
  const safeUsername = encodeURIComponent(username);
  return {
    instagram: `https://www.instagram.com/${safeUsername}/`,
    twitter: `https://x.com/${safeUsername}`,
    linkedin: `https://www.linkedin.com/in/${safeUsername}`,
    youtube: `https://www.youtube.com/@${safeUsername}`
  }[platform];
}

/**
 * Fetch HTML content with basic anti-block headers
 */
async function fetchHtml(url) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
      },
      validateStatus: (s) => s >= 200 && s < 500
    });
    
    if (res.status >= 400) {
      throw new Error(`Upstream returned ${res.status}`);
    }
    
    return res.data;
  } catch (err) {
    console.error(`[FETCH ERROR] ${url}:`, err.message);
    throw err;
  }
}

module.exports = { extractUsername, profileUrl, fetchHtml };
