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

const saveInstagramData = async (req, res, next) => {
  try {
    const { profileLink, followers, engagementRate } = req.body;
    
    if (!profileLink) {
      return res.status(400).json({ success: false, message: 'Profile link is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Extract username from link (e.g. https://instagram.com/username)
    let username = 'creator';
    try {
      const url = new URL(profileLink);
      username = url.pathname.replace(/\//g, '') || 'creator';
    } catch (e) {
      username = profileLink.split('/').filter(Boolean).pop() || 'creator';
    }

    user.instagram = {
      username,
      profileLink,
      followers: parseInt(followers) || 0,
      engagementRate: parseFloat(engagementRate) || 0,
      isConnected: true
    };

    // Keep integrations map in sync
    if (!user.integrations) user.integrations = new Map();
    user.integrations.set('instagram', true);

    // Update legacy fields for backward compatibility
    user.instagramConnected = true;
    user.followers = parseInt(followers) || 0;
    user.engagement = parseFloat(engagementRate) || 0;

    await user.save();

    res.json({ success: true, message: 'Instagram linked successfully', data: user.instagram });
  } catch (error) {
    next(error);
  }
};

module.exports = { connectPlatform, getIntegrations, saveInstagramData };
