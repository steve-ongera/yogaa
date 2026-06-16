import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, 
  FiUsers, 
  FiMessageCircle, 
  FiUser, 
  FiLogOut, 
  FiSettings,
  FiCreditCard,
  FiCheckCircle,
  FiMenu,
  FiX
} from 'react-icons/fi';

const Navbar = () => {
  const { user, logout, isPremium, isVerified } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/discover', label: 'Discover', icon: FiHome },
    { path: '/matches', label: 'Matches', icon: FiUsers },
    { path: '/profile', label: 'Profile', icon: FiUser },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">❤️</span>
            <span className="brand-text">LoveConnect</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-desktop">
          <div className="nav-links">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <item.icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="nav-actions">
            {isPremium && (
              <span className="premium-badge">
                <FiCheckCircle /> Premium
              </span>
            )}
            {isVerified && (
              <span className="verified-badge">
                <FiCheckCircle /> Verified
              </span>
            )}
            <Link to="/subscription" className="nav-action-btn">
              <FiCreditCard />
            </Link>
            <Link to="/settings" className="nav-action-btn">
              <FiSettings />
            </Link>
            <button onClick={logout} className="nav-action-btn logout-btn">
              <FiLogOut />
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile">
          <div className="mobile-nav-links">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            ))}
            <Link
              to="/subscription"
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FiCreditCard className="nav-icon" />
              <span>Subscription</span>
            </Link>
            <Link
              to="/settings"
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FiSettings className="nav-icon" />
              <span>Settings</span>
            </Link>
            <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="mobile-nav-link logout">
              <FiLogOut className="nav-icon" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;