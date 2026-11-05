const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  budget: { type: String, required: true },
  niche: { type: String, default: '' },
  deliverables: { type: String, default: '' },
  requirements: { type: String, default: '' },
  deadline: { type: Date },
  image: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'open', 'paused', 'closed'],
    default: 'open'
  }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
