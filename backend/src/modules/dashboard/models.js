const Campaign = require('../market/models');
const Collaboration = require('../collaborations/models');
const Transaction = require('../billing/models');
const Analytics = require('../analytics/models');
const mongoose = require('mongoose');

const Dashboard = {
  async getBrandStats(brandId) {
    const bId = new mongoose.Types.ObjectId(brandId);
    
    const campaignsStats = await Campaign.aggregate([
      { $match: { brand_id: bId } },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          activeCampaigns: { 
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } 
          },
          totalBudget: { $sum: "$budget" }
        }
      }
    ]);

    const creatorsCount = await Collaboration.distinct('receiver_id', { 
      sender_id: bId, 
      status: 'accepted' 
    });

    const stats = campaignsStats[0] || { totalCampaigns: 0, activeCampaigns: 0, totalBudget: 0 };

    return {
      ...stats,
      totalCreators: creatorsCount.length,
      // Real data — no fake growth percentages
      campaignsGrowth: 'N/A',
      creatorsGrowth: 'N/A',
      budgetGrowth: 'N/A'
    };
  },

  async getCreatorStats(creatorId) {
    const User = require('../auth/models');
    const user = await User.findById(creatorId);
    
    if (!user) return null;

    // Read from user.socials.instagram (correct schema path)
    const instagramSocial = user.socials?.instagram || {};
    const isConnected = instagramSocial.verified === true;

    return {
      username: user.name,
      followers: 0,
      followersGrowth: 'N/A',
      engagement: 0,
      engagementGrowth: 'N/A',
      earnings: 0,
      earningsGrowth: 'N/A',
      growthScore: 0,
      growthScoreGrowth: 'N/A',
      instagram: {
        username: instagramSocial.username || null,
        profileLink: instagramSocial.url || null,
        followers: 0,
        engagementRate: 0,
        isConnected: isConnected
      }
    };
  }
};

module.exports = Dashboard;
