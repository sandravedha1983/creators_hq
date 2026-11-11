jest.mock('../../config/supabase', () => ({
  supabase: { from: jest.fn() }
}));

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { supabase } = require('../../config/supabase');
const { createBrowserBindingSecret, hashBrowserBindingSecret } = require('./oauthState');
const { createOAuthHandoff, exchangeOAuthHandoff } = require('./oauthHandoff');

describe('OAuth browser-bound handoff', () => {
  const originalEnvironment = {
    JWT_SECRET: process.env.JWT_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  const records = new Map();
  let insertedRecord;

  const mockCleanup = () => ({
    delete: jest.fn().mockReturnThis(),
    lt: jest.fn().mockResolvedValue({ error: null })
  });

  const mockProfileLookup = profile => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null })
  });

  const mockInsert = () => ({
    insert: jest.fn().mockImplementation(record => {
      insertedRecord = record;
      records.set(record.code_hash, record);
      return Promise.resolve({ error: null });
    })
  });

  const mockAtomicDelete = () => {
    let codeHash;
    let bindingHash;
    let expiresAfter;
    const query = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn(function (column, value) {
        if (column === 'code_hash') codeHash = value;
        if (column === 'binding_hash') bindingHash = value;
        return query;
      }),
      gt: jest.fn(function (_column, value) {
        expiresAfter = value;
        return query;
      }),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockImplementation(async () => {
        const record = records.get(codeHash);
        if (!record || record.binding_hash !== bindingHash || Date.parse(record.expires_at) <= Date.parse(expiresAfter)) {
          return { data: null, error: null };
        }
        records.delete(codeHash);
        return { data: { user_id: record.user_id, role: record.role }, error: null };
      })
    };
    return query;
  };

  const setupHandoff = async (bindingSecret = createBrowserBindingSecret()) => {
    records.clear();
    insertedRecord = null;
    supabase.from
      .mockReturnValueOnce(mockProfileLookup({
        id: 'a7dc831e-c6d3-4412-873c-80be1b10d234',
        role: 'creator',
        is_blocked: false,
        is_suspended: false
      }))
      .mockReturnValueOnce(mockCleanup())
      .mockReturnValueOnce(mockInsert());
    const sessionToken = jwt.sign(
      { id: 'a7dc831e-c6d3-4412-873c-80be1b10d234', role: 'creator' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const code = await createOAuthHandoff(sessionToken, bindingSecret);
    return { bindingSecret, code };
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    records.clear();
    supabase.from.mockReset();
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('stores the handoff code and browser secret only as hashes', async () => {
    const bindingSecret = createBrowserBindingSecret();
    const { code } = await setupHandoff(bindingSecret);
    const expectedCodeHash = crypto.createHash('sha256').update(code).digest('hex');

    expect(code).toMatch(/^[a-f0-9]{64}$/);
    expect(insertedRecord).toEqual(expect.objectContaining({
      code_hash: expectedCodeHash,
      binding_hash: hashBrowserBindingSecret(bindingSecret),
      user_id: 'a7dc831e-c6d3-4412-873c-80be1b10d234',
      role: 'creator',
      expires_at: expect.any(String)
    }));
    expect(insertedRecord).not.toHaveProperty('code');
    expect(insertedRecord).not.toHaveProperty('binding_secret');
  });

  it('allows Browser A to redeem and denies Browser B, missing cookies, and modified cookies', async () => {
    const browserA = createBrowserBindingSecret();
    const { code } = await setupHandoff(browserA);

    supabase.from.mockImplementation(mockAtomicDelete);
    const sessionToken = await exchangeOAuthHandoff(code, browserA);
    expect(jwt.verify(sessionToken, process.env.JWT_SECRET)).toEqual(expect.objectContaining({
      id: 'a7dc831e-c6d3-4412-873c-80be1b10d234',
      role: 'creator'
    }));

    const browserB = createBrowserBindingSecret();
    const { code: secondCode } = await setupHandoff(browserA);
    expect(await exchangeOAuthHandoff('not-a-code', undefined)).toBeNull();
    expect(await exchangeOAuthHandoff(secondCode, undefined)).toBeNull();
    expect(await exchangeOAuthHandoff(secondCode, browserB)).toBeNull();
    expect(await exchangeOAuthHandoff(secondCode, createBrowserBindingSecret())).toBeNull();
  });

  it('rejects a second redemption by Browser A and expired records', async () => {
    const { bindingSecret, code } = await setupHandoff();
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    records.set(hash, { ...insertedRecord, expires_at: new Date(Date.now() - 1000).toISOString() });
    supabase.from.mockImplementation(mockAtomicDelete);

    expect(await exchangeOAuthHandoff(code, bindingSecret)).toBeNull();

    const next = await setupHandoff(bindingSecret);
    supabase.from.mockImplementation(mockAtomicDelete);
    expect(await exchangeOAuthHandoff(next.code, bindingSecret)).not.toBeNull();
    expect(await exchangeOAuthHandoff(next.code, bindingSecret)).toBeNull();
  });

  it('allows only one successful result for concurrent redemption attempts', async () => {
    const { bindingSecret, code } = await setupHandoff();
    supabase.from.mockImplementation(mockAtomicDelete);

    const results = await Promise.all([
      exchangeOAuthHandoff(code, bindingSecret),
      exchangeOAuthHandoff(code, bindingSecret)
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('requires a valid signed identity before creating a handoff', async () => {
    const invalidToken = jwt.sign({ role: 'creator' }, process.env.JWT_SECRET);
    await expect(createOAuthHandoff(invalidToken, createBrowserBindingSecret())).rejects.toThrow('invalid application identity');
    await expect(createOAuthHandoff('not-a-jwt', createBrowserBindingSecret())).rejects.toThrow();
    await expect(createOAuthHandoff(jwt.sign({ id: 'user-id', role: 'creator' }, process.env.JWT_SECRET), undefined))
      .rejects.toThrow('browser binding secret');
  });

  it('rejects a Passport Mongo id without attempting an implicit Supabase mapping', async () => {
    supabase.from.mockReturnValueOnce(mockProfileLookup(null));
    const legacyToken = jwt.sign(
      { id: '64b64c56e2194f7c09d00001', role: 'creator' },
      process.env.JWT_SECRET
    );

    await expect(createOAuthHandoff(legacyToken, createBrowserBindingSecret()))
      .rejects.toThrow('invalid application identity');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('refuses a valid UUID identity without an active matching Supabase profile', async () => {
    supabase.from.mockReturnValueOnce(mockProfileLookup(null));
    const legacyToken = jwt.sign(
      { id: 'a7dc831e-c6d3-4412-873c-80be1b10d234', role: 'creator' },
      process.env.JWT_SECRET
    );

    await expect(createOAuthHandoff(legacyToken, createBrowserBindingSecret()))
      .rejects.toThrow('not an active Supabase profile');
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('uses the Supabase profile role instead of the Passport role claim', async () => {
    supabase.from
      .mockReturnValueOnce(mockProfileLookup({
        id: 'b6f4707e-3550-4df8-864e-9fd37b9e0304',
        role: 'brand',
        is_blocked: false,
        is_suspended: false
      }))
      .mockReturnValueOnce(mockCleanup())
      .mockReturnValueOnce(mockInsert());
    const token = jwt.sign(
      { id: 'b6f4707e-3550-4df8-864e-9fd37b9e0304', role: 'creator' },
      process.env.JWT_SECRET
    );

    await createOAuthHandoff(token, createBrowserBindingSecret());

    expect(insertedRecord).toEqual(expect.objectContaining({
      user_id: 'b6f4707e-3550-4df8-864e-9fd37b9e0304',
      role: 'brand'
    }));
  });
});
