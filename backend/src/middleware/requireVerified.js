const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'User not authenticated.' });
  }
  if (req.user.role === 'admin') return next();
  if (
    req.user.verificationStatus !== 'verified' ||
    !req.user.isVerified ||
    req.user.isSuspended ||
    req.user.isBlocked
  ) {
    return res.status(403).json({
      success: false,
      code: 'VERIFICATION_REQUIRED',
      message: 'Account verification is required to perform this action.'
    });
  }
  return next();
};

module.exports = { requireVerified };
