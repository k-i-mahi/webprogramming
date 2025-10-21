const express = require('express');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize, isAdmin, isAuthority } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', protect, isAdmin, getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, getUserById);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', protect, updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', protect, isAdmin, deleteUser);

module.exports = router;
