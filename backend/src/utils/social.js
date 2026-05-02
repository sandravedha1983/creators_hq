const axios = require("axios");

/**
 * Extract username from profile URL based on platform patterns
 */
function extractUsername(url, platform) {
  const patterns = {
    instagram: /instagram\.com\/([^/?#]+)/i,
    twitter: /(?:twitter|x)\.com\/([^/?#]+)/i,
    linkedin: /linkedin\.com\/in\/([^/?#]+)/i,
    youtube: /youtube\.com\/@([^/?#]+)/i
  };
  const match = url?.match(patterns[platform]);
  return match ? match[1] : null;
}

/**
 * Build the public profile URL for scraping
 */
function profileUrl(platform, username) {
  return {
    instagram: `https://www.instagram.com/${username}/`,
    twitter: `https://x.com/${username}`,
    linkedin: `https://www.linkedin.com/in/${username}`,
    youtube: `https://www.youtube.com/@${username}`
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
