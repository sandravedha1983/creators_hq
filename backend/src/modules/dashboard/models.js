const Dashboard = {
  async getBrandStats(brandId, client) {
    const { data: campaigns, error: campaignsError } = await client
      .from('campaigns')
      .select('id, status')
      .eq('brand_id', brandId);
    if (campaignsError) throw campaignsError;

    const { data: collaborations, error: collaborationsError } = await client
      .from('collaborations')
      .select('receiver_id')
      .eq('sender_id', brandId)
      .eq('status', 'accepted');
    if (collaborationsError) throw collaborationsError;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(campaign => campaign.status === 'open').length,
      totalCreators: new Set(collaborations.map(collaboration => collaboration.receiver_id)).size,
      campaignsGrowth: '0%',
      creatorsGrowth: '0%',
      budgetGrowth: '0%'
    };
  },

  async getCreatorStats(creatorId, client) {
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('name, socials')
      .eq('id', creatorId)
      .single();
    if (profileError) throw profileError;

    const { data: creatorProfile, error: creatorProfileError } = await client
      .from('creator_profiles')
      .select('username, website, followers, engagement_rate, growth_score')
      .eq('user_id', creatorId)
      .maybeSingle();
    if (creatorProfileError) throw creatorProfileError;

    const { data: transactions, error: transactionsError } = await client
      .from('transactions')
      .select('amount')
      .eq('recipient_id', creatorId)
      .eq('status', 'paid');
    if (transactionsError) throw transactionsError;

    const { count: activeApplications, error: applicationsError } = await client
      .from('campaign_applications')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId)
      .eq('status', 'approved');
    if (applicationsError) throw applicationsError;

    const instagramSocial = profile.socials?.instagram || {};
    const isConnected = instagramSocial.verified === true;
    const earnings = transactions.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

    return {
      username: profile.name,
      followers: creatorProfile?.followers || 0,
      followersGrowth: '0%',
      engagement: creatorProfile?.engagement_rate || 0,
      engagementGrowth: '0%',
      earnings,
      earningsGrowth: '0%',
      growthScore: creatorProfile?.growth_score || 0,
      activeApplications: activeApplications || 0,
      instagram: {
        username: instagramSocial.username || creatorProfile?.username || null,
        profileLink: instagramSocial.url || creatorProfile?.website || null,
        followers: creatorProfile?.followers || 0,
        engagementRate: creatorProfile?.engagement_rate || 0,
        isConnected
      }
    };
  }
};

module.exports = Dashboard;
