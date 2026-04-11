const CreatorProfile = require('./models');

const searchCreators = async (req, res, next) => {
  try {
    const { category, minFollowers, maxFollowers, minEngagement, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const creators = await CreatorProfile.search({
      category,
      minFollowers: minFollowers ? parseInt(minFollowers) : null,
      maxFollowers: maxFollowers ? parseInt(maxFollowers) : null,
      minEngagement: minEngagement ? parseFloat(minEngagement) : null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      data: creators
    });
  } catch (error) {
    next(error);
  }
};

const getCreator = async (req, res, next) => {
  try {
    const data = await CreatorProfile.findById(req.params.id);
    if (!data) {
      const error = new Error("Creator not found");
      error.statusCode = 404;
      throw error;
    }
    res.json({ success: true, data: data });
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  try {
    const { user_id, niche, bio, location } = req.body;
    const data = await CreatorProfile.create({ user_id, niche, bio, location });
    res.status(201).json({ success: true, data: data });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchCreators, getCreator, createProfile };
