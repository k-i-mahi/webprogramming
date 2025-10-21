const express = require('express');
const { body } = require('express-validator');
const { getNearbyUsers, updateLocation, getUsersByRoleInArea } = require('../controllers/locationController');
const { protect, isAuthority } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/location/nearby
// @desc    Get users within a radius
// @access  Private
router.get('/nearby', protect, getNearbyUsers);

// @route   PUT /api/location/update
// @desc    Update user location
// @access  Private
router.put('/update', [
  protect,
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
], updateLocation);

// @route   GET /api/location/role/:role
// @desc    Get users by role in area
// @access  Private/Authority
router.get('/role/:role', protect, isAuthority, getUsersByRoleInArea);

module.exports = router;
