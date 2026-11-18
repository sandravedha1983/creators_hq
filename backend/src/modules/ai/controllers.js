const { GoogleGenAI } = require('@google/genai');

const FREE_MONTHLY_LIMIT = 5;
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_TIMEOUT_MS = 30000;

// ─── Helper: count this month's generations for a user ───────────────────────
async function getMonthlyUsage(userId, client) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count, error } = await client
    .from('ai_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start);
  if (error) throw error;
  return count || 0;
}

function getGeminiFailure(error) {
  const code = String(error?.code || error?.cause?.code || '').toUpperCase();
  const message = [error?.message, error?.cause?.message].filter(Boolean).join(' ').toLowerCase();
  const status = Number(error?.status || error?.statusCode || error?.response?.status || error?.cause?.status);

  if (code === 'AI_KEY_MISSING') {
    return {
      code: 'AI_NOT_CONFIGURED',
      message: 'AI generation is not configured on the server. Please contact support.'
    };
  }
  if (
    status === 429 ||
    status === 402 ||
    code.includes('RESOURCE_EXHAUSTED') ||
    message.includes('resource exhausted') ||
    message.includes('quota')
  ) {
    return {
      code: 'AI_RATE_LIMITED',
      message: 'AI service quota or rate limit reached. Please try again later.'
    };
  }
  if (
    status === 401 ||
    status === 403 ||
    code.includes('API_KEY_INVALID') ||
    message.includes('api key not valid') ||
    message.includes('invalid api key')
  ) {
    return {
      code: 'AI_AUTHENTICATION_FAILED',
      message: 'AI service authentication failed. Please contact support.'
    };
  }
  if (
    status === 408 ||
    code.includes('TIMEOUT') ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNABORTED' ||
    error?.name === 'AbortError' ||
    message.includes('timed out') ||
    message.includes('timeout')
  ) {
    return {
      code: 'AI_TIMEOUT',
      message: 'The AI service took too long to respond. Please try again.'
    };
  }
  if (
    status >= 500 ||
    ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']
      .some(networkCode => code.includes(networkCode))
  ) {
    return {
      code: 'AI_UNAVAILABLE',
      message: 'The AI service is temporarily unavailable. Please try again later.'
    };
  }
  if (code === 'AI_EMPTY_RESPONSE') {
    return {
      code: 'AI_EMPTY_RESPONSE',
      message: 'The AI service returned an empty response. Please try again.'
    };
  }
  return {
    code: 'AI_PROVIDER_ERROR',
    message: 'AI generation failed. A basic template is shown instead.'
  };
}

// ─── Helper: generate text with Gemini ──────────────────────────────────────
async function callGemini(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const error = new Error('Gemini API key is not configured');
    error.code = 'AI_KEY_MISSING';
    throw error;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: GEMINI_TIMEOUT_MS }
  });
  const response = await ai.interactions.create({
    model: GEMINI_MODEL,
    input: userPrompt,
    system_instruction: systemPrompt,
    generation_config: { max_output_tokens: 600 }
  });

  const output = typeof response?.output_text === 'string' ? response.output_text.trim() : '';
  if (!output) {
    const error = new Error('Gemini returned no text');
    error.code = 'AI_EMPTY_RESPONSE';
    throw error;
  }

  return {
    output,
    tokens: Number.isFinite(response?.usage?.total_tokens) ? response.usage.total_tokens : 0
  };
}

function getFallbackWarning(error) {
  const failure = getGeminiFailure(error);
  console.warn(`[AI] Gemini request failed: ${failure.code}`);
  return failure.message;
}

