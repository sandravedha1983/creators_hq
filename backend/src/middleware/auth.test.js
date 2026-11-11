jest.mock('../config/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn()
  },
  createUserClient: jest.fn(() => ({ userScoped: true }))
}));

const jwt = require('jsonwebtoken');
const { supabase, createUserClient } = require('../config/supabase');
const { authenticate } = require('./auth');

describe('authenticate Supabase profile identity', () => {
  const originalEnvironment = {
    JWT_SECRET: process.env.JWT_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  };
  let response;
  let next;
  let profileQuery;
  let request;

  const authenticateToken = token => {
    request = { header: jest.fn().mockReturnValue(`Bearer ${token}`) };
    return authenticate(request, response, next);
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    supabase.auth.getUser.mockReset();
    supabase.from.mockReset();
    createUserClient.mockClear();
    profileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn()
    };
    supabase.from.mockReturnValue(profileQuery);
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('rejects a valid Supabase token when no matching profile exists', async () => {
    const userId = 'a7dc831e-c6d3-4412-873c-80be1b10d234';
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId, email: 'creator@example.com' } }, error: null });
    profileQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

    await authenticateToken('token-for-uuid-user');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(profileQuery.eq).toHaveBeenCalledWith('id', userId);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(createUserClient).not.toHaveBeenCalled();
  });

  it('uses the authenticated Supabase UUID and profile role over caller-supplied claims', async () => {
    const userId = 'a7dc831e-c6d3-4412-873c-80be1b10d234';
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId, email: 'creator@example.com' } }, error: null });
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: userId,
        role: 'brand',
        plan: 'free',
        is_verified: true,
        is_onboarded: true,
        is_blocked: false,
        is_suspended: false
      },
      error: null
    });

    await authenticateToken('token-for-uuid-user');

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
    expect(createUserClient).toHaveBeenCalledWith('token-for-uuid-user');
    expect(request.user).toEqual(expect.objectContaining({
      id: userId,
      role: 'brand'
    }));
  });
});
