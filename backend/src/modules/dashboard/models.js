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
    const cId = new mongoose.Types.ObjectId(creatorId);
    
    // Fetch real analytics from MongoDB
    const analytics = await Analytics.findOne({ userId: cId });
    
    if (!analytics) {
      return {
        followers: 1200,
        followersGrowth: '+12%',
        engagement: 8.5,
        engagementGrowth: '+5%',
        earnings: 2500,
        earningsGrowth: '+24%',
        growthScore: 78,
        growthScoreGrowth: '+18%'
      };
    }

    return {
      followers: analytics.followers,
      followersGrowth: '+12%',
      engagement: analytics.engagement,
      engagementGrowth: '+5%',
      earnings: analytics.earnings,
      earningsGrowth: '+24%',
      growthScore: analytics.growthScore,
      growthScoreGrowth: '+18%',
      instagramConnected: analytics.instagramData?.connected || false,
      instagramUsername: analytics.instagramData?.username
    };
  }
};

module.exports = Dashboard;
