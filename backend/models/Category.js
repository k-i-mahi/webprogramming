const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Category name cannot be more than 100 characters'],
    minlength: [2, 'Category name must be at least 2 characters']
  },
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one user must be assigned to the category'
    }
  }],
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
categorySchema.index({ name: 1 });
categorySchema.index({ assignedUsers: 1 });
categorySchema.index({ isActive: 1 });

// Virtual to get assigned users count
categorySchema.virtual('assignedUsersCount').get(function() {
  return this.assignedUsers.length;
});

// Ensure virtual fields are serialized
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

// Pre-save middleware to validate assigned users exist
categorySchema.pre('save', async function(next) {
  if (this.assignedUsers && this.assignedUsers.length > 0) {
    try {
      const User = mongoose.model('User');
      const existingUsers = await User.find({
        _id: { $in: this.assignedUsers }
      });
      
      if (existingUsers.length !== this.assignedUsers.length) {
        return next(new Error('One or more assigned users do not exist'));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
