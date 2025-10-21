const express = require('express');
const { body } = require('express-validator');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  assignUsersToCategory,
  unassignUsersFromCategory
} = require('../controllers/categoryController');
const { protect, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', protect, getCategories);

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Private/Admin
router.get('/:id', protect, isAdmin, getCategoryById);

// @route   POST /api/categories
// @desc    Create new category
// @access  Private/Admin
router.post('/', [
  protect,
  isAdmin,
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('assignedUsers')
    .optional()
    .isArray()
    .withMessage('Assigned users must be an array'),
  body('assignedUsers.*')
    .optional()
    .isMongoId()
    .withMessage('Each assigned user must be a valid user ID'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters')
], createCategory);

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put('/:id', [
  protect,
  isAdmin,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('assignedUsers')
    .optional()
    .isArray()
    .withMessage('Assigned users must be an array'),
  body('assignedUsers.*')
    .optional()
    .isMongoId()
    .withMessage('Each assigned user must be a valid user ID'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
], updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private/Admin
router.delete('/:id', protect, isAdmin, deleteCategory);

// @route   PUT /api/categories/:id/assign
// @desc    Assign users to category
// @access  Private/Admin
router.put('/:id/assign', [
  protect,
  isAdmin,
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs array is required and must not be empty'),
  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be a valid MongoDB ObjectId')
], assignUsersToCategory);

// @route   PUT /api/categories/:id/unassign
// @desc    Remove users from category
// @access  Private/Admin
router.put('/:id/unassign', [
  protect,
  isAdmin,
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs array is required and must not be empty'),
  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be a valid MongoDB ObjectId')
], unassignUsersFromCategory);

module.exports = router;
