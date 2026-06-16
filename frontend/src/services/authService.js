// src/services/authService.js
import api from './api'

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData)
    return response.data
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete api.defaults.headers.common['Authorization']
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh/', { refresh: refreshToken })
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/profile/')
    return response.data
  },

  updateProfile: async (data) => {
    const response = await api.put('/profile/', data)
    return response.data
  },

  changePassword: async (data) => {
    const response = await api.post('/auth/change-password/', data)
    return response.data
  },

  resetPassword: async (email) => {
    const response = await api.post('/auth/reset-password/', { email })
    return response.data
  },
}