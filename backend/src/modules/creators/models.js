const mongoose = require('mongoose');

const creatorProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String, trim: true, default: '' },
  avatar: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  bio: { type: String, default: '' },
  niche: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  goals: { type: String, default: '' },
  // Social stats (manually entered or pulled from integrations)
  followers: { type: Number, default: 0 },
  engagement_rate: { type: Number, default: 0 },
  // Computed score (updated on profile save)
  growthScore: { type: Number, default: 0 },
  // Social links (mirrors User.socials for convenience)
  socialLinks: {
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    tiktok: { type: String, default: '' }
  }
}, { timestamps: true });

// Static search helper (unchanged for backwards compat)
creatorProfileSchema.statics.search = function({ category, minFollowers, maxFollowers, minEngagement, limit = 10, offset = 0 }) {
  const query = {};
  if (category) query.niche = category;
  if (minFollowers || maxFollowers) {
    query.followers = {};
    if (minFollowers) query.followers.$gte = minFollowers;
    if (maxFollowers) query.followers.$lte = maxFollowers;
  }
  if (minEngagement) query.engagement_rate = { $gte: minEngagement };
  return this.find(query).limit(limit).skip(offset);
};

module.exports = mongoose.model('CreatorProfile', creatorProfileSchema);
