const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const { sendPushNotification } = require('../utils/pushNotification');

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .select('-savedPosts -refreshToken');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get post count
    const postsCount = await Post.countDocuments({ user: user._id, isArchived: false });

    // Check follow status if authenticated
    let isFollowing = false;
    let isFollowedBy = false;
    if (req.userId) {
      isFollowing = user.followers.includes(req.userId);
      isFollowedBy = user.following.includes(req.userId);
    }

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          postsCount,
          followersCount: user.followers.length,
          followingCount: user.following.length,
          isFollowing,
          isFollowedBy
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, website, username } = req.body;
    const updates = {};

    if (fullName !== undefined) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (website !== undefined) updates.website = website;
    
    if (username !== undefined) {
      // Check uniqueness
      const existing = await User.findOne({ 
        username: username.toLowerCase(), 
        _id: { $ne: req.userId } 
      });
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already taken' 
        });
      }
      updates.username = username.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(
      req.userId, 
      updates, 
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change current user password
// @route   PUT /api/users/security/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password and confirmation are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload/update avatar
// @route   PUT /api/users/avatar
// @access  Private
const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide an image' 
      });
    }

    const user = await User.findById(req.userId);

    // Delete old avatar if exists
    if (user.avatar && user.avatar.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }

    // Upload new avatar
    const result = await uploadToCloudinary(
      req.file.buffer, 
      'social-media/avatars', 
      'image'
    );

    user.avatar = { url: result.url, publicId: result.publicId };
    await user.save();

    res.json({
      success: true,
      message: 'Avatar updated',
      data: { avatar: user.avatar }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    
    if (!userToFollow) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot follow yourself' 
      });
    }

    // Check if already following
    if (userToFollow.followers.includes(req.userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already following this user' 
      });
    }

    // Add to followers/following
    await User.findByIdAndUpdate(req.params.id, {
      $push: { followers: req.userId }
    });

    await User.findByIdAndUpdate(req.userId, {
      $push: { following: req.params.id }
    });

    // Create notification
    await Notification.create({
      recipient: req.params.id,
      sender: req.userId,
      type: 'follow'
    });

    // Send push notification
    sendPushNotification(
      req.params.id,
      'New Follower',
      `${req.user.username} started following you`,
      { type: 'follow', userId: req.userId.toString() }
    );

    res.json({ 
      success: true, 
      message: 'User followed successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow user
// @route   DELETE /api/users/:id/follow
// @access  Private
const unfollowUser = async (req, res, next) => {
  try {
    if (req.params.id === req.userId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot unfollow yourself' 
      });
    }

    await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.userId }
    });

    await User.findByIdAndUpdate(req.userId, {
      $pull: { following: req.params.id }
    });

    res.json({ 
      success: true, 
      message: 'User unfollowed successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get followers
// @route   GET /api/users/:id/followers
// @access  Private
const getFollowers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id)
      .populate({
        path: 'followers',
        select: 'username fullName avatar isVerified',
        options: { skip, limit }
      });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: {
        followers: user.followers,
        total: user.followers.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get following
// @route   GET /api/users/:id/following
// @access  Private
const getFollowing = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id)
      .populate({
        path: 'following',
        select: 'username fullName avatar isVerified',
        options: { skip, limit }
      });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: {
        following: user.following,
        total: user.following.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search?q=query
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 20;

    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: { users: [] } });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.userId }
    })
    .select('username fullName avatar isVerified')
    .limit(limit);

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suggested users
// @route   GET /api/users/suggested
// @access  Private
const getSuggestedUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.userId);
    const limit = parseInt(req.query.limit) || 10;

    // Find users not followed by current user
    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: { 
            $nin: [...currentUser.following, req.userId] 
          }
        }
      },
      // Prioritize users with mutual followers
      {
        $addFields: {
          mutualFollowers: {
            $size: {
              $setIntersection: ['$followers', currentUser.following]
            }
          }
        }
      },
      { $sort: { mutualFollowers: -1, followersCount: -1 } },
      { $limit: limit },
      { 
        $project: { 
          username: 1, 
          fullName: 1, 
          avatar: 1, 
          isVerified: 1,
          mutualFollowers: 1,
          followers: { $size: '$followers' }
        } 
      }
    ]);

    res.json({
      success: true,
      data: { users: suggestedUsers }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user posts
// @route   GET /api/users/:username/posts
// @access  Public
const getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: user._id, isArchived: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username fullName avatar isVerified');

    const total = await Post.countDocuments({ user: user._id, isArchived: false });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user settings
// @route   GET /api/users/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('isPrivate privacySettings securitySettings notificationSettings blockedUsers mutedUsers restrictedUsers');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        settings: {
          privacy: {
            privateAccount: user.isPrivate,
            activityStatus: user.privacySettings?.activityStatus ?? true,
            storyReplies: user.privacySettings?.storyReplies ?? true,
          },
          security: {
            twoFactor: user.securitySettings?.twoFactor ?? false,
            loginAlerts: user.securitySettings?.loginAlerts ?? true,
            saveLoginInfo: user.securitySettings?.saveLoginInfo ?? true,
          },
          notifications: {
            likes: user.notificationSettings?.likes ?? true,
            comments: user.notificationSettings?.comments ?? true,
            follows: user.notificationSettings?.follows ?? true,
            messages: user.notificationSettings?.messages ?? true,
            mentions: user.notificationSettings?.mentions ?? true,
          },
        },
        interactionCounts: {
          blocked: user.blockedUsers?.length || 0,
          muted: user.mutedUsers?.length || 0,
          restricted: user.restrictedUsers?.length || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user settings
// @route   PUT /api/users/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    const { privacy = {}, security = {}, notifications = {} } = req.body;

    const updates = {};

    if (privacy.privateAccount !== undefined) {
      updates.isPrivate = !!privacy.privateAccount;
    }
    if (privacy.activityStatus !== undefined) {
      updates['privacySettings.activityStatus'] = !!privacy.activityStatus;
    }
    if (privacy.storyReplies !== undefined) {
      updates['privacySettings.storyReplies'] = !!privacy.storyReplies;
    }

    if (security.twoFactor !== undefined) {
      updates['securitySettings.twoFactor'] = !!security.twoFactor;
    }
    if (security.loginAlerts !== undefined) {
      updates['securitySettings.loginAlerts'] = !!security.loginAlerts;
    }
    if (security.saveLoginInfo !== undefined) {
      updates['securitySettings.saveLoginInfo'] = !!security.saveLoginInfo;
    }

    if (notifications.likes !== undefined) {
      updates['notificationSettings.likes'] = !!notifications.likes;
    }
    if (notifications.comments !== undefined) {
      updates['notificationSettings.comments'] = !!notifications.comments;
    }
    if (notifications.follows !== undefined) {
      updates['notificationSettings.follows'] = !!notifications.follows;
    }
    if (notifications.messages !== undefined) {
      updates['notificationSettings.messages'] = !!notifications.messages;
    }
    if (notifications.mentions !== undefined) {
      updates['notificationSettings.mentions'] = !!notifications.mentions;
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true });

    res.json({
      success: true,
      message: 'Settings updated',
      data: {
        settings: {
          privacy: {
            privateAccount: user.isPrivate,
            activityStatus: user.privacySettings?.activityStatus ?? true,
            storyReplies: user.privacySettings?.storyReplies ?? true,
          },
          security: {
            twoFactor: user.securitySettings?.twoFactor ?? false,
            loginAlerts: user.securitySettings?.loginAlerts ?? true,
            saveLoginInfo: user.securitySettings?.saveLoginInfo ?? true,
          },
          notifications: {
            likes: user.notificationSettings?.likes ?? true,
            comments: user.notificationSettings?.comments ?? true,
            follows: user.notificationSettings?.follows ?? true,
            messages: user.notificationSettings?.messages ?? true,
            mentions: user.notificationSettings?.mentions ?? true,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const mapInteractionType = (type) => {
  if (type === 'blocked') return 'blockedUsers';
  if (type === 'muted') return 'mutedUsers';
  if (type === 'restricted') return 'restrictedUsers';
  return null;
};

// @desc    Get interaction users by type
// @route   GET /api/users/interactions/:type
// @access  Private
const getInteractionUsers = async (req, res, next) => {
  try {
    const field = mapInteractionType(req.params.type);
    if (!field) {
      return res.status(400).json({ success: false, message: 'Invalid interaction type' });
    }

    const user = await User.findById(req.userId).populate({
      path: field,
      select: 'username fullName avatar isVerified',
    });

    res.json({
      success: true,
      data: {
        users: user?.[field] || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add/remove user from interaction list
// @route   POST /api/users/interactions/:type/:targetId
// @access  Private
const updateInteractionUser = async (req, res, next) => {
  try {
    const field = mapInteractionType(req.params.type);
    if (!field) {
      return res.status(400).json({ success: false, message: 'Invalid interaction type' });
    }

    const { action = 'add' } = req.body;
    const targetId = req.params.targetId;

    if (targetId === req.userId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot update your own interaction state' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const op = action === 'remove' ? '$pull' : '$addToSet';
    await User.findByIdAndUpdate(req.userId, {
      [op]: { [field]: targetId },
    });

    res.json({
      success: true,
      message: action === 'remove' ? 'Removed successfully' : 'Updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 1. Delete user avatar from Cloudinary if exists
    if (user.avatar && user.avatar.publicId) {
      await deleteFromCloudinary(user.avatar.publicId, 'image');
    }

    // 2. Find all user's posts to delete their media from Cloudinary
    const posts = await Post.find({ user: userId });
    const Comment = require('../models/Comment');
    for (const post of posts) {
      if (post.media && Array.isArray(post.media)) {
        for (const media of post.media) {
          if (media && media.publicId) {
            const resourceType = media.type === 'video' ? 'video' : 'image';
            await deleteFromCloudinary(media.publicId, resourceType);
          }
        }
      }
      // Delete all comments on this post
      await Comment.deleteMany({ post: post._id });
    }

    // 3. Delete all user's posts from database
    await Post.deleteMany({ user: userId });

    // 4. Delete all user's comments from database
    await Comment.deleteMany({ user: userId });

    // 5. Delete all user's stories from database and Cloudinary
    const Story = require('../models/Story');
    const stories = await Story.find({ user: userId });
    for (const story of stories) {
      if (story.media && story.media.publicId) {
        const resourceType = story.media.type === 'video' ? 'video' : 'image';
        await deleteFromCloudinary(story.media.publicId, resourceType);
      }
    }
    await Story.deleteMany({ user: userId });

    // 6. Delete all notifications associated with the user
    await Notification.deleteMany({
      $or: [{ recipient: userId }, { sender: userId }]
    });

    // 7. Delete all chat messages and conversations
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');
    
    const conversations = await Conversation.find({
      participants: userId
    });
    
    for (const conv of conversations) {
      // Delete all messages in the conversation
      await Message.deleteMany({ conversation: conv._id });
    }
    // Delete the conversations
    await Conversation.deleteMany({ participants: userId });

    // 8. Remove from followers/following of other users
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );

    // 9. Remove user posts from other users' saved posts
    const postIds = posts.map(p => p._id);
    if (postIds.length > 0) {
      await User.updateMany(
        { savedPosts: { $in: postIds } },
        { $pull: { savedPosts: { $in: postIds } } }
      );
    }

    // 10. Delete the user document itself
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account and all associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  changePassword,
  updateProfile,
  updateAvatar,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers,
  getUserPosts,
  getSettings,
  updateSettings,
  getInteractionUsers,
  updateInteractionUser,
  deleteAccount
};
