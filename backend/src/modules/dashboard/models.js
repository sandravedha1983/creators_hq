const Campaign = require('../market/models');
const Collaboration = require('../collaborations/models');
const Transaction = require('../billing/models');
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

    const collabsStats = await Collaboration.aggregate([
      { $match: { receiver_id: cId } },
      {
        $group: {
          _id: null,
          activeCollaborations: { 
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } 
          },
          completedCollaborations: { 
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } 
          },
          pendingRequests: { 
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } 
          }
        }
      }
    ]);

    const earnings = await Transaction.aggregate([
      { $match: { recipient_id: cId, status: 'paid' } },
      { $group: { _id: null, totalEarnings: { $sum: "$amount" } } }
    ]);

    const stats = collabsStats[0] || { 
      activeCollaborations: 0, 
      completedCollaborations: 0, 
      pendingRequests: 0 
    };

    return {
      ...stats,
      totalEarnings: earnings[0] ? earnings[0].totalEarnings : 0,
      activeGrowth: '+12%',
      pendingGrowth: '+5%',
      earningsGrowth: '+24%',
      completedGrowth: '+18%',
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
};

module.exports = Dashboard;
