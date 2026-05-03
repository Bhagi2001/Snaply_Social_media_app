import api from '../../config/api';

export const storyApi = {
  createStory: (formData) => api.post('/stories', formData, {
    timeout: 60000,
  }),
  getStories: () => api.get('/stories'),
  getMyStories: () => api.get('/stories/mine'),
  viewStory: (storyId) => api.post(`/stories/${storyId}/view`),
  deleteStory: (storyId) => api.delete(`/stories/${storyId}`),
};

export default storyApi;
