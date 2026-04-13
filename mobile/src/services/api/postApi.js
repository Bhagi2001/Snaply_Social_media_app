import api from '../../config/api';

export const postApi = {
  createPost: (formData) => api.post('/posts', formData, {
    timeout: 120000, // 2 min for large uploads
  }),
  getFeed: (page = 1) => api.get(`/posts/feed?page=${page}`),
  getPost: (postId) => api.get(`/posts/${postId}`),
  updatePost: (postId, formData) => api.put(`/posts/${postId}`, formData, {
    timeout: 120000, // 2 min for large uploads
  }),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId) => api.delete(`/posts/${postId}/like`),
  savePost: (postId) => api.post(`/posts/${postId}/save`),
  unsavePost: (postId) => api.delete(`/posts/${postId}/save`),
  getExplorePosts: (page = 1) => api.get(`/posts/explore?page=${page}`),
  getPostsByHashtag: (tag, page = 1) => api.get(`/posts/hashtag/${tag}?page=${page}`),
  getSavedPosts: (page = 1) => api.get(`/posts/saved?page=${page}`),
  addComment: (postId, text, parentComment = null) => 
    api.post(`/posts/${postId}/comments`, { text, parentComment }),
  getComments: (postId, page = 1) => api.get(`/posts/${postId}/comments?page=${page}`),
  deleteComment: (commentId) => api.delete(`/posts/comments/${commentId}`),
  likeComment: (commentId) => api.post(`/posts/comments/${commentId}/like`),
};

export default postApi;
