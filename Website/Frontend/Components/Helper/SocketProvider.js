'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthProvider';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, reconnecting
  const [messageQueue, setMessageQueue] = useState([]);
  const [pendingMessages, setPendingMessages] = useState(new Map());
  const { token, user } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = useRef(5);
  const reconnectTimeout = useRef(null);

  // Message queuing and delivery functions
  const queueMessage = (messageData) => {
    const queuedMessage = {
      id: Date.now() + Math.random(),
      data: messageData,
      timestamp: new Date(),
      attempts: 0,
      maxAttempts: 3
    };
    setMessageQueue(prev => [...prev, queuedMessage]);
    return queuedMessage.id;
  };

  const markMessageDelivered = (messageId) => {
    setPendingMessages(prev => {
      const newMap = new Map(prev);
      if (newMap.has(messageId)) {
        newMap.get(messageId).status = 'delivered';
      }
      return newMap;
    });
  };

  const markMessageFailed = (messageId) => {
    setPendingMessages(prev => {
      const newMap = new Map(prev);
      if (newMap.has(messageId)) {
        newMap.get(messageId).status = 'failed';
      }
      return newMap;
    });
  };

  const processMessageQueue = (socketInstance) => {
    if (!socketInstance || messageQueue.length === 0) return;
    
    const messagesToProcess = [...messageQueue];
    setMessageQueue([]);
    
    messagesToProcess.forEach((queuedMessage) => {
      if (queuedMessage.attempts < queuedMessage.maxAttempts) {
        queuedMessage.attempts++;
        
        // Add message to pending tracking
        setPendingMessages(prev => new Map(prev).set(queuedMessage.id, {
          ...queuedMessage.data,
          status: 'sending',
          timestamp: new Date()
        }));
        
        socketInstance.emit('send_message', queuedMessage.data, (ack) => {
          if (ack && ack.success) {
            markMessageDelivered(queuedMessage.id);
          } else {
            markMessageFailed(queuedMessage.id);
            // Re-queue if attempts remaining
            if (queuedMessage.attempts < queuedMessage.maxAttempts) {
              setTimeout(() => {
                setMessageQueue(prev => [...prev, queuedMessage]);
              }, 1000 * queuedMessage.attempts); // Exponential backoff
            }
          }
        });
      }
    });
  };

  const attemptReconnection = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts.current) {
      console.log('Max reconnection attempts reached');
      setConnectionStatus('failed');
      return;
    }
    
    reconnectAttempts.current++;
    setConnectionStatus('reconnecting');
    
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
    
    reconnectTimeout.current = setTimeout(() => {
      if (token && user) {
        console.log(`Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts.current}`);
        initializeSocket();
      }
    }, delay);
  };

  const initializeSocket = () => {
    setConnectionStatus('connecting');
    
    // Create socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000', {
      auth: {
        token: token
      },
      autoConnect: true,
      timeout: 10000,
      retries: 3
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🟢 Connected to chat server');
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      
      // Clear any pending reconnection timeouts
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      // Process queued messages
      processMessageQueue(newSocket);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔴 Disconnected from chat server:', reason);
      setIsConnected(false);
      setOnlineUsers(new Set());
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        setConnectionStatus('disconnected');
      } else {
        // Client-side disconnect, attempt reconnection
        setConnectionStatus('disconnected');
        attemptReconnection();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
      setConnectionStatus('error');
      attemptReconnection();
    });
    
    // Message acknowledgment handlers
    newSocket.on('message_ack', (data) => {
      const { messageId, status, serverMessageId } = data;
      if (status === 'delivered') {
        markMessageDelivered(messageId);
      } else {
        markMessageFailed(messageId);
      }
    });

      // User presence handlers
      newSocket.on('user_joined', (data) => {
        setOnlineUsers(prev => new Set([...prev, data.profileid]));
      });

      newSocket.on('user_left', (data) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(data.profileid);
          return updated;
        });
      });

    setSocket(newSocket);
    return newSocket;
  };

  useEffect(() => {
    if (token && user) {
      const socketInstance = initializeSocket();

      // Cleanup on unmount
      return () => {
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
        if (socketInstance) {
          socketInstance.close();
        }
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setConnectionStatus('disconnected');
        setMessageQueue([]);
        setPendingMessages(new Map());
      };
    }
  }, [token, user]);

  // Socket utility functions
  const joinChat = (chatid) => {
    if (socket) {
      socket.emit('join_chat', chatid);
    }
  };

  const leaveChat = (chatid) => {
    if (socket) {
      socket.emit('leave_chat', chatid);
    }
  };

  const sendMessage = (messageData) => {
    const messageId = Date.now() + Math.random();
    const enhancedMessageData = {
      ...messageData,
      clientMessageId: messageId,
      timestamp: new Date().toISOString()
    };

    if (socket && isConnected) {
      // Add to pending messages
      setPendingMessages(prev => new Map(prev).set(messageId, {
        ...enhancedMessageData,
        status: 'sending',
        timestamp: new Date()
      }));

      socket.emit('send_message', enhancedMessageData, (ack) => {
        if (ack && ack.success) {
          markMessageDelivered(messageId);
        } else {
          markMessageFailed(messageId);
        }
      });
    } else {
      // Queue message if disconnected
      queueMessage(enhancedMessageData);
    }
    
    return messageId;
  };

  const startTyping = (chatid) => {
    if (socket) {
      socket.emit('typing_start', chatid);
    }
  };

  const stopTyping = (chatid) => {
    if (socket) {
      socket.emit('typing_stop', chatid);
    }
  };

  const markMessageRead = (messageid, chatid) => {
    if (socket) {
      socket.emit('mark_message_read', { messageid, chatid });
    }
  };

  const reactToMessage = (messageid, emoji, chatid) => {
    if (socket) {
      socket.emit('react_to_message', { messageid, emoji, chatid });
    }
  };

  const value = {
    socket,
    isConnected,
    connectionStatus,
    onlineUsers,
    messageQueue,
    pendingMessages,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageRead,
    reactToMessage,
    queueMessage,
    processMessageQueue: () => processMessageQueue(socket),
    reconnect: () => {
      if (reconnectAttempts.current < maxReconnectAttempts.current) {
        attemptReconnection();
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
