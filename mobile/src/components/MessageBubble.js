import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import postApi from '../services/api/postApi';

// Detect if a message text contains a shared-post marker
// Format: first line is "[SHARED_POST:<postId>]"
const parseSharedPost = (text = '') => {
  const match = text.match(/^\[SHARED_POST:([a-f0-9]{24})\]/i);
  if (!match) return null;
  const lines = text.split('\n');
  // line 0: marker, line 1: caption line, line 2: image url, line 3+: personal message
  return {
    postId: match[1],
    caption: lines[1] || '',          // "📸 @user: ..."
    imageUrl: lines[2] || '',
    personalMsg: lines.slice(3).join('\n').trim(),
  };
};

// Detect legacy snaply://post/<id> deep-link format in message text
const parseLegacyPostLink = (text = '') => {
  const match = text.match(/snaply:\/\/post\/([a-f0-9]{24})/i);
  if (!match) return null;
  return { postId: match[1] };
};

// ── Shared-Post Card ────────────────────────────────────────────────────────
const SharedPostCard = ({ parsed, isOwn, navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await postApi.getPost(parsed.postId);
        if (!cancelled) setPost(res.data.data.post || res.data.data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [parsed.postId]);

  const cardBg = isOwn ? 'rgba(255,255,255,0.15)' : colors.background;
  const borderColor = isOwn ? 'rgba(255,255,255,0.25)' : colors.border;
  const textColor = isOwn ? '#FFF' : colors.text;
  const subColor = isOwn ? 'rgba(255,255,255,0.75)' : colors.textSecondary;

  const imageSource =
    post?.media?.[0]?.url || parsed.imageUrl || null;

  const openPost = () => {
    if (!navigation || !parsed.postId) return;
    navigation.navigate('PostDetail', { postId: parsed.postId });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={openPost}
      style={[styles.postCard, { backgroundColor: cardBg, borderColor }]}
    >
      {/* Thumbnail */}
      {imageSource ? (
        <Image source={{ uri: imageSource }} style={styles.postThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.postThumb, styles.thumbPlaceholder, { backgroundColor: colors.surfaceLight }]}>
          <Ionicons name="image-outline" size={28} color={colors.textTertiary} />
        </View>
      )}

      {/* Info row */}
      <View style={styles.postCardBody}>
        {loading && !error ? (
          <ActivityIndicator size="small" color={isOwn ? '#FFF' : colors.primary} />
        ) : error ? (
          <Text style={[styles.postCardCaption, { color: subColor }]}>{parsed.caption}</Text>
        ) : (
          <>
            {/* Poster avatar + name */}
            <View style={styles.postCardAuthorRow}>
              {post?.user?.avatar?.url ? (
                <Image source={{ uri: post.user.avatar.url }} style={styles.postCardAvatar} />
              ) : (
                <View style={[styles.postCardAvatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={11} color={colors.textTertiary} />
                </View>
              )}
              <Text style={[styles.postCardAuthor, { color: textColor }]} numberOfLines={1}>
                {post?.user?.username || ''}
              </Text>
              {post?.user?.isVerified && (
                <Ionicons name="checkmark-circle" size={12} color="#536DFE" style={{ marginLeft: 3 }} />
              )}
            </View>

            {/* Caption */}
            {post?.caption ? (
              <Text style={[styles.postCardCaption, { color: subColor }]} numberOfLines={2}>
                {post.caption}
              </Text>
            ) : null}
          </>
        )}

        {/* "View Post" CTA */}
        <View style={[styles.viewPostBtn, { borderColor: isOwn ? 'rgba(255,255,255,0.5)' : colors.primary }]}>
          <Text style={[styles.viewPostText, { color: isOwn ? '#FFF' : colors.primary }]}>
            View Post
          </Text>
          <Ionicons
            name="chevron-forward"
            size={13}
            color={isOwn ? '#FFF' : colors.primary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Main MessageBubble ──────────────────────────────────────────────────────
const MessageBubble = ({ message, isOwn, navigation }) => {
  const { colors } = useTheme();

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sharedPost = parseSharedPost(message.text);
  const legacyLink = !sharedPost ? parseLegacyPostLink(message.text) : null;

  // Personal message that comes after the shared-post block
  const personalMsg = sharedPost?.personalMsg || '';

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? [styles.ownBubble, { backgroundColor: '#E040FB' }]
            : [styles.otherBubble, { backgroundColor: colors.surfaceLight }],
          // Make shared-post bubbles slightly wider
          sharedPost && styles.sharedBubble,
        ]}
      >
        {/* Regular media */}
        {message.media?.url && (
          <Image source={{ uri: message.media.url }} style={styles.mediaImage} resizeMode="cover" />
        )}

        {/* Shared post card (new format) */}
        {sharedPost ? (
          <>
            <SharedPostCard parsed={sharedPost} isOwn={isOwn} navigation={navigation} />
            {personalMsg ? (
              <Text style={[styles.messageText, { color: isOwn ? '#FFF' : colors.text, marginTop: 6 }]}>
                {personalMsg}
              </Text>
            ) : null}
          </>
        ) : legacyLink ? (
          /* Legacy snaply://post/<id> format — render as tappable card */
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('PostDetail', { postId: legacyLink.postId })}
            style={[
              styles.legacyLinkBtn,
              { borderColor: isOwn ? 'rgba(255,255,255,0.4)' : colors.primary },
            ]}
          >
            {/* Show any text before/after the link */}
            {message.text.replace(/snaply:\/\/post\/[a-f0-9]{24}/i, '').trim() ? (
              <Text style={[styles.messageText, { color: isOwn ? '#FFF' : colors.text, marginBottom: 6 }]}>
                {message.text.replace(/snaply:\/\/post\/[a-f0-9]{24}/i, '').trim()}
              </Text>
            ) : null}
            <View style={styles.legacyLinkRow}>
              <Ionicons
                name="albums-outline"
                size={15}
                color={isOwn ? '#FFF' : colors.primary}
              />
              <Text style={[styles.legacyLinkText, { color: isOwn ? '#FFF' : colors.primary }]}>
                View Shared Post
              </Text>
              <Ionicons
                name="chevron-forward"
                size={13}
                color={isOwn ? 'rgba(255,255,255,0.7)' : colors.primary}
              />
            </View>
          </TouchableOpacity>
        ) : (
          /* Normal text message */
          message.text ? (
            <Text style={[styles.messageText, { color: isOwn ? '#FFF' : colors.text }]}>
              {message.text}
            </Text>
          ) : null
        )}

        <Text style={[styles.time, { color: isOwn ? 'rgba(255,255,255,0.65)' : colors.textTertiary }]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 3, paddingHorizontal: 4 },
  ownContainer: { alignItems: 'flex-end' },
  otherContainer: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    padding: 10,
    borderRadius: 18,
  },
  sharedBubble: {
    maxWidth: '82%',
    padding: 8,
  },
  ownBubble: { borderBottomRightRadius: 4 },
  otherBubble: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 21 },
  time: { fontSize: 11, marginTop: 5, alignSelf: 'flex-end' },
  mediaImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 6 },

  // ── Shared post card ──
  postCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    width: 240,
  },
  postThumb: {
    width: '100%',
    height: 150,
  },
  thumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCardBody: {
    padding: 10,
    gap: 6,
  },
  postCardAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postCardAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  postCardAuthor: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  postCardCaption: {
    fontSize: 12,
    lineHeight: 17,
  },
  viewPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 2,
  },
  viewPostText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Legacy snaply://post/<id> link ──
  legacyLinkBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  legacyLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legacyLinkText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
});

export default React.memo(MessageBubble);
