import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import notificationApi from '../../services/api/notificationApi';
import GradientHeader from '../../components/GradientHeader';

const NotificationScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications();
      setNotifications(response.data.data.notifications);
      // Mark all as read
      notificationApi.markAllAsRead();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like': return 'liked your post.';
      case 'comment': return `commented: "${notification.comment?.text?.substring(0, 30) || ''}"`;
      case 'follow': return 'started following you.';
      case 'mention': return 'mentioned you in a comment.';
      default: return '';
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  const handlePress = (notification) => {
    if (notification.type === 'follow') {
      navigation.navigate('UserProfile', { username: notification.sender?.username });
    } else if (notification.post) {
      navigation.navigate('PostDetail', { postId: notification.post._id || notification.post });
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.isRead && { backgroundColor: colors.surfaceLight }]}
      onPress={() => handlePress(item)}
    >
      {item.sender?.avatar?.url ? (
        <Image source={{ uri: item.sender.avatar.url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={18} color={colors.textTertiary} />
        </View>
      )}

      <View style={styles.notifContent}>
        <Text style={[styles.notifText, { color: colors.text }]} numberOfLines={2}>
          <Text style={styles.notifUsername}>{item.sender?.username}</Text>
          {' '}{getNotificationText(item)}{' '}
          <Text style={{ color: colors.textTertiary }}>{getTimeAgo(item.createdAt)}</Text>
        </Text>
      </View>

      {item.post?.media?.[0]?.url && (
        <Image source={{ uri: item.post.media[0].url }} style={styles.postThumb} />
      )}

      {item.type === 'follow' && (
        <View style={[styles.followIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="person-add" size={14} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader title="Notifications" />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotification}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                When someone interacts with you, you'll see it here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  notifItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  notifContent: { flex: 1 },
  notifText: { fontSize: 14, lineHeight: 20 },
  notifUsername: { fontWeight: '700' },
  postThumb: { width: 44, height: 44, borderRadius: 4 },
  followIcon: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 15, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});

export default NotificationScreen;
