// src/services/verificationService.js
import api from './api'

export const verificationService = {
  getStatus: async () => {
    try {
      const response = await api.get('/verification/')
      return response.data
    } catch (error) {
      throw error
    }
  },

  submit: async (formData) => {
    const response = await api.post('/verification/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getPending: async () => {
    const response = await api.get('/verification/pending/')
    return response.data
  },

  approve: async (verificationId) => {
    const response = await api.post(`/verification/${verificationId}/approve/`)
    return response.data
  },

  reject: async (verificationId, reason) => {
    const response = await api.post(`/verification/${verificationId}/reject/`, { reason })
    return response.data
  },
}