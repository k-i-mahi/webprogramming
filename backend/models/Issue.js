const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
    minlength: [5, 'Title must be at least 5 characters']
  },
  description: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters'],
    minlength: [10, 'Description must be at least 10 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  location: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  photoURL: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty string
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Photo URL must be a valid image URL'
    }
  },
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved'],
    default: 'Reported'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  estimatedResolution: {
    type: Date,
    default: null
  },
  actualResolution: {
    type: Date,
    default: null
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  statusHistory: [{
    status: {
      type: String,
      enum: ['Reported', 'In Progress', 'Resolved'],
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
issueSchema.index({ status: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ createdBy: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ location: '2dsphere' });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ priority: 1 });
issueSchema.index({ 'statusHistory.changedAt': -1 });

// Virtual to get time since creation
issueSchema.virtual('timeSinceCreation').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffInMs = now - created;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
});

// Virtual to get comments count
issueSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Ensure virtual fields are serialized
issueSchema.set('toJSON', { virtuals: true });
issueSchema.set('toObject', { virtuals: true });

// Pre-save middleware to validate references
issueSchema.pre('save', async function(next) {
  try {
    // Validate category exists
    if (this.category) {
      const Category = mongoose.model('Category');
      const categoryExists = await Category.findById(this.category);
      if (!categoryExists) {
        return next(new Error('Category does not exist'));
      }
    }

    // Validate assignedTo user exists
    if (this.assignedTo) {
      const User = mongoose.model('User');
      const userExists = await User.findById(this.assignedTo);
      if (!userExists) {
        return next(new Error('Assigned user does not exist'));
      }
    }

    // Validate createdBy user exists
    if (this.createdBy) {
      const User = mongoose.model('User');
      const userExists = await User.findById(this.createdBy);
      if (!userExists) {
        return next(new Error('Created by user does not exist'));
      }
    }

    // Set actualResolution when status changes to Resolved
    if (this.isModified('status') && this.status === 'Resolved' && !this.actualResolution) {
      this.actualResolution = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Issue', issueSchema);
