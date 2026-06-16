import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiHeart, FiStar, FiCheckCircle, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const ProfileCard = ({ profile, onLike, onPass, showActions = true }) => {
  const getProfileImage = () => {
    if (profile.profile_images && profile.profile_images.length > 0) {
      const primary = profile.profile_images.find(img => img.is_primary);
      return primary ? primary.image : profile.profile_images[0].image;
    }
    return null;
  };

  const handleLike = (e) => {
    e.preventDefault();
    if (onLike) onLike(profile.id);
  };

  const handlePass = (e) => {
    e.preventDefault();
    if (onPass) onPass(profile.id);
  };

  return (
    <Link to={`/profile/${profile.id}`} className="profile-card-link">
      <div className="profile-card">
        <div className="profile-card-image">
          {getProfileImage() ? (
            <img src={getProfileImage()} alt={profile.username} />
          ) : (
            <div className="profile-card-placeholder">
              {profile.username?.[0]?.toUpperCase()}
            </div>
          )}
          
          <div className="profile-card-badges">
            {profile.verification_badge && (
              <span className="badge verified-badge">
                <FiCheckCircle /> Verified
              </span>
            )}
            {profile.is_premium && (
              <span className="badge premium-badge">
                <FiStar /> Premium
              </span>
            )}
          </div>

          {profile.is_active_profile === false && (
            <div className="profile-inactive-overlay">
              <span>Inactive</span>
            </div>
          )}
        </div>

        <div className="profile-card-content">
          <div className="profile-card-header">
            <div className="profile-card-name">
              <h3>{profile.username}</h3>
              {profile.age && <span className="profile-age">{profile.age}</span>}
            </div>
            {profile.location && (
              <div className="profile-card-location">
                <FiMapPin size={14} />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="profile-card-bio">{profile.bio}</p>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div className="profile-card-interests">
              {profile.interests.slice(0, 4).map((interest, index) => (
                <span key={index} className="interest-tag">
                  {interest}
                </span>
              ))}
              {profile.interests.length > 4 && (
                <span className="interest-tag more">
                  +{profile.interests.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="profile-card-footer">
            <span className="profile-last-active">
              <FiClock size={12} />
              {profile.last_active ? 
                formatDistanceToNow(new Date(profile.last_active), { addSuffix: true }) : 
                'Recently'
              }
            </span>
            {profile.subscription_tier !== 'free' && (
              <span className="profile-tier">{profile.subscription_tier_display}</span>
            )}
          </div>

          {showActions && (
            <div className="profile-card-actions">
              <button 
                className="action-btn pass-btn"
                onClick={handlePass}
                title="Pass"
              >
                ✕
              </button>
              <button 
                className="action-btn like-btn"
                onClick={handleLike}
                title="Like"
              >
                <FiHeart />
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProfileCard;