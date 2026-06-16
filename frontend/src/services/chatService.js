// src/services/chatService.js
import api from './api'

export const chatService = {
  getMatches: async () => {
    const response = await api.get('/matches/')
    return response.data
  },

  getMessages: async (matchId) => {
    const response = await api.get(`/chat/${matchId}/`)
    return response.data.messages || response.data
  },

  sendMessage: async (matchId, message) => {
    const response = await api.post(`/chat/${matchId}/`, { message })
    return response.data
  },

  markMessagesAsRead: async (matchId) => {
    const response = await api.put(`/chat/${matchId}/read/`)
    return response.data
  },

  unlockChat: async (matchId) => {
    const response = await api.post(`/chat/${matchId}/unlock/`)
    return response.data
  },

  deleteMessage: async (messageId) => {
    const response = await api.delete(`/chat/messages/${messageId}/`)
    return response.data
  },

  getChatStatus: async (matchId) => {
    const response = await api.get(`/chat/${matchId}/status/`)
    return response.data
  },
}