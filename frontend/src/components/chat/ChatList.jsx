import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { FiSearch, FiLock, FiUnlock, FiClock, FiCheckCircle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import Loader from '../common/Loader';

const ChatList = () => {
  const { user } = useAuth();
  const { matches, loading, loadMatches, isChatUnlocked } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMatches, setFilteredMatches] = useState([]);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (matches) {
      const filtered = matches.filter(match => {
        const otherUser = getOtherUser(match);
        return otherUser.username.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredMatches(filtered);
    }
  }, [matches, searchTerm]);

  const getOtherUser = (match) => {
    return match.user1?.id === user?.id ? match.user2 : match.user1;
  };

  const getProfileImage = (profile) => {
    if (profile?.profile_images && profile.profile_images.length > 0) {
      const primary = profile.profile_images.find(img => img.is_primary);
      return primary ? primary.image : profile.profile_images[0].image;
    }
    return null;
  };

  const getLastMessage = (match) => {
    if (match.messages && match.messages.length > 0) {
      return match.messages[match.messages.length - 1];
    }
    return null;
  };

  const getUnreadCount = (match) => {
    if (!match.messages) return 0;
    return match.messages.filter(msg => 
      !msg.is_read && msg.sender?.id !== user?.id
    ).length;
  };

  if (loading) {
    return (
      <div className="chat-list-loading">
        <Loader />
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="chat-list-empty">
        <div className="empty-icon">💬</div>
        <h3>No conversations yet</h3>
        <p>Start swiping to find matches and begin chatting!</p>
        <Link to="/discover" className="btn-primary">
          Find Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="chat-list-wrapper">
      <div className="chat-search">
        <div className="search-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="chat-list">
        {filteredMatches.map((match) => {
          const otherUser = getOtherUser(match);
          const lastMessage = getLastMessage(match);
          const unreadCount = getUnreadCount(match);
          const unlocked = match.chat_unlocked || isChatUnlocked(match.id);

          return (
            <Link 
              key={match.id} 
              to={`/chat/${match.id}`}
              className="chat-list-item"
            >
              <div className="chat-list-avatar">
                {getProfileImage(otherUser) ? (
                  <img src={getProfileImage(otherUser)} alt={otherUser.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {otherUser?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className={`online-dot ${otherUser?.is_active_profile ? 'online' : 'offline'}`} />
              </div>

              <div className="chat-list-info">
                <div className="chat-list-name">
                  <h4>{otherUser?.username}</h4>
                  {otherUser?.verification_badge && (
                    <FiCheckCircle className="verified-badge-small" />
                  )}
                  {otherUser?.is_premium && (
                    <span className="premium-tag">⭐</span>
                  )}
                </div>
                <p className="chat-list-last-message">
                  {lastMessage ? (
                    <>
                      {lastMessage.sender?.id === user?.id && 'You: '}
                      {lastMessage.message}
                    </>
                  ) : (
                    'No messages yet'
                  )}
                </p>
              </div>

              <div className="chat-list-meta">
                {lastMessage && (
                  <span className="chat-list-time">
                    {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                  </span>
                )}
                {unreadCount > 0 && (
                  <span className="chat-list-unread">{unreadCount}</span>
                )}
                {!unlocked && (
                  <span className="chat-list-locked">
                    <FiLock size={12} /> Locked
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;