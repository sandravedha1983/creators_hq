const getMyBrandProfile = async (req, res, next) => {
  try {
    const { data: profile, error } = await req.supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (error) throw error;
    if (profile) return res.json({ success: true, data: profile });

    const { data: created, error: createError } = await req.supabase
      .from('brand_profiles')
      .insert({ user_id: req.user.id })
      .select()
      .single();
    if (createError) throw createError;
    return res.json({ success: true, data: created });
  } catch (error) {
    return next(error);
  }
};

const updateMyBrandProfile = async (req, res, next) => {
  try {
    const fields = {
      company_name: ['company_name', 'companyName'],
      logo: ['logo'],
      website: ['website'],
      industry: ['industry'],
      location: ['location'],
      description: ['description'],
      objectives: ['objectives'],
      budget: ['budget']
    };
    const updates = { user_id: req.user.id };
    for (const [column, aliases] of Object.entries(fields)) {
      const source = aliases.find(field => req.body[field] !== undefined);
      if (source) updates[column] = req.body[source];
    }

    const { data: profile, error } = await req.supabase
      .from('brand_profiles')
      .upsert(updates, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return res.json({ success: true, data: profile });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getMyBrandProfile, updateMyBrandProfile };
