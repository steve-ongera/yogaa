import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import Navbar from '../components/common/Navbar';
import VerificationBadge from '../components/profile/VerificationBadge';
import ProfileGallery from '../components/profile/ProfileGallery';
import { 
  FiEdit2, 
  FiMapPin, 
  FiHeart, 
  FiUsers, 
  FiCalendar, 
  FiInfo,
  FiCamera,
  FiAward,
  FiStar
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { uploadProfileImages, deleteImage, uploading, processing } = useProfile();
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleImageUpload = async (files) => {
    try {
      await uploadProfileImages(files);
      toast.success('Images uploaded successfully!');
      setShowImageUpload(false);
    } catch (error) {
      toast.error('Failed to upload images');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await deleteImage(imageId);
        toast.success('Image deleted');
      } catch (error) {
        toast.error('Failed to delete image');
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-cover">
              <div className="profile-avatar-container">
                {user.profile_images && user.profile_images.length > 0 ? (
                  <img 
                    src={user.profile_images.find(img => img.is_primary)?.image || user.profile_images[0]?.image} 
                    alt={user.username}
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                )}
                {user.verification_badge && (
                  <VerificationBadge className="profile-verify-badge" />
                )}
              </div>
            </div>

            <div className="profile-info">
              <div className="profile-name-section">
                <h1>{user.username}</h1>
                {user.is_premium && (
                  <span className="premium-badge-header">
                    <FiStar /> Premium
                  </span>
                )}
                <Link to="/profile/edit" className="edit-profile-btn">
                  <FiEdit2 /> Edit Profile
                </Link>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{user.age || 'N/A'}</span>
                  <span className="stat-label">Age</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{user.gender || 'N/A'}</span>
                  <span className="stat-label">Gender</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{user.looking_for || 'N/A'}</span>
                  <span className="stat-label">Looking For</span>
                </div>
              </div>

              {user.location && (
                <div className="profile-location">
                  <FiMapPin />
                  <span>{user.location}</span>
                  {user.latitude && user.longitude && (
                    <span className="coordinates">
                      ({user.latitude}, {user.longitude})
                    </span>
                  )}
                </div>
              )}

              {user.bio && (
                <div className="profile-bio">
                  <FiInfo />
                  <p>{user.bio}</p>
                </div>
              )}

              <div className="profile-meta">
                <span>
                  <FiCalendar /> Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
                <span>
                  <FiUsers /> Last active: {formatDistanceToNow(new Date(user.last_active), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="profile-content">
            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <div className="profile-section">
                <h3>Interests</h3>
                <div className="interests-grid">
                  {user.interests.map((interest, index) => (
                    <span key={index} className="interest-pill">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Subscription Info */}
            <div className="profile-section subscription-info">
              <h3>Subscription</h3>
              <div className="subscription-details">
                <div className="subscription-tier">
                  <span className="tier-label">Current Plan</span>
                  <span className="tier-value">{user.subscription_tier_display || 'Free'}</span>
                </div>
                {user.subscription_expiry && (
                  <div className="subscription-expiry">
                    <span className="expiry-label">Expires</span>
                    <span className="expiry-value">
                      {new Date(user.subscription_expiry).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <Link to="/subscription" className="upgrade-btn">
                  {user.is_premium ? 'Manage Subscription' : 'Upgrade Now'}
                </Link>
              </div>
            </div>

            {/* Verification Status */}
            <div className="profile-section verification-section">
              <h3>Verification</h3>
              <div className="verification-status">
                {user.is_verified ? (
                  <div className="verified-status">
                    <FiAward className="verified-icon" />
                    <span>Profile Verified</span>
                    {user.verification_badge && (
                      <span className="badge-status">Badge Active</span>
                    )}
                  </div>
                ) : (
                  <div className="unverified-status">
                    <p>Get verified to build trust and increase your matches</p>
                    <Link to="/verification" className="verify-btn">
                      Start Verification
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Image Gallery */}
            <div className="profile-section gallery-section">
              <div className="gallery-header">
                <h3>Photos</h3>
                <div className="gallery-actions">
                  <span className="image-count">
                    {user.profile_images?.length || 0} / {user.max_images_allowed || 1}
                  </span>
                  {user.can_upload_images && user.profile_images?.length < user.max_images_allowed && (
                    <button 
                      className="add-photo-btn"
                      onClick={() => setShowImageUpload(true)}
                      disabled={uploading}
                    >
                      <FiCamera /> Add Photo
                    </button>
                  )}
                </div>
              </div>

              <ProfileGallery 
                images={user.profile_images || []}
                onDelete={handleDeleteImage}
                loading={processing}
              />

              {!user.can_upload_images && (
                <div className="upload-prompt">
                  <p>Upload more photos by upgrading to Premium</p>
                  <Link to="/subscription" className="upgrade-link">Upgrade Now</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="modal-overlay" onClick={() => setShowImageUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Photos</h3>
              <button className="close-btn" onClick={() => setShowImageUpload(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="upload-area">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      handleImageUpload(e.target.files);
                    }
                  }}
                  disabled={uploading}
                />
                <div className="upload-placeholder">
                  <FiCamera size={48} />
                  <p>Click to upload photos</p>
                  <span className="upload-hint">Max {user.max_images_allowed} photos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;