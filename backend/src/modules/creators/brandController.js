const BrandProfile = require('./brandModel');

// GET /api/brands/profile — own brand profile
const getMyBrandProfile = async (req, res, next) => {
  try {
    const profile = await BrandProfile.findOne({ user_id: req.user.id });
    res.json({ success: true, data: profile || null });
  } catch (err) {
    next(err);
  }
};

// PUT /api/brands/profile — upsert brand profile
const updateMyBrandProfile = async (req, res, next) => {
  try {
    const allowed = ['companyName', 'logo', 'website', 'industry', 'location', 'description', 'objectives', 'budget'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const profile = await BrandProfile.findOneAndUpdate(
      { user_id: req.user.id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyBrandProfile, updateMyBrandProfile };
