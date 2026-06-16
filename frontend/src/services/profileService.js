// src/services/profileService.js
import api from './api'

export const profileService = {
  getProfile: async (userId = null) => {
    const url = userId ? `/profile/${userId}/` : '/profile/'
    const response = await api.get(url)
    return response.data
  },

  updateProfile: async (data) => {
    const response = await api.put('/profile/', data)
    return response.data
  },

  uploadImages: async (files) => {
    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append('images', file)
    })
    
    const response = await api.post('/profile/images/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  deleteImage: async (imageId) => {
    const response = await api.delete(`/profile/images/${imageId}/`)
    return response.data
  },

  getDiscoverProfiles: async (page = 1, filters = {}) => {
    const params = new URLSearchParams({
      page,
      ...filters,
    })
    const response = await api.get(`/discover/?${params}`)
    return response.data
  },

  getVerificationStatus: async () => {
    const response = await api.get('/verification/')
    return response.data
  },

  submitVerification: async (formData) => {
    const response = await api.post('/verification/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getInterests: async () => {
    const response = await api.get('/interests/')
    return response.data
  },

  searchProfiles: async (query) => {
    const response = await api.get(`/search/?q=${query}`)
    return response.data
  },
}