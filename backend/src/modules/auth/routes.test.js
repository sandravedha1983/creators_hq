jest.mock('./controllers', () => new Proxy({}, { get: () => jest.fn() }));
jest.mock('./oauthHandoff', () => ({
  createOAuthHandoff: jest.fn(),
  exchangeOAuthHandoff: jest.fn()
}));
jest.mock('../../config/supabase', () => ({
  supabase: { from: jest.fn() }
}));
jest.mock('../../middleware/auth', () => ({
  authenticate: (_req, _res, next) => next()
}));

const { exchangeOAuthHandoff } = require('./oauthHandoff');
const router = require('./routes');

describe.each(['google', 'linkedin'])('%s OAuth callback', provider => {
  it('rejects callbacks without browser-bound state before continuing', () => {
    const route = router.stack.find(layer => layer.route?.path === `/${provider}/callback`);
    const handler = route.route.stack[0].handle;
    const response = {
      append: jest.fn(),
      redirect: jest.fn()
    };

    handler({
      hostname: 'localhost',
      query: {},
      headers: {}
    }, response, jest.fn());

    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:5173/login?error=oauth_state_invalid'
    );
    expect(response.append).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('Max-Age=0')
    );
  });
});

describe('OAuth handoff exchange route', () => {
  beforeEach(() => exchangeOAuthHandoff.mockReset());

  const handler = () => router.stack.find(layer => layer.route?.path === '/oauth-exchange').route.stack[0].handle;

  it('passes the initiating provider browser-binding cookie to redemption', async () => {
    exchangeOAuthHandoff.mockResolvedValue('signed-session-token');
    const response = {
      set: jest.fn(),
      append: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await handler()({
      body: { code: 'a'.repeat(64), provider: 'google' },
      headers: { cookie: 'creatorshq_google_oauth_binding=browser-a-secret' }
    }, response);

    expect(exchangeOAuthHandoff).toHaveBeenCalledWith('a'.repeat(64), 'browser-a-secret');
    expect(response.json).toHaveBeenCalledWith({ success: true, token: 'signed-session-token' });
  });

  it('does not use a browser binding cookie for an unknown provider', async () => {
    exchangeOAuthHandoff.mockResolvedValue(null);
    const response = {
      set: jest.fn(),
      append: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await handler()({
      body: { code: 'a'.repeat(64), provider: 'other' },
      headers: { cookie: 'creatorshq_google_oauth_binding=browser-a-secret' }
    }, response);

    expect(exchangeOAuthHandoff).toHaveBeenCalledWith('a'.repeat(64), null);
    expect(response.status).toHaveBeenCalledWith(400);
  });
});
