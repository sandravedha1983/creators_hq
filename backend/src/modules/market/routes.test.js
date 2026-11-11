jest.mock('./models', () => ({}));
jest.mock('./applicationModel', () => ({}));
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'brand-1', role: 'brand' };
    next();
  },
  authorize: () => (req, res, next) => next()
}));
jest.mock('../../config/supabase', () => ({
  supabase: { from: jest.fn() }
}));
jest.mock('../notifications/controllers', () => ({
  createNotification: jest.fn()
}));

const express = require('express');
const http = require('node:http');
const { supabase } = require('../../config/supabase');
const app = express();
let server;
let baseUrl;

app.use(express.json());
app.use('/api/market', require('./routes'));
app.use((err, req, res, next) => res.status(500).json({ message: err.message }));

beforeAll(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
});

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  supabase.from.mockReset();
});

describe('market Supabase routes', () => {
  it('lists campaigns without unsupported columns or public brand email', async () => {
    const campaignsQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [{
          id: 'campaign-1',
          brand_id: 'brand-1',
          title: 'Summer campaign',
          deliverables: ['Video', 'Story'],
          created_at: '2026-01-01T00:00:00.000Z'
        }],
        error: null,
        count: 1
      })
    };
    const profilesQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [{ id: 'brand-1', name: 'Brand One', avatar: 'avatar.png' }],
        error: null
      })
    };
    supabase.from.mockImplementation(table => table === 'campaigns' ? campaignsQuery : profilesQuery);

    const response = await fetch(`${baseUrl}/api/market/campaigns`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(campaignsQuery.select.mock.calls[0][0]).not.toContain('requirements');
    expect(campaignsQuery.select.mock.calls[0][0]).not.toContain('brand:brand_id');
    expect(body.data[0]).toMatchObject({
      _id: 'campaign-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      deliverables: 'Video, Story',
      brand_id: { _id: 'brand-1', name: 'Brand One', avatar: 'avatar.png' }
    });
    expect(body.data[0].brand_id).not.toHaveProperty('email');
  });

  it('scopes application status changes to the campaign being managed', async () => {
    const campaignQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'campaign-1', brand_id: 'brand-1', title: 'Campaign' },
        error: null
      })
    };
    const applicationQuery = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'application-1', creator_id: 'creator-1', status: 'approved' },
        error: null
      })
    };
    supabase.from.mockImplementation(table => table === 'campaigns' ? campaignQuery : applicationQuery);

    const response = await fetch(`${baseUrl}/api/market/campaign/campaign-1/application/application-1`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(applicationQuery.eq).toHaveBeenNthCalledWith(1, 'id', 'application-1');
    expect(applicationQuery.eq).toHaveBeenNthCalledWith(2, 'campaign_id', 'campaign-1');
    expect(body.data._id).toBe('application-1');
  });
});
