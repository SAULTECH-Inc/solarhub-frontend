import api from '../lib/apiClient';

export const notificationsService = {
  registerToken:   (token, platform) => api.post('/notifications/register-token', { token, platform }),
  unregisterToken: (token)           => api.delete('/notifications/unregister-token', { data: { token } }),
  getAll:          (page = 1)        => api.get('/notifications', { params: { page } }),
  markRead:        (id)              => api.patch(`/notifications/${id}/read`),
  markAllRead:     ()                => api.post('/notifications/read-all'),
};
