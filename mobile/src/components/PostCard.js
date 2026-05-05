import React, { useState, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
  Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const PostCard = ({ post, navigation, onLike, onSave, currentUserId, showFullCaption = false }) => {
  const { colors } = useTheme();
  const [currentMedia, setCurrentMedia] = useState(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);
  const touchStartX = useRef(0);

  // Swipe gesture for carousel
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // Swipe left → next image
          setCurrentMedia(prev => Math.min(prev + 1, (post.media?.length || 1) - 1));
        } else if (gestureState.dx > 50) {
          // Swipe right → previous image
          setCurrentMedia(prev => Math.max(prev - 1, 0));
        }
      },
    })
  ).current;

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap - like
      if (!post.isLiked) {
        onLike(post._id, false);
      }
      showHeartAnimation();
    }
    lastTap.current = now;
  };

  const showHeartAnimation = () => {
    setShowHeart(true);
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 300,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setShowHeart(false));
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const [captionExpanded, setCaptionExpanded] = useState(showFullCaption);

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => navigation.navigate('UserProfile', { username: post.user?.username })}
      >
        {post.user?.avatar?.url ? (
          <Image source={{ uri: post.user.avatar.url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={16} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <View style={styles.usernameRow}>
            <Text style={[styles.username, { color: colors.text }]}>{post.user?.username}</Text>
            {post.user?.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color="#536DFE" style={{ marginLeft: 4 }} />
            )}
          </View>
          {post.location ? (
            <Text style={[styles.location, { color: colors.textSecondary }]}>{post.location}</Text>
          ) : null}
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
      </TouchableOpacity>

      {/* Media */}
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
        <View>
          {post.media?.length > 1 ? (
            <View {...panResponder.panHandlers}>
              <Image
                source={{ uri: post.media[currentMedia]?.url }}
                style={styles.postImage}
                resizeMode="cover"
              />
              {/* Left arrow */}
              {currentMedia > 0 && (
                <TouchableOpacity
                  style={[styles.carouselArrow, styles.carouselArrowLeft]}
                  onPress={() => setCurrentMedia(prev => prev - 1)}
                >
                  <Ionicons name="chevron-back" size={22} color="#FFF" />
                </TouchableOpacity>
              )}
              {/* Right arrow */}
              {currentMedia < post.media.length - 1 && (
                <TouchableOpacity
                  style={[styles.carouselArrow, styles.carouselArrowRight]}
                  onPress={() => setCurrentMedia(prev => prev + 1)}
                >
                  <Ionicons name="chevron-forward" size={22} color="#FFF" />
                </TouchableOpacity>
              )}
              {/* Counter */}
              <View style={styles.mediaCounter}>
                <Text style={styles.mediaCounterText}>{currentMedia + 1}/{post.media.length}</Text>
              </View>
            </View>
          ) : (
            <Image
              source={{ uri: post.media?.[0]?.url || 'https://via.placeholder.com/400' }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}

          {/* Double-tap heart */}
          {showHeart && (
            <Animated.View
              style={[
                styles.heartOverlay,
                {
                  transform: [{ scale: heartScale }],
                  opacity: heartScale,
                },
              ]}
            >
              <Ionicons name="heart" size={80} color="#FFF" />
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>

      {/* Media dots */}
      {post.media?.length > 1 && (
        <View style={styles.dotsContainer}>
          {post.media.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentMedia ? colors.primary : colors.textTertiary },
              ]}
            />
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={() => onLike(post._id, post.isLiked)} style={styles.actionButton}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={26}
              color={post.isLiked ? colors.heart : colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('PostDetail', { postId: post._id })}
            style={styles.actionButton}
          >
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ChatList')}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => onSave(post._id, post.isSaved)}>
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Likes */}
      {post.likesCount > 0 && (
        <Text style={[styles.likes, { color: colors.text }]}>
          {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
        </Text>
      )}

      {/* Caption */}
      {post.caption ? (
        <View style={styles.captionContainer}>
          <Text style={[styles.captionText, { color: colors.text }]} numberOfLines={captionExpanded ? undefined : 2}>
            <Text style={styles.captionUsername}>{post.user?.username}</Text>{' '}
            {post.caption}
          </Text>
          {!captionExpanded && post.caption.length > 100 && (
            <TouchableOpacity onPress={() => setCaptionExpanded(true)}>
              <Text style={[styles.moreText, { color: colors.textTertiary }]}>more</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* Comments preview */}
      {post.commentsCount > 0 && (
        <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: post._id })}>
          <Text style={[styles.viewComments, { color: colors.textTertiary }]}>
            View all {post.commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* Timestamp */}
      <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
        {timeAgo(post.createdAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderBottomWidth: 0.5, paddingBottom: 8 },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  headerInfo: { flex: 1 },
  usernameRow: { flexDirection: 'row', alignItems: 'center' },
  username: { fontSize: 14, fontWeight: '600' },
  location: { fontSize: 12, marginTop: 1 },
  postImage: {
    width,
    height: width,
    backgroundColor: '#1A1A1A',
  },
  heartOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row', justifyContent: 'center', paddingVertical: 8, gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  carouselArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  carouselArrowLeft: {
    left: 10,
  },
  carouselArrowRight: {
    right: 10,
  },
  mediaCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediaCounterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  leftActions: { flexDirection: 'row', gap: 4 },
  actionButton: { padding: 4 },
  likes: { paddingHorizontal: 14, fontSize: 14, fontWeight: '700' },
  captionContainer: { paddingHorizontal: 14, marginTop: 4 },
  captionText: { fontSize: 14, lineHeight: 20 },
  captionUsername: { fontWeight: '700' },
  moreText: { fontSize: 14, marginTop: 2 },
  viewComments: { paddingHorizontal: 14, marginTop: 6, fontSize: 14 },
  timestamp: { paddingHorizontal: 14, marginTop: 4, fontSize: 11 },
});

export default React.memo(PostCard);
