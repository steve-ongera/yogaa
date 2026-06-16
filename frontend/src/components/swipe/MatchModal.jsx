import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiX } from 'react-icons/fi';

const MatchModal = ({ match, onClose }) => {
  if (!match) return null;

  const { user1, user2 } = match;
  const matchedUser = user1 || user2;

  const getProfileImage = (profile) => {
    if (profile?.profile_images && profile.profile_images.length > 0) {
      const primary = profile.profile_images.find(img => img.is_primary);
      return primary ? primary.image : profile.profile_images[0].image;
    }
    return null;
  };

  return (
    <div className="match-modal-overlay" onClick={onClose}>
      <div className="match-modal" onClick={(e) => e.stopPropagation()}>
        <button className="match-modal-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="match-modal-content">
          <div className="match-modal-icon">
            <div className="heart-icon">
              <FiHeart />
            </div>
          </div>

          <h2>It's a Match! 💕</h2>
          <p className="match-modal-subtitle">
            You and {matchedUser?.username} liked each other
          </p>

          <div className="match-modal-users">
            <div className="match-user">
              <div className="match-user-avatar">
                {getProfileImage(matchedUser) ? (
                  <img src={getProfileImage(matchedUser)} alt={matchedUser?.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {matchedUser?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="match-user-name">{matchedUser?.username}</div>
            </div>

            <div className="match-spark">✨</div>

            <div className="match-user">
              <div className="match-user-avatar">
                {getProfileImage(matchedUser) ? (
                  <img src={getProfileImage(matchedUser)} alt="You" />
                ) : (
                  <div className="avatar-placeholder">You</div>
                )}
              </div>
              <div className="match-user-name">You</div>
            </div>
          </div>

          <div className="match-modal-actions">
            <Link 
              to={`/chat/${match.id}`} 
              className="btn-primary match-chat-btn"
              onClick={onClose}
            >
              <FiMessageCircle /> Send a Message
            </Link>
            <button 
              className="btn-secondary match-continue-btn"
              onClick={onClose}
            >
              Keep Swiping
            </button>
          </div>

          <div className="match-modal-success-steps">
            <div className="success-step">
              <span className="step-number">1</span>
              <span className="step-text">You liked each other</span>
            </div>
            <div className="success-step">
              <span className="step-number">2</span>
              <span className="step-text">Start chatting</span>
            </div>
            <div className="success-step">
              <span className="step-number">3</span>
              <span className="step-text">Plan your date</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;