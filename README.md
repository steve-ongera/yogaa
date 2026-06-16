# LoveConnect - Dating SaaS Platform for Kenya

LoveConnect is a scalable, production-ready dating platform built specifically for the Kenyan market. It features M-Pesa integration, freemium subscription tiers, real-time chat, and profile verification.

![LoveConnect Platform](https://via.placeholder.com/1200x400/FF4B6C/FFFFFF?text=LoveConnect)

## 🚀 Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with registration and login
- **Profile Management**: Complete user profiles with bio, interests, location, and photos
- **Swipe/Like System**: Tinder-style card swiping with match detection
- **Real-time Chat**: WebSocket-powered messaging with read receipts
- **M-Pesa Integration**: Seamless mobile money payments for subscriptions and boosts
- **Freemium Model**: Free, Premium (KES 500/mo), and Gold (KES 1000/mo) tiers
- **Profile Verification**: Document upload with admin verification
- **Verification Badges**: Trust badges for verified users
- **Profile Boosts**: Paid 24-hour profile visibility boosts
- **Advanced Filters**: Age, location, interests, verification status
- **Admin Dashboard**: User management, verification review, analytics

### Technical Features
- **Scalable Architecture**: Django REST Framework with PostgreSQL
- **Real-time Communication**: Django Channels with Redis
- **Background Tasks**: Celery for async processing
- **Caching**: Redis for session and data caching
- **Security**: JWT tokens, CORS, rate limiting
- **Responsive Design**: Mobile-first React frontend
- **WebSocket Support**: Real-time notifications and chat

## 🛠️ Tech Stack

### Backend
- Python 3.11+
- Django 4.2
- Django REST Framework
- PostgreSQL
- Redis (Cache & Channels)
- Celery
- Django Channels (WebSockets)
- JWT Authentication

### Frontend
- React 18
- Vite
- React Router v6
- React Query
- Framer Motion (Animations)
- Axios
- Socket.io Client

### Payment Integration
- Safaricom M-Pesa API
- STK Push for payments

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Virtual Environment (recommended)

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/loveconnect.git
cd loveconnect