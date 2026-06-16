import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { chatService } from '../services';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  // Initialize WebSocket connection
  useEffect(() => {
    if (user && token) {
      const newSocket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws', {
        auth: { token },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected');
      });

      newSocket.on('message', (data) => {
        if (data.type === 'chat_message') {
          handleNewMessage(data.data);
        } else if (data.type === 'notification') {
          toast.info(data.data.message);
        } else if (data.type === 'typing') {
          handleTyping(data.data);
        } else if (data.type === 'read_receipt') {
          handleReadReceipt(data.data);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  const handleNewMessage = (message) => {
    setMessages(prev => {
      const matchId = message.match;
      const existing = prev[matchId] || [];
      // Check if message already exists (prevent duplicates)
      if (existing.some(m => m.id === message.id)) {
        return prev;
      }
      return {
        ...prev,
        [matchId]: [...existing, message]
      };
    });

    // Update match list with new message
    setMatches(prev => 
      prev.map(match => 
        match.id === message.match 
          ? { ...match, last_message: message, messages: [...(match.messages || []), message] }
          : match
      )
    );
  };

  const handleTyping = (data) => {
    setTypingUsers(prev => ({
      ...prev,
      [data.match_id]: data.user_id
    }));
    // Clear typing indicator after 2 seconds
    setTimeout(() => {
      setTypingUsers(prev => {
        const newState = { ...prev };
        if (newState[data.match_id] === data.user_id) {
          delete newState[data.match_id];
        }
        return newState;
      });
    }, 2000);
  };

  const handleReadReceipt = (data) => {
    setMessages(prev => {
      const matchMessages = prev[data.match_id] || [];
      return {
        ...prev,
        [data.match_id]: matchMessages.map(msg => 
          msg.id === data.message_id ? { ...msg, is_read: true, read_at: data.read_at } : msg
        )
      };
    });
  };

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await chatService.getMatches();
      setMatches(data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (matchId) => {
    try {
      const data = await chatService.getMessages(matchId);
      setMessages(prev => ({
        ...prev,
        [matchId]: data
      }));
      setActiveMatchId(matchId);
      return data;
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
      return [];
    }
  }, []);

  const sendMessage = useCallback(async (matchId, message) => {
    try {
      const newMessage = await chatService.sendMessage(matchId, message);
      
      // Add message to local state
      setMessages(prev => ({
        ...prev,
        [matchId]: [...(prev[matchId] || []), newMessage]
      }));

      // Emit via socket for real-time
      if (socket) {
        socket.emit('send_message', {
          match_id: matchId,
          message: message,
          message_id: newMessage.id
        });
      }

      return newMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.error || 'Failed to send message');
      throw error;
    }
  }, [socket]);

  const markAsRead = useCallback(async (matchId) => {
    try {
      await chatService.markMessagesAsRead(matchId);
      
      // Update local state
      setMessages(prev => {
        const matchMessages = prev[matchId] || [];
        return {
          ...prev,
          [matchId]: matchMessages.map(msg => 
            !msg.is_read && msg.sender?.id !== user?.id 
              ? { ...msg, is_read: true, read_at: new Date().toISOString() }
              : msg
          )
        };
      });

      // Emit read receipt via socket
      if (socket) {
        socket.emit('mark_read', {
          match_id: matchId
        });
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [socket, user]);

  const unlockChat = useCallback(async (matchId) => {
    try {
      const result = await chatService.unlockChat(matchId);
      
      // Update match in local state
      setMatches(prev => 
        prev.map(match => 
          match.id === matchId 
            ? { ...match, chat_unlocked: true, chat_unlocked_at: new Date().toISOString() }
            : match
        )
      );

      return result;
    } catch (error) {
      console.error('Failed to unlock chat:', error);
      toast.error(error.response?.data?.error || 'Failed to unlock chat');
      throw error;
    }
  }, []);

  const isChatUnlocked = useCallback((matchId) => {
    const match = matches.find(m => m.id === matchId);
    return match?.chat_unlocked || false;
  }, [matches]);

  const sendTypingIndicator = useCallback((matchId, isTyping) => {
    if (socket) {
      socket.emit('typing', {
        match_id: matchId,
        is_typing: isTyping
      });
    }
  }, [socket]);

  const value = {
    matches,
    messages,
    loading,
    activeMatchId,
    typingUsers,
    loadMatches,
    loadMessages,
    sendMessage,
    markAsRead,
    unlockChat,
    isChatUnlocked,
    sendTypingIndicator,
    getMessages: (matchId) => messages[matchId] || [],
    getMatch: (matchId) => matches.find(m => m.id === matchId),
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};