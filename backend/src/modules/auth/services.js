const bcrypt = require('bcrypt');
const User = require('./models');

const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) throw new Error('User already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = new User({ 
    name, 
    email, 
    password_hash: passwordHash, 
    role,
    isVerified: false
  });
  return await user.save();
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid email or password');

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Invalid email or password');

  return user;
};

const getProfile = async (id) => {
  const user = await User.findById(id).lean();
  return user;
};

module.exports = { register, login, getProfile };
