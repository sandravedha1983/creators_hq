const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ["active", "paused", "completed"], default: "active" },
  budget: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
