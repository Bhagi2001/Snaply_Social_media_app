import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CommentItem = ({ comment, onReply, currentUserId, navigation }) => {
  const { colors } = useTheme();

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.navigate('UserProfile', { username: comment.user?.username })}
      >
        {comment.user?.avatar?.url ? (
          <Image source={{ uri: comment.user.avatar.url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={14} color={colors.textTertiary} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.commentText, { color: colors.text }]}>
          <Text style={styles.username}>{comment.user?.username}</Text>{' '}
          {comment.text}
        </Text>

        <View style={styles.meta}>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {timeAgo(comment.createdAt)}
          </Text>
          {comment.likesCount > 0 && (
            <Text style={[styles.likesCount, { color: colors.textTertiary }]}>
              {comment.likesCount} {comment.likesCount === 1 ? 'like' : 'likes'}
            </Text>
          )}
          <TouchableOpacity onPress={() => onReply && onReply(comment)}>
            <Text style={[styles.replyBtn, { color: colors.textTertiary }]}>Reply</Text>
          </TouchableOpacity>
        </View>

        {/* Nested replies preview */}
        {comment.replies?.length > 0 && (
          <View style={styles.replies}>
            {comment.replies.map((reply) => (
              <View key={reply._id} style={styles.replyItem}>
                <Text style={[styles.commentText, { color: colors.text, fontSize: 13 }]}>
                  <Text style={styles.username}>{reply.user?.username}</Text>{' '}
                  {reply.text}
                </Text>
              </View>
            ))}
            {comment.totalReplies > comment.replies.length && (
              <Text style={[styles.viewMoreReplies, { color: colors.textTertiary }]}>
                View {comment.totalReplies - comment.replies.length} more replies
              </Text>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.likeButton}>
        <Ionicons
          name={comment.isLiked ? 'heart' : 'heart-outline'}
          size={14}
          color={comment.isLiked ? colors.heart : colors.textTertiary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  content: { flex: 1 },
  commentText: { fontSize: 14, lineHeight: 20 },
  username: { fontWeight: '700' },
  meta: { flexDirection: 'row', gap: 16, marginTop: 6 },
  time: { fontSize: 12 },
  likesCount: { fontSize: 12, fontWeight: '600' },
  replyBtn: { fontSize: 12, fontWeight: '600' },
  likeButton: { paddingTop: 4 },
  replies: { marginTop: 10, marginLeft: 4 },
  replyItem: { marginBottom: 8 },
  viewMoreReplies: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});

export default React.memo(CommentItem);
