import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';

const MessageBubble = ({ message, isOwn }) => {
  const isRead = message.is_read;

  return (
    <div className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
      <div className="message-bubble">
        <p className="message-text">{message.message}</p>
        <div className="message-meta">
          <span className="message-time">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {isOwn && (
            <span className="message-read-status">
              {isRead ? (
                <FiCheckCircle className="read" size={14} />
              ) : (
                <FiCheck className="unread" size={14} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;