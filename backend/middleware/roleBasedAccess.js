const Issue = require('../models/Issue');
const Category = require('../models/Category');

// Middleware to check if user can access specific issue
const canAccessIssue = async (req, res, next) => {
  try {
    const issueId = req.params.id;
    const user = req.user;

    // Admin can access everything
    if (user.role === 'admin') {
      return next();
    }

    // Get the issue
    const issue = await Issue.findById(issueId).populate('category');
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Residents can only access their own issues
    if (user.role === 'resident') {
      if (issue.createdBy.toString() !== user.id) {
        return res.status(403).json({
          message: 'Not authorized to access this issue'
        });
      }
      return next();
    }

    // Authorities can access issues in their assigned categories
    if (user.role === 'authority') {
      // Check if user is assigned to the issue's category
      const userCategories = await Category.find({
        assignedUsers: user.id
      });
      
      const userCategoryIds = userCategories.map(cat => cat._id.toString());
      
      if (!userCategoryIds.includes(issue.category._id.toString())) {
        return res.status(403).json({
          message: 'Not authorized to access issues in this category'
        });
      }
      return next();
    }

    // If role is not recognized
    return res.status(403).json({
      message: 'Invalid user role'
    });
  } catch (error) {
    console.error('canAccessIssue middleware error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// Middleware to check if user can create issues
const canCreateIssue = (req, res, next) => {
  const user = req.user;

  // Residents and authorities can create issues
  if (user.role === 'resident' || user.role === 'authority' || user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    message: 'Not authorized to create issues'
  });
};

// Middleware to check if user can update issues
const canUpdateIssue = async (req, res, next) => {
  try {
    const issueId = req.params.id;
    const user = req.user;

    // Admin can update everything
    if (user.role === 'admin') {
      return next();
    }

    // Get the issue
    const issue = await Issue.findById(issueId).populate('category');
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Residents can only update their own issues (but not status/assignment)
    if (user.role === 'resident') {
      if (issue.createdBy.toString() !== user.id) {
        return res.status(403).json({
          message: 'Not authorized to update this issue'
        });
      }
      
      // Check if trying to update restricted fields
      const restrictedFields = ['status', 'assignedTo'];
      const updateFields = Object.keys(req.body);
      const hasRestrictedFields = updateFields.some(field => restrictedFields.includes(field));
      
      if (hasRestrictedFields) {
        return res.status(403).json({
          message: 'Residents cannot update status or assignment'
        });
      }
      
      return next();
    }

    // Authorities can update issues in their assigned categories
    if (user.role === 'authority') {
      const userCategories = await Category.find({
        assignedUsers: user.id
      });
      
      const userCategoryIds = userCategories.map(cat => cat._id.toString());
      
      if (!userCategoryIds.includes(issue.category._id.toString())) {
        return res.status(403).json({
          message: 'Not authorized to update issues in this category'
        });
      }
      
      return next();
    }

    return res.status(403).json({
      message: 'Invalid user role'
    });
  } catch (error) {
    console.error('canUpdateIssue middleware error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// Middleware to check if user can delete issues
const canDeleteIssue = (req, res, next) => {
  const user = req.user;

  // Only admin can delete issues
  if (user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    message: 'Only administrators can delete issues'
  });
};

// Middleware to filter issues based on user role
const filterIssuesByRole = async (req, res, next) => {
  try {
    const user = req.user;

    // Admin can see all issues
    if (user.role === 'admin') {
      return next();
    }

    // Residents can only see their own issues
    if (user.role === 'resident') {
      req.query.createdBy = user.id;
      return next();
    }

    // Authorities can see issues in their assigned categories
    if (user.role === 'authority') {
      const userCategories = await Category.find({
        assignedUsers: user.id
      });
      
      const userCategoryIds = userCategories.map(cat => cat._id.toString());
      
      if (userCategoryIds.length === 0) {
        // No assigned categories, return empty result
        req.query._id = 'nonexistent';
        return next();
      }
      
      req.query.category = { $in: userCategoryIds };
      return next();
    }

    return next();
  } catch (error) {
    console.error('filterIssuesByRole middleware error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// Middleware to check if user can add comments
const canAddComment = async (req, res, next) => {
  try {
    const issueId = req.params.id;
    const user = req.user;

    // Admin can comment on everything
    if (user.role === 'admin') {
      return next();
    }

    // Get the issue
    const issue = await Issue.findById(issueId).populate('category');
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Residents can comment on their own issues
    if (user.role === 'resident') {
      if (issue.createdBy.toString() !== user.id) {
        return res.status(403).json({
          message: 'Not authorized to comment on this issue'
        });
      }
      return next();
    }

    // Authorities can comment on issues in their assigned categories
    if (user.role === 'authority') {
      const userCategories = await Category.find({
        assignedUsers: user.id
      });
      
      const userCategoryIds = userCategories.map(cat => cat._id.toString());
      
      if (!userCategoryIds.includes(issue.category._id.toString())) {
        return res.status(403).json({
          message: 'Not authorized to comment on issues in this category'
        });
      }
      
      return next();
    }

    return res.status(403).json({
      message: 'Invalid user role'
    });
  } catch (error) {
    console.error('canAddComment middleware error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// Middleware to check if user can view statistics
const canViewStats = (req, res, next) => {
  const user = req.user;

  // Only admin and authority can view statistics
  if (user.role === 'admin' || user.role === 'authority') {
    return next();
  }

  return res.status(403).json({
    message: 'Not authorized to view statistics'
  });
};

module.exports = {
  canAccessIssue,
  canCreateIssue,
  canUpdateIssue,
  canDeleteIssue,
  filterIssuesByRole,
  canAddComment,
  canViewStats
};
