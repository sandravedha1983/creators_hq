const CreatorProfile = require('./models');
const User = require('../auth/models');
const { supabase } = require('../../config/supabase');

const isSupabaseActive = () => {
  return supabase && process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('dummy-creatorshq');
};

/**
 * Calculate Growth Score based on profile completeness + verified socials + portfolio.
 * Max 100 points:
 *   Profile completeness  = up to 40pts (bio 8, niche 8, location 8, website 8, avatar 8)
 *   Portfolio & Goals     = up to 20pts (goals 10, portfolio items 10)
 *   Verified socials      = up to 30pts (7.5 per verified platform)
 *   Followers bonus       = up to 10pts
 */
const calcGrowthScore = (profile, userOrProfile) => {
  let score = 0;

  // Profile completeness
  if (profile.bio && profile.bio.length > 10) score += 8;
  if (profile.niche) score += 8;
  if (profile.location) score += 8;
  if (profile.website) score += 8;
  if (profile.avatar || userOrProfile?.avatar) score += 8;

  // Portfolio & Goals
  if (profile.goals) score += 10;
  if (profile.portfolio && profile.portfolio.length > 0) score += 10;

  // Verified socials
  const socials = userOrProfile?.socials || {};
  ['instagram', 'youtube', 'twitter', 'linkedin'].forEach(platform => {
    if (socials[platform] && socials[platform].verified) score += 7.5;
  });

  // Followers bonus
  const followers = Number(profile.followers) || 0;
  if (followers >= 100000) score += 10;
  else if (followers >= 10000) score += 6;
  else if (followers >= 1000) score += 3;

  return Math.min(Math.round(score), 100);
};

