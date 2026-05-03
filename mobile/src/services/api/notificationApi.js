import api from '../../config/api';

export const notificationApi = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAllAsRead: () => api.put('/notifications/read'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
};

export default notificationApi;
