const User = require('../auth/models');
const Campaign = require('../market/models');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password_hash -resetToken -resetTokenExpiry');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isBlocked = !user.isBlocked;
    user.isSuspended = user.isBlocked; // Sync isSuspended flag
    await user.save();
    
    res.json({ success: true, message: `User ${user.isBlocked ? 'blocked/suspended' : 'unblocked'} successfully` });
  } catch (error) {
    next(error);
  }
};

const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find().populate('brand_id', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

const getLeads = async (req, res, next) => {
  try {
    // Check if Leads model exists, otherwise return empty
    let leads = [];
    try {
      const mongoose = require('mongoose');
      if (mongoose.modelNames().includes('Lead')) {
        const Lead = mongoose.model('Lead');
        leads = await Lead.find().sort({ createdAt: -1 });
      }
    } catch (e) {
      // Model doesn't exist yet — return empty array
    }
    res.json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, deleteUser, blockUser, getCampaigns, getLeads };
