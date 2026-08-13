const mongoose = require('mongoose');

const campaignApplicationSchema = new mongoose.Schema({
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Prevent duplicate applications from the same creator to the same campaign
campaignApplicationSchema.index({ campaign_id: 1, creator_id: 1 }, { unique: true });

module.exports = mongoose.model('CampaignApplication', campaignApplicationSchema);
