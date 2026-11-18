const crypto = require('crypto');
const axios = require('axios');
const { supabase } = require('../../config/supabase');

const STATE_TABLE = 'instagram_oauth_states';
const INTEGRATION_TABLE = 'social_integrations';
const STATE_TTL_MS = 10 * 60 * 1000;
const INSTAGRAM_SCOPE = 'instagram_business_basic';
const API_BASE = 'https://graph.instagram.com';
const CALLBACK_PATH = '/api/integrations/instagram/callback';
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const isValidOpaqueValue = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const parseProviderJson = response => {
  if (typeof response !== 'string') return response;
  const parsed = JSON.parse(response);
  const id = response.match(/"(?:user_id|id)"\s*:\s*(?:"([^"]+)"|(\d+))/);
  if (id) parsed.user_id = id[1] || id[2];
  return parsed;
};

const getConfiguration = () => {
  const { INSTAGRAM_APP_ID: clientId, INSTAGRAM_APP_SECRET: clientSecret, INSTAGRAM_REDIRECT_URI: redirectUri } = process.env;
  const key = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY;
  if (!clientId || !clientSecret || !redirectUri || !key) {
    throw new Error('Instagram OAuth is not configured.');
  }
  if (!/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error('Instagram token encryption must be configured with a 32-byte hex key.');
  }

  let callback;
  try {
    callback = new URL(redirectUri);
  } catch {
    throw new Error('Instagram callback URL configuration is invalid.');
  }
  if (
    callback.pathname !== CALLBACK_PATH ||
    callback.search ||
    callback.hash ||
    callback.username ||
    callback.password ||
    (process.env.NODE_ENV === 'production' && callback.protocol !== 'https:')
  ) {
    throw new Error('Instagram callback URL configuration is invalid.');
  }
  return { clientId, clientSecret, redirectUri, encryptionKey: Buffer.from(key, 'hex'), callbackOrigin: callback.origin };
};

const buildAuthorizationUrl = (state, config = getConfiguration()) => {
  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: INSTAGRAM_SCOPE,
    state
  }).toString();
  return url.toString();
};

const createOAuthAttempt = async userId => {
  if (typeof userId !== 'string' || !UUID_PATTERN.test(userId)) {
    throw new Error('A valid authenticated Supabase user is required.');
  }
  const config = getConfiguration();
  const state = crypto.randomBytes(32).toString('hex');
  const bindingSecret = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + STATE_TTL_MS).toISOString();
  const now = new Date().toISOString();

  const { error: cleanupError } = await supabase.from(STATE_TABLE).delete().lt('expires_at', now);
  if (cleanupError) throw cleanupError;
  const { error: priorAttemptError } = await supabase.from(STATE_TABLE).delete().eq('user_id', userId);
  if (priorAttemptError) throw priorAttemptError;
  const { error } = await supabase.from(STATE_TABLE).insert({
    state_hash: sha256(state),
    binding_hash: sha256(bindingSecret),
    user_id: userId,
    expires_at: expiresAt
  });
  if (error) throw error;

  return {
    state,
    bindingSecret,
    authorizationUrl: `${config.callbackOrigin}/api/integrations/instagram/authorize?state=${state}`
  };
};

const isPendingOAuthAttempt = async (state, bindingSecret) => {
  if (!isValidOpaqueValue(state) || !isValidOpaqueValue(bindingSecret)) return false;
  const { data, error } = await supabase.from(STATE_TABLE)
    .select('state_hash')
    .eq('state_hash', sha256(state))
    .eq('binding_hash', sha256(bindingSecret))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

const consumeOAuthAttempt = async (state, bindingSecret) => {
  if (!isValidOpaqueValue(state) || !isValidOpaqueValue(bindingSecret)) return null;
  const { data, error } = await supabase.from(STATE_TABLE)
    .delete()
    .eq('state_hash', sha256(state))
    .eq('binding_hash', sha256(bindingSecret))
    .gt('expires_at', new Date().toISOString())
    .select('user_id')
    .maybeSingle();
  if (error) throw error;
  return data?.user_id ? data : null;
};

const discardOAuthAttempt = async bindingSecret => {
  if (!isValidOpaqueValue(bindingSecret)) return;
  const { error } = await supabase.from(STATE_TABLE).delete()
    .eq('binding_hash', sha256(bindingSecret));
  if (error) throw error;
};

const encryptToken = (token, key) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return {
    token_ciphertext: ciphertext.toString('base64'),
    token_iv: iv.toString('base64'),
    token_auth_tag: cipher.getAuthTag().toString('base64')
  };
};

