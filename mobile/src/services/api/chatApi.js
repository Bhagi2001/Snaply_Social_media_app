import api from '../../config/api';

export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateConversation: (userId) => api.post('/chat/conversations', { userId }),
  getMessages: (conversationId, page = 1) => 
    api.get(`/chat/conversations/${conversationId}/messages?page=${page}`),
  sendMessage: (conversationId, formData) => 
    api.post(`/chat/conversations/${conversationId}/messages`, formData),
  markAsRead: (conversationId) => api.put(`/chat/messages/read/${conversationId}`),
};

export default chatApi;
