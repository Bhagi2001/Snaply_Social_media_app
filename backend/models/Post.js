const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  caption: {
    type: String,
    maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    default: ''
  },
  media: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['image', 'video'],
      default: 'image'
    },
    width: Number,
    height: Number
  }],
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: ''
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for feed and explore queries
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ likesCount: -1, createdAt: -1 });

// Extract hashtags from caption before saving
postSchema.pre('save', function(next) {
  if (this.isModified('caption')) {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.caption.match(hashtagRegex);
    if (matches) {
      this.hashtags = matches.map(tag => tag.slice(1).toLowerCase());
    }
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
