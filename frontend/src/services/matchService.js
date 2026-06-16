import api from './api';

export const matchService = {
  like: async (userId) => {
    const response = await api.post('/likes/', { user_id: userId });
    return response.data;
  },

  unlike: async (userId) => {
    const response = await api.delete(`/likes/${userId}/`);
    return response.data;
  },

  getMatches: async () => {
    const response = await api.get('/matches/');
    return response.data;
  },

  getMatch: async (matchId) => {
    const response = await api.get(`/matches/${matchId}/`);
    return response.data;
  },

  getLikes: async () => {
    const response = await api.get('/likes/');
    return response.data;
  },

  getLikedBy: async () => {
    const response = await api.get('/likes/received/');
    return response.data;
  },

  report: async (data) => {
    const response = await api.post('/reports/', data);
    return response.data;
  },

  block: async (userId) => {
    const response = await api.post(`/blocks/${userId}/`);
    return response.data;
  },

  unblock: async (userId) => {
    const response = await api.delete(`/blocks/${userId}/`);
    return response.data;
  },
};