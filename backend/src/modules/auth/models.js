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
  isVerified: { type: Boolean, default: false },
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
  socials: {
    instagram: {
      url: { type: String },
      username: { type: String },
      code: { type: String },
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date }
    },
    twitter: {
      url: { type: String },
      username: { type: String },
      code: { type: String },
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date }
    },
    linkedin: {
      url: { type: String },
      username: { type: String },
      code: { type: String },
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date }
    },
    youtube: {
      url: { type: String },
      username: { type: String },
      code: { type: String },
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date }
    }
  },
  // Legacy compatibility fields
  integrations: {
    type: Map,
    of: Boolean,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
