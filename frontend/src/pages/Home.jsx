import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import { FiHeart, FiUsers, FiMessageCircle, FiShield, FiTrendingUp, FiAward } from 'react-icons/fi';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: FiHeart,
      title: 'Smart Matching',
      description: 'Our algorithm finds the perfect match for you based on your preferences and interests.'
    },
    {
      icon: FiUsers,
      title: 'Verified Profiles',
      description: 'Connect with verified users and build meaningful relationships in Kenya.'
    },
    {
      icon: FiMessageCircle,
      title: 'Secure Chat',
      description: 'Chat safely with your matches using our end-to-end encrypted messaging system.'
    },
    {
      icon: FiShield,
      title: 'Privacy First',
      description: 'Your data is secure and private. You control what you share and who sees it.'
    },
    {
      icon: FiTrendingUp,
      title: 'Boost Your Profile',
      description: 'Get more visibility with profile boosts and premium features.'
    },
    {
      icon: FiAward,
      title: 'Verification Badges',
      description: 'Get verified and stand out with a trusted verification badge on your profile.'
    }
  ];

  return (
    <>
      <Navbar />
      <div className="home-page">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">
                Find Your Perfect Match in Kenya
              </h1>
              <p className="hero-subtitle">
                Connect with real people, build meaningful relationships, and find love with LoveConnect.
              </p>
              {!isAuthenticated ? (
                <div className="hero-actions">
                  <Link to="/register" className="btn-primary hero-btn">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn-secondary hero-btn">
                    Sign In
                  </Link>
                </div>
              ) : (
                <Link to="/discover" className="btn-primary hero-btn">
                  Start Swiping
                </Link>
              )}
            </div>
            <div className="hero-image">
              <div className="hero-illustration">
                <div className="illustration-circle"></div>
                <div className="illustration-circle-2"></div>
                <div className="illustration-heart">❤️</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-container">
            <div className="features-header">
              <h2>Why Choose LoveConnect?</h2>
              <p>Discover the features that make us the leading dating platform in Kenya</p>
            </div>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">
                    <feature.icon />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section">
          <div className="testimonials-container">
            <div className="testimonials-header">
              <h2>Success Stories</h2>
              <p>Real people finding real love on LoveConnect</p>
            </div>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="testimonial-avatar">👩</div>
                <h4>Mary & John</h4>
                <p>"We met on LoveConnect and now we're planning our wedding! The best decision we ever made."</p>
                <span className="testimonial-location">Nairobi, Kenya</span>
              </div>
              <div className="testimonial-card">
                <div className="testimonial-avatar">👨</div>
                <h4>David & Sarah</h4>
                <p>"LoveConnect made it so easy to find someone who shares my values and interests."</p>
                <span className="testimonial-location">Mombasa, Kenya</span>
              </div>
              <div className="testimonial-card">
                <div className="testimonial-avatar">👩</div>
                <h4>Grace & Michael</h4>
                <p>"The verification system gave me confidence that I was talking to real people."</p>
                <span className="testimonial-location">Kisumu, Kenya</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <h2>Ready to Find Love?</h2>
            <p>Join thousands of Kenyans who have found meaningful connections on LoveConnect</p>
            {!isAuthenticated ? (
              <Link to="/register" className="btn-primary cta-btn">
                Create Free Account
              </Link>
            ) : (
              <Link to="/discover" className="btn-primary cta-btn">
                Start Your Journey
              </Link>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;