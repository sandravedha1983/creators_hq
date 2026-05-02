const User = require('../auth/models');

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

    if (!user.integrations) user.integrations = new Map();
    user.integrations.set(platform, true);
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
    const { profileLink } = req.body;
    
    if (!profileLink) {
      return res.status(400).json({ success: false, message: 'Profile link is required' });
    }

    // Basic validation
    if (!profileLink.includes('instagram.com')) {
      return res.status(400).json({ success: false, message: 'Invalid Instagram profile link' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Extract username from link
    let username = profileLink.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
    if (!username) {
       username = profileLink.split('/').filter(Boolean).pop();
    }

    user.instagram = {
      username: username || 'User',
      profileLink,
      isConnected: true
    };

    if (!user.integrations) user.integrations = new Map();
    user.integrations.set('instagram', true);

    await user.save();

    res.json({ success: true, message: 'Instagram linked successfully', data: user.instagram });
  } catch (error) {
    next(error);
  }
};

module.exports = { connectPlatform, getIntegrations, saveInstagramData };
