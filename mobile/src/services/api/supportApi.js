import api from '../../config/api';

export const supportApi = {
  createTicket: (data) => api.post('/support/tickets', data),
  getMyTickets: () => api.get('/support/tickets'),
};

export default supportApi;
