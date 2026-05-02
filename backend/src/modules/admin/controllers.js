const User = require('../auth/models');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password_hash');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Assuming blocking means setting a flag or changing role. 
    // Let's just use a role change for now or add a 'isBlocked' field if it existed.
    // The user just said "Block users". I'll add 'isBlocked' to User model if not there.
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isBlocked = !user.isBlocked;
    await user.save();
    
    res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, deleteUser, blockUser };
