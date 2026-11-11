const express = require('express');
const authController = require('./controllers');
const { authenticate } = require('../../middleware/auth');
const { exchangeOAuthHandoff } = require('./oauthHandoff');
const {
  getCookieValue,
  isValidOAuthState,
  serializeOAuthStateCookie
} = require('./oauthState');

const router = express.Router();

const getProviderConfig = (provider) => {
  if (provider !== 'google' && provider !== 'linkedin') {
    return null;
  }

  return {
    stateCookie: `creatorshq_${provider}_oauth_state`,
    bindingCookie: `creatorshq_${provider}_oauth_binding`,
    frontendRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
  };
};

const clearOAuthCookies = (res, provider) => {
  const config = getProviderConfig(provider);
  if (!config) return;

  const cookies = [config.stateCookie, config.bindingCookie];
  for (const cookieName of cookies) {
    res.append('Set-Cookie', serializeOAuthStateCookie('', {
      cookieName,
      path: '/api/auth',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 0
    }));
  }
};

const rejectInvalidOAuthState = (req, res, provider) => {
  const config = getProviderConfig(provider);
  if (!config) {
    return res.status(400).json({ success: false, message: 'Unsupported OAuth provider.' });
  }

  const cookieHeader = req.headers.cookie || '';
  const queryState = typeof req.query?.state === 'string' ? req.query.state : '';
  const isValidState = isValidOAuthState(queryState, cookieHeader, config.stateCookie, config.bindingCookie);

  if (!isValidState) {
    clearOAuthCookies(res, provider);
    return res.redirect(`${config.frontendRedirect}?error=oauth_state_invalid`);
  }

  return null;
};

router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

router.get('/google/callback', (req, res) => {
  const invalidStateResponse = rejectInvalidOAuthState(req, res, 'google');
  if (invalidStateResponse) return invalidStateResponse;
  return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard-redirect`);
});

router.get('/linkedin/callback', (req, res) => {
  const invalidStateResponse = rejectInvalidOAuthState(req, res, 'linkedin');
  if (invalidStateResponse) return invalidStateResponse;
  return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard-redirect`);
});

router.post('/oauth-exchange', async (req, res) => {
  try {
    const { code, provider } = req.body || {};
    const cookieHeader = req.headers.cookie || '';
    const bindingName = provider === 'linkedin' ? 'creatorshq_linkedin_oauth_binding' : 'creatorshq_google_oauth_binding';
    const bindingSecret = getCookieValue(cookieHeader, bindingName);
    const isSupportedProvider = provider === 'google' || provider === 'linkedin';

    const token = await exchangeOAuthHandoff(code, isSupportedProvider ? bindingSecret : null);
    if (!isSupportedProvider) {
      return res.status(400).json({ success: false, message: 'Unsupported OAuth provider.' });
    }
    if (!token) {
      return res.status(400).json({ success: false, message: 'OAuth handoff failed or expired.' });
    }

    return res.json({ success: true, token });
  } catch (error) {
    console.error('[OAUTH HANDOFF ERROR]', error.message || error);
    return res.status(400).json({ success: false, message: 'OAuth handoff failed.' });
  }
});

module.exports = router;
