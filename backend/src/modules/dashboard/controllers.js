const dashboardModel = require('./models');

const getBrandDashboard = async (req, res, next) => {
  try {
    const stats = await dashboardModel.getBrandStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const getCreatorDashboard = async (req, res, next) => {
  try {
    const stats = await dashboardModel.getCreatorStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBrandDashboard, getCreatorDashboard };
