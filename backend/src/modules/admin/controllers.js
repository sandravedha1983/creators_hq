const { supabase } = require('../../config/supabase');

const getAllUsers = async (req, res, next) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, is_verified, is_blocked, is_suspended, social_handle, avatar, plan, is_onboarded, verification_status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data: profiles || [] });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('is_blocked')
      .eq('id', req.params.id)
      .single();

    if (fetchError?.code === 'PGRST116' || !profile) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (fetchError) throw fetchError;

    const isBlocked = !profile.is_blocked;
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: isBlocked, is_suspended: isBlocked })
      .eq('id', req.params.id);

    if (error) throw error;
    return res.json({
      success: true,
      message: `User ${isBlocked ? 'blocked/suspended' : 'unblocked'} successfully`
    });
  } catch (error) {
    return next(error);
  }
};

const getCampaigns = async (req, res, next) => {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, brand_id, title, description, budget, niche, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const brandIds = [...new Set((campaigns || []).map(campaign => campaign.brand_id))];
    const { data: brands, error: brandsError } = brandIds.length
      ? await supabase.from('profiles').select('id, name, email').in('id', brandIds)
      : { data: [], error: null };
    if (brandsError) throw brandsError;

    const profilesById = new Map((brands || []).map(profile => [profile.id, profile]));
    return res.json({
      success: true,
      data: (campaigns || []).map(campaign => ({
        ...campaign,
        brand: profilesById.get(campaign.brand_id) || null
      }))
    });
  } catch (error) {
    return next(error);
  }
};

const getLeads = async (req, res, next) => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, user_id, name, email, phone, company, status, value, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const userIds = [...new Set((leads || []).map(lead => lead.user_id))];
    const { data: users, error: usersError } = userIds.length
      ? await supabase.from('profiles').select('id, name, email, avatar, role').in('id', userIds)
      : { data: [], error: null };
    if (usersError) throw usersError;

    const profilesById = new Map((users || []).map(profile => [profile.id, profile]));
    return res.json({
      success: true,
      data: (leads || []).map(lead => ({ ...lead, user: profilesById.get(lead.user_id) || null }))
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAllUsers, deleteUser, blockUser, getCampaigns, getLeads };
