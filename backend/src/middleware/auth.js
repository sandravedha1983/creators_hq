const jwt = require('jsonwebtoken');
const User = require('../modules/auth/models');

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded.userId || decoded._id);
    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }
    if (user.isBlocked || user.isSuspended) {
      return res.status(403).json({ error: "Your account is suspended or blocked. Please contact support." });
    }
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      plan: user.plan
    };
    next();
  } catch (ex) {
    res.status(401).json({ error: "Invalid token." });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "User not authenticated." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden. Insufficient permissions." });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
