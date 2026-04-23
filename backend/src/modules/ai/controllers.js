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
    
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ 
        success: true, 
        data: "AI: I'm currently in offline mode. How can I assist you with your content strategy today?" 
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful AI assistant for CreatorsHQ, specializing in social media growth." },
        { role: "user", content: message }
      ],
    });

    res.json({ 
      success: true, 
      reply: response.choices[0].message.content || `Creative idea: ${message} → Try storytelling + strong hook 🎯` 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateContent, getGrowthSuggestions, chat };
