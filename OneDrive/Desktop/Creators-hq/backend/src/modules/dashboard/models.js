const Campaign = require('../market/models');
const CampaignApplication = require('../market/applicationModel');
const Collaboration = require('../collaborations/models');
const Transaction = require('../billing/models');
const CreatorProfile = require('../creators/models');
const User = require('../auth/models');
const mongoose = require('mongoose');
const { supabase } = require('../../config/supabase');

const isSupabaseActive = () => {
  return supabase && process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('dummy-creatorshq');
};

const Dashboard = {
  async getBrandStats(brandId) {
    if (isSupabaseActive()) {
      // Fetch campaigns
      const { data: camps, error: campErr } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('brand_id', brandId);

      const totalCampaigns = camps ? camps.length : 0;
      const activeCampaigns = camps ? camps.filter(c => c.status === 'open').length : 0;

      // Fetch distinct accepted creators
      const { data: collabs } = await supabase
        .from('collaborations')
        .select('receiver_id')
        .eq('sender_id', brandId)
        .eq('status', 'accepted');

      const distinctCreators = new Set((collabs || []).map(c => c.receiver_id));

      return {
        totalCampaigns,
        activeCampaigns,
        totalCreators: distinctCreators.size,
        campaignsGrowth: '0%',
        creatorsGrowth: '0%',
        budgetGrowth: '0%'
      };
    }

    // MongoDB Fallback
    try {
      const bId = mongoose.Types.ObjectId.isValid(brandId) ? new mongoose.Types.ObjectId(brandId) : brandId;

      const campaignsStats = await Campaign.aggregate([
        { $match: { brand_id: bId } },
        {
          $group: {
            _id: null,
            totalCampaigns: { $sum: 1 },
            activeCampaigns: {
              $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] }
            }
          }
        }
      ]);

      const creatorsCount = await Collaboration.distinct('receiver_id', {
        sender_id: bId,
        status: 'accepted'
      });

      const stats = campaignsStats[0] || { totalCampaigns: 0, activeCampaigns: 0 };

      return {
        totalCampaigns: stats.totalCampaigns,
        activeCampaigns: stats.activeCampaigns,
        totalCreators: creatorsCount.length,
        campaignsGrowth: '0%',
        creatorsGrowth: '0%',
        budgetGrowth: '0%'
      };
    } catch {
      return { totalCampaigns: 0, activeCampaigns: 0, totalCreators: 0 };
    }
  },

  async getCreatorStats(creatorId) {
    if (isSupabaseActive()) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', creatorId)
        .single();

      if (!profile) return null;

      const { data: cp } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', creatorId)
        .single();

      // Aggregate earnings
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount')
        .eq('recipient_id', creatorId)
        .eq('status', 'paid');

      const earnings = (txs || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      // Aggregate applications
      const { count: activeApps } = await supabase
        .from('campaign_applications')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('status', 'approved');

      const instagramSocial = profile.socials?.instagram || {};
      const isConnected = instagramSocial.verified === true;

      return {
        username: profile.name,
        followers: cp?.followers || 0,
        followersGrowth: '0%',
        engagement: cp?.engagement_rate || 0,
        engagementGrowth: '0%',
        earnings,
        earningsGrowth: '0%',
        growthScore: cp?.growth_score || 0,
        activeApplications: activeApps || 0,
        instagram: {
          username: instagramSocial.username || cp?.username || null,
          profileLink: instagramSocial.url || cp?.website || null,
          followers: cp?.followers || 0,
          engagementRate: cp?.engagement_rate || 0,
          isConnected: isConnected
        }
      };
    }

    // MongoDB Fallback
    try {
      const user = await User.findById(creatorId);
      if (!user) return null;

      const profile = await CreatorProfile.findOne({ user_id: creatorId });

      let earnings = 0;
      if (mongoose.Types.ObjectId.isValid(creatorId)) {
        const earningsAgg = await Transaction.aggregate([
          { $match: { recipient_id: new mongoose.Types.ObjectId(creatorId), status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        earnings = earningsAgg[0] ? earningsAgg[0].total : 0;
      }

      const activeApplications = await CampaignApplication.countDocuments({
        creator_id: creatorId,
        status: 'approved'
      });

      const instagramSocial = user.socials?.instagram || {};
      const isConnected = instagramSocial.verified === true;

      return {
        username: user.name,
        followers: profile?.followers || 0,
        followersGrowth: '0%',
        engagement: profile?.engagement_rate || 0,
        engagementGrowth: '0%',
        earnings,
        earningsGrowth: '0%',
        growthScore: profile?.growthScore || 0,
        activeApplications,
        instagram: {
          username: instagramSocial.username || profile?.username || null,
          profileLink: instagramSocial.url || profile?.website || null,
          followers: profile?.followers || 0,
          engagementRate: profile?.engagement_rate || 0,
          isConnected: isConnected
        }
      };
    } catch {
      return null;
    }
  }
};

module.exports = Dashboard;
