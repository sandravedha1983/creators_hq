jest.mock('../../utils/social', () => ({
  extractUsername: jest.fn(() => 'creator'),
  profileUrl: jest.fn(() => 'https://www.instagram.com/creator/'),
  fetchHtml: jest.fn()
}));

jest.mock('./instagramOAuth', () => ({
  getConnectionStatus: jest.fn(),
  createOAuthAttempt: jest.fn(),
  isPendingOAuthAttempt: jest.fn(),
  discardOAuthAttempt: jest.fn(),
  buildAuthorizationUrl: jest.fn(),
  consumeOAuthAttempt: jest.fn(),
  exchangeAuthorizationCode: jest.fn(),
  persistConnection: jest.fn(),
  updateConnectionStatus: jest.fn(),
  disconnectConnection: jest.fn()
}));

const { extractUsername, fetchHtml } = require('../../utils/social');
const instagramOAuth = require('./instagramOAuth');
const {
  authorizeInstagramOAuth,
  disconnectInstagram,
  getIntegrations,
  instagramOAuthCallback,
  linkSocial,
  verifySocial
} = require('./controllers');

const createRequest = (profile, body = {}) => {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null })
  };
  return {
    user: { id: 'a7dc831e-c6d3-4412-873c-80be1b10d234' },
    body,
    headers: {},
    query: {},
    supabase: { from: jest.fn().mockReturnValue(query) },
    queryBuilder: query
  };
};

describe('Instagram OAuth integration controllers', () => {
  let response;
  const profile = () => ({
    id: 'a7dc831e-c6d3-4412-873c-80be1b10d234',
    socials: { instagram: { username: 'legacy', verified: true } },
    integrations: { instagram: true }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      append: jest.fn(),
      redirect: jest.fn()
    };
  });

  it('rejects legacy Instagram bio linking and verification without scraping', async () => {
    const request = createRequest(profile(), {
      platform: 'instagram',
      url: 'https://www.instagram.com/creator/',
      code: 'CRHQ_TEST'
    });

    await linkSocial(request, response, jest.fn());
    await verifySocial(request, response, jest.fn());

    expect(response.status).toHaveBeenNthCalledWith(1, 410);
    expect(response.status).toHaveBeenNthCalledWith(2, 410);
    expect(fetchHtml).not.toHaveBeenCalled();
    expect(extractUsername).not.toHaveBeenCalled();
  });

  it('does not expose a legacy verification flag as an Instagram OAuth connection', async () => {
    instagramOAuth.getConnectionStatus.mockResolvedValue({ status: 'disconnected', username: null });
    const request = createRequest(profile());

    await getIntegrations(request, response, jest.fn());

    expect(response.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        instagram: false,
        instagramStatus: 'disconnected',
        instagramUsername: null,
        profileVerified: expect.objectContaining({ instagram: false })
      })
    });
  });

  it('starts OAuth for the authenticated Supabase UUID and sets a browser-bound cookie', async () => {
    instagramOAuth.createOAuthAttempt.mockResolvedValue({
      bindingSecret: 'a'.repeat(64),
      authorizationUrl: 'https://api.example.com/api/integrations/instagram/authorize?state=state'
    });
    const { startInstagramOAuth } = require('./controllers');
    const request = createRequest(profile());

    await startInstagramOAuth(request, response, jest.fn());

    expect(instagramOAuth.createOAuthAttempt).toHaveBeenCalledWith(request.user.id);
    expect(response.append).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('HttpOnly'));
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      authorizationUrl: expect.stringContaining('/instagram/authorize?state=')
    }));
  });

  it('rejects an authorization redirect without a valid state and browser binding', async () => {
    instagramOAuth.isPendingOAuthAttempt.mockResolvedValue(false);
    await authorizeInstagramOAuth({
      query: { state: 'not-valid' },
      headers: { cookie: '' }
    }, response, jest.fn());

    expect(instagramOAuth.buildAuthorizationUrl).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(expect.stringContaining('?instagram=error'));
  });

  it('never redirects to connected when the provider callback has no valid state', async () => {
    instagramOAuth.consumeOAuthAttempt.mockResolvedValue(null);
    await instagramOAuthCallback({
      query: { state: 'bad', code: 'provider-code' },
      headers: { cookie: '' }
    }, response);

    expect(instagramOAuth.exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(expect.not.stringContaining('instagram=connected'));
  });

  it('redirects as connected only after the account is verified and persisted', async () => {
    instagramOAuth.consumeOAuthAttempt.mockResolvedValue({
      user_id: 'a7dc831e-c6d3-4412-873c-80be1b10d234'
    });
    const verifiedConnection = { accountId: 'instagram-account-id', username: 'creatorshq2026' };
    instagramOAuth.exchangeAuthorizationCode.mockResolvedValue(verifiedConnection);
    instagramOAuth.persistConnection.mockResolvedValue();

    await instagramOAuthCallback({
      query: { state: 'a'.repeat(64), code: 'valid-provider-code' },
      headers: { cookie: `creatorshq_instagram_oauth_binding=${'b'.repeat(64)}` }
    }, response);

    expect(instagramOAuth.persistConnection).toHaveBeenCalledWith(
      'a7dc831e-c6d3-4412-873c-80be1b10d234',
      verifiedConnection
    );
    expect(instagramOAuth.persistConnection.mock.invocationCallOrder[0])
      .toBeLessThan(response.redirect.mock.invocationCallOrder[0]);
    expect(response.redirect).toHaveBeenCalledWith(expect.stringContaining('instagram=connected'));
  });

  it('records a failed or expired authorization code and never redirects as connected', async () => {
    instagramOAuth.consumeOAuthAttempt.mockResolvedValue({
      user_id: 'a7dc831e-c6d3-4412-873c-80be1b10d234'
    });
    instagramOAuth.exchangeAuthorizationCode.mockRejectedValue(new Error('expired code'));

    await instagramOAuthCallback({
      query: { state: 'a'.repeat(64), code: 'expired-provider-code' },
      headers: { cookie: '' }
    }, response);

    expect(instagramOAuth.updateConnectionStatus).toHaveBeenCalledWith(
      'a7dc831e-c6d3-4412-873c-80be1b10d234',
      'error'
    );
    expect(response.redirect).toHaveBeenCalledWith(expect.not.stringContaining('instagram=connected'));
  });

  it('keeps a cancelled authorization disconnected', async () => {
    instagramOAuth.consumeOAuthAttempt.mockResolvedValue({
      user_id: 'a7dc831e-c6d3-4412-873c-80be1b10d234'
    });
    await instagramOAuthCallback({
      query: { state: 'a'.repeat(64), error: 'access_denied' },
      headers: { cookie: '' }
    }, response);

    expect(instagramOAuth.exchangeAuthorizationCode).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(expect.stringContaining('instagram=cancelled'));
  });

  it('disconnects only through the authenticated user-scoped controller', async () => {
    const request = createRequest(profile());
    await disconnectInstagram(request, response, jest.fn());
    expect(instagramOAuth.disconnectConnection).toHaveBeenCalledWith(request.user.id);
    expect(response.json).toHaveBeenCalledWith({ success: true, status: 'disconnected' });
  });
});
