const mongoose = require('mongoose');

const aiGenerationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['caption', 'bio', 'pitch', 'hashtags', 'script', 'email', 'idea'],
    required: true
  },
  prompt: { type: String, required: true },
  output: { type: String, required: true },
  tokens_used: { type: Number, default: 0 },
  model: { type: String, default: 'gpt-4o-mini' }
}, { timestamps: true });

module.exports = mongoose.model('AiGeneration', aiGenerationSchema);
