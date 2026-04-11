const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected", "completed"], 
    default: "pending" 
  }
}, { timestamps: true });

collaborationSchema.statics.getByBrand = function(brandId) {
  return this.find({ sender_id: brandId });
};

collaborationSchema.statics.getByCreator = function(creatorId) {
  return this.find({ receiver_id: creatorId });
};

collaborationSchema.statics.updateStatus = function(id, status) {
  return this.findByIdAndUpdate(id, { status }, { new: true });
};

module.exports = mongoose.model('Collaboration', collaborationSchema);
