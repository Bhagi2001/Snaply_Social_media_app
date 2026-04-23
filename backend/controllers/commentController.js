const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../utils/pushNotification');

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { text, parentComment } = req.body;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    // Validate parent comment if nested
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent || parent.post.toString() !== postId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid parent comment' 
        });
      }
    }

    const comment = await Comment.create({
      post: postId,
      user: req.userId,
      text,
      parentComment: parentComment || null
    });

    // Increment comment count on post
    post.commentsCount += 1;
    await post.save();

    await comment.populate('user', 'username fullName avatar isVerified');

    // Notify post owner
    if (post.user.toString() !== req.userId.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.userId,
        type: 'comment',
        post: postId,
        comment: comment._id
      });

      sendPushNotification(
        post.user,
        'New Comment',
        `${req.user.username} commented: "${text.substring(0, 50)}"`,
        { type: 'comment', postId: postId.toString() }
      );
    }

    // Notify parent comment author if replying
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent.user.toString() !== req.userId.toString()) {
        await Notification.create({
          recipient: parent.user,
          sender: req.userId,
          type: 'comment',
          post: postId,
          comment: comment._id
        });
      }
    }

    res.status(201).json({
      success: true,
      data: { comment }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
const getComments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get top-level comments
    const comments = await Comment.find({ 
      post: req.params.id,
      parentComment: null 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username fullName avatar isVerified')
    .lean();

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .sort({ createdAt: 1 })
          .limit(3)
          .populate('user', 'username fullName avatar isVerified')
          .lean();

        const totalReplies = await Comment.countDocuments({ parentComment: comment._id });

        return {
          ...comment,
          replies,
          totalReplies,
          isLiked: req.userId ? comment.likes.some(id => id.toString() === req.userId.toString()) : false
        };
      })
    );

    const total = await Comment.countDocuments({ 
      post: req.params.id, 
      parentComment: null 
    });

    res.json({
      success: true,
      data: {
        comments: commentsWithReplies,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/comments/:commentId
// @access  Private
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    // Allow comment author or post author to delete
    const post = await Post.findById(comment.post);
    if (
      comment.user.toString() !== req.userId.toString() &&
      post.user.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Delete nested replies
    const repliesCount = await Comment.countDocuments({ parentComment: comment._id });
    await Comment.deleteMany({ parentComment: comment._id });
    await Comment.findByIdAndDelete(req.params.commentId);

    // Update comment count on post
    post.commentsCount = Math.max(0, post.commentsCount - 1 - repliesCount);
    await post.save();

    res.json({ 
      success: true, 
      message: 'Comment deleted' 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like comment
// @route   POST /api/posts/comments/:commentId/like
// @access  Private
const likeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    const isLiked = comment.likes.includes(req.userId);

    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== req.userId.toString());
    } else {
      comment.likes.push(req.userId);
    }

    comment.likesCount = comment.likes.length;
    await comment.save();

    res.json({
      success: true,
      data: { 
        isLiked: !isLiked, 
        likesCount: comment.likesCount 
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment,
  likeComment
};
