'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useFixedSecureAuth } from '@context/FixedSecureAuthContext';
import enhancedMessageService from '@services/MessageService';

/**
 * 🔒 REACT HOOK FOR ENHANCED MESSAGE SERVICE
 * 
 * Integrates EnhancedMessageService with React Context Auth
 * Provides reactive connection status and message handling
 */

export const useEnhancedMessageService = () => {
  const auth = useFixedSecureAuth();
  const [connectionStatus, setConnectionStatus] = useState({
    isAuthenticated: false,
    isConnected: false,
    connectionState: 'disconnected',
    user: null,
    stats: {}
  });
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState([]);
  const integrationRef = useRef(false);

  // Integrate auth context with message service
  useEffect(() => {
    if (auth && !integrationRef.current) {
      console.log('🔗 Integrating auth context with message service...');
      
      // Set auth context in message service
      enhancedMessageService.setAuthContext(auth);
      integrationRef.current = true;
      
      // Update connection status
      const status = enhancedMessageService.getConnectionStatus();
      setConnectionStatus(status);
    }
  }, [auth]);

  // Listen to auth state changes with event-driven approach
  useEffect(() => {
    if (!auth) return;

    // Update message service when auth state changes
    const handleAuthChange = () => {
      if (integrationRef.current) {
        enhancedMessageService.handleAuthStateChange(auth);
        
        // Update connection status
        const status = enhancedMessageService.getConnectionStatus();
        setConnectionStatus(status);
      }
    };

    // Trigger immediately
    handleAuthChange();

    // Set up heartbeat and reconnection mechanism
    const heartbeatInterval = setInterval(() => {
      if (enhancedMessageService && enhancedMessageService.isConnected()) {
        enhancedMessageService.sendHeartbeat();
      } else if (auth?.isAuthenticated && !enhancedMessageService.isConnecting()) {
        // Attempt reconnection if authenticated but not connected
        console.log('🔄 Attempting auto-reconnection...');
        enhancedMessageService.reconnect();
      }
    }, 5000); // Heartbeat every 5 seconds

    // Listen for connection status changes via events instead of polling
    const handleStatusChange = (newStatus) => {
      console.log('📊 Connection status changed:', newStatus);
      setConnectionStatus(newStatus);
    };

    enhancedMessageService.on('status_changed', handleStatusChange);

    return () => {
      clearInterval(heartbeatInterval);
      enhancedMessageService.off('status_changed', handleStatusChange);
    };
  }, [auth?.isAuthenticated, auth?.user?.id]);

  // Listen to message service events
  useEffect(() => {
    const handleConnectionEstablished = () => {
      console.log('✅ Message service connection established');
      const status = enhancedMessageService.getConnectionStatus();
      setConnectionStatus(status);
    };

    const handleConnectionLost = (reason) => {
      console.log('❌ Message service connection lost:', reason);
      const status = enhancedMessageService.getConnectionStatus();
      setConnectionStatus(status);
      
      // Attempt immediate reconnection for certain error types
      if (reason?.code !== 'AUTHENTICATION_FAILED' && auth?.isAuthenticated) {
        console.log('🔄 Attempting immediate reconnection after connection loss...');
        setTimeout(() => {
          enhancedMessageService.reconnect();
        }, 1000);
      }
    };

    const handleAuthError = (error) => {
      console.error('🔐 Message service auth error:', error);
      const status = enhancedMessageService.getConnectionStatus();
      setConnectionStatus(status);
      
      // Handle token refresh if needed
      if (error?.code === 'TOKEN_EXPIRED' && auth?.refreshToken) {
        console.log('🔄 Token expired, attempting refresh...');
        auth.refreshSession?.().then(() => {
          enhancedMessageService.reconnect();
        }).catch((refreshError) => {
          console.error('❌ Token refresh failed:', refreshError);
          // Force logout if refresh fails
          auth.logout?.();
        });
      }
    };
    
    const handleNetworkError = (error) => {
      console.error('🌐 Network error in message service:', error);
      const status = enhancedMessageService.getConnectionStatus();
      setConnectionStatus(status);
    };
    
    const handleReconnecting = (attempt) => {
      console.log(`🔄 Message service reconnecting... (attempt ${attempt})`);
      setConnectionStatus(prev => ({ ...prev, connectionState: 'reconnecting' }));
    };
    
    const handleReconnectFailed = (error) => {
      console.error('❌ Message service reconnection failed:', error);
      setConnectionStatus(prev => ({ ...prev, connectionState: 'reconnect_failed' }));
    };

    const handleMessageReceived = (message) => {
      console.log('📨 Message received in hook:', message);
      setMessages(prev => [...prev, message]);
    };

    const handleTypingStart = (data) => {
      setTyping(prev => {
        if (!prev.find(t => t.userId === data.userId && t.chatId === data.chatId)) {
          return [...prev, data];
        }
        return prev;
      });
    };

    const handleTypingStop = (data) => {
      setTyping(prev => prev.filter(t => !(t.userId === data.userId && t.chatId === data.chatId)));
    };

    // Add event listeners
    enhancedMessageService.on('connection_established', handleConnectionEstablished);
    enhancedMessageService.on('connection_lost', handleConnectionLost);
    enhancedMessageService.on('auth_error', handleAuthError);
    enhancedMessageService.on('message_received', handleMessageReceived);
    enhancedMessageService.on('typing_start', handleTypingStart);
    enhancedMessageService.on('typing_stop', handleTypingStop);

    return () => {
      // Remove event listeners
      enhancedMessageService.off('connection_established', handleConnectionEstablished);
      enhancedMessageService.off('connection_lost', handleConnectionLost);
      enhancedMessageService.off('auth_error', handleAuthError);
      enhancedMessageService.off('message_received', handleMessageReceived);
      enhancedMessageService.off('typing_start', handleTypingStart);
      enhancedMessageService.off('typing_stop', handleTypingStop);
    };
  }, []);

  // Send message function
  const sendMessage = useCallback(async (chatId, messageData) => {
    try {
      const message = await enhancedMessageService.sendMessage(chatId, messageData);
      setMessages(prev => [...prev, message]);
      return message;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }, []);

  // Get messages for a chat
  const getMessagesForChat = useCallback((chatId) => {
    return messages.filter(msg => msg.chatId === chatId);
  }, [messages]);

  // Get typing users for a chat
  const getTypingUsersForChat = useCallback((chatId) => {
    return typing.filter(t => t.chatId === chatId);
  }, [typing]);

  // Manual reconnection
  const reconnect = useCallback(() => {
    if (auth?.isAuthenticated) {
      enhancedMessageService.handleAuthStateChange(auth);
    }
  }, [auth]);

  return {
    // Connection state
    connectionStatus,
    isConnected: connectionStatus.isConnected,
    isAuthenticated: connectionStatus.isAuthenticated,
    connectionState: connectionStatus.connectionState,
    user: connectionStatus.user,
    
    // Messages
    messages,
    getMessagesForChat,
    sendMessage,
    
    // Typing
    typing,
    getTypingUsersForChat,
    
    // Actions
    reconnect,
    
    // Service reference
    messageService: enhancedMessageService
  };
};

export default useEnhancedMessageService;