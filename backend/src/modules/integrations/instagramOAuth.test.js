jest.mock('../../config/supabase', () => ({
  supabase: { from: jest.fn() }
}));
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn()
}));

const crypto = require('crypto');
const axios = require('axios');
const { supabase } = require('../../config/supabase');
const oauth = require('./instagramOAuth');

const USER_ID = 'a7dc831e-c6d3-4412-873c-80be1b10d234';
const OTHER_USER_ID = 'b6f4707e-3550-4df8-864e-9fd37b9e0304';
const SECRET_KEY = 'ab'.repeat(32);
const originalEnvironment = {
  INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID,
  INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET,
  INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
  INSTAGRAM_TOKEN_ENCRYPTION_KEY: process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY,
  NODE_ENV: process.env.NODE_ENV
};

const queryResult = result => ({
  select: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue(result),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
});

const mutationResult = result => {
  const query = {
    insert: jest.fn().mockResolvedValue(result),
    upsert: jest.fn().mockResolvedValue(result),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  };
  return query;
};

describe('Instagram Login OAuth', () => {
  beforeEach(() => {
    process.env.INSTAGRAM_APP_ID = 'instagram-login-app-id';
    process.env.INSTAGRAM_APP_SECRET = 'instagram-login-app-secret';
    process.env.INSTAGRAM_REDIRECT_URI = 'https://api.example.com/api/integrations/instagram/callback';
    process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY = SECRET_KEY;
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('builds the official Instagram Login URL with the least required permission', () => {
    const url = new URL(oauth.buildAuthorizationUrl('a'.repeat(64)));
    expect(url.origin + url.pathname).toBe('https://www.instagram.com/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('instagram-login-app-id');
    expect(url.searchParams.get('redirect_uri')).toBe(process.env.INSTAGRAM_REDIRECT_URI);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('instagram_business_basic');
    expect(url.searchParams.get('state')).toBe('a'.repeat(64));
  });

  it('requires the exact configured backend callback and rejects invalid encryption keys', () => {
    process.env.INSTAGRAM_REDIRECT_URI = 'https://api.example.com/another/callback';
    expect(() => oauth.getConfiguration()).toThrow('callback URL configuration is invalid');
    process.env.INSTAGRAM_REDIRECT_URI = 'https://api.example.com/api/integrations/instagram/callback';
    process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY = 'not-a-key';
    expect(() => oauth.getConfiguration()).toThrow('32-byte hex key');
  });

  it('stores only hashes for random state and browser binding and returns the backend authorize URL', async () => {
    const cleanup = mutationResult({ error: null });
    const priorAttemptCleanup = mutationResult({ error: null });
    const insert = mutationResult({ error: null });
    supabase.from.mockReturnValueOnce(cleanup).mockReturnValueOnce(priorAttemptCleanup).mockReturnValueOnce(insert);

    const attempt = await oauth.createOAuthAttempt(USER_ID);
    const inserted = supabase.from.mock.results[2].value.insert.mock.calls[0][0];
    expect(attempt.state).toMatch(/^[a-f0-9]{64}$/);
    expect(attempt.bindingSecret).toMatch(/^[a-f0-9]{64}$/);
    expect(attempt.authorizationUrl).toContain('/api/integrations/instagram/authorize?state=');
    expect(inserted).toEqual(expect.objectContaining({
      state_hash: crypto.createHash('sha256').update(attempt.state).digest('hex'),
      binding_hash: crypto.createHash('sha256').update(attempt.bindingSecret).digest('hex'),
      user_id: USER_ID,
      expires_at: expect.any(String)
    }));
    expect(inserted).not.toHaveProperty('state');
    expect(inserted).not.toHaveProperty('binding_secret');
    expect(priorAttemptCleanup.eq).toHaveBeenCalledWith('user_id', USER_ID);
  });

  it('rejects missing, modified, expired, or different-browser OAuth state', async () => {
    supabase.from.mockReturnValue(queryResult({ data: null, error: null }));
    expect(await oauth.consumeOAuthAttempt('bad-state', 'bad-cookie')).toBeNull();
    expect(await oauth.consumeOAuthAttempt('a'.repeat(64), 'b'.repeat(64))).toBeNull();
    expect(await oauth.isPendingOAuthAttempt('a'.repeat(64), 'b'.repeat(64))).toBe(false);
  });

  it('exchanges the code using Instagram Login credentials, verifies the same account, and obtains a long-lived token', async () => {
    axios.post.mockResolvedValue({
      data: { access_token: 'short-lived-secret', user_id: '17841400000000001', expires_in: 3600 }
    });
    axios.get
      .mockResolvedValueOnce({ data: { access_token: 'long-lived-secret', expires_in: 5184000 } })
      .mockResolvedValueOnce({ data: {
        user_id: '17841400000000001',
        username: 'creatorshq2026',
        followers_count: 21,
        media_count: 7
      } });

    const connection = await oauth.exchangeAuthorizationCode('authorization-code');
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.instagram.com/oauth/access_token',
      expect.any(URLSearchParams),
      expect.objectContaining({ timeout: 10000 })
    );
    const form = axios.post.mock.calls[0][1];
    expect(form.get('client_id')).toBe('instagram-login-app-id');
    expect(form.get('client_secret')).toBe('instagram-login-app-secret');
    expect(form.get('redirect_uri')).toBe(process.env.INSTAGRAM_REDIRECT_URI);
    expect(axios.get).toHaveBeenNthCalledWith(2, 'https://graph.instagram.com/me', expect.objectContaining({
      params: { fields: 'user_id,username,followers_count,media_count' },
      headers: { Authorization: 'Bearer long-lived-secret' }
    }));
    expect(connection).toEqual(expect.objectContaining({
      accountId: '17841400000000001',
      username: 'creatorshq2026',
      followersCount: 21,
      mediaCount: 7,
      accessToken: 'long-lived-secret'
    }));
  });

  it('preserves numeric Instagram IDs exactly instead of rounding JavaScript numbers', async () => {
    axios.post.mockResolvedValue({
      data: '{"access_token":"short-token","user_id":17841405793187218,"expires_in":3600}'
    });
    axios.get
      .mockResolvedValueOnce({ data: { access_token: 'long-token', expires_in: 5184000 } })
      .mockResolvedValueOnce({
        data: '{"user_id":17841405793187218,"username":"creator","followers_count":4,"media_count":1}'
      });
    const connection = await oauth.exchangeAuthorizationCode('code');
    expect(connection.accountId).toBe('17841405793187218');
  });

  it('rejects expired authorization codes and invalid token responses without connecting', async () => {
    axios.post.mockRejectedValue(new Error('provider error'));
    await expect(oauth.exchangeAuthorizationCode('expired-code')).rejects.toThrow('provider error');
    axios.post.mockResolvedValue({ data: { user_id: '17841400000000001' } });
    await expect(oauth.exchangeAuthorizationCode('invalid-token')).rejects.toThrow('valid account token');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('refuses a profile identity that differs from the code-exchange account', async () => {
    axios.post.mockResolvedValue({
      data: { access_token: 'short-token', user_id: 'account-a', expires_in: 3600 }
    });
    axios.get
      .mockResolvedValueOnce({ data: { access_token: 'long-token', expires_in: 5184000 } })
      .mockResolvedValueOnce({ data: { user_id: 'account-b', username: 'other' } });
    await expect(oauth.exchangeAuthorizationCode('code')).rejects.toThrow('identity could not be verified');
  });

  it('persists encrypted tokens only and rejects a duplicate provider account owned by someone else', async () => {
    const upsert = mutationResult({ error: null });
    supabase.from.mockReturnValueOnce(upsert);
    await oauth.persistConnection(USER_ID, {
      accountId: 'account-1',
      username: 'creator',
      followersCount: 10,
      mediaCount: 2,
      accessToken: 'never-store-this-in-plaintext',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      encryptionKey: Buffer.from(SECRET_KEY, 'hex')
    });
    const inserted = supabase.from.mock.results[0].value.upsert.mock.calls[0][0];
    expect(inserted).toEqual(expect.objectContaining({
      user_id: USER_ID,
      provider: 'instagram',
      account_id: 'account-1',
      username: 'creator',
      connection_status: 'connected',
      granted_permissions: ['instagram_business_basic']
    }));
    expect(inserted.token_ciphertext).not.toContain('never-store-this-in-plaintext');
    expect(inserted.token_iv).toBeTruthy();
    expect(inserted.token_auth_tag).toBeTruthy();

    supabase.from.mockReturnValueOnce(mutationResult({ error: { code: '23505' } }));
    await expect(oauth.persistConnection(OTHER_USER_ID, {
      accountId: 'account-1',
      username: 'creator',
      accessToken: 'another-token',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      encryptionKey: Buffer.from(SECRET_KEY, 'hex')
    })).rejects.toEqual({ code: '23505' });
  });

  it('returns disconnected for a new user and scopes all lookup queries by Supabase UUID', async () => {
    const pendingLookup = queryResult({ data: [], error: null });
    const integrationLookup = queryResult({ data: null, error: null });
    supabase.from.mockReturnValueOnce(pendingLookup).mockReturnValueOnce(integrationLookup);
    expect(await oauth.getConnectionStatus(USER_ID)).toEqual({ status: 'disconnected', username: null });
    expect(integrationLookup.eq).toHaveBeenCalledWith('user_id', USER_ID);
    expect(integrationLookup.eq).toHaveBeenCalledWith('provider', 'instagram');

    const secondPendingLookup = queryResult({ data: [], error: null });
    const secondUserLookup = queryResult({ data: null, error: null });
    supabase.from.mockReturnValueOnce(secondPendingLookup).mockReturnValueOnce(secondUserLookup);
    expect(await oauth.getConnectionStatus(OTHER_USER_ID)).toEqual({ status: 'disconnected', username: null });
    expect(secondUserLookup.eq).toHaveBeenCalledWith('user_id', OTHER_USER_ID);
  });

  it('reports an active OAuth attempt as connecting before showing a stored connection', async () => {
    const pendingLookup = queryResult({ data: [{ state_hash: 'state-hash' }], error: null });
    supabase.from.mockReturnValueOnce(pendingLookup);
    expect(await oauth.getConnectionStatus(USER_ID)).toEqual({ status: 'connecting', username: null });
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it('marks an expired token expired without returning its account identity', async () => {
    const record = {
      data: {
        account_id: 'account-1',
        username: 'creator',
        connection_status: 'connected',
        granted_permissions: ['instagram_business_basic'],
        token_ciphertext: 'ciphertext',
        token_iv: 'iv',
        token_auth_tag: 'tag',
        token_issued_at: new Date().toISOString(),
        token_expires_at: new Date(Date.now() - 1000).toISOString()
      },
      error: null
    };
    const pending = queryResult({ data: [], error: null });
    const lookup = queryResult(record);
    const update = mutationResult({ error: null });
    supabase.from.mockReturnValueOnce(pending).mockReturnValueOnce(lookup).mockReturnValueOnce(update);
    expect(await oauth.getConnectionStatus(USER_ID)).toEqual({
      status: 'expired',
      username: null,
      accountId: null,
      permissions: [],
      expiresAt: null
    });
    expect(update.eq).toHaveBeenCalledWith('user_id', USER_ID);
  });

  it('refreshes a near-expiry token and requests reconnection when Meta rejects refresh', async () => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(SECRET_KEY, 'hex'), iv);
    const ciphertext = Buffer.concat([cipher.update('old-access-token', 'utf8'), cipher.final()]);
    const nearExpiryRecord = {
      account_id: 'account-1',
      username: 'creator',
      connection_status: 'connected',
      granted_permissions: ['instagram_business_basic'],
      token_ciphertext: ciphertext.toString('base64'),
      token_iv: iv.toString('base64'),
      token_auth_tag: cipher.getAuthTag().toString('base64'),
      token_expires_at: new Date(Date.now() + 2 * 86400000).toISOString(),
      token_issued_at: new Date(Date.now() - 2 * 86400000).toISOString()
    };
    const pending = queryResult({ data: [], error: null });
    const lookup = queryResult({ data: nearExpiryRecord, error: null });
    const saveRefresh = mutationResult({ error: null });
    axios.get.mockResolvedValue({ data: { access_token: 'refreshed-token', expires_in: 5184000 } });
    supabase.from.mockReturnValueOnce(pending).mockReturnValueOnce(lookup).mockReturnValueOnce(saveRefresh);
    expect((await oauth.getConnectionStatus(USER_ID)).status).toBe('connected');
    expect(axios.get).toHaveBeenCalledWith('https://graph.instagram.com/refresh_access_token', expect.objectContaining({
      params: expect.objectContaining({ grant_type: 'ig_refresh_token' })
    }));

    const rejectedPending = queryResult({ data: [], error: null });
    const rejectedLookup = queryResult({ data: nearExpiryRecord, error: null });
    const setReconnect = mutationResult({ error: null });
    axios.get.mockRejectedValue(new Error('token revoked'));
    supabase.from.mockReturnValueOnce(rejectedPending).mockReturnValueOnce(rejectedLookup).mockReturnValueOnce(setReconnect);
    expect((await oauth.getConnectionStatus(USER_ID)).status).toBe('reconnect_required');
  });

  it('disconnects and deletes only the authenticated user’s pending state and Instagram integration', async () => {
    const stateDelete = mutationResult({ error: null });
    const integrationDelete = mutationResult({ error: null });
    supabase.from.mockReturnValueOnce(stateDelete).mockReturnValueOnce(integrationDelete);
    await oauth.disconnectConnection(USER_ID);
    expect(supabase.from).toHaveBeenNthCalledWith(1, 'instagram_oauth_states');
    expect(stateDelete.eq).toHaveBeenCalledWith('user_id', USER_ID);
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'social_integrations');
    expect(integrationDelete.eq).toHaveBeenCalledWith('user_id', USER_ID);
    expect(integrationDelete.eq).toHaveBeenCalledWith('provider', 'instagram');
  });
});
