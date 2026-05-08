import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import chatApi from '../../services/api/chatApi';
import userApi from '../../services/api/userApi';
import GradientHeader from '../../components/GradientHeader';

const ChatListScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { isUserOnline, socketService } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New message modal state
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchConversations();

    // Listen for real-time updates
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('conversation_update', handleConversationUpdate);
      return () => socket.off('conversation_update', handleConversationUpdate);
    }
  }, []);

  const handleConversationUpdate = (data) => {
    setConversations(prev =>
      prev.map(conv =>
        conv._id === data.conversationId
          ? { ...conv, lastMessage: data.lastMessage, unreadCount: data.unreadCount }
          : conv
      ).sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0))
    );
  };

  const fetchConversations = async () => {
    try {
      const response = await chatApi.getConversations();
      setConversations(response.data.data.conversations);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Search users for new conversation
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await userApi.searchUsers(query);
      setSearchResults(response.data.data.users || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Start conversation with selected user
  const startConversation = async (selectedUser) => {
    setShowNewMessage(false);
    setSearchQuery('');
    setSearchResults([]);

    try {
      const response = await chatApi.getOrCreateConversation(selectedUser._id);
      const conversation = response.data.data.conversation;
      navigation.navigate('ChatDetail', {
        conversationId: conversation._id,
        userId: selectedUser._id,
        username: selectedUser.username,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffHours = (now - d) / (1000 * 60 * 60);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffHours < 168) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }) => {
    const online = isUserOnline(item.user?._id);

    return (
      <TouchableOpacity
        style={styles.convItem}
        onPress={() => navigation.navigate('ChatDetail', {
          conversationId: item._id,
          userId: item.user?._id,
          username: item.user?.username,
        })}
      >
        <View style={styles.avatarWrapper}>
          {item.user?.avatar?.url ? (
            <Image source={{ uri: item.user.avatar.url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={22} color={colors.textTertiary} />
            </View>
          )}
          {online && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.convInfo}>
          <View style={styles.convHeader}>
            <Text style={[styles.convUsername, { color: colors.text }]} numberOfLines={1}>
              {item.user?.username || 'User'}
            </Text>
            <Text style={[styles.convTime, { color: colors.textTertiary }]}>
              {formatTime(item.lastMessage?.createdAt)}
            </Text>
          </View>
          <View style={styles.convFooter}>
            <Text
              style={[
                styles.convLastMsg,
                { color: item.unreadCount > 0 ? colors.text : colors.textSecondary },
                item.unreadCount > 0 && { fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {item.lastMessage?.text || 'Start a conversation'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader
        title="Messages"
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={() => setShowNewMessage(true)}>
            <Ionicons name="create-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchConversations(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Start a conversation with someone
              </Text>
              <TouchableOpacity
                style={[styles.startChatBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowNewMessage(true)}
              >
                <Text style={styles.startChatText}>New Message</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* New Message Modal */}
      <Modal
        visible={showNewMessage}
        animationType="slide"
        transparent={false}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <GradientHeader
            title="New Message"
            leftComponent={
              <TouchableOpacity onPress={() => { setShowNewMessage(false); setSearchQuery(''); setSearchResults([]); }}>
                <Text style={{ color: '#FFF', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            }
          />

          {/* Search Input */}
          <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
            <Text style={[styles.toLabel, { color: colors.textSecondary }]}>To:</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search users..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>

          {/* Search Results */}
          {searching ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => startConversation(item)}
                >
                  {item.avatar?.url ? (
                    <Image source={{ uri: item.avatar.url }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="person" size={18} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.username}</Text>
                    <Text style={[styles.userFullName, { color: colors.textSecondary }]}>{item.fullName}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length >= 2 ? (
                  <Text style={[styles.noResults, { color: colors.textTertiary }]}>No users found</Text>
                ) : (
                  <Text style={[styles.noResults, { color: colors.textTertiary }]}>
                    Type a username to search
                  </Text>
                )
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  convItem: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#2ED573', borderWidth: 2, borderColor: '#000',
  },
  convInfo: { flex: 1, marginLeft: 14 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convUsername: { fontSize: 15, fontWeight: '600', flex: 1 },
  convTime: { fontSize: 12, marginLeft: 8 },
  convFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  convLastMsg: { fontSize: 14, flex: 1 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  unreadText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 15, marginTop: 8 },
  startChatBtn: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8,
  },
  startChatText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  cancelText: { fontSize: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 0.5,
  },
  toLabel: { fontSize: 16, fontWeight: '600', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, outlineStyle: 'none' },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
  userAvatar: { width: 44, height: 44, borderRadius: 22 },
  userInfo: { marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '600' },
  userFullName: { fontSize: 13, marginTop: 2 },
  noResults: { textAlign: 'center', marginTop: 30, fontSize: 14 },
});

export default ChatListScreen;

