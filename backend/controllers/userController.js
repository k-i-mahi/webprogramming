const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');

    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Server error',
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
        message: 'User not found',
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      avatar,
      latitude,
      longitude,
      role,
      gender,
      dateOfBirth,
      profession,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Check if user is updating their own profile or is admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Not authorized to update this user',
      });
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Add location if provided
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
    }

    // Add new profile fields if provided
    if (gender !== undefined) {
      if (gender !== null && !['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({
          message: 'Gender must be male, female, other, or null',
        });
      }
      updateData.gender = gender;
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth !== null) {
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            message: 'Invalid date of birth',
          });
        }
        updateData.dateOfBirth = date;
      } else {
        updateData.dateOfBirth = null;
      }
    }

    if (profession !== undefined) {
      if (profession !== null && typeof profession === 'string') {
        if (profession.length > 100) {
          return res.status(400).json({
            message: 'Profession cannot exceed 100 characters',
          });
        }
        updateData.profession = profession.trim();
      } else {
        updateData.profession = '';
      }
    }

    // Only admin can change role
    if (role && req.user.role === 'admin') {
      if (!['resident', 'authority', 'admin'].includes(role)) {
        return res.status(400).json({
          message: 'Invalid role',
        });
      }
      updateData.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).select('-password');

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      gender: updatedUser.gender,
      dateOfBirth: updatedUser.dateOfBirth,
      profession: updatedUser.profession,
      location: updatedUser.location,
      avatar: updatedUser.avatar,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Email already exists',
      });
    }

    res.status(500).json({
      message: 'Server error',
      error: error.message,
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
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        message: 'Cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// @desc    Get nearby users (within radius)
// @route   GET /api/users/nearby
// @access  Private
const getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query; // radius in meters

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'Latitude and longitude are required',
      });
    }

    const users = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(radius),
        },
      },
    }).select('-password');

    res.json({
      count: users.length,
      radius: `${radius}m`,
      users,
    });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/users/:id/toggle-active
// @access  Private/Admin
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${
        user.isActive ? 'activated' : 'deactivated'
      } successfully`,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error('Toggle user active error:', error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getNearbyUsers,
  toggleUserActive,
};
