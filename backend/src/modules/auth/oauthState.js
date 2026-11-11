const crypto = require('crypto');

const OAUTH_STATE_MAX_AGE_SECONDS = 600;
const BINDING_SECRET_PATTERN = /^[a-f0-9]{64}$/;
const STATE_PATTERN = /^[a-f0-9]{128}$/;

const createBrowserBindingSecret = () => crypto.randomBytes(32).toString('hex');

const createOAuthState = (bindingSecret) => {
  if (typeof bindingSecret !== 'string' || !BINDING_SECRET_PATTERN.test(bindingSecret)) {
    throw new Error('A valid browser binding secret is required to create OAuth state.');
  }
  const nonce = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', Buffer.from(bindingSecret, 'hex')).update(nonce).digest('hex');
  return `${nonce}${signature}`;
};

const getCookieValue = (cookieHeader = '', cookieName) => {
  const matches = cookieHeader.split(';').flatMap(part => {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== cookieName) return [];
    return [part.slice(separator + 1).trim()];
  });
  return matches.length === 1 ? matches[0] : null;
};

const isValidOAuthState = (queryState, cookieHeader, stateCookieName, bindingCookieName) => {
  if (typeof queryState !== 'string' || !STATE_PATTERN.test(queryState)) return false;
  const cookieState = getCookieValue(cookieHeader, stateCookieName);
  const bindingSecret = getCookieValue(cookieHeader, bindingCookieName);
  if (cookieState !== queryState || typeof bindingSecret !== 'string' || !BINDING_SECRET_PATTERN.test(bindingSecret)) {
    return false;
  }

  const nonce = queryState.slice(0, 64);
  const receivedSignature = Buffer.from(queryState.slice(64), 'hex');
  const expectedSignature = crypto.createHmac('sha256', Buffer.from(bindingSecret, 'hex')).update(nonce).digest();
  return expectedSignature.length === receivedSignature.length &&
    crypto.timingSafeEqual(expectedSignature, receivedSignature);
};

const hashBrowserBindingSecret = (bindingSecret) => {
  if (typeof bindingSecret !== 'string' || !BINDING_SECRET_PATTERN.test(bindingSecret)) return null;
  return crypto.createHash('sha256').update(Buffer.from(bindingSecret, 'hex')).digest('hex');
};

const isValidBrowserBindingSecret = (bindingSecret) => {
  return typeof bindingSecret === 'string' && BINDING_SECRET_PATTERN.test(bindingSecret);
};

const serializeOAuthStateCookie = (value, {
  cookieName,
  path,
  secure = false,
  sameSite = 'Lax',
  maxAge = OAUTH_STATE_MAX_AGE_SECONDS
}) => {
  const safeValue = typeof value === 'string' && /^[a-f0-9]{64,128}$/.test(value) ? value : '';
  const secureAttribute = secure ? '; Secure' : '';
  return `${cookieName}=${safeValue}; Path=${path}; Max-Age=${maxAge}; HttpOnly; SameSite=${sameSite}${secureAttribute}`;
};

module.exports = {
  createBrowserBindingSecret,
  createOAuthState,
  getCookieValue,
  hashBrowserBindingSecret,
  isValidBrowserBindingSecret,
  isValidOAuthState,
  serializeOAuthStateCookie
};
