import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ChatBox from '../components/chat/ChatBox';
import MessageBubble from '../components/chat/MessageBubble';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { FiSend, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Chat = () => {
  const { matchId } = useParams();
  const { user } = useAuth();
  const { 
    messages, 
    loading, 
    sendMessage, 
    loadMessages,
    markAsRead,
    match,
    isChatUnlocked 
  } = useChat();
  
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadMessages(matchId);
    // Mark messages as read
    markAsRead(matchId);
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    if (!isChatUnlocked) {
      toast.error('Please subscribe to unlock chat');
      return;
    }

    setSending(true);
    try {
      await sendMessage(matchId, message);
      setMessage('');
      inputRef.current?.focus();
    } catch (error) {
      toast.error('Failed to send message');
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
      <>
        <Navbar />
        <div className="chat-page">
          <Loader />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="chat-page">
        <div className="chat-container">
          <div className="chat-header">
            <h3>Chat with {match?.user1?.username === user?.username ? match?.user2?.username : match?.user1?.username}</h3>
            {!isChatUnlocked && (
              <div className="chat-locked-banner">
                <FiLock />
                <span>Chat is locked. Subscribe to chat.</span>
              </div>
            )}
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-messages">
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender.id === user?.id}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isChatUnlocked ? "Type a message..." : "Subscribe to chat..."}
              disabled={!isChatUnlocked || sending}
              rows={1}
            />
            <button 
              className="send-btn"
              onClick={handleSend}
              disabled={!isChatUnlocked || sending || !message.trim()}
            >
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;