const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Track online users: { userId: socketId }
const onlineUsers = new Map();

const setupSocket = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('username fullName avatar');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.username} (${socket.userId})`);

    // Track online status
    onlineUsers.set(socket.userId, socket.id);
    
    // Join personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Broadcast online status
    io.emit('user_online', { 
      userId: socket.userId,
      online: true 
    });

    // Update last active
    User.findByIdAndUpdate(socket.userId, { lastActive: new Date() }).exec();

    // ==========================================
    // CHAT EVENTS
    // ==========================================

    // Join a conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`💬 ${socket.user.username} joined conversation: ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send message via socket
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, text, tempId } = data;

        // Verify participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });

        if (!conversation) return;

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text: text || '',
          readBy: [socket.userId]
        });

        await message.populate('sender', 'username fullName avatar');

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();

        const otherParticipant = conversation.participants.find(
          p => p.toString() !== socket.userId
        );

        if (!conversation.unreadCount) conversation.unreadCount = new Map();
        const currentUnread = conversation.unreadCount.get(otherParticipant.toString()) || 0;
        conversation.unreadCount.set(otherParticipant.toString(), currentUnread + 1);
        
        await conversation.save();

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message,
          conversationId,
          tempId // For optimistic UI updates
        });

        // Notify other participant
        io.to(`user:${otherParticipant}`).emit('conversation_update', {
          conversationId,
          lastMessage: message,
          unreadCount: currentUnread + 1
        });

      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    // Typing indicators
    socket.on('typing', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username,
        conversationId
      });
    });

    socket.on('stop_typing', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId } = data;

        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.userId },
            readBy: { $nin: [socket.userId] }
          },
          { $push: { readBy: socket.userId } }
        );

        const conversation = await Conversation.findById(conversationId);
        if (conversation && conversation.unreadCount) {
          conversation.unreadCount.set(socket.userId, 0);
          await conversation.save();
        }

        // Notify the other user that messages were read
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: socket.userId
        });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // ==========================================
    // NOTIFICATION EVENTS
    // ==========================================

    // Get online status of users
    socket.on('get_online_status', (userIds) => {
      const statuses = userIds.map(id => ({
        userId: id,
        online: onlineUsers.has(id)
      }));
      socket.emit('online_statuses', statuses);
    });

    // ==========================================
    // DISCONNECT
    // ==========================================

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      
      onlineUsers.delete(socket.userId);

      // Broadcast offline status
      io.emit('user_online', { 
        userId: socket.userId, 
        online: false 
      });

      // Update last active
      User.findByIdAndUpdate(socket.userId, { lastActive: new Date() }).exec();
    });
  });

  return io;
};

// Helper to get online users (used by REST endpoints)
const getOnlineUsers = () => onlineUsers;

module.exports = { setupSocket, getOnlineUsers };
