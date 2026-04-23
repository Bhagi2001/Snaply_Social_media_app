const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { uploadMultiple, deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const { sendPushNotification } = require('../utils/pushNotification');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { caption, location } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one image or video is required' 
      });
    }

    // Upload media to Cloudinary
    const mediaResults = await uploadMultiple(req.files, 'social-media/posts');

    const post = await Post.create({
      user: req.userId,
      caption: caption || '',
      media: mediaResults,
      location: location || ''
    });

    await post.populate('user', 'username fullName avatar isVerified');

    res.status(201).json({
      success: true,
      message: 'Post created',
      data: { post }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get feed posts from followed users
// @route   GET /api/posts/feed
// @access  Private
const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.userId);
    
    // Get posts from followed users and own posts
    const feedUserIds = [...user.following, req.userId];

    const posts = await Post.find({
      user: { $in: feedUserIds },
      isArchived: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username fullName avatar isVerified')
    .lean();

    // Add isLiked and isSaved flags
    const enrichedPosts = posts.map(post => ({
      ...post,
      isLiked: post.likes.some(id => id.toString() === req.userId.toString()),
      isSaved: user.savedPosts.some(id => id.toString() === post._id.toString())
    }));

    const total = await Post.countDocuments({
      user: { $in: feedUserIds },
      isArchived: false
    });

    res.json({
      success: true,
      data: {
        posts: enrichedPosts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username fullName avatar isVerified');

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    let isLiked = false;
    let isSaved = false;

    if (req.userId) {
      isLiked = post.likes.includes(req.userId);
      const user = await User.findById(req.userId);
      isSaved = user.savedPosts.includes(post._id);
    }

    res.json({
      success: true,
      data: { 
        post: { ...post.toObject(), isLiked, isSaved }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    if (post.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const { caption, location } = req.body;
    if (caption !== undefined) post.caption = caption;
    if (location !== undefined) post.location = location;

    await post.save();
    await post.populate('user', 'username fullName avatar isVerified');

    res.json({
      success: true,
      message: 'Post updated',
      data: { post }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    if (post.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Delete media from Cloudinary
    for (const media of post.media) {
      const resourceType = media.type === 'video' ? 'video' : 'image';
      await deleteFromCloudinary(media.publicId, resourceType);
    }

    // Delete associated comments
    await Comment.deleteMany({ post: post._id });

    // Delete associated notifications
    await Notification.deleteMany({ post: post._id });

    // Remove from saved posts
    await User.updateMany(
      { savedPosts: post._id },
      { $pull: { savedPosts: post._id } }
    );

    await Post.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: 'Post deleted' 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    if (post.likes.includes(req.userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post already liked' 
      });
    }

    post.likes.push(req.userId);
    post.likesCount = post.likes.length;
    await post.save();

    // Notify post owner (don't notify yourself)
    if (post.user.toString() !== req.userId.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.userId,
        type: 'like',
        post: post._id
      });

      sendPushNotification(
        post.user,
        'New Like',
        `${req.user.username} liked your post`,
        { type: 'like', postId: post._id.toString() }
      );
    }

    res.json({ 
      success: true, 
      message: 'Post liked',
      data: { likesCount: post.likesCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike post
// @route   DELETE /api/posts/:id/like
// @access  Private
const unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    post.likes = post.likes.filter(id => id.toString() !== req.userId.toString());
    post.likesCount = post.likes.length;
    await post.save();

    res.json({ 
      success: true, 
      message: 'Post unliked',
      data: { likesCount: post.likesCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save post
// @route   POST /api/posts/:id/save
// @access  Private
const savePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { savedPosts: post._id }
    });

    res.json({ success: true, message: 'Post saved' });
  } catch (error) {
    next(error);
  }
};

// @desc    Unsave post
// @route   DELETE /api/posts/:id/save
// @access  Private
const unsavePost = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $pull: { savedPosts: req.params.id }
    });

    res.json({ success: true, message: 'Post unsaved' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get explore/trending posts
// @route   GET /api/posts/explore
// @access  Private
const getExplorePosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.userId);

    // Get trending posts from users NOT followed
    const posts = await Post.find({
      user: { $nin: [...user.following, req.userId] },
      isArchived: false
    })
    .sort({ likesCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username fullName avatar isVerified')
    .lean();

    const enrichedPosts = posts.map(post => ({
      ...post,
      isLiked: post.likes.some(id => id.toString() === req.userId.toString())
    }));

    res.json({
      success: true,
      data: { posts: enrichedPosts }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts by hashtag
// @route   GET /api/posts/hashtag/:tag
// @access  Public
const getPostsByHashtag = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const tag = req.params.tag.toLowerCase();

    const posts = await Post.find({ 
      hashtags: tag, 
      isArchived: false 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username fullName avatar isVerified');

    const total = await Post.countDocuments({ hashtags: tag, isArchived: false });

    res.json({
      success: true,
      data: {
        posts,
        hashtag: tag,
        total,
        pagination: { page, limit, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get saved posts
// @route   GET /api/posts/saved
// @access  Private
const getSavedPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.userId);
    const savedIds = user.savedPosts.slice(skip, skip + limit);

    const posts = await Post.find({ _id: { $in: savedIds } })
      .populate('user', 'username fullName avatar isVerified');

    res.json({
      success: true,
      data: {
        posts,
        total: user.savedPosts.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  getExplorePosts,
  getPostsByHashtag,
  getSavedPosts
};
