const Issue = require('../models/Issue');
const Category = require('../models/Category');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if env set
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// @desc    Get all issues
// @route   GET /api/issues
// @access  Private
const getIssues = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      assignedTo,
      createdBy
    } = req.query;

    // Build query - role-based filtering is handled by middleware
    let query = {};

    // Apply filters from query parameters
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (createdBy) query.createdBy = createdBy;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply role-based filters from middleware
    if (req.query.createdBy) query.createdBy = req.query.createdBy;
    if (req.query.category) query.category = req.query.category;
    if (req.query._id === 'nonexistent') query._id = 'nonexistent';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const issues = await Issue.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.user', 'name email')
      .populate('statusHistory.changedBy', 'name email role')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Issue.countDocuments(query);

    res.json({
      issues,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Get issue by ID
// @route   GET /api/issues/:id
// @access  Private
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('category', 'name')
      .populate('createdBy', 'name email role location')
      .populate('assignedTo', 'name email role location')
      .populate('comments.user', 'name email role')
      .populate('statusHistory.changedBy', 'name email role');

    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Access control is handled by middleware
    res.json({ issue });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private (Residents and Authorities)
const createIssue = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      latitude, 
      longitude, 
      photoURL, 
      priority 
    } = req.body;

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        message: 'Category does not exist'
      });
    }

    // Handle photo upload
    let photoURLFinal = photoURL || '';
    if (req.file) {
      try {
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          const uploadRes = await cloudinary.uploader.upload(req.file.path, {
            folder: 'civita/issues'
          });
          photoURLFinal = uploadRes.secure_url;
          fs.unlink(req.file.path, () => {});
        } else {
          // Local served URL
          photoURLFinal = `${req.protocol}://${req.get('host')}/uploads/${path.basename(req.file.path)}`;
        }
      } catch (uploadErr) {
        return res.status(400).json({ message: 'Image upload failed' });
      }
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      photoURL: photoURLFinal,
      priority: priority || 'Medium',
      createdBy: req.user.id,
      statusHistory: [{ status: 'Reported', changedBy: req.user.id }]
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('category', 'name')
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role');

    res.status(201).json({
      message: 'Issue created successfully',
      issue: populatedIssue
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Update issue
// @route   PUT /api/issues/:id
// @access  Private (Role-based access)
const updateIssue = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      status, 
      assignedTo, 
      priority, 
      estimatedResolution 
    } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Access control is handled by middleware

    // Validate assignedTo user if provided
    if (assignedTo) {
      const userExists = await User.findById(assignedTo);
      if (!userExists) {
        return res.status(400).json({
          message: 'Assigned user does not exist'
        });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (priority !== undefined) updateData.priority = priority;
    if (estimatedResolution !== undefined) updateData.estimatedResolution = estimatedResolution;

    // If status is changing, append to history after update
    const wasStatusChanged = status !== undefined && status !== issue.status;

    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name')
     .populate('createdBy', 'name email role')
     .populate('assignedTo', 'name email role')
     .populate('comments.user', 'name email role')
     .populate('statusHistory.changedBy', 'name email role');

    if (wasStatusChanged && updatedIssue) {
      updatedIssue.statusHistory = updatedIssue.statusHistory || [];
      updatedIssue.statusHistory.push({ status: updatedIssue.status, changedBy: req.user.id });
      await updatedIssue.save();
    }

    res.json({
      message: 'Issue updated successfully',
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private (Admin only)
const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    await Issue.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Add comment to issue
// @route   POST /api/issues/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { comment } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        message: 'Issue not found'
      });
    }

    // Access control is handled by middleware

    issue.comments.push({
      user: req.user.id,
      comment
    });

    await issue.save();

    const updatedIssue = await Issue.findById(req.params.id)
      .populate('category', 'name')
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.user', 'name email role');

    res.json({
      message: 'Comment added successfully',
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Get issues by location
// @route   GET /api/issues/nearby
// @access  Private
const getNearbyIssues = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);

    const issues = await Issue.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: rad * 1000 // Convert km to meters
        }
      },
      isActive: true
    }).populate('category', 'name')
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .limit(50);

    res.json({
      issues,
      center: { latitude: lat, longitude: lng },
      radius: rad
    });
  } catch (error) {
    console.error('Get nearby issues error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Get issues statistics
// @route   GET /api/issues/stats
// @access  Private (Admin and Authority)
const getIssueStats = async (req, res) => {
  try {
    const stats = await Issue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Issue.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Issue.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statusStats: stats,
      priorityStats: priorityStats,
      categoryStats: categoryStats
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    res.status(500).json({
      message: 'Server error'
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
