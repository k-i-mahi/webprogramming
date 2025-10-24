const User = require('../models/User');
const Issue = require('../models/Issue');

// @desc    Get nearby users
// @route   GET /api/location/users/nearby
// @access  Private
const getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);

    // Validate coordinates
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates',
      });
    }

    // Find users within radius using MongoDB geospatial queries
    const users = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: rad * 1000, // Convert km to meters
        },
      },
      _id: { $ne: req.user._id }, // Exclude current user
      isActive: true,
    }).select('name email avatar role profession location');

    res.json({
      success: true,
      data: users,
      meta: {
        count: users.length,
        center: { latitude: lat, longitude: lng },
        radius: rad,
        unit: 'km',
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

// @desc    Get nearby issues
// @route   GET /api/location/issues/nearby
// @access  Public
const getNearbyIssues = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 5,
      status,
      priority,
      category,
      limit = 50,
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);

    // Build query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: rad * 1000,
        },
      },
    };

    // Add filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Public issues only for non-authenticated users
    if (!req.user) {
      query.isPublic = true;
    }

    const issues = await Issue.find(query)
      .populate('reportedBy', 'name avatar role')
      .populate('assignedTo', 'name avatar')
      .populate('category', 'name displayName icon color')
      .select('-followers')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: issues,
      meta: {
        count: issues.length,
        center: { latitude: lat, longitude: lng },
        radius: rad,
        unit: 'km',
        filters: { status, priority, category },
      },
    });
  } catch (error) {
    console.error('Get nearby issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching nearby issues',
    });
  }
};

// @desc    Get issues within bounds (map viewport)
// @route   GET /api/location/issues/bounds
// @access  Public
const getIssuesInBounds = async (req, res) => {
  try {
    const {
      swLat, // Southwest latitude
      swLng, // Southwest longitude
      neLat, // Northeast latitude
      neLng, // Northeast longitude
      status,
      priority,
      category,
    } = req.query;

    if (!swLat || !swLng || !neLat || !neLng) {
      return res.status(400).json({
        success: false,
        message: 'Bounding box coordinates are required',
      });
    }

    // Build query
    const query = {
      'location.coordinates': {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)], // Southwest corner
            [parseFloat(neLng), parseFloat(neLat)], // Northeast corner
          ],
        },
      },
    };

    // Add filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Public issues only for non-authenticated users
    if (!req.user) {
      query.isPublic = true;
    }

    const issues = await Issue.find(query)
      .populate('reportedBy', 'name avatar')
      .populate('category', 'name displayName icon color')
      .select('title status priority location category createdAt stats')
      .limit(500); // Prevent too many markers

    res.json({
      success: true,
      data: issues,
      meta: {
        count: issues.length,
        bounds: {
          southwest: {
            latitude: parseFloat(swLat),
            longitude: parseFloat(swLng),
          },
          northeast: {
            latitude: parseFloat(neLat),
            longitude: parseFloat(neLng),
          },
        },
      },
    });
  } catch (error) {
    console.error('Get issues in bounds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching issues',
    });
  }
};

// @desc    Get heatmap data for issues
// @route   GET /api/location/heatmap
// @access  Public
const getIssueHeatmap = async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng, status, category } = req.query;

    // Build query
    const query = {};

    if (swLat && swLng && neLat && neLng) {
      query['location.coordinates'] = {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)],
            [parseFloat(neLng), parseFloat(neLat)],
          ],
        },
      };
    }

    if (status) query.status = status;
    if (category) query.category = category;

    // Public issues only for non-authenticated users
    if (!req.user) {
      query.isPublic = true;
    }

    const issues = await Issue.find(query)
      .select('location priority status')
      .lean();

    // Format for heatmap
    const heatmapData = issues.map((issue) => ({
      lat: issue.location.coordinates[1],
      lng: issue.location.coordinates[0],
      weight:
        issue.priority === 'urgent' ? 3 : issue.priority === 'high' ? 2 : 1,
    }));

    res.json({
      success: true,
      data: heatmapData,
      meta: {
        count: heatmapData.length,
      },
    });
  } catch (error) {
    console.error('Get heatmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating heatmap',
    });
  }
};

// @desc    Get location statistics
// @route   GET /api/location/stats
// @access  Public
const getLocationStats = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);

    // Get issue statistics in area
    const issueStats = await Issue.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          distanceField: 'distance',
          maxDistance: rad * 1000,
          spherical: true,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
          },
          avgViews: { $avg: '$stats.views' },
          avgUpvotes: { $avg: '$stats.upvotes' },
        },
      },
    ]);

    // Get user statistics in area
    const userCount = await User.countDocuments({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: rad * 1000,
        },
      },
      isActive: true,
    });

    // Get category breakdown
    const categoryStats = await Issue.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          distanceField: 'distance',
          maxDistance: rad * 1000,
          spherical: true,
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.displayName',
          icon: '$category.icon',
          color: '$category.color',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        issues: issueStats[0] || {
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
          avgViews: 0,
          avgUpvotes: 0,
        },
        users: userCount,
        categories: categoryStats,
      },
      meta: {
        center: { latitude: lat, longitude: lng },
        radius: rad,
        unit: 'km',
      },
    });
  } catch (error) {
    console.error('Get location stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics',
    });
  }
};

// @desc    Reverse geocode coordinates to address
// @route   GET /api/location/reverse-geocode
// @access  Public
const reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    // You can integrate with a geocoding service like:
    // - Google Maps Geocoding API
    // - Nominatim (OpenStreetMap)
    // - Mapbox Geocoding API

    // Example placeholder response
    res.json({
      success: true,
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: 'Address lookup not implemented',
        city: null,
        state: null,
        country: null,
        postalCode: null,
      },
      message: 'Geocoding service not configured',
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Calculate distance between two points
// @route   GET /api/location/distance
// @access  Public
const calculateDistance = async (req, res) => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.query;

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return res.status(400).json({
        success: false,
        message: 'Two coordinate pairs are required',
      });
    }

    // Haversine formula
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371; // Earth's radius in km
    const dLat = toRad(parseFloat(lat2) - parseFloat(lat1));
    const dLng = toRad(parseFloat(lng2) - parseFloat(lng1));

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(parseFloat(lat1))) *
        Math.cos(toRad(parseFloat(lat2))) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    res.json({
      success: true,
      data: {
        distance: parseFloat(distance.toFixed(2)),
        unit: 'km',
        distanceMiles: parseFloat((distance * 0.621371).toFixed(2)),
        from: {
          latitude: parseFloat(lat1),
          longitude: parseFloat(lng1),
        },
        to: {
          latitude: parseFloat(lat2),
          longitude: parseFloat(lng2),
        },
      },
    });
  } catch (error) {
    console.error('Calculate distance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error calculating distance',
    });
  }
};

module.exports = {
  getNearbyUsers,
  getNearbyIssues,
  getIssuesInBounds,
  getIssueHeatmap,
  getLocationStats,
  reverseGeocode,
  calculateDistance,
};
