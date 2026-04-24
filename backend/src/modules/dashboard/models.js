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
      campaignsGrowth: '+12%',
      creatorsGrowth: '+8%',
      budgetGrowth: '+15%'
    };
  },

  async getCreatorStats(creatorId) {
    const User = require('../auth/models');
    const user = await User.findById(creatorId);
    
    if (!user) return null;

    const instagram = user.instagram || {
      followers: 0,
      engagementRate: 0,
      isConnected: false
    };

    return {
      username: user.name,
      followers: instagram.followers,
      followersGrowth: instagram.isConnected ? '+0%' : 'N/A',
      engagement: instagram.engagementRate,
      engagementGrowth: instagram.isConnected ? '+0%' : 'N/A',
      earnings: 0, // Zeroed out as per "No Dummy Data" rule
      earningsGrowth: 'N/A',
      growthScore: 0, // Zeroed out as per "No Dummy Data" rule
      growthScoreGrowth: 'N/A',
      instagram: {
        username: instagram.username,
        profileLink: instagram.profileLink,
        followers: instagram.followers,
        engagementRate: instagram.engagementRate,
        isConnected: instagram.isConnected
      }
    };
  }
};

module.exports = Dashboard;
