const Category = require('../models/Category');
const User = require('../models/User');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private/Admin
const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    
    // Build query
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const categories = await Category.find(query)
      .populate('assignedUsers', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Category.countDocuments(query);

    res.json({
      categories,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Private/Admin
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('assignedUsers', 'name email role location')
      .populate('createdBy', 'name email');

    if (!category) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, assignedUsers, description } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        message: 'Category with this name already exists'
      });
    }

    // Validate assigned users exist
    if (assignedUsers && assignedUsers.length > 0) {
      const existingUsers = await User.find({
        _id: { $in: assignedUsers }
      });
      
      if (existingUsers.length !== assignedUsers.length) {
        return res.status(400).json({
          message: 'One or more assigned users do not exist'
        });
      }
    }

    const category = await Category.create({
      name,
      assignedUsers: assignedUsers || [],
      description: description || '',
      createdBy: req.user.id
    });

    const populatedCategory = await Category.findById(category._id)
      .populate('assignedUsers', 'name email role')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Category created successfully',
      category: populatedCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, assignedUsers, description, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          message: 'Category with this name already exists'
        });
      }
    }

    // Validate assigned users if provided
    if (assignedUsers && assignedUsers.length > 0) {
      const existingUsers = await User.find({
        _id: { $in: assignedUsers }
      });
      
      if (existingUsers.length !== assignedUsers.length) {
        return res.status(400).json({
          message: 'One or more assigned users do not exist'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (assignedUsers !== undefined) updateData.assignedUsers = assignedUsers;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedUsers', 'name email role')
     .populate('createdBy', 'name email');

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Assign users to category
// @route   PUT /api/categories/:id/assign
// @access  Private/Admin
const assignUsersToCategory = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        message: 'User IDs array is required'
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    // Validate users exist
    const existingUsers = await User.find({
      _id: { $in: userIds }
    });
    
    if (existingUsers.length !== userIds.length) {
      return res.status(400).json({
        message: 'One or more users do not exist'
      });
    }

    // Add users to category (avoid duplicates)
    const uniqueUserIds = [...new Set([...category.assignedUsers, ...userIds])];
    
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { assignedUsers: uniqueUserIds },
      { new: true, runValidators: true }
    ).populate('assignedUsers', 'name email role')
     .populate('createdBy', 'name email');

    res.json({
      message: 'Users assigned to category successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Assign users error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// @desc    Remove users from category
// @route   PUT /api/categories/:id/unassign
// @access  Private/Admin
const unassignUsersFromCategory = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        message: 'User IDs array is required'
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    // Remove users from category
    const updatedAssignedUsers = category.assignedUsers.filter(
      userId => !userIds.includes(userId.toString())
    );
    
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { assignedUsers: updatedAssignedUsers },
      { new: true, runValidators: true }
    ).populate('assignedUsers', 'name email role')
     .populate('createdBy', 'name email');

    res.json({
      message: 'Users removed from category successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Unassign users error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  assignUsersToCategory,
  unassignUsersFromCategory
};
