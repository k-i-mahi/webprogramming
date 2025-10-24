const User = require('../models/User');
const Issue = require('../models/Issue');
const Interaction = require('../models/Interaction');
const Activity = require('../models/Activity');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      search,
      sort = '-createdAt',
    } = req.query;

    // Build query
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users',
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
        success: false,
        message: 'User not found',
      });
    }

    // Get user statistics
    const issueStats = await Issue.aggregate([
      {
        $match: {
          $or: [{ reportedBy: user._id }, { assignedTo: user._id }],
        },
      },
      {
        $group: {
          _id: null,
          totalReported: {
            $sum: { $cond: [{ $eq: ['$reportedBy', user._id] }, 1, 0] },
          },
          totalAssigned: {
            $sum: { $cond: [{ $eq: ['$assignedTo', user._id] }, 1, 0] },
          },
          resolved: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['resolved', 'closed']] },
                    {
                      $or: [
                        { $eq: ['$reportedBy', user._id] },
                        { $eq: ['$assignedTo', user._id] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          inProgress: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'in-progress'] },
                    { $eq: ['$assignedTo', user._id] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get interaction stats
    const interactionStats = await Interaction.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        statistics: {
          issues: issueStats[0] || {
            totalReported: 0,
            totalAssigned: 0,
            resolved: 0,
            inProgress: 0,
          },
          interactions: {
            comments:
              interactionStats.find((s) => s._id === 'comment')?.count || 0,
            upvotes:
              interactionStats.find((s) => s._id === 'upvote')?.count || 0,
            follows:
              interactionStats.find((s) => s._id === 'follow')?.count || 0,
          },
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user',
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is updating their own profile or is admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
      });
    }

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
          success: false,
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
            success: false,
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
            success: false,
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
          success: false,
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
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Check if user has active issues
    const issueCount = await Issue.countDocuments({
      reportedBy: user._id,
      status: { $in: ['open', 'in-progress'] },
    });

    if (issueCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user. They have ${issueCount} active issue(s). Please resolve or reassign them first.`,
      });
    }

    // Check if user is assigned to issues
    const assignedCount = await Issue.countDocuments({
      assignedTo: user._id,
      status: { $in: ['open', 'in-progress'] },
    });

    if (assignedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user. They are assigned to ${assignedCount} active issue(s). Please reassign them first.`,
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user',
    });
  }
};

// @desc    Get nearby users (within radius)
// @route   GET /api/users/nearby
// @access  Private
const getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusInDegrees = parseInt(radius) / 111320; // Convert meters to degrees (approximate)

    const users = await User.find({
      'location.latitude': {
        $gte: lat - radiusInDegrees,
        $lte: lat + radiusInDegrees,
      },
      'location.longitude': {
        $gte: lon - radiusInDegrees,
        $lte: lon + radiusInDegrees,
      },
      _id: { $ne: req.user._id }, // Exclude current user
      isActive: true,
    }).select('name email avatar role profession location');

    // Further filter by actual distance using Haversine formula
    const filteredUsers = users.filter((user) => {
      const distance = calculateDistance(
        lat,
        lon,
        user.location.latitude,
        user.location.longitude,
      );
      return distance <= parseInt(radius);
    });

    res.json({
      success: true,
      data: filteredUsers,
      count: filteredUsers.length,
      searchParams: {
        latitude: lat,
        longitude: lon,
        radius: parseInt(radius),
      },
    });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching nearby users',
    });
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// @desc    Toggle user active status
// @route   PATCH /api/users/:id/toggle-active
// @access  Private/Admin
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${
        user.isActive ? 'activated' : 'deactivated'
      } successfully`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Toggle user active error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Change user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['resident', 'authority', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent changing own role
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        oldRole,
        newRole: role,
      },
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get user activity history
// @route   GET /api/users/:id/activity
// @access  Private
const getUserActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Only user themselves or admin can view activity
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this activity',
      });
    }

    const activities = await Activity.find({ user: user._id })
      .populate('issue', 'title status category')
      .populate({
        path: 'issue',
        populate: { path: 'category', select: 'name displayName icon' },
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Activity.countDocuments({ user: user._id });

    res.json({
      success: true,
      data: activities,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching activity',
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get issue statistics
    const issueStats = await Issue.aggregate([
      {
        $match: {
          $or: [{ reportedBy: user._id }, { assignedTo: user._id }],
        },
      },
      {
        $group: {
          _id: null,
          totalReported: {
            $sum: { $cond: [{ $eq: ['$reportedBy', user._id] }, 1, 0] },
          },
          totalAssigned: {
            $sum: { $cond: [{ $eq: ['$assignedTo', user._id] }, 1, 0] },
          },
          resolved: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'resolved'] },
                    {
                      $or: [
                        { $eq: ['$reportedBy', user._id] },
                        { $eq: ['$assignedTo', user._id] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          inProgress: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'in-progress'] },
                    { $eq: ['$assignedTo', user._id] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get interaction statistics
    const interactionStats = await Interaction.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get monthly activity trend
    const monthlyActivity = await Activity.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        issues: issueStats[0] || {
          totalReported: 0,
          totalAssigned: 0,
          resolved: 0,
          inProgress: 0,
        },
        interactions: {
          comments:
            interactionStats.find((s) => s._id === 'comment')?.count || 0,
          upvotes: interactionStats.find((s) => s._id === 'upvote')?.count || 0,
          follows: interactionStats.find((s) => s._id === 'follow')?.count || 0,
        },
        monthlyActivity,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics',
    });
  }
};

// @desc    Get all authorities
// @route   GET /api/users/authorities
// @access  Private/Admin
const getAuthorities = async (req, res) => {
  try {
    const authorities = await User.find({
      role: { $in: ['authority', 'admin'] },
      isActive: true,
    }).select('name email avatar role');

    res.json({
      success: true,
      data: authorities,
      count: authorities.length,
    });
  } catch (error) {
    console.error('Get authorities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching authorities',
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
  changeUserRole,
  getUserActivity,
  getUserStats,
  getAuthorities,
};
