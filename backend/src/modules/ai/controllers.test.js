'use strict';

const mockCreateInteraction = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    interactions: { create: mockCreateInteraction }
  }))
}));

const { GoogleGenAI } = require('@google/genai');
const { generateContent, getGrowthSuggestions, chat } = require('./controllers');

const createResponse = () => ({
  status: jest.fn(function (status) {
    this.statusCode = status;
    return this;
  }),
  json: jest.fn(function (body) {
    this.body = body;
    return this;
  })
});

const createSupabase = () => {
  const insert = jest.fn().mockResolvedValue({ error: null });
  return { client: { from: jest.fn(() => ({ insert })) }, insert };
};

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'server-only-test-key';
  mockCreateInteraction.mockReset();
  GoogleGenAI.mockClear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
});

describe('Gemini AI endpoints', () => {
  test('generates content with the configured model and preserves the response and history shapes', async () => {
    mockCreateInteraction.mockResolvedValue({
      output_text: '  A Gemini caption  ',
      usage: { total_tokens: 27 }
    });
    const { client, insert } = createSupabase();
    const req = {
      body: { prompt: 'coffee shop launch', type: 'caption' },
      user: { id: 'user-1', plan: 'pro' },
      supabase: client
    };
    const res = createResponse();

    await generateContent(req, res, jest.fn());

    expect(GoogleGenAI).toHaveBeenCalledWith({
      apiKey: 'server-only-test-key',
      httpOptions: { timeout: 30000 }
    });
    expect(mockCreateInteraction).toHaveBeenCalledWith({
      model: 'gemini-3.5-flash-lite',
      input: 'Generate caption for: coffee shop launch',
      system_instruction: expect.stringContaining('social media expert for CreatorsHQ'),
      generation_config: { max_output_tokens: 600 }
    });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      output: 'A Gemini caption',
      tokens_used: 27,
      model: 'gemini-3.5-flash-lite'
    }));
    expect(res.body).toEqual({ success: true, data: 'A Gemini caption' });
    expect(JSON.stringify(res.body)).not.toContain('server-only-test-key');
  });

  test('returns a useful warning and the existing content fallback when the API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const { client } = createSupabase();
    const res = createResponse();

    await generateContent({
      body: { prompt: 'coffee shop launch', type: 'caption' },
      user: { id: 'user-1', plan: 'pro' },
      supabase: client
    }, res, jest.fn());

    expect(mockCreateInteraction).not.toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toContain('coffee shop launch');
    expect(res.body.warning).toMatch(/not configured/i);
  });

  test('returns a visible quota warning with the existing chat fallback', async () => {
    mockCreateInteraction.mockRejectedValue(Object.assign(new Error('quota exhausted'), { status: 429 }));
    const res = createResponse();

    await chat({ body: { message: 'How do I grow?' } }, res, jest.fn());

    expect(res.body.success).toBe(true);
    expect(res.body.reply).toContain('How do I grow?');
    expect(res.body.warning).toMatch(/quota or rate limit/i);
  });

  test('reports an invalid Gemini API key without exposing provider details', async () => {
    mockCreateInteraction.mockRejectedValue(Object.assign(
      new Error('API key not valid: secret provider details'),
      { status: 400 }
    ));
    const res = createResponse();

    await chat({ body: { message: 'How do I grow?' } }, res, jest.fn());

    expect(res.body.warning).toMatch(/authentication failed/i);
    expect(JSON.stringify(res.body)).not.toContain('secret provider details');
  });

  test('distinguishes request timeouts and network failures', async () => {
    const timeoutResponse = createResponse();
    mockCreateInteraction.mockRejectedValueOnce(Object.assign(new Error('request timeout'), { code: 'ETIMEDOUT' }));

    await chat({ body: { message: 'How do I grow?' } }, timeoutResponse, jest.fn());

    expect(timeoutResponse.body.warning).toMatch(/too long to respond/i);

    const networkResponse = createResponse();
    mockCreateInteraction.mockRejectedValueOnce(
      Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } })
    );

    await chat({ body: { message: 'How do I grow?' } }, networkResponse, jest.fn());

    expect(networkResponse.body.warning).toMatch(/temporarily unavailable/i);
  });

  test('uses the growth-suggestions fallback for an empty Gemini response', async () => {
    mockCreateInteraction.mockResolvedValue({ output_text: '  ' });
    const res = createResponse();

    await getGrowthSuggestions({ body: { profileData: { niche: 'food' } } }, res, jest.fn());

    expect(res.body.success).toBe(true);
    expect(res.body.data).toContain('Content Pillars');
    expect(res.body.warning).toMatch(/empty response/i);
  });
});
