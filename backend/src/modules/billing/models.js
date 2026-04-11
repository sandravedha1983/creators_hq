const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "paid" }
}, { timestamps: true });

transactionSchema.statics.getHistoryByUserId = function(userId) {
  return this.find({ 
    $or: [{ sender_id: userId }, { recipient_id: userId }] 
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Transaction', transactionSchema);
