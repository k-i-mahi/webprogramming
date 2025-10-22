const express = require('express');
const { body } = require('express-validator');
const {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  addComment,
  getNearbyIssues,
  getIssueStats
} = require('../controllers/issueController');
const { protect, isAdmin, isAuthority } = require('../middleware/auth');
const {
  canAccessIssue,
  canCreateIssue,
  canUpdateIssue,
  canDeleteIssue,
  filterIssuesByRole,
  canAddComment,
  canViewStats
} = require('../middleware/roleBasedAccess');
const multer = require('multer');
const path = require('path');

// Multer storage (local fallback)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'issue-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

// @route   POST /api/issues
// @desc    Create new issue
// @access  Private (Residents and Authorities)
router.post('/', [
  protect,
  canCreateIssue,
  upload.single('photo'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isMongoId()
    .withMessage('Category must be a valid category ID'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('photoURL')
    .optional()
    .isURL()
    .withMessage('Photo URL must be a valid URL'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be Low, Medium, High, or Critical')
], createIssue);

// @route   GET /api/issues/stats
// @desc    Get issue statistics
// @access  Private (Admin and Authority)
router.get('/stats', protect, canViewStats, getIssueStats);

// @route   GET /api/issues/nearby
// @desc    Get issues by location
// @access  Private (Role-based filtering)
router.get('/nearby', protect, filterIssuesByRole, getNearbyIssues);

// @route   GET /api/issues/:id
// @desc    Get issue by ID
// @access  Private (Role-based access)
router.get('/:id', protect, canAccessIssue, getIssueById);

// @route   GET /api/issues
// @desc    Get all issues
// @access  Private (Role-based filtering)
router.get('/', protect, filterIssuesByRole, getIssues);

// @route   PUT /api/issues/:id
// @desc    Update issue
// @access  Private (Role-based access)
router.put('/:id', [
  protect,
  canUpdateIssue,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('status')
    .optional()
    .isIn(['Reported', 'In Progress', 'Resolved'])
    .withMessage('Status must be Reported, In Progress, or Resolved'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Assigned user must be a valid user ID'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be Low, Medium, High, or Critical'),
  body('estimatedResolution')
    .optional()
    .isISO8601()
    .withMessage('Estimated resolution must be a valid date')
], updateIssue);

// @route   DELETE /api/issues/:id
// @desc    Delete issue
// @access  Private (Admin only)
router.delete('/:id', protect, canDeleteIssue, deleteIssue);

// @route   POST /api/issues/:id/comments
// @desc    Add comment to issue
// @access  Private (Role-based access)
router.post('/:id/comments', [
  protect,
  canAddComment,
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
], addComment);

module.exports = router;
