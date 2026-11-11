const getProfile = async (req, res, next) => {
  try {
    const { data: profile, error } = await req.supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    if (!profile) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: profile });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'avatar', 'is_onboarded', 'social_handle'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const { data: profile, error } = await req.supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error) throw error;
    if (!profile) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: profile });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getProfile, updateProfile };
