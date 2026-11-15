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
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete the currently signed-in Admin account.' });
    }
    const { data: target, error: targetError } = await supabase
      .from('profiles')
      .select('id, role, is_blocked')
      .eq('id', req.params.id)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (target.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deleted from user management.' });
    }
    const { data: documents, error: documentsError } = await supabase
      .from('verification_documents')
      .select('storage_path')
      .eq('user_id', target.id);
    if (documentsError) throw documentsError;

    const { error: auditError } = await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'admin_user_delete_attempted',
      entity_type: 'profile',
      entity_id: target.id,
      details: { target_user_id: target.id, target_role: target.role }
    });
    if (auditError) throw auditError;

    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    let documentCleanupComplete = true;
    if (documents?.length) {
      const { error: storageError } = await supabase.storage
        .from('verification_docs')
        .remove(documents.map(document => document.storage_path));
      if (storageError) {
        documentCleanupComplete = false;
        console.error('[ADMIN USER DOCUMENT CLEANUP ERROR]', storageError.message);
      }
    }
    const { error: completedAuditError } = await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'admin_user_deleted',
      entity_type: 'profile',
      entity_id: target.id,
      details: { target_user_id: target.id, target_role: target.role, completed: true }
    });
    if (completedAuditError) throw completedAuditError;
    return res.json({
      success: true,
      message: documentCleanupComplete
        ? 'User deleted successfully'
        : 'User deleted, but private verification document cleanup requires follow-up.',
      data: { documentCleanupComplete }
    });
  } catch (error) {
    return next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot block or suspend the currently signed-in Admin account.' });
    }
    const { data: profile, error } = await supabase.rpc('set_account_block_status', {
      p_actor_id: req.user.id,
      p_target_id: req.params.id
    });
    if (error) {
      const message = error.message?.toLowerCase() || '';
      if (message.includes('user not found')) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (message.includes('admin accounts cannot be blocked') || message.includes('cannot block their own')) {
        return res.status(403).json({ success: false, message: error.message });
      }
      throw error;
    }
    return res.json({
      success: true,
      message: `User ${profile.is_blocked ? 'blocked' : 'unblocked'} successfully`,
      data: { id: profile.id, is_blocked: profile.is_blocked, is_suspended: profile.is_suspended }
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
