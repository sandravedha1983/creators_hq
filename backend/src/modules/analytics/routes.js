const express = require('express');
const { authenticate } = require('../../middleware/auth');
const router = express.Router();

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const client = req.supabase;
    const [
      { data: profile, error: profileError },
      { count: totalLeads, error: leadsError },
      { count: hotLeads, error: hotLeadsError },
      { count: totalApplications, error: applicationsError },
      { count: approvedApplications, error: approvedError },
      { data: transactions, error: transactionsError }
    ] = await Promise.all([
      client.from('creator_profiles').select('followers, engagement_rate, growth_score').eq('user_id', userId).maybeSingle(),
      client.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'Hot'),
      client.from('campaign_applications').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
      client.from('campaign_applications').select('*', { count: 'exact', head: true }).eq('creator_id', userId).eq('status', 'approved'),
      client.from('transactions').select('amount').eq('recipient_id', userId).eq('status', 'paid')
    ]);

    const queryError = [profileError, leadsError, hotLeadsError, applicationsError, approvedError, transactionsError].find(Boolean);
    if (queryError) throw queryError;

    return res.json({
      success: true,
      data: {
        followers: profile?.followers || 0,
        engagementRate: profile?.engagement_rate || 0,
        growthScore: profile?.growth_score || 0,
        totalLeads: totalLeads || 0,
        hotLeads: hotLeads || 0,
        totalApplications: totalApplications || 0,
        approvedApplications: approvedApplications || 0,
        totalEarnings: (transactions || []).reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0)
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/campaign/:id', authenticate, async (req, res, next) => {
  try {
    const { data: campaign, error: campaignError } = await req.supabase
      .from('campaigns')
      .select('id, brand_id, title, budget, status')
      .eq('id', req.params.id)
      .maybeSingle();
    if (campaignError) throw campaignError;
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    if (req.user.role !== 'admin' && campaign.brand_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { count: applicationsCount, error: applicationsError } = await req.supabase
      .from('campaign_applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
    const { count: approvedCount, error: approvedError } = await req.supabase
      .from('campaign_applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('status', 'approved');
    if (applicationsError) throw applicationsError;
    if (approvedError) throw approvedError;

    return res.json({
      success: true,
      data: {
        id: campaign.id,
        title: campaign.title,
        budget: campaign.budget,
        totalApplications: applicationsCount || 0,
        approvedApplications: approvedCount || 0,
        status: campaign.status
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/creator/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { data: profile, error } = await req.supabase
      .from('creator_profiles')
      .select('user_id, username, niche, followers, engagement_rate, growth_score')
      .eq('user_id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!profile) return res.status(404).json({ success: false, message: 'Creator profile not found' });

    const { data: account, error: accountError } = await req.supabase
      .from('profiles')
      .select('name')
      .eq('id', profile.user_id)
      .single();
    if (accountError) throw accountError;

    return res.json({
      success: true,
      data: {
        id: profile.user_id,
        name: account.name,
        niche: profile.niche,
        followers: profile.followers,
        engagementRate: profile.engagement_rate,
        growthScore: profile.growth_score
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
