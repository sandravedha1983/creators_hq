const bcrypt = require('bcrypt');
const User = require('./models');

const register = async ({ name, email, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();
  let existingUser;
  try {
    existingUser = await User.findOne({ email: normalizedEmail }).lean();
  } catch (dbError) {
    console.error("[DATABASE ERROR] MongoDB query failed during registration check:", dbError.message || dbError);
    const err = new Error("Internal database error occurred");
    err.status = 500;
    throw err;
  }
  
  if (existingUser) throw new Error('User already exists');

  let passwordHash;
  try {
    passwordHash = await bcrypt.hash(password, 10);
  } catch (hashError) {
    console.error("[AUTH ERROR] Password hashing failed:", hashError.message || hashError);
    const err = new Error("Internal registration processing error");
    err.status = 500;
    throw err;
  }
  
  const user = new User({ 
    name, 
    email: normalizedEmail, 
    password_hash: passwordHash, 
    role,
    isVerified: false
  });

  try {
    return await user.save();
  } catch (saveError) {
    console.error("[DATABASE ERROR] Failed to save new user:", saveError.message || saveError);
    const err = new Error("Internal database save failed");
    err.status = 500;
    throw err;
  }
};

const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  let user;
  try {
    user = await User.findOne({ email: normalizedEmail });
  } catch (dbError) {
    console.error("[DATABASE ERROR] MongoDB query failed during user lookup:", dbError.message || dbError);
    const err = new Error("Internal database error occurred");
    err.status = 500;
    throw err;
  }

  if (!user) throw new Error('Invalid email or password');

  let isValid;
  try {
    isValid = await bcrypt.compare(password, user.password_hash);
  } catch (hashError) {
    console.error("[AUTH ERROR] Password verification failed:", hashError.message || hashError);
    const err = new Error("Internal password verification error occurred");
    err.status = 500;
    throw err;
  }

  if (!isValid) throw new Error('Invalid email or password');

  return user;
};

const getProfile = async (id) => {
  const user = await User.findById(id).lean();
  return user;
};

module.exports = { register, login, getProfile };
