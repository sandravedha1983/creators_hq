const User = require('../auth/models');
const Campaign = require('../market/models');
const { supabase } = require('../../config/supabase');

const isSupabaseActive = () => {
  return supabase && process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('dummy-creatorshq');
};

const getAllUsers = async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          is_verified,
          is_blocked,
          is_suspended,
          social_handle,
          avatar,
          plan,
          is_onboarded,
          verification_status,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, data: profiles || [] });
    }

    // MongoDB Fallback
    const users = await User.find().select('-password_hash -resetToken -resetTokenExpiry');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isSupabaseActive()) {
      // Delete from Supabase Auth admin (cascades to profile and sub-profiles)
      const { error: authErr } = await supabase.auth.admin.deleteUser(id);
      if (authErr) {
        // Attempt deleting from profiles table directly
        await supabase.from('profiles').delete().eq('id', id);
      }
      return res.json({ success: true, message: 'User deleted successfully' });
    }

    // MongoDB Fallback
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

    if (isSupabaseActive()) {
      const { data: profile, error: fetchErr } = await supabase
        .from('profiles')
        .select('is_blocked, is_suspended')
        .eq('id', id)
        .single();

      if (fetchErr || !profile) return res.status(404).json({ message: 'User not found' });

      const newBlocked = !profile.is_blocked;
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ is_blocked: newBlocked, is_suspended: newBlocked })
        .eq('id', id);

      if (updateErr) throw updateErr;

      return res.json({
        success: true,
        message: `User ${newBlocked ? 'blocked/suspended' : 'unblocked'} successfully`
      });
    }

    // MongoDB Fallback
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBlocked = !user.isBlocked;
    user.isSuspended = user.isBlocked;
    await user.save();

    res.json({ success: true, message: `User ${user.isBlocked ? 'blocked/suspended' : 'unblocked'} successfully` });
  } catch (error) {
    next(error);
  }
};

const getCampaigns = async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          brand_id,
          title,
          description,
          budget,
          niche,
          status,
          created_at,
          brand:brand_id(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, data: campaigns || [] });
    }

    // MongoDB Fallback
    const campaigns = await Campaign.find().populate('brand_id', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

const getLeads = async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          id,
          user_id,
          name,
          email,
          phone,
          company,
          status,
          value,
          created_at,
          user:user_id(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, data: leads || [] });
    }

    // MongoDB Fallback
    let leads = [];
    try {
      const mongoose = require('mongoose');
      if (mongoose.modelNames().includes('Lead')) {
        const Lead = mongoose.model('Lead');
        leads = await Lead.find().sort({ createdAt: -1 });
      }
    } catch (e) {
      // Ignored
    }
    res.json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, deleteUser, blockUser, getCampaigns, getLeads };
