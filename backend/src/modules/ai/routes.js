const express = require('express');
const OpenAI = require('openai');

let client;
if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const router = express.Router();

router.get('/ideas', async (req, res, next) => {
  try {
    if (!client) throw new Error("AI Service Unavailable (OpenAI API key missing)");
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `Give 5 content ideas for ${req.query.niche}` }]
    });
    res.json({ success: true, ideas: r.choices[0].message.content });
  } catch (error) {
    next(error);
  }
});

router.post('/lead-analysis', async (req, res, next) => {
  try {
    if (!client) throw new Error("AI Service Unavailable (OpenAI API key missing)");
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `Analyze leads: ${JSON.stringify(req.body)}` }]
    });
    res.json({ success: true, analysis: r.choices[0].message.content });
  } catch (error) {
    next(error);
  }
});

router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!client) throw new Error("AI Service Unavailable (OpenAI API key missing)");
    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are the CreatorsHQ AI Assistant. You help creators and brands manage their growth, content, and analytics." },
        { role: "user", content: message }
      ]
    });
    res.json({ success: true, response: r.choices[0].message.content });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
