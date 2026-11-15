const crypto = require('crypto');
const { supabase } = require('../../config/supabase');

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const isSecret = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);

const createIntent = async (req, res, next) => {
  try {
    const { role, browserBinding } = req.body || {};
    if (!['creator', 'brand'].includes(role) || !isSecret(browserBinding)) {
      return res.status(400).json({ success: false, message: 'Choose Creator or Brand and provide a valid browser binding.' });
    }

    const code = crypto.randomBytes(32).toString('hex');
    const { error } = await supabase.from('oauth_signup_role_intents').insert({
      code_hash: hash(code),
      role,
      binding_hash: hash(browserBinding),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });
    if (error) throw error;
    return res.status(201).json({ success: true, data: { code } });
  } catch (error) {
    return next(error);
  }
};

const consumeIntent = async (req, res, next) => {
  try {
    const { code, browserBinding } = req.body || {};
    if (!isSecret(code) || !isSecret(browserBinding)) {
      return res.status(400).json({ success: false, message: 'OAuth signup intent is invalid or expired.' });
    }

    const { data: role, error } = await supabase.rpc('consume_oauth_signup_role_intent', {
      p_code_hash: hash(code),
      p_binding_hash: hash(browserBinding),
      p_user_id: req.user.id
    });
    if (error) throw error;
    if (!role) {
      return res.status(409).json({ success: false, message: 'OAuth signup intent is invalid or expired.' });
    }
    return res.json({ success: true, data: { role } });
  } catch (error) {
    return next(error);
  }
};

module.exports = { createIntent, consumeIntent };
