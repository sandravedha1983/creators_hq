const mongoose = require('mongoose');

const creatorProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  niche: { type: String, required: true },
  bio: { type: String },
  location: { type: String },
  followers: { type: Number, default: 0 },
  engagement_rate: { type: Number, default: 0 }
}, { timestamps: true });

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
