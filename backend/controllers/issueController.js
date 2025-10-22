const Issue = require('../models/Issue');
const { validationResult } = require('express-validator');

// Get all issues
const getIssues = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      status,
      category,
      priority,
      search,
      createdBy,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 100,
      skip = 0
    } = req.query;

    let filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (createdBy) filter.createdBy = createdBy;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const issues = await Issue.find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit) || 100)
      .skip(parseInt(skip) || 0)
      .populate('category', 'name')
      .populate('createdBy', 'name role email')
      .populate('assignedTo', 'name email')
      .lean();

    const total = await Issue.countDocuments(filter);

    res.json({
      success: true,
      issues,
      count: issues.length,
      total
    });
  } catch (error) {
    console.error('❌ getIssues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
      error: error.message
    });
  }
};

// Get issue by ID
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('category', 'name')
      .populate('createdBy', 'name role email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email role')
      .populate('statusHistory.changedBy', 'name');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    res.json({ success: true, issue });
  } catch (error) {
    console.error('❌ getIssueById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issue',
      error: error.message
    });
  }
};

// Create issue
const createIssue = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, category, latitude, longitude, priority = 'Medium' } = req.body;

    let photoURL = null;
    if (req.file) {
      photoURL = `/uploads/${req.file.filename}`;
    }

    const newIssue = new Issue({
      title: title.trim(),
      description: description.trim(),
      category,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      photoURL,
      priority,
      createdBy: req.user.id,
      status: 'Reported',
      statusHistory: [{
        status: 'Reported',
        changedAt: new Date(),
        changedBy: req.user.id
      }]
    });

    await newIssue.save();
    await newIssue.populate('category', 'name');
    await newIssue.populate('createdBy', 'name role email');

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      issue: newIssue
    });
  } catch (error) {
    console.error('❌ createIssue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create issue',
      error: error.message
    });
  }
};

// Update issue
const updateIssue = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, category, status, priority, assignedTo, latitude, longitude } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    if (title) issue.title = title.trim();
    if (description) issue.description = description.trim();
    if (category) issue.category = category;
    if (priority) issue.priority = priority;
    if (assignedTo !== undefined) issue.assignedTo = assignedTo;

    if (latitude && longitude) {
      issue.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    if (status && status !== issue.status) {
      issue.status = status;
      issue.statusHistory.push({
        status,
        changedAt: new Date(),
        changedBy: req.user.id
      });
    }

    await issue.save();
    await issue.populate('category', 'name');
    await issue.populate('createdBy', 'name role email');
    await issue.populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'Issue updated successfully',
      issue
    });
  } catch (error) {
    console.error('❌ updateIssue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update issue',
      error: error.message
    });
  }
};

// Delete issue
const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('❌ deleteIssue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete issue',
      error: error.message
    });
  }
};

// Add comment
const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { comment } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    issue.comments.push({
      user: req.user.id,
      text: comment.trim(),
      createdAt: new Date()
    });

    await issue.save();
    await issue.populate('comments.user', 'name email role');

    res.json({
      success: true,
      message: 'Comment added successfully',
      issue
    });
  } catch (error) {
    console.error('❌ addComment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Get nearby issues
const getNearbyIssues = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude required'
      });
    }

    const issues = await Issue.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    })
      .populate('category', 'name')
      .populate('createdBy', 'name role email');

    res.json({
      success: true,
      issues,
      count: issues.length
    });
  } catch (error) {
    console.error('❌ getNearbyIssues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby issues',
      error: error.message
    });
  }
};

// Get stats
const getIssueStats = async (req, res) => {
  try {
    const stats = {
      total: await Issue.countDocuments(),
      reported: await Issue.countDocuments({ status: 'Reported' }),
      inProgress: await Issue.countDocuments({ status: 'In Progress' }),
      resolved: await Issue.countDocuments({ status: 'Resolved' })
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ getIssueStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  addComment,
  getNearbyIssues,
  getIssueStats
};
