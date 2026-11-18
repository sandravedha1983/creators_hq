/**
 * Extract username from profile URL based on platform patterns
 */
function extractUsername(url, platform) {
  const hosts = {
    instagram: ['instagram.com', 'www.instagram.com'],
    twitter: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
    linkedin: ['linkedin.com', 'www.linkedin.com'],
    youtube: ['youtube.com', 'www.youtube.com'],
    facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com']
  };
  const allowedHosts = hosts[platform];
  if (!allowedHosts || typeof url !== 'string') return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:' || !allowedHosts.includes(parsedUrl.hostname.toLowerCase())) {
      return null;
    }

    if (platform === 'facebook' && parsedUrl.pathname === '/profile.php') {
      return parsedUrl.searchParams.get('id') || null;
    }

    const path = parsedUrl.pathname;
    const patterns = {
      instagram: /^\/([^/]+)\/?$/,
      twitter: /^\/([^/]+)\/?$/,
      linkedin: /^\/in\/([^/]+)\/?$/,
      youtube: /^\/@([^/]+)\/?$/,
      facebook: /^\/([^/]+)\/?$/
    };
    const match = path.match(patterns[platform]);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

module.exports = { extractUsername };
