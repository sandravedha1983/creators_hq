const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  status: {
    type: String,
    enum: ['Hot', 'Warm', 'Cold'],
    default: 'Warm'
  },
  value: { type: String, default: '' },
  notes: { type: String, default: '' },
  source: { type: String, default: 'manual' }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
