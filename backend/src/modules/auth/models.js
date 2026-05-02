const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String, required: true },
    role: { 
    type: String, 
    enum: ["brand", "creator", "admin"], 
    default: "creator" 
  },
  isBlocked: { type: Boolean, default: false },
  socialHandle: { type: String },
  verificationStatus: {
    type: String,
    enum: ["not_submitted", "pending", "verified", "rejected"],
    default: "not_submitted"
  },
  verificationScreenshot: { type: String },
  verificationCode: { type: String },
  integrations: {
    type: Map,
    of: Boolean,
    default: {}
  },
  instagram: {
    username: { type: String },
    profileLink: { type: String },
    followers: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    isConnected: { type: Boolean, default: false }
  },
  // Legacy fields (optional: keeping for compatibility during transition)
  instagramConnected: { type: Boolean, default: false },
  followers: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
