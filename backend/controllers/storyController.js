const Story = require('../models/Story');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Image or video is required' 
      });
    }

    const resourceType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    const result = await uploadToCloudinary(
      req.file.buffer, 
      'social-media/stories', 
      resourceType
    );

    const story = await Story.create({
      user: req.userId,
      media: {
        url: result.url,
        publicId: result.publicId,
        type: resourceType
      },
      caption: req.body.caption || ''
    });

    await story.populate('user', 'username fullName avatar');

    res.status(201).json({
      success: true,
      data: { story }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stories from followed users
// @route   GET /api/stories
// @access  Private
const getStories = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const feedUserIds = [...user.following, req.userId];

    // Get all active stories grouped by user
    const stories = await Story.find({
      user: { $in: feedUserIds },
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'username fullName avatar');

    // Group stories by user
    const groupedStories = {};
    stories.forEach(story => {
      const userId = story.user._id.toString();
      if (!groupedStories[userId]) {
        groupedStories[userId] = {
          user: story.user,
          stories: [],
          hasUnviewed: false
        };
      }
      
      const isViewed = story.viewers.some(
        v => v.user.toString() === req.userId.toString()
      );
      
      if (!isViewed) {
        groupedStories[userId].hasUnviewed = true;
      }
      
      groupedStories[userId].stories.push({
        ...story.toObject(),
        isViewed
      });
    });

    // Sort: unviewed first, then own stories
    const storyGroups = Object.values(groupedStories).sort((a, b) => {
      // Own stories first
      if (a.user._id.toString() === req.userId.toString()) return -1;
      if (b.user._id.toString() === req.userId.toString()) return 1;
      // Unviewed before viewed
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    res.json({
      success: true,
      data: { stories: storyGroups }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get own stories
// @route   GET /api/stories/mine
// @access  Private
const getMyStories = async (req, res, next) => {
  try {
    const stories = await Story.find({
      user: req.userId,
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .populate('viewers.user', 'username fullName avatar');

    res.json({
      success: true,
      data: { stories }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View a story
// @route   POST /api/stories/:id/view
// @access  Private
const viewStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ 
        success: false, 
        message: 'Story not found' 
      });
    }

    // Don't add viewer if it's the owner or already viewed
    const alreadyViewed = story.viewers.some(
      v => v.user.toString() === req.userId.toString()
    );

    if (!alreadyViewed && story.user.toString() !== req.userId.toString()) {
      story.viewers.push({ user: req.userId });
      await story.save();
    }

    res.json({ 
      success: true, 
      message: 'Story viewed' 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ 
        success: false, 
        message: 'Story not found' 
      });
    }

    if (story.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const resourceType = story.media.type === 'video' ? 'video' : 'image';
    await deleteFromCloudinary(story.media.publicId, resourceType);
    await Story.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: 'Story deleted' 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStory,
  getStories,
  getMyStories,
  viewStory,
  deleteStory
};
