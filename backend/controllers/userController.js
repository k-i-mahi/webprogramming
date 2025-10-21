const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const { name, email, avatar, latitude, longitude, role } = req.body;
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if user is updating their own profile or is admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Not authorized to update this user'
      });
    }

    // Prepare update data
    const updateData = { name, email, avatar };
    
    // Add location if provided
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
    }

    // Only admin can change role
    if (role && req.user.role === 'admin') {
      updateData.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
