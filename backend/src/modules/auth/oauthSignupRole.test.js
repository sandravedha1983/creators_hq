jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

const crypto = require('crypto');
const { supabase } = require('../../config/supabase');
const { createIntent, consumeIntent } = require('./oauthSignupRole');

describe('OAuth signup role intent', () => {
  let response;
  let next;

  beforeEach(() => {
    supabase.from.mockReset();
    supabase.rpc.mockReset();
    response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('only creates short-lived intents for public Creator and Brand roles', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert });
    const browserBinding = 'a'.repeat(64);

    await createIntent({ body: { role: 'brand', browserBinding } }, response, next);

    const [stored] = insert.mock.calls[0];
    expect(stored.role).toBe('brand');
    expect(stored.code_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.code_hash).not.toBe(response.json.mock.calls[0][0].data.code);
    expect(stored.binding_hash).toBe(crypto.createHash('sha256').update(browserBinding).digest('hex'));
    expect(new Date(stored.expires_at).getTime()).toBeGreaterThan(Date.now());
    expect(response.status).toHaveBeenCalledWith(201);
  });

  it('rejects attempts to request an Admin signup intent', async () => {
    await createIntent({ body: { role: 'admin', browserBinding: 'a'.repeat(64) } }, response, next);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('consumes an intent only for the authenticated Supabase user', async () => {
    supabase.rpc.mockResolvedValue({ data: 'brand', error: null });
    const code = 'b'.repeat(64);
    const browserBinding = 'c'.repeat(64);

    await consumeIntent({ body: { code, browserBinding }, user: { id: 'auth-user-uuid' } }, response, next);

    expect(supabase.rpc).toHaveBeenCalledWith('consume_oauth_signup_role_intent', {
      p_code_hash: crypto.createHash('sha256').update(code).digest('hex'),
      p_binding_hash: crypto.createHash('sha256').update(browserBinding).digest('hex'),
      p_user_id: 'auth-user-uuid'
    });
    expect(response.json).toHaveBeenCalledWith({ success: true, data: { role: 'brand' } });
  });
});