// ─── GET /api/ai/usage — return current usage count ──────────────────────────
const getUsage = async (req, res, next) => {
  try {
    const isPro = req.user.plan === 'pro';
    const used = await getMonthlyUsage(req.user.id, req.supabase);
    res.json({
      success: true,
      data: {
        used,
        limit: isPro ? null : FREE_MONTHLY_LIMIT,
        isPro,
        limitReached: !isPro && used >= FREE_MONTHLY_LIMIT
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/content — generate caption, bio, pitch, hashtags, etc. ─────
const generateContent = async (req, res, next) => {
  try {
    const { prompt, type } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'prompt is required' });

    // Normalize type enum: 'ideas' -> 'idea'
    const normalizedType = type === 'ideas' ? 'idea' : (type || 'idea');

    // Usage limit check
    const isPro = req.user.plan === 'pro';

    if (!isPro) {
      const used = await getMonthlyUsage(req.user.id, req.supabase);
      if (used >= FREE_MONTHLY_LIMIT) {
        return res.status(402).json({
          success: false,
          limitReached: true,
          message: `Free plan limit reached (${FREE_MONTHLY_LIMIT} generations/month). Upgrade to Pro for unlimited access.`
        });
      }
    }

    const systemPrompt = 'You are a social media expert for CreatorsHQ. Help creators with high-converting captions, viral ideas, compelling bios, and pitch templates. Be concise, punchy, and platform-aware.';
    const userPrompt = `Generate ${type || 'content'} for: ${prompt}`;

    const FALLBACKS = {
      caption: `🔥 "${prompt}" — Your audience is waiting. Make it count. Drop a 💬 if you agree! #CreatorsHQ #ContentCreator #Growth`,
      bio: `Content creator | ${prompt} enthusiast | Helping you grow smarter 🚀 | DMs open for collabs`,
      pitch: `Hi! I'm a content creator specialising in ${prompt}. I'd love to collaborate on a campaign that resonates authentically with my audience of engaged followers.`,
      hashtags: `#${prompt.replace(/\s+/g, '')} #ContentCreator #CreatorsHQ #Growth #ViralContent #SocialMedia`,
      idea: `Content ideas for "${prompt}": 1) Behind-the-scenes reel 2) Tutorial breakdown 3) Day-in-the-life vlog 4) Trending audio twist 5) Creator collab`,
      ideas: `Content ideas for "${prompt}": 1) Behind-the-scenes reel 2) Tutorial breakdown 3) Day-in-the-life vlog 4) Trending audio twist 5) Creator collab`,
      script: `Hook: Start with "Did you know that ${prompt}..."\nBody: Share 3 key points with quick cuts.\nCTA: "Follow for more tips like this!"`,
      email: `Subject: Let's Create Something Amazing Together\n\nHi [Brand Name],\n\nI'm a content creator focused on ${prompt}. I believe there's a natural fit between your brand and my audience. Would love to explore a collaboration.\n\nBest,\n[Your Name]`,
      default: `Strategy for "${prompt}": Focus on consistency over perfection. Post 4–5× per week, engage with your top commenters daily, and use carousel posts for maximum saves.`
    };

    let output, tokens, warning;
    try {
      const result = await callGemini(systemPrompt, userPrompt);
      output = result.output;
      tokens = result.tokens;
    } catch (error) {
      output = FALLBACKS[normalizedType] || FALLBACKS[type] || FALLBACKS.default;
      tokens = 0;
      warning = getFallbackWarning(error);
    }

    // Save to DB for history and usage tracking
    const { error: saveError } = await req.supabase.from('ai_generations').insert({
      user_id: req.user.id,
      type: normalizedType,
      prompt,
      output,
      tokens_used: tokens,
      model: GEMINI_MODEL
    });
    if (saveError) throw saveError;

    res.json({ success: true, data: output, ...(warning && { warning }) });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/suggestions — growth suggestions ────────────────────────────
const getGrowthSuggestions = async (req, res, next) => {
  try {
    const { profileData } = req.body;
    const FALLBACK = `Growth tips:\n\n1. **Content Pillars**: Define 3 core topics and rotate between them.\n\n2. **Engagement Windows**: Post during your audience's peak activity hours.\n\n3. **Collaboration**: Partner with 2–3 creators in adjacent niches each month to cross-pollinate audiences.`;

    let data;
    try {
      const result = await callGemini(
        'You are an AI growth analyst for social media creators.',
        `Based on this data: ${JSON.stringify(profileData)}, give 3 actionable growth tips.`
      );
      data = result.output;
    } catch (error) {
      data = FALLBACK;
      return res.json({ success: true, data, warning: getFallbackWarning(error) });
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/chat — Crea AI assistant ────────────────────────────────────
const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message is required' });

    const FALLBACKS = [
      `Growth hack for "${message}": Leverage high-contrast thumbnails + a "Pattern Interrupt" in the first 3 seconds.`,
      `Regarding "${message}": Use the "Bridge Content" method — connect your niche to a trending topic to ride the algorithm.`,
      `Strategy for "${message}": Use a 70/20/10 content split — 70% Value, 20% Engagement, 10% Promotion.`
    ];

    let reply, warning;
    try {
      const result = await callGemini(
        'You are CreatorsHQ AI (Crea), a growth strategist for content creators. Give short, viral, and highly actionable advice.',
        message
      );
      reply = result.output;
    } catch (error) {
      reply = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
      warning = getFallbackWarning(error);
    }

    res.json({ success: true, reply, ...(warning && { warning }) });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/ai/history — user's generation history ─────────────────────────
const getHistory = async (req, res, next) => {
  try {
    const { data: history, error } = await req.supabase
      .from('ai_generations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return res.json({ success: true, data: history || [] });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateContent, getGrowthSuggestions, chat, getUsage, getHistory };
