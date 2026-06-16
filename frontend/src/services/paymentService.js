// src/services/paymentService.js
import api from './api'

// Use named export (export const)
export const paymentService = {
  initiatePayment: async (data) => {
    const response = await api.post('/payments/', data)
    return response.data
  },

  checkPaymentStatus: async (transactionId) => {
    const response = await api.get(`/payments/${transactionId}/status/`)
    return response.data
  },

  getSubscriptionTiers: async () => {
    const response = await api.get('/subscriptions/')
    return response.data
  },

  getTransactionHistory: async () => {
    const response = await api.get('/payments/history/')
    return response.data
  },

  purchaseBoost: async (phoneNumber) => {
    const response = await api.post('/payments/boost/', { phone_number: phoneNumber })
    return response.data
  },

  getBoostStatus: async () => {
    const response = await api.get('/boost-status/')
    return response.data
  },

  cancelSubscription: async () => {
    const response = await api.post('/subscriptions/cancel/')
    return response.data
  },

  getInvoice: async (transactionId) => {
    const response = await api.get(`/payments/${transactionId}/invoice/`)
    return response.data
  },
}