
const express = require('express');
const { Queue } = require('bullmq');

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let queue;

try {
  queue = new Queue("posts", { connection: redisUrl });
  queue.on('error', (err) => {
    console.error("Redis Connection Error:", err.message);
  });
} catch (err) {
  console.error("Failed to initialize Redis queue:", err.message);
}

const router = express.Router();

router.post('/schedule', async (req,res)=>{
  if (!queue) return res.status(503).json({ error: "Automation service unavailable (Redis disconnected)" });
  await queue.add("post", req.body, { delay: 5000 });
  res.json({msg:"Scheduled"});
});

module.exports = router;

