import api from './api';

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all/');
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}/`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count/');
    return response.data;
  },

  subscribeToPush: async (subscription) => {
    const response = await api.post('/notifications/subscribe/', { subscription });
    return response.data;
  },

  unsubscribeFromPush: async () => {
    const response = await api.delete('/notifications/unsubscribe/');
    return response.data;
  },
};