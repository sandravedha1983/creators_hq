const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
    role: { 
    type: String, 
    enum: ["brand", "creator", "admin"], 
    default: "creator" 
  },
  otp: { type: String },
  otp_expiry: { type: Date },
  last_otp_resend: { type: Date },
  socialHandle: { type: String },
  verificationStatus: {
    type: String,
    enum: ["not_submitted", "pending", "verified", "rejected"],
    default: "not_submitted"
  },
  verificationScreenshot: { type: String },
  verificationCode: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
