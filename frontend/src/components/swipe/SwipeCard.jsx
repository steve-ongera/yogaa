import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
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

  const bind = useDrag(({ down, movement: [mx, my] }) => {
    const threshold = 120;

    if (!down && Math.abs(mx) > threshold) {
      const dir = mx > 0 ? 'right' : 'left';

      api.start({
        x: mx * 2,
        y: my * 2,
        rot: dir === 'right' ? 15 : -15,
        scale: 0.8,
      });

      setTimeout(() => onSwipe(dir, profile), 200);
      return;
    }

    if (!down) {
      api.start({ x: 0, y: 0, rot: 0, scale: 1 });
      return;
    }

    const power = Math.min(1, Math.abs(mx) / threshold);

    api.start({
      x: mx,
      y: my,
      rot: mx / 20,
      scale: 1 - power * 0.1,
    });

    setSwipeDirection(mx > 0 ? 'right' : 'left');
  });

  const getProfileImage = () => {
    if (profile.profile_images?.length > 0) {
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
          transform: x.to((x, y, rot, scale) =>
            `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${scale})`
          ),
          touchAction: 'none',
        }}
      >
        <div className="card-image">
          {getProfileImage() ? (
            <img src={getProfileImage()} alt={profile.username} />
          ) : (
            <div className="card-placeholder">
              {profile.username?.[0]}
            </div>
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
          <h3>{profile.username}, {profile.age}</h3>

          {profile.location && (
            <span>
              <FiMapPin /> {profile.location}
            </span>
          )}

          <p>{profile.bio}</p>

          <div className="card-footer">
            <FiClock />
            {profile.last_active
              ? formatDistanceToNow(new Date(profile.last_active), { addSuffix: true })
              : 'Recently'}
          </div>
        </div>

        {swipeDirection === 'right' && (
          <div className="swipe-indicator like">❤️ LIKE</div>
        )}

        {swipeDirection === 'left' && (
          <div className="swipe-indicator nope">✕ NOPE</div>
        )}
      </animated.div>

      <div className="swipe-actions">
        <button onClick={() => onSwipe('left', profile)}>
          <FiX size={28} />
        </button>
        <button onClick={() => onSwipe('right', profile)}>
          <FiHeart size={28} />
        </button>
      </div>
    </div>
  );
};

export default SwipeCard;