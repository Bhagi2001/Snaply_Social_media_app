import api from '../../config/api';

export const userApi = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (formData) => api.put('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    transformRequest: (data) => data,
  }),
  changePassword: (data) => api.put('/users/security/password', data),
  getSettings: () => api.get('/users/settings'),
  updateSettings: (data) => api.put('/users/settings', data),
  getInteractionUsers: (type) => api.get(`/users/interactions/${type}`),
  updateInteractionUser: (type, targetId, action = 'add') => api.post(`/users/interactions/${type}/${targetId}`, { action }),
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.delete(`/users/${userId}/follow`),
  getFollowers: (userId, page = 1) => api.get(`/users/${userId}/followers?page=${page}`),
  getFollowing: (userId, page = 1) => api.get(`/users/${userId}/following?page=${page}`),
  searchUsers: (query) => api.get(`/users/search?q=${query}`),
  getSuggestedUsers: (limit = 10) => api.get(`/users/suggested?limit=${limit}`),
  getUserPosts: (username, page = 1) => api.get(`/users/${username}/posts?page=${page}`),
};

export default userApi;
