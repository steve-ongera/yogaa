import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import { FiHeart, FiX, FiStar, FiMapPin, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const SwipeCard = ({ profile, onSwipe, isSwiping }) => {
  const [swipeDirection, setSwipeDirection] = useState(null);

  const [{ x, y, rot, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rot: 0,
    scale: 1,
    config: { tension: 300, friction: 20 },
  }));

  const bind = useDrag(
    ({ down, movement: [mx, my], velocity, direction, cancel }) => {
      const threshold = 100;
      const power = Math.min(1, Math.abs(mx) / threshold);

      if (!down && Math.abs(mx) > threshold) {
        // Swipe completed
        const direction = mx > 0 ? 'right' : 'left';
        api.start({ x: mx * 2, y: my * 2, rot: direction === 'right' ? 15 : -15, scale: 0.8 });
        setTimeout(() => {
          onSwipe(direction, profile);
        }, 300);
        return;
      }

      if (!down && Math.abs(mx) <= threshold) {
        // Reset position
        api.start({ x: 0, y: 0, rot: 0, scale: 1 });
        return;
      }

      // Update position during drag
      api.start({
        x: mx,
        y: my,
        rot: (mx / 20) * (direction === 'right' ? 1 : -1),
        scale: 1 - power * 0.1,
      });

      setSwipeDirection(mx > 0 ? 'right' : 'left');
    },
    {
      axis: 'x',
      rubberband: true,
      filterTaps: true,
      preventDefault: true,
    }
  );

  const getProfileImage = () => {
    if (profile.profile_images && profile.profile_images.length > 0) {
      const primary = profile.profile_images.find(img => img.is_primary);
      return primary ? primary.image : profile.profile_images[0].image;
    }
    return null;
  };

  return (
    <div className="swipe-card-wrapper">
      <animated.div
        {...bind()}
        className="swipe-card"
        style={{
          transform: x.to((x) => `translateX(${x}px) rotate(${rot}deg) scale(${scale})`),
          touchAction: 'none',
        }}
      >
        <div className="card-image">
          {getProfileImage() ? (
            <img src={getProfileImage()} alt={profile.username} />
          ) : (
            <div className="card-placeholder">{profile.username[0]}</div>
          )}
          
          <div className="card-badges">
            {profile.verification_badge && (
              <span className="badge verified">
                <FiStar /> Verified
              </span>
            )}
            {profile.is_premium && (
              <span className="badge premium">⭐ Premium</span>
            )}
          </div>
        </div>

        <div className="card-content">
          <div className="card-header">
            <h3>{profile.username}, {profile.age}</h3>
            {profile.location && (
              <span className="location">
                <FiMapPin /> {profile.location}
              </span>
            )}
          </div>

          <p className="bio">{profile.bio}</p>

          {profile.interests && profile.interests.length > 0 && (
            <div className="interests">
              {profile.interests.slice(0, 5).map((interest, index) => (
                <span key={index} className="interest-tag">
                  {interest}
                </span>
              ))}
            </div>
          )}

          <div className="card-footer">
            <span className="last-active">
              <FiClock /> 
              {profile.last_active ? formatDistanceToNow(new Date(profile.last_active), { addSuffix: true }) : 'Recently'}
            </span>
          </div>
        </div>

        {/* Swipe indicators */}
        {swipeDirection === 'right' && (
          <div className="swipe-indicator like">❤️ LIKE</div>
        )}
        {swipeDirection === 'left' && (
          <div className="swipe-indicator nope">✕ NOPE</div>
        )}
      </animated.div>

      <div className="swipe-actions">
        <button 
          className="action-btn nope-btn" 
          onClick={() => onSwipe('left', profile)}
          disabled={isSwiping}
        >
          <FiX size={28} />
        </button>
        <button 
          className="action-btn like-btn" 
          onClick={() => onSwipe('right', profile)}
          disabled={isSwiping}
        >
          <FiHeart size={28} />
        </button>
      </div>
    </div>
  );
};

export default SwipeCard;