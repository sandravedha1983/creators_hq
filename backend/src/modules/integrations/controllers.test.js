jest.mock('../../utils/social', () => ({
  extractUsername: jest.fn(() => 'creator'),
  profileUrl: jest.fn(() => 'https://www.instagram.com/creator/'),
  fetchHtml: jest.fn()
}));

jest.mock('axios', () => ({ get: jest.fn() }));

const axios = require('axios');
const { fetchHtml } = require('../../utils/social');
const { verifySocial, getIntegrations, connectPlatform } = require('./controllers');

const createRequest = (profile) => {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    })
  };
  return {
    user: { id: 'a7dc831e-c6d3-4412-873c-80be1b10d234' },
    supabase: { from: jest.fn().mockReturnValue(query) },
    query
  };
};

describe('Supabase integration controllers', () => {
  let response;
  const profile = () => ({
    id: 'a7dc831e-c6d3-4412-873c-80be1b10d234',
    socials: {
      instagram: { username: 'creator', code: 'CRHQ_TEST', verified: false }
    },
    integrations: {}
  });

  beforeEach(() => {
    jest.clearAllMocks();
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('does not verify ownership when public profile lookups fail', async () => {
    const request = createRequest(profile());
    axios.get.mockRejectedValue(new Error('upstream unavailable'));
    fetchHtml.mockRejectedValue(new Error('profile fetch blocked'));

    await verifySocial({
      ...request,
      body: { platform: 'instagram', url: 'https://www.instagram.com/creator/', code: 'CRHQ_TEST' }
    }, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ verified: false }));
    expect(request.query.update).not.toHaveBeenCalled();
  });

  it('stores social profile verification against the authenticated Supabase UUID only', async () => {
    const request = createRequest(profile());
    axios.get.mockRejectedValue(new Error('upstream unavailable'));
    fetchHtml.mockResolvedValue('<html><body>CRHQ_TEST</body></html>');

    await verifySocial({
      ...request,
      body: { platform: 'instagram', url: 'https://www.instagram.com/creator/', code: 'CRHQ_TEST' }
    }, response, jest.fn());

    expect(request.supabase.from).toHaveBeenCalledWith('profiles');
    expect(request.query.update).toHaveBeenCalledWith(expect.objectContaining({
      socials: expect.objectContaining({
        instagram: expect.objectContaining({ verified: true })
      }),
      integrations: { instagram: true }
    }));
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ verified: true }));
  });

  it('does not treat manually verified social profiles as authenticated provider connections', async () => {
    const request = createRequest({
      ...profile(),
      socials: { instagram: { username: 'creator', verified: true } },
      integrations: { instagram: true, slack: true }
    });

    await getIntegrations(request, response, jest.fn());

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
    const request = createRequest(profile());
    await connectPlatform({ ...request, body: { platform: 'slack' } }, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(501);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('No provider account was connected')
    }));
  });
});
