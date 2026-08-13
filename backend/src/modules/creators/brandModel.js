const mongoose = require('mongoose');

const brandProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, trim: true, default: '' },
  logo: { type: String, default: '' },
  website: { type: String, default: '' },
  industry: { type: String, default: '' },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  objectives: { type: String, default: '' },
  budget: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('BrandProfile', brandProfileSchema);
