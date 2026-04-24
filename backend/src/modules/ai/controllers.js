const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateContent = async (req, res, next) => {
  try {
    const { prompt, type } = req.body; // type: 'caption', 'ideas', etc.
    
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ 
        success: true, 
        data: "AI Content: Elevate your brand with CreatorsHQ. Authentic storytelling for the modern era. #CreatorsHQ #Growth"
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a social media expert for CreatorsHQ. Help creators with high-converting captions and viral ideas." 
        },
        { role: "user", content: `Generate ${type || 'content'} for: ${prompt}` }
      ],
    });

    res.json({ success: true, data: response.choices[0].message.content });
  } catch (error) {
    next(error);
  }
};

const getGrowthSuggestions = async (req, res, next) => {
  try {
    const { profileData } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ 
        success: true, 
        data: "Suggestion: Post more educational reels to increase your shareability and build authority in your niche." 
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an AI growth analyst for social media creators." },
        { role: "user", content: `Based on this data: ${JSON.stringify(profileData)}, what are 3 actionable growth tips?` }
      ],
    });

    res.json({ success: true, data: response.choices[0].message.content });
  } catch (error) {
    next(error);
  }
};

const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    
    // Attempt OpenAI generation
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are CreatorsHQ AI, a growth strategist for content creators. Give short, viral, and highly actionable advice." },
          { role: "user", content: message }
        ],
      });

      return res.json({ 
        success: true, 
        reply: response.choices[0].message.content 
      });
    } catch (openaiError) {
      console.warn("OpenAI Error, using local intelligence engine:", openaiError.message);
      // Fallback Strategy Engine
      const fallbackReplies = [
        `Growth hack for "${message}": Leverage high-contrast thumbnails + a "Pattern Interrupt" in the first 3 seconds.`,
        `Regarding "${message}": Use the "Bridge Content" method. Connect your niche to a trending topic to hijack the algorithm.`,
        `Strategy for "${message}": Double down on SEO-rich captions and use a 70/20/10 content split (Value/Engagement/Sales).`
      ];
      const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      
      return res.json({ 
        success: true, 
        reply: randomReply 
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { generateContent, getGrowthSuggestions, chat };
