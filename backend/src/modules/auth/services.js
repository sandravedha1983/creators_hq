const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models');

const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) throw new Error('User already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationCode = `CREATORSHQ_${Math.floor(1000 + Math.random() * 9000)}`;
  
  const user = new User({ 
    name, 
    email, 
    password_hash: passwordHash, 
    role,
    verificationCode
  });
  return await user.save();
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).lean();
  if (!user) throw new Error('Invalid email or password');

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Invalid email or password');

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { 
    token, 
    user: { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      verificationStatus: user.verificationStatus,
      verificationCode: user.verificationCode
    } 
  };
};

const getProfile = async (id) => {
  const user = await User.findById(id).lean();
  return user;
};

module.exports = { register, login, getProfile };
