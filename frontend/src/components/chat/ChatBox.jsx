import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { FiSend, FiPaperclip, FiSmile } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Loader from '../common/Loader';

const ChatBox = ({ messages, onSendMessage, loading, isLocked }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!message.trim() || isLocked || sending) return;

    setSending(true);
    try {
      await onSendMessage(message);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <Loader />
      </div>
    );
  }

  return (
    <div className="chat-box">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat-state">
            <div className="empty-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Say hello to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender?.id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <button className="chat-input-btn" disabled={isLocked}>
            <FiPaperclip />
          </button>
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isLocked ? "Subscribe to chat..." : "Type a message..."}
            disabled={isLocked || sending}
            rows={1}
          />
          <button className="chat-input-btn" disabled={isLocked}>
            <FiSmile />
          </button>
        </div>
        <button 
          className="chat-send-btn"
          onClick={handleSend}
          disabled={isLocked || sending || !message.trim()}
        >
          {sending ? <Loader size="small" /> : <FiSend />}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;