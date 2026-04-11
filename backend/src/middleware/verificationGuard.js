const User = require('../modules/auth/models');

const verificationGuard = async (req, res, next) => {
  try {
    // If not authenticated, let the auth middleware handle it later or handle it here
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Admins are exempt? Usually yes, but following user request strictly
    // Unless they have verified status, block dashboard
    if (user.verificationStatus !== 'verified') {
      return res.status(403).json({ 
        success: false, 
        message: 'Please complete verification to access this feature.',
        verificationStatus: user.verificationStatus
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verificationGuard };
