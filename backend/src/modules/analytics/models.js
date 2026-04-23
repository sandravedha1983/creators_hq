const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followers: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  growthScore: { type: Number, default: 0 },
  historicalData: [{
    date: { type: Date, default: Date.now },
    followers: Number,
    engagement: Number,
    earnings: Number
  }],
  lastUpdated: { type: Date, default: Date.now },
  instagramData: {
    username: String,
    followers: Number,
    engagement: Number,
    connected: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema);
