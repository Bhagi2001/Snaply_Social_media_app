import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import postApi from '../../services/api/postApi';
import PostCard from '../../components/PostCard';
import CommentItem from '../../components/CommentItem';
import GradientHeader from '../../components/GradientHeader';

const PostDetailScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await postApi.getPost(postId);
      setPost(response.data.data.post);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await postApi.getComments(postId);
      setComments(response.data.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      await postApi.addComment(postId, commentText.trim(), replyTo?._id);
      setCommentText('');
      setReplyTo(null);
      fetchComments();
      // Update comment count on post
      setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = useCallback(async (id, isLiked) => {
    try {
      if (isLiked) await postApi.unlikePost(id);
      else await postApi.likePost(id);
      setPost(prev =>
        prev ? {
          ...prev,
          isLiked: !isLiked,
          likesCount: isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
        } : prev
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, []);

  const handleSave = useCallback(async (id, isSaved) => {
    try {
      if (isSaved) await postApi.unsavePost(id);
      else await postApi.savePost(id);
      setPost(prev => prev ? { ...prev, isSaved: !isSaved } : prev);
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  }, []);
  const handleDeletePost = useCallback((deletedPostId) => {
    navigation.goBack();
  }, [navigation]);

  const handleEditPost = useCallback((postToEdit) => {
    navigation.navigate('EditPost', {
      postId: postToEdit._id,
      initialCaption: postToEdit.caption,
      initialLocation: postToEdit.location,
      media: postToEdit.media,
      onUpdate: (updatedPost) => {
        setPost(prev => prev ? {
          ...prev,
          caption: updatedPost.caption,
          location: updatedPost.location,
        } : prev);
      }
    });
  }, [navigation]);


  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <GradientHeader
        title="Post"
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={() =>
          post ? (
            <PostCard
              post={post}
              navigation={navigation}
              onLike={handleLike}
              onSave={handleSave}
              currentUserId={user?._id}
              showFullCaption
              onDeletePost={handleDeletePost}
              onEditPost={handleEditPost}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            onReply={(comment) => {
              setReplyTo(comment);
              setCommentText(`@${comment.user.username} `);
            }}
            currentUserId={user?._id}
            navigation={navigation}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Comment Input */}
      <View style={[styles.commentInputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {replyTo && (
          <View style={styles.replyBanner}>
            <Text style={[styles.replyText, { color: colors.textSecondary }]}>
              Replying to <Text style={{ color: colors.primary }}>@{replyTo.user.username}</Text>
            </Text>
            <TouchableOpacity onPress={() => { setReplyTo(null); setCommentText(''); }}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.commentInput, { color: colors.text, backgroundColor: colors.inputBg }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name="send"
                size={24}
                color={commentText.trim() ? colors.primary : colors.textTertiary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  commentInputContainer: {
    borderTopWidth: 0.5,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    paddingTop: 8,
  },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  replyText: { fontSize: 13 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
});

export default PostDetailScreen;
