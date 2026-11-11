jest.mock('../auth/models', () => ({
  findById: jest.fn()
}));

jest.mock('../../utils/social', () => ({
  extractUsername: jest.fn(() => 'creator'),
  profileUrl: jest.fn(() => 'https://www.instagram.com/creator/'),
  fetchHtml: jest.fn()
}));

jest.mock('axios', () => ({
  get: jest.fn()
}));

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

const User = require('../auth/models');
const axios = require('axios');
const { fetchHtml } = require('../../utils/social');
const { supabase } = require('../../config/supabase');
const { verifySocial, getIntegrations, connectPlatform } = require('./controllers');

describe('verifySocial', () => {
  let user;
  let response;

  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    jest.clearAllMocks();
    supabase.from.mockReset();
    user = {
      socials: {
        instagram: { username: 'creator', code: 'CRHQ_TEST', verified: false }
      },
      integrations: new Map(),
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined)
    };
    User.findById.mockResolvedValue(user);
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  const submitVerification = (code = 'CRHQ_TEST') => {
    const next = jest.fn();
    return verifySocial({
      user: { id: 'mongo-user-id' },
      body: { platform: 'instagram', url: 'https://www.instagram.com/creator/', code }
    }, response, next).then(() => {
      if (next.mock.calls.length > 0) throw next.mock.calls[0][0];
    });
  };

  it('does not verify ownership when both public profile lookups fail', async () => {
    axios.get.mockRejectedValue(new Error('upstream unavailable'));
    fetchHtml.mockRejectedValue(new Error('profile fetch blocked'));

    await submitVerification();

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      verified: false
    }));
    expect(user.save).not.toHaveBeenCalled();
  });

  it('does not verify ownership when the public profile does not contain the code', async () => {
    axios.get.mockResolvedValue({ data: { data: { user: { biography: '', full_name: '' } } } });
    fetchHtml.mockResolvedValue('<html><body>Public creator profile</body></html>');

    await submitVerification();

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      verified: false
    }));
    expect(user.save).not.toHaveBeenCalled();
  });

  it('marks ownership verified only when a public profile contains the assigned code', async () => {
    axios.get.mockRejectedValue(new Error('upstream unavailable'));
    fetchHtml.mockResolvedValue('<html><body>CRHQ_TEST</body></html>');

    await submitVerification();

    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      verified: true
    }));
    expect(user.socials.instagram.verified).toBe(true);
    expect(user.integrations.get('instagram')).toBe(true);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  it('uses the authenticated Supabase profile instead of a Mongo user record', async () => {
    process.env.SUPABASE_URL = 'https://project.supabase.co';
    const profile = {
      id: 'supabase-user-id',
      socials: {
        instagram: { username: 'creator', code: 'CRHQ_TEST', verified: false }
      },
      integrations: {}
    };
    const updateQuery = {
      eq: jest.fn().mockResolvedValue({ error: null })
    };
    const profileQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null }),
      update: jest.fn().mockReturnValue(updateQuery)
    };
    supabase.from.mockReturnValue(profileQuery);
    axios.get.mockRejectedValue(new Error('upstream unavailable'));
    fetchHtml.mockResolvedValue('<html><body>CRHQ_TEST</body></html>');

    await verifySocial({
      user: { id: 'supabase-user-id' },
      body: { platform: 'instagram', url: 'https://www.instagram.com/creator/', code: 'CRHQ_TEST' }
    }, response, jest.fn());

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(profileQuery.update).toHaveBeenCalledWith(expect.objectContaining({
      socials: expect.objectContaining({
        instagram: expect.objectContaining({ verified: true })
      }),
      integrations: { instagram: true }
    }));
    expect(User.findById).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ verified: true }));
  });

  it('does not report legacy flags as authenticated provider connections', async () => {
    user.integrations = new Map([['instagram', true], ['slack', true]]);
    user.socials.instagram.verified = true;
    User.findById.mockResolvedValue(user);

    await getIntegrations({ user: { id: 'mongo-user-id' } }, response, jest.fn());

    expect(response.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        instagram: false,
        slack: false,
        profileVerified: expect.objectContaining({ instagram: true })
      })
    });
  });

  it('does not report an unimplemented OAuth integration as connected', async () => {
    await connectPlatform({
      user: { id: 'mongo-user-id' },
      body: { platform: 'slack' }
    }, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(501);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('No provider account was connected')
    }));
    expect(user.save).not.toHaveBeenCalled();
  });
});
