const User = require('../models/User');

// @desc    Get users within a radius
// @route   GET /api/location/nearby
// @access  Private
const getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);

    // Find users within radius using MongoDB geospatial queries
    const users = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: rad * 1000 // Convert km to meters
        }
      },
      _id: { $ne: req.user.id } // Exclude current user
    }).select('-password');

    res.json({
      count: users.length,
      users,
      center: { latitude: lat, longitude: lng },
      radius: rad
    });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Update user location
// @route   PUT /api/location/update
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'Latitude and longitude are required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      message: 'Location updated successfully',
      user
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Get users by role in area
// @route   GET /api/location/role/:role
// @access  Private
const getUsersByRoleInArea = async (req, res) => {
  try {
    const { role } = req.params;
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);

    const users = await User.find({
      role: role,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: rad * 1000
        }
      }
    }).select('-password');

    res.json({
      count: users.length,
      users,
      role,
      center: { latitude: lat, longitude: lng },
      radius: rad
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

module.exports = {
  getNearbyUsers,
  updateLocation,
  getUsersByRoleInArea
};
