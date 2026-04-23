const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinaryUpload');

// @desc    Get all conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    })
    .populate('participants', 'username fullName avatar lastActive')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Format conversations
    const formatted = conversations.map(conv => {
      const otherUser = conv.participants.find(
        p => p._id.toString() !== req.userId.toString()
      );
      const unread = conv.unreadCount ? (conv.unreadCount.get(req.userId.toString()) || 0) : 0;

      return {
        _id: conv._id,
        user: otherUser,
        lastMessage: conv.lastMessage,
        unreadCount: unread,
        updatedAt: conv.updatedAt
      };
    });

    res.json({
      success: true,
      data: { conversations: formatted }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create conversation
// @route   POST /api/chat/conversations
// @access  Private
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID required' 
      });
    }

    if (userId === req.userId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot create conversation with yourself' 
      });
    }

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, userId] }
    })
    .populate('participants', 'username fullName avatar lastActive')
    .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.userId, userId]
      });
      await conversation.populate('participants', 'username fullName avatar lastActive');
    }

    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== req.userId.toString()
    );

    res.json({
      success: true,
      data: {
        conversation: {
          _id: conversation._id,
          user: otherParticipant,
          lastMessage: conversation.lastMessage,
          updatedAt: conversation.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username fullName avatar');

    const total = await Message.countDocuments({ conversation: req.params.id });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Oldest first for display
        pagination: {
          page, limit, total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;

    // Verify participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    let media = {};
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer, 
        'social-media/chat',
        'image'
      );
      media = { url: result.url, publicId: result.publicId, type: 'image' };
    }

    if (!text && !media.url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message text or image required' 
      });
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.userId,
      text: text || '',
      media,
      readBy: [req.userId]
    });

    await message.populate('sender', 'username fullName avatar');

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();

    // Increment unread count for other participants
    const otherParticipant = conversation.participants.find(
      p => p.toString() !== req.userId.toString()
    );
    const currentUnread = conversation.unreadCount ? 
      (conversation.unreadCount.get(otherParticipant.toString()) || 0) : 0;
    
    if (!conversation.unreadCount) conversation.unreadCount = new Map();
    conversation.unreadCount.set(otherParticipant.toString(), currentUnread + 1);
    
    await conversation.save();

    // Emit via Socket.IO (handled in socketHandler)
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('new_message', {
        message,
        conversationId: req.params.id
      });

      io.to(`user:${otherParticipant}`).emit('conversation_update', {
        conversationId: req.params.id,
        lastMessage: message
      });
    }

    res.status(201).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/messages/read/:conversationId
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.userId
    });

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found' 
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        sender: { $ne: req.userId },
        readBy: { $nin: [req.userId] }
      },
      { $push: { readBy: req.userId } }
    );

    // Reset unread count
    if (conversation.unreadCount) {
      conversation.unreadCount.set(req.userId.toString(), 0);
      await conversation.save();
    }

    res.json({ 
      success: true, 
      message: 'Messages marked as read' 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead
};
