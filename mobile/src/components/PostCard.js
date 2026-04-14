import React, { useState, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
  Animated, PanResponder, Alert, Platform, Modal,
  TextInput, FlatList, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import postApi from '../services/api/postApi';
import chatApi from '../services/api/chatApi';
import userApi from '../services/api/userApi';

// Instagram-style gradient palette used in the share modal
const IG_GRADIENT = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'];

const { width } = Dimensions.get('window');

const PostCard = ({ post, navigation, onLike, onSave, currentUserId, showFullCaption = false, onDeletePost, onEditPost }) => {
  const { colors } = useTheme();
  const [currentMedia, setCurrentMedia] = useState(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);
  const touchStartX = useRef(0);

  const [menuVisible, setMenuVisible] = useState(false);

  // ── Share modal state ──────────────────────────────────────────────────────
  const [shareVisible, setShareVisible] = useState(false);
  const [shareSearch, setShareSearch] = useState('');
  const [shareSearchResults, setShareSearchResults] = useState([]);
  const [friendsList, setFriendsList] = useState([]);        // people I follow
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [shareSearching, setShareSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
  const [shareSending, setShareSending] = useState(false);
  const [shareSentIds, setShareSentIds] = useState([]);

  const isOwnPost = post.user?._id === currentUserId || post.user === currentUserId;

  // ── Options menu ───────────────────────────────────────────────────────────
  const handleOptionsPress = () => setMenuVisible(true);

  const handleDeleteConfirm = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this post?')) executeDelete();
    } else {
      Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  const executeDelete = async () => {
    try {
      await postApi.deletePost(post._id);
      if (onDeletePost) onDeletePost(post._id);
    } catch (error) {
      console.error('Error deleting post:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to delete post');
      } else {
        Alert.alert('Error', 'Failed to delete post');
      }
    }
  };

  // ── Share helpers ──────────────────────────────────────────────────────────
  const openShare = async () => {
    setShareVisible(true);
    setShareSearch('');
    setShareSearchResults([]);
    setSelectedUsers([]);
    setShareMessage('');
    setShareSentIds([]);

    // Load the people I follow as "friends"
    if (!currentUserId) return;
    setLoadingFriends(true);
    try {
      const res = await userApi.getFollowing(currentUserId);
      // API returns array at res.data.data.following or res.data.data.users — handle both
      const users =
        res.data?.data?.following ||
        res.data?.data?.users ||
        res.data?.data ||
        [];
      setFriendsList(Array.isArray(users) ? users : []);
    } catch (e) {
      console.error('Load friends error', e);
      setFriendsList([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleShareSearch = async (query) => {
    setShareSearch(query);
    if (query.trim().length < 2) { setShareSearchResults([]); return; }
    setShareSearching(true);
    try {
      const res = await userApi.searchUsers(query);
      setShareSearchResults(res.data.data.users || []);
    } catch {
      setShareSearchResults([]);
    } finally {
      setShareSearching(false);
    }
  };

  const toggleSelectUser = (u) => {
    setSelectedUsers(prev =>
      prev.find(x => x._id === u._id)
        ? prev.filter(x => x._id !== u._id)
        : [...prev, u]
    );
  };

  const isSelected = (u) => !!selectedUsers.find(x => x._id === u._id);
  const isSent = (u) => shareSentIds.includes(u._id);

  const handleSendShare = async () => {
    if (selectedUsers.length === 0 || shareSending) return;
    setShareSending(true);

    // Structured share text — MessageBubble parses [SHARED_POST:id] to render a rich card
    const caption = post.caption
      ? post.caption.substring(0, 100) + (post.caption.length > 100 ? '...' : '')
      : '';
    const shareText = [
      `[SHARED_POST:${post._id}]`,
      `📸 @${post.user?.username}${caption ? ': ' + caption : ''}`,
      post.media?.[0]?.url || '',
      shareMessage.trim() || null,
    ].filter(Boolean).join('\n');

    const sentIds = [];
    for (const u of selectedUsers) {
      try {
        const convRes = await chatApi.getOrCreateConversation(u._id);
        const convId = convRes.data.data.conversation._id;
        const formData = new FormData();
        formData.append('text', shareText);
        await chatApi.sendMessage(convId, formData);
        sentIds.push(u._id);
      } catch (e) {
        console.error('Share send error', e);
      }
    }
    setShareSentIds(sentIds);
    setShareSending(false);
    setTimeout(() => {
      setShareVisible(false);
      setSelectedUsers([]);
      setShareSentIds([]);
    }, 1400);
  };

  // ── Carousel ───────────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dy) < 30,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) setCurrentMedia(prev => Math.min(prev + 1, (post.media?.length || 1) - 1));
        else if (g.dx > 50) setCurrentMedia(prev => Math.max(prev - 1, 0));
      },
    })
  ).current;

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!post.isLiked) onLike(post._id, false);
      showHeartAnim();
    }
    lastTap.current = now;
  };

  const showHeartAnim = () => {
    setShowHeart(true);
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 0, duration: 300, delay: 400, useNativeDriver: true }),
    ]).start(() => setShowHeart(false));
  };

  const timeAgo = (date) => {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const [captionExpanded, setCaptionExpanded] = useState(showFullCaption);

  // ── Friend avatar item (horizontal row) ───────────────────────────────────
  const FriendBubble = ({ user: u }) => {
    const sel = isSelected(u);
    const sent = isSent(u);
    return (
      <TouchableOpacity style={styles.friendBubble} onPress={() => toggleSelectUser(u)} activeOpacity={0.8}>
        <View style={[styles.friendAvatarWrap, sel && { borderColor: colors.primary, borderWidth: 2.5 }]}>
          {u.avatar?.url ? (
            <Image source={{ uri: u.avatar.url }} style={styles.friendAvatar} />
          ) : (
            <View style={[styles.friendAvatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={22} color={colors.textTertiary} />
            </View>
          )}
          {sel && (
            <View style={[styles.friendTick, { backgroundColor: colors.primary }]}>
              <Ionicons name={sent ? 'checkmark-done' : 'checkmark'} size={10} color="#FFF" />
            </View>
          )}
        </View>
        <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>{u.username}</Text>
      </TouchableOpacity>
    );
  };

  // ── Search result row ──────────────────────────────────────────────────────
  const SearchRow = ({ user: u }) => {
    const sel = isSelected(u);
    const sent = isSent(u);
    return (
      <TouchableOpacity
        style={[styles.searchRow, sel && { backgroundColor: colors.primary + '12' }]}
        onPress={() => toggleSelectUser(u)}
        activeOpacity={0.75}
      >
        {u.avatar?.url ? (
          <Image source={{ uri: u.avatar.url }} style={styles.searchAvatar} />
        ) : (
          <View style={[styles.searchAvatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={20} color={colors.textTertiary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.searchUsername, { color: colors.text }]}>{u.username}</Text>
          {u.fullName ? <Text style={[styles.searchFullName, { color: colors.textSecondary }]}>{u.fullName}</Text> : null}
        </View>
        <View style={[
          styles.selectCircle,
          { borderColor: sel ? colors.primary : colors.border },
          sel && { backgroundColor: colors.primary },
        ]}>
          {(sel || sent) && <Ionicons name={sent ? 'checkmark-done' : 'checkmark'} size={13} color="#FFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>

      {/* ════════ Share Post Modal ════════ */}
      <Modal
        visible={shareVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareVisible(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShareVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.shareSheet, { backgroundColor: colors.surface }]}>

            {/* ── Gradient banner header ── */}
            <LinearGradient
              colors={IG_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sheetGradientBanner}
            >
              <View style={styles.sheetHandleOnGradient} />
              <View style={styles.shareHeaderRow}>
                <View style={styles.sheetTitleRow}>
                  <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.sheetTitleWhite}>Send to</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShareVisible(false)}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* ── Search bar ── */}
            <LinearGradient
              colors={['#962FBF22', '#4F5BD522']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.searchBarGradientWrap}
            >
              <View style={[styles.searchBar, { backgroundColor: colors.inputBg || colors.surfaceLight, borderColor: '#962FBF55' }]}>
                <Ionicons name="search" size={16} color="#962FBF" style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search friends..."
                  placeholderTextColor={colors.textTertiary}
                  value={shareSearch}
                  onChangeText={handleShareSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {shareSearching ? (
                  <ActivityIndicator size="small" color="#D62976" />
                ) : shareSearch.length > 0 ? (
                  <TouchableOpacity onPress={() => { setShareSearch(''); setShareSearchResults([]); }}>
                    <Ionicons name="close-circle" size={16} color="#962FBF" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </LinearGradient>

            {/* ── Selected user chips (shown when users picked) ── */}
            {selectedUsers.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {selectedUsers.map(u => (
                  <TouchableOpacity
                    key={u._id}
                    style={[styles.chip, { backgroundColor: colors.primary }]}
                    onPress={() => toggleSelectUser(u)}
                  >
                    {u.avatar?.url
                      ? <Image source={{ uri: u.avatar.url }} style={styles.chipAvatar} />
                      : <Ionicons name="person" size={12} color="#FFF" />
                    }
                    <Text style={styles.chipText} numberOfLines={1}>{u.username}</Text>
                    <Ionicons name="close" size={11} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* ════ Friends section (horizontal bubbles) ════ */}
            {shareSearch.length < 2 && (
              <>
                {/* Colored "Friends" label */}
                <LinearGradient
                  colors={['#FEDA7522', '#FA7E1E22']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionLabelPill}
                >
                  <Ionicons name="people" size={13} color="#FA7E1E" style={{ marginRight: 5 }} />
                  <Text style={[styles.sectionLabelText, { color: '#FA7E1E' }]}>Friends</Text>
                </LinearGradient>

                {loadingFriends ? (
                  <View style={styles.friendsLoadWrap}>
                    <ActivityIndicator size="small" color="#D62976" />
                  </View>
                ) : friendsList.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.friendsScroll}
                  >
                    {friendsList.map(u => (
                      <FriendBubble key={u._id} user={u} />
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={[styles.noFriendsText, { color: colors.textTertiary }]}>
                    Follow people to share posts with them
                  </Text>
                )}

                {/* Gradient divider */}
                <LinearGradient
                  colors={IG_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientDivider}
                />

                {/* Colored "More people" label */}
                <LinearGradient
                  colors={['#4F5BD522', '#962FBF22']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sectionLabelPill}
                >
                  <Ionicons name="search" size={13} color="#4F5BD5" style={{ marginRight: 5 }} />
                  <Text style={[styles.sectionLabelText, { color: '#4F5BD5' }]}>More people</Text>
                </LinearGradient>
              </>
            )}

            {/* ════ Search results ════ */}
            {shareSearch.length >= 2 ? (
              shareSearchResults.length > 0 ? (
                <FlatList
                  data={shareSearchResults}
                  keyExtractor={item => item._id}
                  style={styles.searchList}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => <SearchRow user={item} />}
                />
              ) : !shareSearching ? (
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No users found</Text>
              ) : null
            ) : (
              /* Show full friends list vertically below the horizontal section */
              <FlatList
                data={friendsList}
                keyExtractor={item => item._id}
                style={styles.searchList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={!loadingFriends
                  ? <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Search to find more friends</Text>
                  : null
                }
                renderItem={({ item }) => <SearchRow user={item} />}
              />
            )}

            {/* ════ Message + Send ════ */}
            <View style={[styles.sendRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.messageInput, { color: colors.text, backgroundColor: colors.inputBg || colors.surfaceLight }]}
                placeholder="Write a message..."
                placeholderTextColor={colors.textTertiary}
                value={shareMessage}
                onChangeText={setShareMessage}
                maxLength={200}
              />
              <TouchableOpacity
                onPress={handleSendShare}
                disabled={selectedUsers.length === 0 || shareSending}
                activeOpacity={0.8}
                style={{ opacity: selectedUsers.length > 0 ? 1 : 0.45 }}
              >
                <LinearGradient
                  colors={selectedUsers.length > 0 ? IG_GRADIENT : [colors.surfaceLight, colors.surfaceLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendBtn}
                >
                  {shareSending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : shareSentIds.length > 0 ? (
                    <Ionicons name="checkmark-done" size={20} color="#FFF" />
                  ) : (
                    <Ionicons name="paper-plane" size={18} color={selectedUsers.length > 0 ? '#FFF' : colors.textTertiary} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Send count label */}
            {selectedUsers.length > 0 && !shareSending && shareSentIds.length === 0 && (
              <Text style={[styles.sendCount, { color: colors.primary }]}>
                Send to {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'}
              </Text>
            )}
            {shareSentIds.length > 0 && (
              <Text style={[styles.sendCount, { color: colors.primary }]}>
                ✓ Sent to {shareSentIds.length} {shareSentIds.length === 1 ? 'person' : 'people'}!
              </Text>
            )}

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ════════ Options Menu Modal ════════ */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.menuTitle, { color: colors.textSecondary }]}>Post Options</Text>

            {isOwnPost ? (
              <>
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setMenuVisible(false);
                    if (onEditPost) {
                      onEditPost(post);
                    } else {
                      navigation.navigate('EditPost', {
                        postId: post._id,
                        initialCaption: post.caption,
                        initialLocation: post.location,
                        media: post.media,
                      });
                    }
                  }}
                >
                  <Ionicons name="create-outline" size={20} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Post</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: colors.border }]}
                  onPress={() => { setMenuVisible(false); handleDeleteConfirm(); }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.heart} />
                  <Text style={[styles.menuItemText, { color: colors.heart }]}>Delete Post</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setMenuVisible(false);
                  if (Platform.OS === 'web') {
                    window.alert('Thank you for reporting this post.');
                  } else {
                    Alert.alert('Reported', 'Thank you for reporting this post.');
                  }
                }}
              >
                <Ionicons name="flag-outline" size={20} color={colors.heart} />
                <Text style={[styles.menuItemText, { color: colors.heart }]}>Report</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItemCancel}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={[styles.menuItemCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerUserPressable}
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
            {post.location
              ? <Text style={[styles.location, { color: colors.textSecondary }]}>{post.location}</Text>
              : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleOptionsPress}
          style={{ padding: 12 }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* ── Media ── */}
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
        <View>
          {post.media?.length > 1 ? (
            <View {...panResponder.panHandlers}>
              <Image source={{ uri: post.media[currentMedia]?.url }} style={styles.postImage} resizeMode="cover" />
              {currentMedia > 0 && (
                <TouchableOpacity
                  style={[styles.carouselArrow, styles.carouselArrowLeft]}
                  onPress={() => setCurrentMedia(prev => prev - 1)}
                >
                  <Ionicons name="chevron-back" size={22} color="#FFF" />
                </TouchableOpacity>
              )}
              {currentMedia < post.media.length - 1 && (
                <TouchableOpacity
                  style={[styles.carouselArrow, styles.carouselArrowRight]}
                  onPress={() => setCurrentMedia(prev => prev + 1)}
                >
                  <Ionicons name="chevron-forward" size={22} color="#FFF" />
                </TouchableOpacity>
              )}
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
          {showHeart && (
            <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartScale }], opacity: heartScale }]}>
              <Ionicons name="heart" size={80} color="#FFF" />
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>

      {/* ── Dots ── */}
      {post.media?.length > 1 && (
        <View style={styles.dotsContainer}>
          {post.media.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === currentMedia ? colors.primary : colors.textTertiary }]} />
          ))}
        </View>
      )}

      {/* ── Actions ── */}
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
          <TouchableOpacity style={styles.actionButton} onPress={openShare}>
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

      {/* ── Likes ── */}
      {post.likesCount > 0 && (
        <Text style={[styles.likes, { color: colors.text }]}>
          {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
        </Text>
      )}

      {/* ── Caption ── */}
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

      {/* ── Comments preview ── */}
      {post.commentsCount > 0 && (
        <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: post._id })}>
          <Text style={[styles.viewComments, { color: colors.textTertiary }]}>
            View all {post.commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Timestamp ── */}
      <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
        {timeAgo(post.createdAt)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Card ─────────────────────────────────────────────────────────────────
  container: { borderBottomWidth: 0.5, paddingBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, justifyContent: 'space-between' },
  headerUserPressable: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  headerInfo: { flex: 1 },
  usernameRow: { flexDirection: 'row', alignItems: 'center' },
  username: { fontSize: 14, fontWeight: '600' },
  location: { fontSize: 12, marginTop: 1 },
  postImage: { width, height: width, backgroundColor: '#1A1A1A' },
  heartOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  carouselArrow: {
    position: 'absolute', top: '50%', marginTop: -18,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  carouselArrowLeft: { left: 10 },
  carouselArrowRight: { right: 10 },
  mediaCounter: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  mediaCounterText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
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

  // ── Options menu ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center', zIndex: 999,
  },
  menuContainer: {
    width: Platform.OS === 'web' ? 350 : '100%',
    borderTopLeftRadius: Platform.OS === 'web' ? 16 : 20,
    borderTopRightRadius: Platform.OS === 'web' ? 16 : 20,
    borderRadius: Platform.OS === 'web' ? 16 : 0,
    paddingBottom: Platform.OS === 'web' ? 16 : 30,
    paddingTop: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25, shadowRadius: 5, elevation: 5,
  },
  menuTitle: { fontSize: 13, fontWeight: '600', textAlign: 'center', paddingVertical: 12 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 24,
    borderBottomWidth: 0.5, gap: 12,
  },
  menuItemText: { fontSize: 16, fontWeight: '500' },
  menuItemCancel: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 8 },
  menuItemCancelText: { fontSize: 16, fontWeight: '600' },

  // ── Share modal ───────────────────────────────────────────────────────────
  shareOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  shareSheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    maxHeight: '88%',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 16,
  },
  sheetHandle: {
    width: 38, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 14, opacity: 0.35,
  },
  // Gradient banner header
  sheetGradientBanner: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingTop: 10, paddingBottom: 14,
    marginBottom: 4,
  },
  sheetHandleOnGradient: {
    width: 38, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  shareHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  sheetTitleRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  sheetTitleWhite: { fontSize: 18, fontWeight: '700', letterSpacing: 0.2, color: '#FFF' },
  sheetTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Search bar
  searchBarGradientWrap: {
    marginHorizontal: 10, borderRadius: 16, padding: 2, marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: {
    flex: 1, fontSize: 15,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  // Selected chips scrollbar
  chipsScroll: {
    paddingHorizontal: 14, paddingBottom: 10, gap: 8, flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, gap: 5,
  },
  chipAvatar: { width: 16, height: 16, borderRadius: 8 },
  chipText: { color: '#FFF', fontSize: 13, fontWeight: '600', maxWidth: 90 },

  // Section labels (pill style)
  sectionLabel: {
    fontSize: 13, fontWeight: '600', letterSpacing: 0.3,
    paddingHorizontal: 16, marginBottom: 10,
  },
  sectionLabelPill: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginBottom: 10,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  sectionLabelText: {
    fontSize: 13, fontWeight: '700', letterSpacing: 0.3,
  },

  // Friends horizontal bubbles
  friendsScroll: {
    paddingHorizontal: 14, paddingBottom: 4, gap: 6, flexDirection: 'row',
  },
  friendBubble: {
    alignItems: 'center', width: 70, marginRight: 4,
  },
  friendAvatarWrap: {
    borderRadius: 36, borderWidth: 2, borderColor: 'transparent',
    padding: 2, position: 'relative',
  },
  friendAvatar: { width: 60, height: 60, borderRadius: 30 },
  friendTick: {
    position: 'absolute', bottom: 1, right: 1,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFF',
  },
  friendName: {
    fontSize: 12, fontWeight: '500', marginTop: 5,
    textAlign: 'center', width: 68,
  },
  friendsLoadWrap: { height: 80, justifyContent: 'center', alignItems: 'center' },

  // Divider
  divider: { height: 0.5, marginHorizontal: 16, marginVertical: 12 },
  gradientDivider: { height: 2, marginHorizontal: 16, marginVertical: 12, borderRadius: 1 },

  // Search result rows
  searchList: { maxHeight: 230 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16, gap: 12, borderRadius: 10,
  },
  searchAvatar: { width: 46, height: 46, borderRadius: 23 },
  searchUsername: { fontSize: 15, fontWeight: '600' },
  searchFullName: { fontSize: 13, marginTop: 1 },
  selectCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
  },
  emptyText: { textAlign: 'center', marginVertical: 20, fontSize: 14 },

  // Send row
  sendRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 12,
    borderTopWidth: 0.5, gap: 10, marginTop: 4,
  },
  messageInput: {
    flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  sendCount: {
    textAlign: 'center', fontSize: 13, fontWeight: '600',
    paddingTop: 8, paddingBottom: 4,
  },
});

export default React.memo(PostCard);
