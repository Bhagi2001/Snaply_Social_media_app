import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, accessToken } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => disconnectSocket();
  }, [isAuthenticated, accessToken]);

  const connectSocket = () => {
    const socket = socketService.connect(accessToken);
    socketRef.current = socket;

    socket.on('user_online', ({ userId, online }) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        if (online) {
          updated.add(userId);
        } else {
          updated.delete(userId);
        }
        return updated;
      });
    });

    socket.on('user_typing', ({ userId, conversationId }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: userId
      }));
    });

    socket.on('user_stop_typing', ({ conversationId }) => {
      setTypingUsers(prev => {
        const updated = { ...prev };
        delete updated[conversationId];
        return updated;
      });
    });
  };

  const disconnectSocket = () => {
    socketService.disconnect();
    socketRef.current = null;
  };

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  const joinConversation = useCallback((conversationId) => {
    socketService.emit('join_conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    socketService.emit('leave_conversation', conversationId);
  }, []);

  const sendMessage = useCallback((data) => {
    socketService.emit('send_message', data);
  }, []);

  const emitTyping = useCallback((conversationId) => {
    socketService.emit('typing', { conversationId });
  }, []);

  const emitStopTyping = useCallback((conversationId) => {
    socketService.emit('stop_typing', { conversationId });
  }, []);

  const markAsRead = useCallback((conversationId) => {
    socketService.emit('mark_read', { conversationId });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        onlineUsers,
        typingUsers,
        isUserOnline,
        joinConversation,
        leaveConversation,
        sendMessage,
        emitTyping,
        emitStopTyping,
        markAsRead,
        socketService,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
