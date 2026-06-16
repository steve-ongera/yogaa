import api from './api';

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats/');
    return response.data;
  },

  getPendingVerifications: async () => {
    const response = await api.get('/admin/verifications/');
    return response.data;
  },

  processVerification: async (verificationId, action, notes = '') => {
    const response = await api.post(`/admin/verifications/${verificationId}/`, {
      action,
      notes,
    });
    return response.data;
  },

  getUsers: async (page = 1, filters = {}) => {
    const response = await api.get('/admin/users/', { params: { page, ...filters } });
    return response.data;
  },

  updateUser: async (userId, data) => {
    const response = await api.put(`/admin/users/${userId}/`, data);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}/`);
    return response.data;
  },

  getReports: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/reports/', { params });
    return response.data;
  },

  resolveReport: async (reportId, action) => {
    const response = await api.post(`/admin/reports/${reportId}/resolve/`, { action });
    return response.data;
  },

  getRevenueStats: async (period = 'monthly') => {
    const response = await api.get('/admin/revenue/', { params: { period } });
    return response.data;
  },

  getActivityLogs: async (page = 1) => {
    const response = await api.get('/admin/activity/', { params: { page } });
    return response.data;
  },
};