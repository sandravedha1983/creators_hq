const User = require('../auth/models');

const submitVerification = async (req, res, next) => {
  try {
    const { socialHandle } = req.body;
    const screenshot = req.file ? `/uploads/verification/${req.file.filename}` : req.body.screenshot;

    if (!socialHandle) {
      return res.status(400).json({ success: false, message: 'Social handle is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.socialHandle = socialHandle;
    user.verificationScreenshot = screenshot;
    user.verificationStatus = 'pending';
    await user.save();

    res.json({ 
      success: true, 
      message: 'Verification submitted. Awaiting approval',
      data: { status: user.verificationStatus }
    });
  } catch (error) {
    next(error);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fallback if code was not generated at registration
    if (!user.verificationCode) {
      user.verificationCode = `CREATORSHQ_${Math.floor(1000 + Math.random() * 9000)}`;
      await user.save();
    }

    res.json({
      success: true,
      data: {
        verificationStatus: user.verificationStatus,
        verificationCode: user.verificationCode,
        socialHandle: user.socialHandle
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(id, { verificationStatus: status }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: `Status updated to ${status}`, data: user });
  } catch (error) {
    next(error);
  }
};

const generateCode = async (req, res, next) => {
  try {
    const { profileLink } = req.body;
    if (!profileLink) {
      return res.status(400).json({ success: false, message: 'Profile link is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const code = `CRHQ_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    user.verificationCode = code;
    user.socialHandle = profileLink;
    await user.save();

    res.json({ success: true, code });
  } catch (error) {
    next(error);
  }
};

const checkVerification = async (req, res, next) => {
  try {
    const { profileLink, code } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    user.verificationStatus = 'verified';
    await user.save();

    res.json({ success: true, message: 'Verification successful' });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitVerification, getStatus, updateStatus, generateCode, checkVerification };