const decryptToken = (record, key) => {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(record.token_iv, 'base64'));
  decipher.setAuthTag(Buffer.from(record.token_auth_tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(record.token_ciphertext, 'base64')),
    decipher.final()
  ]).toString('utf8');
};

const tokenExpiry = seconds => {
  const lifetime = Number(seconds);
  if (!Number.isFinite(lifetime) || lifetime <= 0) throw new Error('Instagram returned an invalid token lifetime.');
  return new Date(Date.now() + lifetime * 1000).toISOString();
};

const exchangeAuthorizationCode = async code => {
  if (typeof code !== 'string' || !code || code.length > 4096) {
    throw new Error('Instagram authorization code is invalid.');
  }
  const config = getConfiguration();
  const form = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    code
  });
  const { data: shortTokenResponse } = await axios.post('https://api.instagram.com/oauth/access_token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'text',
    transformResponse: [response => response],
    timeout: 10000
  });
  const shortToken = parseProviderJson(shortTokenResponse);
  if (
    typeof shortToken?.access_token !== 'string' ||
    typeof shortToken?.user_id !== 'string' ||
    !shortToken.user_id
  ) {
    throw new Error('Instagram did not return a valid account token.');
  }

  const { data: longLived } = await axios.get(`${API_BASE}/access_token`, {
    params: {
      grant_type: 'ig_exchange',
      client_secret: config.clientSecret,
      access_token: shortToken.access_token
    },
    timeout: 10000
  });
  if (typeof longLived?.access_token !== 'string' || !longLived.access_token) {
    throw new Error('Instagram did not return a long-lived token.');
  }
  const accessToken = longLived.access_token;
  const expiresAt = tokenExpiry(longLived.expires_in);

  const { data: profileResponse } = await axios.get(`${API_BASE}/me`, {
    params: { fields: 'user_id,username,followers_count,media_count' },
    headers: { Authorization: `Bearer ${accessToken}` },
    responseType: 'text',
    transformResponse: [response => response],
    timeout: 10000
  });
  const profile = parseProviderJson(profileResponse);
  const accountId = profile?.user_id || profile?.id;
  if (
    typeof accountId !== 'string' ||
    !accountId ||
    accountId !== shortToken.user_id ||
    typeof profile?.username !== 'string' ||
    !profile.username
  ) {
    throw new Error('Instagram account identity could not be verified.');
  }

  return {
    accountId,
    username: profile.username,
    followersCount: Number.isFinite(profile.followers_count) ? profile.followers_count : null,
    mediaCount: Number.isFinite(profile.media_count) ? profile.media_count : null,
    accessToken,
    expiresAt,
    encryptionKey: config.encryptionKey
  };
};

const persistConnection = async (userId, connection) => {
  const now = new Date().toISOString();
  const { error } = await supabase.from(INTEGRATION_TABLE).upsert({
    user_id: userId,
    provider: 'instagram',
    account_id: connection.accountId,
    username: connection.username,
    connection_status: 'connected',
    granted_permissions: [INSTAGRAM_SCOPE],
    followers_count: connection.followersCount,
    media_count: connection.mediaCount,
    ...encryptToken(connection.accessToken, connection.encryptionKey),
    token_expires_at: connection.expiresAt,
    token_issued_at: now,
    updated_at: now
  }, { onConflict: 'user_id,provider' });
  if (error) throw error;
};

