import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import { 
  FiBell, 
  FiLock, 
  FiUser, 
  FiShield, 
  FiGlobe, 
  FiLogOut,
  FiMoon,
  FiSun,
  FiChevronRight,
  FiTrash2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: FiUser, label: 'Profile Settings', action: () => window.location.href = '/profile/edit' },
        { icon: FiLock, label: 'Change Password', action: () => toast.info('Change password feature coming soon') },
        { icon: FiShield, label: 'Privacy & Security', action: () => toast.info('Privacy settings coming soon') },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: notifications ? FiBell : FiBell, 
          label: 'Notifications', 
          toggle: true,
          value: notifications,
          onChange: setNotifications
        },
        { 
          icon: darkMode ? FiMoon : FiSun, 
          label: 'Dark Mode', 
          toggle: true,
          value: darkMode,
          onChange: setDarkMode
        },
        { icon: FiGlobe, label: 'Language', action: () => toast.info('Language settings coming soon') },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: FiShield, label: 'Help Center', action: () => toast.info('Help center coming soon') },
        { icon: FiShield, label: 'Report a Problem', action: () => toast.info('Report feature coming soon') },
        { icon: FiShield, label: 'Terms & Privacy', action: () => toast.info('Terms and privacy coming soon') },
      ]
    }
  ];

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion feature coming soon');
    }
  };

  return (
    <>
      <Navbar />
      <div className="settings-page">
        <div className="settings-container">
          <div className="settings-header">
            <h1>Settings</h1>
            <p>Manage your account preferences</p>
          </div>

          <div className="settings-sections">
            {settingsSections.map((section, index) => (
              <div key={index} className="settings-section">
                <h2 className="section-title">{section.title}</h2>
                <div className="settings-cards">
                  {section.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex} 
                      className="settings-card"
                      onClick={!item.toggle ? item.action : undefined}
                    >
                      <div className="settings-card-left">
                        <item.icon className="card-icon" />
                        <span className="card-label">{item.label}</span>
                      </div>
                      <div className="settings-card-right">
                        {item.toggle ? (
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={item.value}
                              onChange={(e) => item.onChange(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        ) : (
                          <FiChevronRight className="card-arrow" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="settings-section danger-section">
              <div className="settings-cards">
                <div className="settings-card danger" onClick={logout}>
                  <div className="settings-card-left">
                    <FiLogOut className="card-icon danger-icon" />
                    <span className="card-label danger-text">Logout</span>
                  </div>
                  <div className="settings-card-right">
                    <FiChevronRight className="card-arrow" />
                  </div>
                </div>

                <div className="settings-card danger" onClick={handleDeleteAccount}>
                  <div className="settings-card-left">
                    <FiTrash2 className="card-icon danger-icon" />
                    <span className="card-label danger-text">Delete Account</span>
                  </div>
                  <div className="settings-card-right">
                    <FiChevronRight className="card-arrow" />
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-footer">
              <p>Version 1.0.0</p>
              <p>© 2024 LoveConnect. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;