const User = require('../auth/models');

const Analytics = require('../analytics/models');

const connectPlatform = async (req, res, next) => {
  try {
    const { platform } = req.body;
    if (!platform) {
      return res.status(400).json({ success: false, message: 'Platform is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Initialize integrations if it doesn't exist (though default is {})
    if (!user.integrations) user.integrations = new Map();
    
    user.integrations.set(platform, true);

    if (platform === 'instagram') {
      user.instagramConnected = true;
      user.instagramUsername = 'creator_demo';
      user.followers = 15400;
      user.engagement = 4.8;

      // Also update/create analytics
      await Analytics.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          followers: 15400,
          engagement: 4.8,
          instagramData: {
            username: 'creator_demo',
            followers: 15400,
            engagement: 4.8,
            connected: true
          },
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    }

    await user.save();

    res.json({ success: true, message: `${platform} connected successfully` });
  } catch (error) {
    next(error);
  }
};

const getIntegrations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user.integrations || {} });
  } catch (error) {
    next(error);
  }
};

module.exports = { connectPlatform, getIntegrations };
