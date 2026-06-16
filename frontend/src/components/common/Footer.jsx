import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiTwitter, FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="brand-link">
              <span className="brand-icon">❤️</span>
              <span className="brand-text">LoveConnect</span>
            </Link>
            <p className="footer-description">
              Find your perfect match in Kenya with LoveConnect.
              Building meaningful relationships since 2024.
            </p>
            <div className="social-links">
              <a href="#" className="social-link"><FiTwitter /></a>
              <a href="#" className="social-link"><FiFacebook /></a>
              <a href="#" className="social-link"><FiInstagram /></a>
              <a href="#" className="social-link"><FiYoutube /></a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Product</h4>
            <Link to="/discover">Discover</Link>
            <Link to="/matches">Matches</Link>
            <Link to="/subscription">Subscription</Link>
            <Link to="/verification">Verification</Link>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/press">Press</Link>
          </div>

          <div className="footer-links">
            <h4>Support</h4>
            <Link to="/help">Help Center</Link>
            <Link to="/safety">Safety</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} LoveConnect. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;