const updateConnectionStatus = async (userId, status) => {
  const { data, error } = await supabase.from(INTEGRATION_TABLE)
    .select('token_ciphertext')
    .eq('user_id', userId)
    .eq('provider', 'instagram')
    .maybeSingle();
  if (error) throw error;
  const safeStatus = data?.token_ciphertext ? 'reconnect_required' : status;
  const { error: updateError } = await supabase.from(INTEGRATION_TABLE)
    .update({ connection_status: safeStatus, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', 'instagram');
  if (updateError) throw updateError;
  if (!data) {
    const { error: insertError } = await supabase.from(INTEGRATION_TABLE).insert({
      user_id: userId,
      provider: 'instagram',
      connection_status: status
    });
    if (insertError) throw insertError;
  }
};

const getConnectionStatus = async userId => {
  const { data: pending, error: pendingError } = await supabase.from(STATE_TABLE)
    .select('state_hash')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .limit(1);
  if (pendingError) throw pendingError;
  if (pending?.length) return { status: 'connecting', username: null };

  const { data: record, error } = await supabase.from(INTEGRATION_TABLE)
    .select('account_id, username, connection_status, granted_permissions, token_ciphertext, token_iv, token_auth_tag, token_expires_at, token_issued_at')
    .eq('user_id', userId)
    .eq('provider', 'instagram')
    .maybeSingle();
  if (error) throw error;
  if (!record) return { status: 'disconnected', username: null };

  let status = record.connection_status;
  const expiresAt = record.token_expires_at ? Date.parse(record.token_expires_at) : NaN;
  const hasCompleteToken = Boolean(
    record.account_id &&
    record.username &&
    record.token_ciphertext &&
    record.token_iv &&
    record.token_auth_tag &&
    Number.isFinite(Date.parse(record.token_issued_at)) &&
    Array.isArray(record.granted_permissions) &&
    record.granted_permissions.includes(INSTAGRAM_SCOPE)
  );
  if (status === 'connected' && !hasCompleteToken) {
    status = 'reconnect_required';
    const { error: updateError } = await supabase.from(INTEGRATION_TABLE)
      .update({ connection_status: status, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'instagram');
    if (updateError) throw updateError;
  } else if (status === 'connected' && (!Number.isFinite(expiresAt) || expiresAt <= Date.now())) {
    status = Number.isFinite(expiresAt) ? 'expired' : 'reconnect_required';
    const { error: updateError } = await supabase.from(INTEGRATION_TABLE)
      .update({ connection_status: status, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'instagram');
    if (updateError) throw updateError;
  } else if (
    status === 'connected' &&
    expiresAt - Date.now() <= 7 * 24 * 60 * 60 * 1000 &&
    Date.now() - Date.parse(record.token_issued_at) >= 24 * 60 * 60 * 1000
  ) {
    status = await refreshConnection(userId, record);
  }
  return {
    status,
    username: status === 'connected' ? record.username : null,
    accountId: status === 'connected' ? record.account_id : null,
    permissions: status === 'connected' ? record.granted_permissions : [],
    expiresAt: status === 'connected' ? record.token_expires_at : null
  };
};

const refreshConnection = async (userId, record) => {
  const config = getConfiguration();
  let refreshedToken;
  try {
    const accessToken = decryptToken(record, config.encryptionKey);
    const { data } = await axios.get(`${API_BASE}/refresh_access_token`, {
      params: { grant_type: 'ig_refresh_token', access_token: accessToken },
      timeout: 5000
    });
    if (typeof data?.access_token !== 'string' || !data.access_token) {
      throw new Error('Instagram did not return a refreshed token.');
    }
    refreshedToken = { accessToken: data.access_token, expiresAt: tokenExpiry(data.expires_in) };
  } catch {
    const { error } = await supabase.from(INTEGRATION_TABLE).update({
      connection_status: 'reconnect_required',
      updated_at: new Date().toISOString()
    }).eq('user_id', userId).eq('provider', 'instagram');
    if (error) throw error;
    return 'reconnect_required';
  }
  const { error } = await supabase.from(INTEGRATION_TABLE).update({
    ...encryptToken(refreshedToken.accessToken, config.encryptionKey),
    token_expires_at: refreshedToken.expiresAt,
    token_issued_at: new Date().toISOString(),
    connection_status: 'connected',
    updated_at: new Date().toISOString()
  }).eq('user_id', userId).eq('provider', 'instagram');
  if (error) throw error;
  return 'connected';
};

const disconnectConnection = async userId => {
  const { error } = await supabase.from(STATE_TABLE).delete().eq('user_id', userId);
  if (error) throw error;
  const { error: integrationError } = await supabase.from(INTEGRATION_TABLE).delete()
    .eq('user_id', userId)
    .eq('provider', 'instagram');
  if (integrationError) throw integrationError;
};

module.exports = {
  CALLBACK_PATH,
  INSTAGRAM_SCOPE,
  buildAuthorizationUrl,
  consumeOAuthAttempt,
  createOAuthAttempt,
  discardOAuthAttempt,
  disconnectConnection,
  exchangeAuthorizationCode,
  getConfiguration,
  getConnectionStatus,
  isPendingOAuthAttempt,
  persistConnection,
  updateConnectionStatus
};
