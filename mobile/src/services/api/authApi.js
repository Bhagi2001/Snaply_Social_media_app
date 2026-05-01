import api from '../../config/api';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  updateFcmToken: (fcmToken) => api.put('/auth/fcm-token', { fcmToken }),
  logout: () => api.post('/auth/logout'),
};

export default authApi;
