// src/services/index.js
// Core
import api from './api'

// Services
import { authService } from './authService'
import { profileService } from './profileService'
import { matchService } from './matchService'
import { chatService } from './chatService'
import { paymentService } from './paymentService'
import { adminService } from './adminService'
import { notificationService } from './notificationService'
import { verificationService } from './verificationService'

// Export all services
export {
  api,
  authService,
  profileService,
  matchService,
  chatService,
  paymentService,
  adminService,
  notificationService,
  verificationService,
}

// Also export as default object
const services = {
  api,
  authService,
  profileService,
  matchService,
  chatService,
  paymentService,
  adminService,
  notificationService,
  verificationService,
}

export default services