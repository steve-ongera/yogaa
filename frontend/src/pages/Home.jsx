// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHeart, 
  FiUsers, 
  FiMessageCircle, 
  FiShield, 
  FiTrendingUp, 
  FiAward,
  FiMapPin,
  FiCheckCircle,
  FiStar,
  FiClock
} from 'react-icons/fi';
import '../styles/home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: FiHeart,
      title: 'Smart Matching',
      description: 'Our algorithm finds the perfect match for you based on your preferences and interests.',
      color: '#FF4B6C'
    },
    {
      icon: FiUsers,
      title: 'Verified Profiles',
      description: 'Connect with verified users and build meaningful relationships in Kenya.',
      color: '#6C63FF'
    },
    {
      icon: FiMessageCircle,
      title: 'Secure Chat',
      description: 'Chat safely with your matches using our end-to-end encrypted messaging system.',
      color: '#00C853'
    },
    {
      icon: FiShield,
      title: 'Privacy First',
      description: 'Your data is secure and private. You control what you share and who sees it.',
      color: '#FFB300'
    },
    {
      icon: FiTrendingUp,
      title: 'Boost Your Profile',
      description: 'Get more visibility with profile boosts and premium features.',
      color: '#FF6B6B'
    },
    {
      icon: FiAward,
      title: 'Verification Badges',
      description: 'Get verified and stand out with a trusted verification badge on your profile.',
      color: '#4CAF50'
    }
  ];

  const testimonials = [
    {
      name: 'Mary & John',
      avatar: '👩‍❤️‍👨',
      text: '"We met on LoveConnect and now we\'re planning our wedding! The best decision we ever made."',
      location: 'Nairobi, Kenya',
      image: '/images/testimonial-1.jpg'
    },
    {
      name: 'David & Sarah',
      avatar: '👨‍❤️‍👨',
      text: '"LoveConnect made it so easy to find someone who shares my values and interests."',
      location: 'Mombasa, Kenya',
      image: '/images/testimonial-2.jpg'
    },
    {
      name: 'Grace & Michael',
      avatar: '👩‍❤️‍👨',
      text: '"The verification system gave me confidence that I was talking to real people."',
      location: 'Kisumu, Kenya',
      image: '/images/testimonial-3.jpg'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Active Users', icon: FiUsers },
    { number: '10K+', label: 'Successful Matches', icon: FiHeart },
    { number: '95%', label: 'Satisfaction Rate', icon: FiStar },
    { number: '24/7', label: 'Support Available', icon: FiClock }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">❤️</span>
              <span>#1 Dating Platform in Kenya</span>
            </div>
            <h1 className="hero-title">
              Find Your <span className="highlight">Perfect Match</span> in Kenya
            </h1>
            <p className="hero-subtitle">
              Connect with real people, build meaningful relationships, 
              and find love with LoveConnect - Kenya's most trusted dating platform.
            </p>
            <div className="hero-stats">
              {stats.map((stat, index) => (
                <div key={index} className="hero-stat">
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
            {!isAuthenticated ? (
              <div className="hero-actions">
                <Link to="/register" className="btn-primary hero-btn">
                  <i className="bi bi-person-plus"></i> Get Started Free
                </Link>
                <Link to="/login" className="btn-secondary hero-btn">
                  <i className="bi bi-box-arrow-in-right"></i> Sign In
                </Link>
              </div>
            ) : (
              <Link to="/discover" className="btn-primary hero-btn">
                <i className="bi bi-heart-fill"></i> Start Swiping
              </Link>
            )}
            <div className="hero-trust">
              <i className="bi bi-shield-check"></i>
              <span>100% Secure • Verified Profiles • Privacy Protected</span>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <div className="illustration-circle"></div>
              <div className="illustration-circle-2"></div>
              <div className="illustration-circle-3"></div>
              <div className="illustration-heart">❤️</div>
              <div className="floating-card card-1">
                <i className="bi bi-person-check"></i>
                <span>Verified</span>
              </div>
              <div className="floating-card card-2">
                <i className="bi bi-chat-heart"></i>
                <span>Chat</span>
              </div>
              <div className="floating-card card-3">
                <i className="bi bi-star-fill"></i>
                <span>Premium</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <span className="section-tag">Features</span>
            <h2>Why Choose <span className="highlight">LoveConnect</span>?</h2>
            <p>Discover the features that make us the leading dating platform in Kenya</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" style={{ '--feature-color': feature.color }}>
                <div className="feature-icon-wrapper">
                  <div className="feature-icon" style={{ backgroundColor: feature.color + '20', color: feature.color }}>
                    <feature.icon />
                  </div>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-link">
                  <span>Learn More</span>
                  <i className="bi bi-arrow-right"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-item">
              <i className="bi bi-people-fill"></i>
              <span className="stat-number">50,000+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat-item">
              <i className="bi bi-heart-fill"></i>
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Successful Matches</span>
            </div>
            <div className="stat-item">
              <i className="bi bi-star-fill"></i>
              <span className="stat-number">4.8</span>
              <span className="stat-label">Average Rating</span>
            </div>
            <div className="stat-item">
              <i className="bi bi-clock-fill"></i>
              <span className="stat-number">24/7</span>
              <span className="stat-label">Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="testimonials-header">
            <span className="section-tag">Success Stories</span>
            <h2>Real People, <span className="highlight">Real Love</span></h2>
            <p>Hear from our users who found their perfect match</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">
                    {testimonial.avatar}
                  </div>
                  <div className="testimonial-user">
                    <h4>{testimonial.name}</h4>
                    <div className="testimonial-location">
                      <FiMapPin />
                      <span>{testimonial.location}</span>
                    </div>
                  </div>
                </div>
                <div className="testimonial-rating">
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                </div>
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-footer">
                  <FiCheckCircle className="verified-icon" />
                  <span>Verified Match</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <div className="cta-badge">
              <i className="bi bi-heart-fill"></i>
              <span>Join 50,000+ Kenyans</span>
            </div>
            <h2>Ready to Find <span className="highlight">Love</span>?</h2>
            <p>Join thousands of Kenyans who have found meaningful connections on LoveConnect</p>
            <div className="cta-features">
              <div className="cta-feature">
                <i className="bi bi-check-circle-fill"></i>
                <span>Free to join</span>
              </div>
              <div className="cta-feature">
                <i className="bi bi-check-circle-fill"></i>
                <span>Verified profiles</span>
              </div>
              <div className="cta-feature">
                <i className="bi bi-check-circle-fill"></i>
                <span>Secure messaging</span>
              </div>
            </div>
            {!isAuthenticated ? (
              <Link to="/register" className="btn-primary cta-btn">
                <i className="bi bi-person-plus"></i> Create Free Account
              </Link>
            ) : (
              <Link to="/discover" className="btn-primary cta-btn">
                <i className="bi bi-heart-fill"></i> Start Your Journey
              </Link>
            )}
          </div>
          <div className="cta-image">
            <div className="cta-illustration">
              <div className="cta-heart">❤️</div>
              <div className="cta-sparkles">
                <span>✨</span>
                <span>💫</span>
                <span>⭐</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;