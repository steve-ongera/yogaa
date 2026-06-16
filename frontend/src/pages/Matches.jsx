import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { FiMessageCircle, FiLock, FiUnlock, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Matches = () => {
  const { user } = useAuth();
  const { matches, loading, loadMatches, unlockChat, isChatUnlocked } = useChat();
  const [unlocking, setUnlocking] = useState(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const handleUnlockChat = async (matchId) => {
    setUnlocking(matchId);
    try {
      await unlockChat(matchId);
      toast.success('Chat unlocked! You can now chat with this match.');
    } catch (error) {
      toast.error('Failed to unlock chat. Please subscribe to unlock.');
    } finally {
      setUnlocking(null);
    }
  };

  const getOtherUser = (match) => {
    return match.user1.id === user.id ? match.user2 : match.user1;
  };

  const getProfileImage = (profile) => {
    if (profile.profile_images && profile.profile_images.length > 0) {
      const primary = profile.profile_images.find(img => img.is_primary);
      return primary ? primary.image : profile.profile_images[0].image;
    }
    return null;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="matches-page">
          <Loader />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="matches-page">
        <div className="matches-container">
          <div className="matches-header">
            <h1>Your Matches</h1>
            <p>Connect with people who liked you back</p>
          </div>

          {matches.length === 0 ? (
            <div className="no-matches">
              <div className="no-matches-icon">💔</div>
              <h3>No matches yet</h3>
              <p>Keep swiping to find your perfect match!</p>
              <Link to="/discover" className="btn-primary">
                Start Swiping
              </Link>
            </div>
          ) : (
            <div className="matches-grid">
              {matches.map((match) => {
                const otherUser = getOtherUser(match);
                const unlocked = match.chat_unlocked || isChatUnlocked(match.id);
                const lastMessage = match.last_message;
                const unreadCount = match.unread_count || 0;

                return (
                  <div key={match.id} className="match-card">
                    <Link to={`/chat/${match.id}`} className="match-link">
                      <div className="match-avatar">
                        {getProfileImage(otherUser) ? (
                          <img src={getProfileImage(otherUser)} alt={otherUser.username} />
                        ) : (
                          <div className="avatar-placeholder">
                            {otherUser.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                        {otherUser.verification_badge && (
                          <span className="verified-dot">✓</span>
                        )}
                      </div>

                      <div className="match-info">
                        <div className="match-name">
                          <h3>{otherUser.username}</h3>
                          <span className="match-age">{otherUser.age}</span>
                        </div>
                        {otherUser.location && (
                          <span className="match-location">{otherUser.location}</span>
                        )}
                        {lastMessage && (
                          <div className="match-last-message">
                            <p>{lastMessage.message}</p>
                            <span className="match-time">
                              {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                        {unreadCount > 0 && (
                          <span className="unread-badge">{unreadCount}</span>
                        )}
                      </div>
                    </Link>

                    <div className="match-actions">
                      {!unlocked ? (
                        <button
                          className="unlock-chat-btn"
                          onClick={() => handleUnlockChat(match.id)}
                          disabled={unlocking === match.id}
                        >
                          {unlocking === match.id ? (
                            <Loader size="small" />
                          ) : (
                            <>
                              <FiLock /> Unlock Chat
                            </>
                          )}
                        </button>
                      ) : (
                        <Link to={`/chat/${match.id}`} className="chat-btn">
                          <FiMessageCircle /> Chat Now
                        </Link>
                      )}
                    </div>

                    <div className="match-meta">
                      <FiClock />
                      <span>Matched {formatDistanceToNow(new Date(match.matched_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Matches;