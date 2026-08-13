const CreatorProfile = require('./models');
const User = require('../auth/models');

/**
 * Calculate Growth Score based on profile completeness + verified socials.
 * Max 100 points:
 *   Profile fields  = up to 50pts (bio 10, niche 10, location 8, website 8, avatar 8, goals 6)
 *   Verified socials = up to 40pts (10 per verified platform)
 *   Followers bonus  = up to 10pts
 */
const calcGrowthScore = (profile, user) => {
  let score = 0;

  // Profile completeness
  if (profile.bio && profile.bio.length > 10) score += 10;
  if (profile.niche) score += 10;
  if (profile.location) score += 8;
  if (profile.website) score += 8;
  if (profile.avatar || user.avatar) score += 8;
  if (profile.goals) score += 6;

  // Verified socials
  const socials = user.socials || {};
  ['instagram', 'youtube', 'twitter', 'linkedin'].forEach(platform => {
    if (socials[platform] && socials[platform].verified) score += 10;
  });

  // Followers bonus (rough tiers)
  if (profile.followers >= 100000) score += 10;
  else if (profile.followers >= 10000) score += 6;
  else if (profile.followers >= 1000) score += 3;

  return Math.min(score, 100);
};

// GET /api/creators/profile — own profile
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await CreatorProfile.findOne({ user_id: req.user.id });
    res.json({ success: true, data: profile || null });
  } catch (err) {
    next(err);
  }
};

// PUT /api/creators/profile — upsert own profile
const updateMyProfile = async (req, res, next) => {
  try {
    const allowed = ['username', 'avatar', 'coverImage', 'bio', 'niche', 'location', 'website', 'goals', 'followers', 'engagement_rate', 'socialLinks'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Sync avatar to User model too if provided
    if (updates.avatar) {
      await User.findByIdAndUpdate(req.user.id, { avatar: updates.avatar });
    }

    // Upsert profile
    let profile = await CreatorProfile.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    // Recompute growth score
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

    // Update stored score
    await CreatorProfile.findByIdAndUpdate(profile._id, { growthScore: score });

    const breakdown = {
      bio: !!(profile.bio && profile.bio.length > 10),
      niche: !!profile.niche,
      location: !!profile.location,
      website: !!profile.website,
      avatar: !!(profile.avatar || user.avatar),
      goals: !!profile.goals,
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
const getPublicCreators = async (req, res, next) => {
  try {
    const { niche, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (niche) query.niche = { $regex: niche, $options: 'i' };

    let profiles = await CreatorProfile.find(query)
      .populate('user_id', 'name email avatar isVerified verificationStatus socials')
      .sort({ growthScore: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Filter by name search if provided
    if (search) {
      const s = search.toLowerCase();
      profiles = profiles.filter(p =>
        (p.user_id?.name || '').toLowerCase().includes(s) ||
        (p.niche || '').toLowerCase().includes(s) ||
        (p.username || '').toLowerCase().includes(s)
      );
    }

    const total = await CreatorProfile.countDocuments(query);
    res.json({ success: true, data: profiles, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyProfile, updateMyProfile, getGrowthScore, getPublicCreators };
