const mongoose = require('mongoose');

const portfolioItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  link: { type: String, default: '' },
  image: { type: String, default: '' },
  platform: { type: String, default: 'web' }
}, { _id: true });

const creatorProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String, trim: true, default: '' },
  avatar: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  bio: { type: String, default: '' },
  niche: { type: String, default: '' },
  subCategories: [{ type: String }],
  languages: [{ type: String }],
  contentTypes: [{ type: String }],
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  goals: { type: String, default: '' },
  collaborationPreferences: { type: String, default: '' },
  preferredBrandCategories: [{ type: String }],
  portfolio: [portfolioItemSchema],
  // Social stats
  followers: { type: Number, default: 0 },
  engagement_rate: { type: Number, default: 0 },
  // Computed growth score
  growthScore: { type: Number, default: 0 },
  // Social links
  socialLinks: {
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    tiktok: { type: String, default: '' }
  }
}, { timestamps: true });

// Compound indexes for search optimization
creatorProfileSchema.index({ niche: 1, growthScore: -1 });
creatorProfileSchema.index({ followers: -1 });

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
