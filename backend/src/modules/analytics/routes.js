const express = require('express');
const { authenticate } = require('../../middleware/auth');
const router = express.Router();

router.get('/campaign/:id', authenticate, async (req, res) => {
  // Mock data as requested
  res.json({
    id: req.params.id,
    views: Math.floor(Math.random() * 10000),
    clicks: Math.floor(Math.random() * 1000),
    engagementRate: (Math.random() * 5 + 1).toFixed(2),
    earnings: Math.floor(Math.random() * 5000),
    performanceMetrics: "Excelent"
  });
});

router.get('/creator/:id', authenticate, async (req, res) => {
  // Mock data as requested
  res.json({
    id: req.params.id,
    views: Math.floor(Math.random() * 50000),
    clicks: Math.floor(Math.random() * 5000),
    engagementRate: (Math.random() * 10 + 2).toFixed(2),
    earnings: Math.floor(Math.random() * 10000),
    performanceMetrics: "Top Tier"
  });
});

module.exports = router;
