const { createPublicClient } = require('../../config/supabase');

const calcGrowthScore = (profile, account) => {
  let score = 0;
  if (profile.bio && profile.bio.length > 10) score += 8;
  if (profile.niche) score += 8;
  if (profile.location) score += 8;
  if (profile.website) score += 8;
  if (profile.avatar || account?.avatar) score += 8;
  if (profile.goals) score += 10;
  if (profile.portfolio && profile.portfolio.length > 0) score += 10;

  const socials = account?.socials || {};
  ['instagram', 'youtube', 'twitter', 'linkedin'].forEach(platform => {
    if (socials[platform]?.verified) score += 7.5;
  });

  const followers = Number(profile.followers) || 0;
  if (followers >= 100000) score += 10;
  else if (followers >= 10000) score += 6;
  else if (followers >= 1000) score += 3;
  return Math.min(Math.round(score), 100);
};

const getMyProfile = async (req, res, next) => {
  try {
    const { data: existing, error } = await req.supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (error) throw error;

    if (existing) return res.json({ success: true, data: existing });
    const { data: created, error: createError } = await req.supabase
      .from('creator_profiles')
      .insert({ user_id: req.user.id })
      .select()
      .single();
    if (createError) throw createError;
    return res.json({ success: true, data: created });
  } catch (error) {
    return next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const allowed = [
      'username', 'avatar', 'coverImage', 'cover_image', 'bio', 'niche', 'subCategories', 'sub_categories',
      'languages', 'contentTypes', 'content_types', 'location', 'website', 'goals',
      'collaborationPreferences', 'collaboration_preferences', 'preferredBrandCategories', 'preferred_brand_categories',
      'portfolio', 'followers', 'engagement_rate', 'socialLinks', 'social_links'
    ];
    const supplied = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) supplied[field] = req.body[field];
    }

    const { data: existing, error: existingError } = await req.supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (existingError) throw existingError;

    const profileUpdates = { user_id: req.user.id };
    const fields = {
      username: 'username',
      avatar: 'avatar',
      cover_image: 'cover_image',
      bio: 'bio',
      niche: 'niche',
      sub_categories: 'sub_categories',
      languages: 'languages',
      content_types: 'content_types',
      location: 'location',
      website: 'website',
      goals: 'goals',
      collaboration_preferences: 'collaboration_preferences',
      preferred_brand_categories: 'preferred_brand_categories',
      portfolio: 'portfolio',
      followers: 'followers',
      engagement_rate: 'engagement_rate',
      social_links: 'social_links'
    };
    const aliases = {
      cover_image: ['cover_image', 'coverImage'],
      sub_categories: ['sub_categories', 'subCategories'],
      content_types: ['content_types', 'contentTypes'],
      collaboration_preferences: ['collaboration_preferences', 'collaborationPreferences'],
      preferred_brand_categories: ['preferred_brand_categories', 'preferredBrandCategories'],
      social_links: ['social_links', 'socialLinks']
    };

    for (const [column, field] of Object.entries(fields)) {
      const sourceFields = aliases[column] || [field];
      const source = sourceFields.find(key => supplied[key] !== undefined);
      if (source !== undefined) profileUpdates[column] = supplied[source];
    }
    if (profileUpdates.followers !== undefined) profileUpdates.followers = Number(profileUpdates.followers) || 0;
    if (profileUpdates.engagement_rate !== undefined) profileUpdates.engagement_rate = Number(profileUpdates.engagement_rate) || 0;

    const { data: account, error: accountError } = await req.supabase
      .from('profiles')
      .select('avatar, socials')
      .eq('id', req.user.id)
      .single();
    if (accountError) throw accountError;

    if (profileUpdates.avatar) {
      const { error: avatarError } = await req.supabase
        .from('profiles')
        .update({ avatar: profileUpdates.avatar })
        .eq('id', req.user.id);
      if (avatarError) throw avatarError;
    }

    const mergedProfile = { ...existing, ...profileUpdates };
    profileUpdates.growth_score = calcGrowthScore(mergedProfile, {
      ...account,
      avatar: profileUpdates.avatar || account.avatar
    });

    const { data: profile, error } = await req.supabase
      .from('creator_profiles')
      .upsert(profileUpdates, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return res.json({ success: true, data: profile });
  } catch (error) {
    return next(error);
  }
};

const getGrowthScore = async (req, res, next) => {
  try {
    const [
      { data: profile, error: profileError },
      { data: account, error: accountError }
    ] = await Promise.all([
      req.supabase.from('creator_profiles').select('*').eq('user_id', req.user.id).maybeSingle(),
      req.supabase.from('profiles').select('avatar, socials').eq('id', req.user.id).single()
    ]);
    if (profileError) throw profileError;
    if (accountError) throw accountError;

    if (!profile) {
      return res.json({
        success: true,
        score: 0,
        breakdown: {
          message: 'Complete your profile to get a Growth Score.',
          insufficientData: true
        }
      });
    }

    const score = calcGrowthScore(profile, account);
    const { error: updateError } = await req.supabase
      .from('creator_profiles')
      .update({ growth_score: score })
      .eq('user_id', req.user.id);
    if (updateError) throw updateError;

    const breakdown = {
      bio: !!(profile.bio && profile.bio.length > 10),
      niche: !!profile.niche,
      location: !!profile.location,
      website: !!profile.website,
      avatar: !!(profile.avatar || account.avatar),
      goals: !!profile.goals,
      hasPortfolio: profile.portfolio && profile.portfolio.length > 0,
      verifiedSocials: ['instagram', 'youtube', 'twitter', 'linkedin'].filter(platform => account.socials?.[platform]?.verified),
      followers: profile.followers,
      insufficientData: score === 0
    };
    return res.json({ success: true, score, breakdown });
  } catch (error) {
    return next(error);
  }
};

const getPublicCreators = async (req, res, next) => {
  try {
    const { niche, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = createPublicClient()
      .from('public_creator_profiles')
      .select('user_id, username, avatar, niche', { count: 'exact' });

    if (niche && niche !== 'all') query = query.ilike('niche', `%${niche}%`);
    if (search) query = query.or(`niche.ilike.%${search}%,username.ilike.%${search}%`);

    const { data: profiles, error, count } = await query
      .order('username', { ascending: true })
      .range(offset, offset + limitNum - 1);
    if (error) throw error;
    return res.json({
      success: true,
      data: profiles || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getMyProfile, updateMyProfile, getGrowthScore, getPublicCreators, calcGrowthScore };
