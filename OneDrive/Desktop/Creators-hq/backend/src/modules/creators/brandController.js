const BrandProfile = require('./brandModel');
const { supabase } = require('../../config/supabase');

const isSupabaseActive = () => {
  return supabase && process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('dummy-creatorshq');
};

// GET /api/brands/profile — own brand profile
const getMyBrandProfile = async (req, res, next) => {
  try {
    if (isSupabaseActive()) {
      let { data: profile, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (!profile) {
        const { data: created, error: createErr } = await supabase
          .from('brand_profiles')
          .insert({ user_id: req.user.id })
          .select()
          .single();
        if (createErr) throw createErr;
        profile = created;
      }
      return res.json({ success: true, data: profile });
    }

    // MongoDB Fallback
    const profile = await BrandProfile.findOne({ user_id: req.user.id });
    res.json({ success: true, data: profile || null });
  } catch (err) {
    next(err);
  }
};

// PUT /api/brands/profile — upsert brand profile
const updateMyBrandProfile = async (req, res, next) => {
  try {
    const allowed = ['companyName', 'company_name', 'logo', 'website', 'industry', 'location', 'description', 'objectives', 'budget'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (isSupabaseActive()) {
      const pgUpdates = {
        user_id: req.user.id,
        company_name: updates.company_name || updates.companyName || '',
        logo: updates.logo || '',
        website: updates.website || '',
        industry: updates.industry || '',
        location: updates.location || '',
        description: updates.description || '',
        objectives: updates.objectives || '',
        budget: updates.budget || ''
      };

      const { data: profile, error } = await supabase
        .from('brand_profiles')
        .upsert(pgUpdates, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, data: profile });
    }

    // MongoDB Fallback
    const profile = await BrandProfile.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: updates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyBrandProfile, updateMyBrandProfile };
