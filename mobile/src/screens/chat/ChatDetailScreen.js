import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import chatApi from '../../services/api/chatApi';
import MessageBubble from '../../components/MessageBubble';
import GradientHeader from '../../components/GradientHeader';

const ChatDetailScreen = ({ route, navigation }) => {
  const { conversationId: paramConvId, userId, username } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  const { joinConversation, leaveConversation, emitTyping, emitStopTyping, markAsRead, isUserOnline, socketService, typingUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState(paramConvId);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    initChat();
    return () => {
      if (conversationId) leaveConversation(conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !conversationId) return;

    const handleNewMessage = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
        markAsRead(conversationId);
      }
    };

    const handleTyping = (data) => {
      if (data.conversationId === conversationId) setIsTyping(true);
    };

    const handleStopTyping = (data) => {
      if (data.conversationId === conversationId) setIsTyping(false);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [conversationId]);

  const initChat = async () => {
    try {
      let convId = paramConvId;

      if (!convId && userId) {
        const response = await chatApi.getOrCreateConversation(userId);
        convId = response.data.data.conversation._id;
        setConversationId(convId);
      }

      if (convId) {
        joinConversation(convId);
        markAsRead(convId);
        const msgResponse = await chatApi.getMessages(convId);
        setMessages(msgResponse.data.data.messages);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !conversationId) return;

    const text = messageText.trim();
    setMessageText('');
    emitStopTyping(conversationId);

    try {
      const formData = new FormData();
      formData.append('text', text);
      await chatApi.sendMessage(conversationId, formData);
    } catch (error) {
      console.error('Error sending:', error);
    }
  };

  const handleTypingInput = (text) => {
    setMessageText(text);
    if (conversationId) {
      emitTyping(conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => emitStopTyping(conversationId), 2000);
    }
  };

  const online = isUserOnline(userId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={0}
    >
      <GradientHeader
        onBack={() => navigation.goBack()}
        centerComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile', { username })}
            style={{ alignItems: 'center' }}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>{username}</Text>
            <Text style={{ color: isTyping ? '#FFF' : online ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
              {isTyping ? 'typing...' : online ? 'Active now' : 'Offline'}
            </Text>
          </TouchableOpacity>
        }
      />

      {/* Messages */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.sender?._id === user?._id} navigation={navigation} />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyChatText, { color: colors.textSecondary }]}>
                Say hello! 👋
              </Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.messageInput, { color: colors.text, backgroundColor: colors.inputBg }]}
          placeholder="Message..."
          placeholderTextColor={colors.textTertiary}
          value={messageText}
          onChangeText={handleTypingInput}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!messageText.trim()}
          style={[styles.sendButton, messageText.trim() && { backgroundColor: colors.primary }]}
        >
          <Ionicons name="send" size={18} color={messageText.trim() ? '#FFF' : colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerUsername: { fontSize: 16, fontWeight: '700' },
  headerStatus: { fontSize: 12, marginTop: 2 },
  messageList: { padding: 16, flexGrow: 1 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyChatText: { fontSize: 16, marginTop: 12 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 12, borderTopWidth: 0.5, gap: 10,
  },
  messageInput: {
    flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, maxHeight: 100, outlineStyle: 'none',
  },
  sendButton: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
});

export default ChatDetailScreen;
