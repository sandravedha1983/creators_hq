const OpenAI = require('openai');
const AiGeneration = require('./models');
const User = require('../auth/models');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FREE_MONTHLY_LIMIT = 5;

// ─── Helper: count this month's generations for a user ───────────────────────
async function getMonthlyUsage(userId) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return AiGeneration.countDocuments({ user_id: userId, createdAt: { $gte: start } });
}

// ─── Helper: generate via OpenAI with fallback ────────────────────────────────
async function callOpenAI(systemPrompt, userPrompt, model = 'gpt-4o-mini') {
  if (!process.env.OPENAI_API_KEY) throw new Error('no_key');
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 600
  });
  return {
    output: response.choices[0].message.content,
    tokens: response.usage?.total_tokens || 0
  };
}

// ─── GET /api/ai/usage — return current usage count ──────────────────────────
const getUsage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('plan');
    const used = await getMonthlyUsage(req.user.id);
    const isPro = user?.plan === 'pro';
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

    // Usage limit check
    const user = await User.findById(req.user.id).select('plan');
    const isPro = user?.plan === 'pro';
    if (!isPro) {
      const used = await getMonthlyUsage(req.user.id);
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
      ideas: `Content ideas for "${prompt}": 1) Behind-the-scenes reel 2) Tutorial breakdown 3) Day-in-the-life vlog 4) Trending audio twist 5) Creator collab`,
      script: `Hook: Start with "Did you know that ${prompt}..."\nBody: Share 3 key points with quick cuts.\nCTA: "Follow for more tips like this!"`,
      email: `Subject: Let's Create Something Amazing Together\n\nHi [Brand Name],\n\nI'm a content creator focused on ${prompt}. I believe there's a natural fit between your brand and my audience. Would love to explore a collaboration.\n\nBest,\n[Your Name]`,
      default: `Strategy for "${prompt}": Focus on consistency over perfection. Post 4–5× per week, engage with your top commenters daily, and use carousel posts for maximum saves.`
    };

    let output, tokens;
    try {
      const result = await callOpenAI(systemPrompt, userPrompt);
      output = result.output;
      tokens = result.tokens;
    } catch {
      output = FALLBACKS[type] || FALLBACKS.default;
      tokens = 0;
    }

    // Save to DB for history and usage tracking
    await AiGeneration.create({
      user_id: req.user.id,
      type: type || 'default',
      prompt,
      output,
      tokens_used: tokens
    });

    res.json({ success: true, data: output });
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
      const result = await callOpenAI(
        'You are an AI growth analyst for social media creators.',
        `Based on this data: ${JSON.stringify(profileData)}, give 3 actionable growth tips.`
      );
      data = result.output;
    } catch {
      data = FALLBACK;
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

    let reply;
    try {
      const result = await callOpenAI(
        'You are CreatorsHQ AI (Crea), a growth strategist for content creators. Give short, viral, and highly actionable advice.',
        message,
        'gpt-4o-mini'
      );
      reply = result.output;
    } catch {
      reply = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    }

    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/ai/history — user's generation history ─────────────────────────
const getHistory = async (req, res, next) => {
  try {
    const history = await AiGeneration.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateContent, getGrowthSuggestions, chat, getUsage, getHistory };
