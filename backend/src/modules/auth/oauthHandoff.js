const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { supabase } = require('../../config/supabase');
const { hashBrowserBindingSecret, isValidBrowserBindingSecret } = require('./oauthState');

const HANDOFF_TABLE = 'oauth_login_handoffs';
const HANDOFF_TTL_MS = 60_000;
const HANDOFF_CODE_PATTERN = /^[a-f0-9]{64}$/;
const SUPABASE_USER_ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const getHandoffConfiguration = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required for OAuth login handoffs.');
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service configuration is required for OAuth login handoffs.');
  }
  return secret;
};

const createOAuthHandoff = async (sessionToken, bindingSecret) => {
  const secret = getHandoffConfiguration();
  if (typeof sessionToken !== 'string' || !sessionToken) {
    throw new Error('OAuth login did not provide a valid application session.');
  }
  if (!isValidBrowserBindingSecret(bindingSecret)) {
    throw new Error('OAuth login did not provide a valid browser binding secret.');
  }

  const identity = jwt.verify(sessionToken, secret);
  if (!identity || typeof identity !== 'object') {
    throw new Error('OAuth login produced an invalid application session.');
  }
  const userId = identity.id || identity.userId || identity._id;
  if (typeof userId !== 'string' || !SUPABASE_USER_ID_PATTERN.test(userId)) {
    throw new Error('OAuth login produced an invalid application identity.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, is_blocked, is_suspended')
    .eq('id', String(userId))
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile || !['creator', 'brand', 'admin'].includes(profile.role) || profile.is_blocked || profile.is_suspended) {
    throw new Error('OAuth login identity is not an active Supabase profile.');
  }

  const code = crypto.randomBytes(32).toString('hex');
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + HANDOFF_TTL_MS).toISOString();

  const { error: cleanupError } = await supabase
    .from(HANDOFF_TABLE)
    .delete()
    .lt('expires_at', now.toISOString());
  if (cleanupError) throw cleanupError;

  const { error: insertError } = await supabase
    .from(HANDOFF_TABLE)
    .insert({
      code_hash: codeHash,
      binding_hash: hashBrowserBindingSecret(bindingSecret),
      user_id: profile.id,
      role: profile.role,
      expires_at: expiresAt
    });
  if (insertError) throw insertError;

  return code;
};

const exchangeOAuthHandoff = async (code, bindingSecret) => {
  const secret = getHandoffConfiguration();
  if (typeof code !== 'string' || !HANDOFF_CODE_PATTERN.test(code) || !isValidBrowserBindingSecret(bindingSecret)) return null;

  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const bindingHash = hashBrowserBindingSecret(bindingSecret);
  const { data, error } = await supabase
    .from(HANDOFF_TABLE)
    .delete()
    .eq('code_hash', codeHash)
    .eq('binding_hash', bindingHash)
    .gt('expires_at', new Date().toISOString())
    .select('user_id, role')
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.user_id || !['creator', 'brand', 'admin'].includes(data.role)) return null;

  return jwt.sign({ id: data.user_id, role: data.role }, secret, { expiresIn: '7d' });
};

module.exports = { createOAuthHandoff, exchangeOAuthHandoff };
