const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  media: {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    }
  },
  caption: {
    type: String,
    default: '',
    maxlength: 200
  },
  viewers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now }
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    index: { expires: 0 } // TTL index: auto-delete when expired
  }
}, {
  timestamps: true
});

storySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
