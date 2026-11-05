const express = require('express');
const { authenticate } = require('../../middleware/auth');
const Campaign = require('../market/models');
const CampaignApplication = require('../market/applicationModel');
const CreatorProfile = require('../creators/models');
const Transaction = require('../billing/models');
const Lead = require('../leads/models');
const router = express.Router();

// GET /api/analytics/summary — User analytics summary
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const mongoose = require('mongoose');

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({
        success: true,
        data: {
          followers: 0,
          engagementRate: 0,
          growthScore: 0,
          totalLeads: 0,
          hotLeads: 0,
          totalApplications: 0,
          approvedApplications: 0,
          totalEarnings: 0
        }
      });
    }

    const profile = await CreatorProfile.findOne({ user_id: userId });

    const totalLeads = await Lead.countDocuments({ user_id: userId });
    const hotLeads = await Lead.countDocuments({ user_id: userId, status: 'Hot' });
    const totalApplications = await CampaignApplication.countDocuments({ creator_id: userId });
    const approvedApplications = await CampaignApplication.countDocuments({ creator_id: userId, status: 'approved' });

    // Convert to ObjectId only if it's a valid ObjectId (not 'admin')
    let totalEarnings = 0;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const earningsResult = await Transaction.aggregate([
        { $match: { recipient_id: new mongoose.Types.ObjectId(userId), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      totalEarnings = earningsResult[0]?.total || 0;
    }

    res.json({
      success: true,
      data: {
        followers: profile?.followers || 0,
        engagementRate: profile?.engagement_rate || 0,
        growthScore: profile?.growthScore || 0,
        totalLeads,
        hotLeads,
        totalApplications,
        approvedApplications,
        totalEarnings
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/campaign/:id
router.get('/campaign/:id', authenticate, async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const applicationsCount = await CampaignApplication.countDocuments({ campaign_id: campaign._id });
    const approvedCount = await CampaignApplication.countDocuments({ campaign_id: campaign._id, status: 'approved' });

    res.json({
      success: true,
      data: {
        id: campaign._id,
        title: campaign.title,
        budget: campaign.budget,
        totalApplications: applicationsCount,
        approvedApplications: approvedCount,
        status: campaign.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/creator/:id
router.get('/creator/:id', authenticate, async (req, res, next) => {
  try {
    const profile = await CreatorProfile.findOne({ user_id: req.params.id }).populate('user_id', 'name email');
    if (!profile) return res.status(404).json({ success: false, message: 'Creator profile not found' });

    res.json({
      success: true,
      data: {
        id: profile._id,
        name: profile.user_id?.name || '',
        niche: profile.niche,
        followers: profile.followers,
        engagementRate: profile.engagement_rate,
        growthScore: profile.growthScore
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