// GET /api/creators/profile — own profile
const getMyProfile = async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      let { data: profile, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (!profile) {
        // Create empty profile placeholder if not existing
        const { data: created, error: createError } = await supabase
          .from('creator_profiles')
          .insert({ user_id: req.user.id })
          .select()
          .single();
        if (createError) throw createError;
        profile = created;
      }

      return res.json({ success: true, data: profile });
    }

    // MongoDB Fallback
    let profile = await CreatorProfile.findOne({ user_id: req.user.id });
    if (!profile) {
      profile = await CreatorProfile.create({ user_id: req.user.id });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// PUT /api/creators/profile — upsert own profile
const updateMyProfile = async (req, res, next) => {
  try {
    const allowed = [
      'username', 'avatar', 'coverImage', 'cover_image', 'bio', 'niche', 'subCategories', 'sub_categories',
      'languages', 'contentTypes', 'content_types', 'location', 'website', 'goals',
      'collaborationPreferences', 'collaboration_preferences', 'preferredBrandCategories', 'preferred_brand_categories',
      'portfolio', 'followers', 'engagement_rate', 'socialLinks', 'social_links'
    ];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (isSupabaseActive()) {
      // Sync avatar to profiles table if updated
      const avatarVal = updates.avatar;
      if (avatarVal) {
        await supabase.from('profiles').update({ avatar: avatarVal }).eq('id', req.user.id);
      }

      // Format updates for PostgreSQL schema
      const pgUpdates = {
        user_id: req.user.id,
        username: updates.username || '',
        avatar: updates.avatar || '',
        cover_image: updates.cover_image || updates.coverImage || '',
        bio: updates.bio || '',
        niche: updates.niche || '',
        sub_categories: updates.sub_categories || updates.subCategories || [],
        languages: updates.languages || [],
        content_types: updates.content_types || updates.contentTypes || [],
        location: updates.location || '',
        website: updates.website || '',
        goals: updates.goals || '',
        collaboration_preferences: updates.collaboration_preferences || updates.collaborationPreferences || '',
        preferred_brand_categories: updates.preferred_brand_categories || updates.preferredBrandCategories || [],
        portfolio: updates.portfolio || [],
        followers: Number(updates.followers) || 0,
        engagement_rate: Number(updates.engagement_rate) || 0,
        social_links: updates.social_links || updates.socialLinks || {}
      };

      // Fetch user profile to calculate growth score
      const { data: userProf } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
      pgUpdates.growth_score = calcGrowthScore(pgUpdates, userProf);

      const { data: profile, error } = await supabase
        .from('creator_profiles')
        .upsert(pgUpdates, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data: profile });
    }

    // MongoDB Fallback
    if (updates.avatar) {
      await User.findByIdAndUpdate(req.user.id, { avatar: updates.avatar });
    }

    let profile = await CreatorProfile.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: updates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    const user = await User.findById(req.user.id);
    profile.growthScore = calcGrowthScore(profile, user);
    await profile.save();

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// GET /api/creators/growth-score
const getGrowthScore = async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: profile } = await supabase.from('creator_profiles').select('*').eq('user_id', req.user.id).single();
      const { data: userProf } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();

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

      const score = calcGrowthScore(profile, userProf);
      await supabase.from('creator_profiles').update({ growth_score: score }).eq('id', profile.id);

      const breakdown = {
        bio: !!(profile.bio && profile.bio.length > 10),
        niche: !!profile.niche,
        location: !!profile.location,
        website: !!profile.website,
        avatar: !!(profile.avatar || userProf?.avatar),
        goals: !!profile.goals,
        hasPortfolio: profile.portfolio && profile.portfolio.length > 0,
        verifiedSocials: ['instagram', 'youtube', 'twitter', 'linkedin'].filter(p => userProf?.socials?.[p]?.verified),
        followers: profile.followers,
        insufficientData: score === 0
      };

      return res.json({ success: true, score, breakdown });
    }

    // MongoDB Fallback
    const profile = await CreatorProfile.findOne({ user_id: req.user.id });
    const user = await User.findById(req.user.id);

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

    const score = calcGrowthScore(profile, user);
    await CreatorProfile.findByIdAndUpdate(profile._id, { growthScore: score });

    const breakdown = {
      bio: !!(profile.bio && profile.bio.length > 10),
      niche: !!profile.niche,
      location: !!profile.location,
      website: !!profile.website,
      avatar: !!(profile.avatar || user.avatar),
      goals: !!profile.goals,
      hasPortfolio: profile.portfolio && profile.portfolio.length > 0,
      verifiedSocials: ['instagram', 'youtube', 'twitter', 'linkedin'].filter(p => user.socials?.[p]?.verified),
      followers: profile.followers,
      insufficientData: score === 0
    };

    res.json({ success: true, score, breakdown });
  } catch (err) {
    next(err);
  }
};

// GET /api/creators/public — creator discovery for brands
// SANITIZED: Never leaks creator email address. Reliable server-side pagination.
const getPublicCreators = async (req, res, next) => {
  try {
    const { niche, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    if (isSupabaseActive()) {
      let query = supabase
        .from('public_creator_profiles')
        .select('user_id, username, avatar, niche', { count: 'exact' });

      if (niche && niche !== 'all') {
        query = query.ilike('niche', `%${niche}%`);
      }

      if (search) {
        query = query.or(`niche.ilike.%${search}%,username.ilike.%${search}%`);
      }

      query = query
        .order('username', { ascending: true })
        .range(offset, offset + limitNum - 1);

      const { data: profiles, error, count } = await query;
      if (error) throw error;

      return res.json({
        success: true,
        data: profiles || [],
        total: count || 0,
        page: pageNum,
        limit: limitNum
      });
    }

    // Match the narrow public Supabase view; do not populate user/profile fields.
    const query = {};
    if (niche && niche !== 'all') query.niche = { $regex: niche, $options: 'i' };
    if (search) {
      query.$or = [
        { niche: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await CreatorProfile.countDocuments(query);
    const profiles = await CreatorProfile.find(query)
      .select('user_id username avatar niche')
      .sort({ username: 1 })
      .skip(offset)
      .limit(limitNum);

    res.json({
      success: true,
      data: profiles.map(profile => ({
        user_id: String(profile.user_id),
        username: profile.username,
        avatar: profile.avatar,
        niche: profile.niche
      })),
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyProfile, updateMyProfile, getGrowthScore, getPublicCreators };
