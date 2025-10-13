'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';

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
  
  // ========================================
  // CONNECTION QUALITY MONITORING
  // ========================================
  const [connectionQuality, setConnectionQuality] = useState({
    latency: null,
    bandwidth: 'unknown',
    packetLoss: 0,
    jitter: 0,
    effectiveType: 'unknown'
  });
  const latencyHistory = useRef([]);
  const messageDeduplicationCache = useRef(new Map()); // Track sent message IDs
  const auth = useFixedSecureAuth();
  const { isAuthenticated, user, isLoading, _debug } = auth;
  
  // Use secure cookie-based authentication (tokens in httpOnly cookies)
  console.log('🔍 SocketProvider: Auth state:', { isAuthenticated, hasUser: !!user, userProfileId: user?.profileid });
  
  // 🔍 DEBUG: Track auth state changes in socket provider
  useEffect(() => {
    console.log('🔍 SOCKET PROVIDER: Auth state changed:', {
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      profileid: user?.profileid,
      connectionStatus,
      isConnected,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, user, connectionStatus, isConnected]);
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = useRef(5);
  const reconnectTimeout = useRef(null);
  const initializationInProgress = useRef(false); // Prevent concurrent initializations
  const socketRef = useRef(null); // Keep a ref to the socket instance
  const pingInterval = useRef(null);
  const lastPingTime = useRef(null);

  // 🔄 CRITICAL FIX: Enhanced message queuing with overflow protection and size limits
  const queueMessage = useCallback((messageData) => {
    const MAX_QUEUE_SIZE = 100; // Maximum messages to queue
    const MAX_MESSAGE_AGE = 300000; // 5 minutes max age
    
    const queuedMessage = {
      id: Date.now() + Math.random(),
      data: messageData,
      timestamp: new Date(),
      attempts: 0,
      maxAttempts: 3
    };
    
    setMessageQueue(prev => {
      // 🔄 CRITICAL FIX: Clean old messages first
      const now = Date.now();
      const cleanedQueue = prev.filter(msg => {
        const messageAge = now - msg.timestamp.getTime();
        return messageAge < MAX_MESSAGE_AGE;
      });
      
      // 🔄 CRITICAL FIX: Prevent queue overflow
      let newQueue = [...cleanedQueue, queuedMessage];
      
      if (newQueue.length > MAX_QUEUE_SIZE) {
        console.warn(`⚠️ QUEUE: Queue size limit exceeded (${newQueue.length}), removing oldest messages`);
        // Remove oldest messages to make room, keeping most recent
        newQueue = newQueue.slice(-MAX_QUEUE_SIZE);
      }
      
      console.log(`📦 QUEUE: Added message to queue, size: ${newQueue.length}/${MAX_QUEUE_SIZE}`);
      return newQueue;
    });
    
    return queuedMessage.id;
  }, []);

  const markMessageDelivered = useCallback((messageId) => {
    setPendingMessages(prev => {
      const newMap = new Map(prev);
      if (newMap.has(messageId)) {
        newMap.get(messageId).status = 'delivered';
      }
      return newMap;
    });
  }, []);

  const markMessageFailed = useCallback((messageId) => {
    setPendingMessages(prev => {
      const newMap = new Map(prev);
      if (newMap.has(messageId)) {
        newMap.get(messageId).status = 'failed';
      }
      return newMap;
    });
  }, []);

  // ========================================
  // LATENCY & CONNECTION QUALITY MONITORING
  // ========================================
  
  const measureLatency = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) return;
    
    const startTime = Date.now();
    lastPingTime.current = startTime;
    
    socketRef.current.emit('ping', { timestamp: startTime }, (response) => {
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      // Update latency history (keep last 10 measurements)
      latencyHistory.current.push(latency);
      if (latencyHistory.current.length > 10) {
        latencyHistory.current.shift();
      }
      
      // Calculate average latency
      const avgLatency = latencyHistory.current.reduce((a, b) => a + b, 0) / latencyHistory.current.length;
      
      // Calculate jitter (variation in latency)
      const jitter = latencyHistory.current.length > 1
        ? Math.abs(latencyHistory.current[latencyHistory.current.length - 1] - latencyHistory.current[latencyHistory.current.length - 2])
        : 0;
      
      setConnectionQuality(prev => ({
        ...prev,
        latency: Math.round(avgLatency),
        jitter: Math.round(jitter)
      }));
    });
  }, []);
  
  const updateNetworkInfo = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      setConnectionQuality(prev => ({
        ...prev,
        effectiveType: connection.effectiveType || 'unknown',
        bandwidth: connection.downlink ? `${connection.downlink} Mbps` : 'unknown'
      }));
    }
  }, []);
  
  // Start latency monitoring when connected
  useEffect(() => {
    if (isConnected && socketRef.current) {
      // Initial measurement
      measureLatency();
      updateNetworkInfo();
      
      // Set up periodic latency checks (every 30 seconds)
      pingInterval.current = setInterval(() => {
        measureLatency();
        updateNetworkInfo();
      }, 30000);
      
      // Listen for network change events
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        connection.addEventListener('change', updateNetworkInfo);
      }
      
      return () => {
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }
        
        if (typeof navigator !== 'undefined' && 'connection' in navigator) {
          const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
          connection.removeEventListener('change', updateNetworkInfo);
        }
      };
    }
  }, [isConnected, measureLatency, updateNetworkInfo]);
  
  // ========================================
  // MESSAGE DEDUPLICATION
  // ========================================
  
  const cleanDeduplicationCache = useCallback(() => {
    const MAX_CACHE_SIZE = 1000;
    const MAX_CACHE_AGE = 300000; // 5 minutes
    const now = Date.now();
    
    const cache = messageDeduplicationCache.current;
    const entries = Array.from(cache.entries());
    
    // Remove old entries
    const cleaned = entries.filter(([_, timestamp]) => {
      return now - timestamp < MAX_CACHE_AGE;
    });
    
    // Keep only recent entries if cache is too large
    if (cleaned.length > MAX_CACHE_SIZE) {
      cleaned.sort((a, b) => b[1] - a[1]); // Sort by timestamp descending
      cleaned.splice(MAX_CACHE_SIZE); // Keep only MAX_CACHE_SIZE most recent
    }
    
    messageDeduplicationCache.current = new Map(cleaned);
  }, []);
  
  const isDuplicateMessage = useCallback((clientMessageId) => {
    if (!clientMessageId) return false;
    
    const cache = messageDeduplicationCache.current;
    if (cache.has(clientMessageId)) {
      console.warn(`⚠️ DEDUP: Duplicate message detected: ${clientMessageId}`);
      return true;
    }
    
    // Add to cache
    cache.set(clientMessageId, Date.now());
    
    // Periodic cleanup
    if (cache.size > 1000) {
      cleanDeduplicationCache();
    }
    
    return false;
  }, [cleanDeduplicationCache]);
  
  // ========================================
  // NETWORK ONLINE/OFFLINE MONITORING
  // ========================================
  
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Back online');
      setConnectionStatus('reconnecting');
      
      // Emit custom event for reconnection logic to handle
      // This avoids circular dependency issues
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('network-online', {
          detail: { timestamp: Date.now() }
        }));
      }
    };
    
    const handleOffline = () => {
      console.log('🌐 Network: Offline');
      setConnectionStatus('Network offline');
      setIsConnected(false);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // 🔄 CRITICAL FIX: Enhanced message queuing with overflow protection and size limits
  const processMessageQueue = useCallback((socketInstance) => {
    if (!socketInstance || messageQueue.length === 0) {
      console.log('📦 QUEUE: Nothing to process');
      return;
    }
    
    console.log(`📦 QUEUE: Processing ${messageQueue.length} queued messages`);
    
    const messagesToProcess = [...messageQueue];
    setMessageQueue([]);
    
    // 🔄 CRITICAL FIX: Clean up old pending messages before processing new ones
    setPendingMessages(prev => {
      const MAX_PENDING_SIZE = 50;
      const MAX_PENDING_AGE = 300000; // 5 minutes
      const now = Date.now();
      
      const cleaned = new Map();
      let cleanedCount = 0;
      
      for (const [id, message] of prev.entries()) {
        const messageAge = now - message.timestamp.getTime();
        if (messageAge < MAX_PENDING_AGE && cleaned.size < MAX_PENDING_SIZE) {
          cleaned.set(id, message);
        } else {
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 PENDING: Cleaned ${cleanedCount} old pending messages, remaining: ${cleaned.size}`);
      }
      
      return cleaned;
    });
    
    messagesToProcess.forEach((queuedMessage) => {
      if (queuedMessage.attempts < queuedMessage.maxAttempts) {
        queuedMessage.attempts++;
        
        console.log(`📤 QUEUE: Processing message ${queuedMessage.id} (attempt ${queuedMessage.attempts}/${queuedMessage.maxAttempts})`);
        
        // Add message to pending tracking
        setPendingMessages(prev => new Map(prev).set(queuedMessage.id, {
          ...queuedMessage.data,
          status: 'sending',
          timestamp: new Date()
        }));
        
        socketInstance.emit('send_message', queuedMessage.data, (ack) => {
          if (ack && ack.success) {
            console.log(`✅ QUEUE: Message ${queuedMessage.id} delivered successfully`);
            markMessageDelivered(queuedMessage.id);
          } else {
            console.warn(`❌ QUEUE: Message ${queuedMessage.id} failed to deliver:`, ack);
            markMessageFailed(queuedMessage.id);
            
            // Re-queue if attempts remaining
            if (queuedMessage.attempts < queuedMessage.maxAttempts) {
              const retryDelay = Math.min(1000 * Math.pow(2, queuedMessage.attempts - 1), 30000);
              console.log(`🔄 QUEUE: Re-queuing message ${queuedMessage.id} after ${retryDelay}ms`);
              
              setTimeout(() => {
                setMessageQueue(prev => {
                  // Prevent re-queuing if queue is getting too large
                  if (prev.length >= 100) {
                    console.warn(`⚠️ QUEUE: Queue full, dropping retry for message ${queuedMessage.id}`);
                    return prev;
                  }
                  return [...prev, queuedMessage];
                });
              }, retryDelay);
            } else {
              console.error(`❌ QUEUE: Message ${queuedMessage.id} exceeded max attempts, dropping`);
            }
          }
        });
      } else {
        console.error(`❌ QUEUE: Message ${queuedMessage.id} already exceeded max attempts`);
      }
    });
  }, [messageQueue, markMessageDelivered, markMessageFailed]);

  // 🔄 CRITICAL FIX: Enhanced reconnection logic with auth failure detection and exponential backoff
  const attemptReconnection = useCallback((errorType = 'unknown') => {
    console.log('🔄 RECONNECT: Attempting reconnection for error type:', errorType);
    
    // 🚨 CRITICAL FIX: Don't retry auth-related errors indefinitely
    if (errorType === 'auth_failed' || errorType === 'unauthorized' || errorType === 'forbidden') {
      console.error('❌ RECONNECT: Authentication error detected - stopping reconnection attempts');
      setConnectionStatus('Authentication failed');
      setIsConnected(false);
      reconnectAttempts.current = 0; // Reset for future auth success
      return;
    }
    
    // 🔄 CRITICAL FIX: Check if we've exceeded maximum attempts
    if (reconnectAttempts.current >= maxReconnectAttempts.current) {
      console.error(`❌ RECONNECT: Maximum reconnection attempts reached (${maxReconnectAttempts.current})`);
      setConnectionStatus('Connection failed');
      setIsConnected(false);
      
      // 🔄 CRITICAL FIX: Reset attempts after extended delay for potential recovery
      setTimeout(() => {
        console.log('🔄 RECONNECT: Resetting reconnection attempts for potential recovery');
        reconnectAttempts.current = 0;
        maxReconnectAttempts.current = Math.min(maxReconnectAttempts.current + 1, 10); // Gradually increase max attempts
      }, 300000); // 5 minutes
      
      return;
    }
    
    reconnectAttempts.current++;
    setConnectionStatus('reconnecting');
    
    // 🔄 CRITICAL FIX: Smart exponential backoff with jitter and caps
    // Use disconnect reason if available for better backoff strategy
    let baseDelay;
    if (socketRef.current?._disconnectReason) {
      const reason = socketRef.current._disconnectReason;
      if (reason === 'server') {
        // Server issues - longer delays
        baseDelay = 1000 * Math.pow(2, Math.min(reconnectAttempts.current - 1, 6));
      } else if (reason === 'network') {
        // Network issues - moderate delays
        baseDelay = 500 * Math.pow(2, Math.min(reconnectAttempts.current - 1, 7));
      } else if (reason === 'client') {
        // Client issues - shorter delays
        baseDelay = 250 * Math.pow(2, Math.min(reconnectAttempts.current - 1, 8));
      } else {
        // Unknown issues - default exponential backoff
        baseDelay = 1000 * Math.pow(2, Math.min(reconnectAttempts.current - 1, 6));
      }
    } else {
      // Fallback to errorType-based delays
      if (errorType === 'server') {
        baseDelay = 1000 * Math.pow(2, Math.min(reconnectAttempts.current - 1, 6));
      } else if (errorType === 'network') {
        baseDelay = 500 * Math.pow(2, Math.min(reconnectAttempts.current - 1, 7));
      } else {
        baseDelay = 1000 * Math.pow(2, Math.min(reconnectAttempts.current - 1, 6));
      }
    }
    
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    const maxDelay = errorType === 'network' ? 30000 : 60000; // Longer delays for persistent issues
    const delay = Math.min(baseDelay + jitter, maxDelay);
    
    console.log(`⏰ RECONNECT: Scheduling attempt ${reconnectAttempts.current}/${maxReconnectAttempts.current} in ${Math.round(delay)}ms`);
    
    // 🔄 CRITICAL FIX: Clear any existing reconnection timeout before setting a new one
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    reconnectTimeout.current = setTimeout(() => {
      const standardizedUserId = user?.profileid || user?.id;
      
      console.log(`🔄 RECONNECT: Executing attempt ${reconnectAttempts.current}/${maxReconnectAttempts.current}`);
      
      // 🔄 CRITICAL FIX: Verify auth state before attempting reconnection
      if (!isAuthenticated) {
        console.warn('⚠️ RECONNECT: User no longer authenticated - canceling reconnection');
        setConnectionStatus('Not authenticated');
        reconnectAttempts.current = 0;
        return;
      }
      
      if (!standardizedUserId) {
        console.warn('⚠️ RECONNECT: Missing user ID - canceling reconnection');
        setConnectionStatus('Missing user data');
        return;
      }
      
      console.log(`✅ RECONNECT: Proceeding with reconnection for user: ${standardizedUserId}`);
      initializeSocket();
    }, delay);
  }, [isAuthenticated, user?.profileid, user?.id]);

  const initializeSocket = useCallback(() => {
    // 🚫 CRITICAL: Prevent initialization if user is not authenticated
    if (!isAuthenticated || !user) {
      console.log('⚠️ SOCKET INIT: User not authenticated, skipping initialization');
      setConnectionStatus('Not authenticated');
      return null;
    }
    
    // 🚫 CRITICAL: Prevent concurrent initializations
    if (initializationInProgress.current) {
      console.log('⚠️ SOCKET INIT: Initialization already in progress, skipping');
      return socketRef.current;
    }
    
    // 🚫 CRITICAL: Prevent multiple socket initializations
    if (socketRef.current && socketRef.current.connected) {
      console.log('⚠️ SOCKET INIT: Socket already exists and connected, skipping initialization');
      return socketRef.current;
    }
    
    if (socketRef.current && !socketRef.current.connected) {
      console.log('⚠️ SOCKET INIT: Socket exists but disconnected, cleaning up before reinitializing');
      // 🔄 CRITICAL FIX: Properly close existing socket before creating new one
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
    }
    
    initializationInProgress.current = true;
    
    console.log('🔄 Initializing socket connection...');
    console.log('Server URL:', process.env.NEXT_PUBLIC_SERVER_URL);
    console.log('Authentication:', isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
    
    // 🔍 ENHANCED DEBUG: Detailed user object analysis for socket authentication
    console.log('🔍 SOCKET INIT: User object analysis:', {
      hasUser: !!user,
      userKeys: user ? Object.keys(user) : 'No user object',
      userId: user?.id,
      profileid: user?.profileid,
      username: user?.username,
      email: user?.email,
      fullUserObject: user // Log entire user object to check structure
    });
    
    // 🔄 CRITICAL FIX: Standardized user ID resolution with profileid priority
    const standardizedUserId = user?.profileid || user?.id;
    
    // ⚠️ CRITICAL FIX: Ensure profileid is available for socket authentication
    if (user && !user.profileid && user.id) {
      console.warn('⚠️ SOCKET AUTH: User missing profileid, using id as fallback. This may cause authentication issues.');
      console.warn('⚠️ SOCKET AUTH: Backend should ensure user objects include profileid field.');
    }
    
    console.log('🎯 SOCKET AUTH: Standardized userId for authentication:', {
      userId: standardizedUserId,
      source: user?.profileid ? 'profileid' : 'id_fallback',
      profileidAvailable: !!user?.profileid,
      idAvailable: !!user?.id
    });
    
    setConnectionStatus('connecting');
    
    // Check authentication status and user ID availability
    if (!isAuthenticated || !standardizedUserId) {
      console.error('❌ User not authenticated or no user ID available', {
        isAuthenticated,
        standardizedUserId,
        originalProfileid: user?.profileid,
        originalId: user?.id
      });
      setConnectionStatus('Not authenticated');
      initializationInProgress.current = false; // Reset flag on error
      return;
    }
    
    // 🔄 CRITICAL FIX: Double-check authentication state before creating socket
    // This prevents race conditions where auth state changes during socket initialization
    if (typeof window !== 'undefined') {
      const authEvent = new CustomEvent('auth-socket-check', {
        detail: {
          user: user,
          isAuthenticated: isAuthenticated,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(authEvent);
    }
    
    console.log('Using secure cookie-based authentication');
    
    // Create socket connection with secure cookie-based authentication
    console.log('🔍 Creating socket with cookie authentication...');
    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL, {
      withCredentials: true, // Critical: Send httpOnly cookies for authentication
      auth: {
        timestamp: Date.now() // Only send timestamp for security, not user identifiers
      },
      autoConnect: true,
      timeout: 15000, // Increase timeout for authentication
      reconnection: false, // 🔄 CRITICAL FIX: Disable automatic reconnection, we handle it manually
      transports: ['polling', 'websocket'], // Start with polling for cookie auth
      forceNew: true, // Force new connection to prevent reuse issues
      upgrade: true // Allow upgrade to websocket after auth
    });

    // Store socket in ref and state
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    const handleConnect = () => {
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
    };

    const handleDisconnect = (reason) => {
      console.log('🔴 DISCONNECT: Disconnected from chat server:', reason);
      setIsConnected(false);
      setOnlineUsers(new Set());
      
      // 🔄 CRITICAL FIX: Classify disconnect reasons for appropriate reconnection strategy
      if (reason === 'io server disconnect') {
        console.log('🛠️ DISCONNECT: Server initiated disconnect - will not auto-reconnect');
        setConnectionStatus('Server disconnected');
        reconnectAttempts.current = 0; // Reset attempts
      } else if (reason === 'io client disconnect') {
        console.log('🛠️ DISCONNECT: Client initiated disconnect - will not auto-reconnect');
        setConnectionStatus('disconnected');
        reconnectAttempts.current = 0; // Reset attempts
      } else if (reason.includes('unauthorized') || reason.includes('auth')) {
        console.error('🔒 DISCONNECT: Authentication-related disconnect:', reason);
        setConnectionStatus('Authentication failed');
        attemptReconnection('auth_failed');
      } else {
        // Network or other client-side disconnect, attempt reconnection
        console.log('🔄 DISCONNECT: Network disconnect - attempting reconnection');
        setConnectionStatus('disconnected');
        attemptReconnection('network');
      }
    };

    const handleConnectError = (error) => {
      console.error('❌ SOCKET ERROR: Connection failed:', error.message);
      console.error('🔍 SOCKET ERROR: Detailed error info:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type,
        stack: error.stack
      });
      console.error('🔍 SOCKET ERROR: Client state:', {
        isAuthenticated,
        hasUser: !!user,
        userProfileId: user?.profileid,
        serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
        withCredentials: true
      });
      
      setIsConnected(false);
      
      // 🔄 CRITICAL FIX: Classify connection errors for appropriate reconnection strategy
      // Add proper type checking to prevent "toLowerCase is not a function" errors
      const errorMessage = (typeof error.message === 'string') ? error.message.toLowerCase() : '';
      const errorDescription = (typeof error.description === 'string') ? error.description.toLowerCase() : '';
      
      let errorType = 'network';
      let statusMessage = 'Connection error';
      
      if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') || errorMessage.includes('forbidden') || errorMessage.includes('auth')) {
        errorType = 'auth_failed';
        statusMessage = 'Authentication failed';
        console.error('🔒 SOCKET ERROR: Authentication error detected');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('enotfound')) {
        errorType = 'network';
        statusMessage = 'Network error';
        console.error('🌍 SOCKET ERROR: Network error detected');
      } else if (errorMessage.includes('server') || error.type === 'TransportError') {
        errorType = 'server';
        statusMessage = 'Server error';
        console.error('🛠️ SOCKET ERROR: Server error detected');
      } else {
        console.error('❓ SOCKET ERROR: Unknown error type');
      }
      
      setConnectionStatus(statusMessage);
      attemptReconnection(errorType);
    };

    // Message acknowledgment handlers
    const handleMessageAck = (data) => {
      const { messageId, status, serverMessageId } = data;
      if (status === 'delivered') {
        markMessageDelivered(messageId);
      } else {
        markMessageFailed(messageId);
      }
    };

    // User presence handlers
    const handleUserJoined = (data) => {
      setOnlineUsers(prev => new Set([...prev, data.profileid]));
    };

    const handleUserLeft = (data) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(data.profileid);
        return updated;
      });
    };

    // User presence handlers for online/offline status
    const handleUserOnline = (data) => {
      console.log('🟢 User came online:', data);
      setOnlineUsers(prev => new Set([...prev, data.profileid]));
    };

    const handleUserOffline = (data) => {
      console.log('🔴 User went offline:', data);
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(data.profileid);
        return updated;
      });
    };

    const handleUserStatusChanged = (data) => {
      console.log('🔄 User status changed:', data);
      if (data.isOnline) {
        setOnlineUsers(prev => new Set([...prev, data.profileid]));
      } else {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(data.profileid);
          return updated;
        });
      }
    };

    // Attach event listeners
    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('connect_error', handleConnectError);
    newSocket.on('message_ack', handleMessageAck);
    newSocket.on('user_joined', handleUserJoined);
    newSocket.on('user_left', handleUserLeft);
    newSocket.on('user_online', handleUserOnline); // Handle deprecated user_online event
    newSocket.on('user_offline', handleUserOffline); // Handle deprecated user_offline event
    newSocket.on('user_status_changed', handleUserStatusChanged); // Handle new unified event
    
    // Request initial online users list when connected
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected, requesting online users');
      newSocket.emit('get_online_users', (users) => {
        console.log('👥 Received online users list:', users);
        if (Array.isArray(users)) {
          setOnlineUsers(new Set(users));
        }
      });
    });
    
    // Authentication success handler
    newSocket.on('auth_success', (data) => {
      console.log('✅ Socket authentication successful:', data);
      // Update connection status if needed
      if (connectionStatus !== 'connected') {
        setConnectionStatus('connected');
      }
    });
    
    // Authentication error handler
    newSocket.on('auth_error', (data) => {
      console.error('❌ Socket authentication error:', data);
      if (data.code === 'TOKEN_EXPIRED') {
        // Handle token refresh
        setConnectionStatus('Authentication failed - token expired');
        attemptReconnection('auth_failed');
      } else {
        setConnectionStatus('Authentication failed');
      }
    });
    
    // User joined chat handler
    newSocket.on('user_joined_chat', (data) => {
      console.log('👥 User joined chat:', data);
      // Emit event for other services to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user-joined-chat', { detail: data }));
      }
    });
    
    // Call ringing handler
    newSocket.on('call_ringing', (data) => {
      console.log('🔔 Call ringing:', data);
      // Emit event for call service
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('call-ringing', { detail: data }));
      }
    });
    
    // Disconnect reason handler
    newSocket.on('disconnect_reason', (data) => {
      console.log('🔌 Disconnect reason received from server:', data);
      // Store the disconnect reason for better reconnection strategy
      if (data.reason) {
        // We'll use this information in our reconnection logic
        newSocket._disconnectReason = data.reason;
      }
    });
    
    // Handle incoming call (FIX EVENT CONTRACT MISMATCH)
    newSocket.on('incoming_call', (data) => {
      console.log('📞 Incoming call:', data);
      // Emit event for call service with the correct event name
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('call_offer', { detail: data }));
      }
    });
    
    // Handle message delivered (FIX EVENT CONTRACT MISMATCH)
    newSocket.on('message_delivered', (data) => {
      console.log('✉️ Message delivered:', data);
      // Emit event with the correct event name
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('message_status_update', { detail: data }));
      }
    });
    
    // Handle message reaction (FIX EVENT CONTRACT MISMATCH)
    newSocket.on('message_reaction', (data) => {
      console.log('❤️ Message reaction:', data);
      // Emit event for message service
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('message_reaction', { detail: data }));
      }
    });
    
    // Handle message edit (FIX EVENT CONTRACT MISMATCH)
    newSocket.on('message_edited', (data) => {
      console.log('✏️ Message edited:', data);
      // Emit event for message service
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('message_edited', { detail: data }));
      }
    });
    
    // Handle typing start (FIX EVENT CONTRACT MISMATCH)
    newSocket.on('typing_start', (data) => {
      console.log('⌨️ User typing:', data);
      // Emit event with the correct event name
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user_typing', { detail: data }));
      }
    });

    // Handle message delete confirmation
    newSocket.on('delete_confirmation', (data) => {
      console.log('🗑️ Message delete confirmation:', data);
      // Emit event for message service
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('message_deleted', { detail: data }));
      }
    });

    // Handle message deleted by others
    newSocket.on('message_deleted', (data) => {
      console.log('🗑️ Message deleted by others:', data);
      // Emit event for message service
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('message_deleted_by_others', { detail: data }));
      }
    });

    initializationInProgress.current = false; // Reset flag after socket is set
    return newSocket;
  }, [isAuthenticated, user, processMessageQueue, attemptReconnection]);

  // 🔄 CRITICAL FIX: Event-driven socket initialization to prevent race conditions
  useEffect(() => {
    let cleanup = null;
    let authReadyListener = null;
    let authFailedListener = null;
    let hmrCleanup = null;
    
    // 🔄 CRITICAL FIX: Track if we've already attempted initialization
    // Move this inside the effect scope to avoid invalid hook call
    let hasAttemptedInit = false;
    
    const handleAuthReady = (event) => {
      const { user: authUser, isAuthenticated: authStatus, initializationComplete } = event.detail;
      console.log('🎉 SOCKET: Received auth-socket-ready event:', {
        hasUser: !!authUser,
        userId: authUser?.id,
        profileid: authUser?.profileid,
        isAuthenticated: authStatus,
        initializationComplete
      });
      
      // 🔄 CRITICAL FIX: Wait for authentication initialization to complete before proceeding
      if (!initializationComplete) {
        console.log('⚠️ SOCKET: Authentication initialization not complete, waiting...');
        return;
      }
      
      // 🔄 CRITICAL FIX: Prevent multiple initialization attempts
      if (hasAttemptedInit) {
        console.log('⚠️ SOCKET: Already attempted initialization, skipping');
        return;
      }
      
      hasAttemptedInit = true;
      
      if (authStatus && authUser && (authUser.profileid || authUser.id)) {
        console.log('✅ SOCKET: Initializing socket connection with authenticated user');
        const socketInstance = initializeSocket();
        
        // Set cleanup function for this socket instance
        cleanup = () => {
          if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
          }
          if (socketInstance) {
            socketInstance.close();
          }
          setSocket(null);
          socketRef.current = null;
          setIsConnected(false);
          setOnlineUsers(new Set());
          setConnectionStatus('disconnected');
          setMessageQueue([]);
          setPendingMessages(new Map());
        };
      }
    };
    
    const handleAuthFailed = (event) => {
      console.log('❌ SOCKET: Received auth-failed event:', event.detail.reason);
      setConnectionStatus('Not authenticated');
      
      // Cleanup any existing socket
      if (cleanup) cleanup();
      
      // Reset initialization flag
      hasAttemptedInit = false;
    };
    
    const handleNetworkOnline = (event) => {
      console.log('🌐 SOCKET: Network back online, attempting reconnection');
      
      // Only attempt reconnection if we have a disconnected socket and user is authenticated
      if (socketRef.current && !socketRef.current.connected && isAuthenticated && user) {
        console.log('🔄 SOCKET: Triggering reconnection after network recovery');
        attemptReconnection('network');
      } else if (!socketRef.current && isAuthenticated && user) {
        console.log('🔄 SOCKET: Initializing new socket after network recovery');
        initializeSocket();
      }
    };
    
    // HMR support for socket persistence during development
    const handleHMRUpdate = () => {
      console.log('🔄 HMR: Preserving socket connection during hot reload');
      // Don't cleanup socket during HMR updates
      // The socket connection should persist through hot reloads
      return () => {
        // Only cleanup timeouts during HMR, keep socket connection
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
      };
    };
    
    // Listen for authentication and network events
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-socket-ready', handleAuthReady);
      window.addEventListener('auth-failed', handleAuthFailed);
      window.addEventListener('network-online', handleNetworkOnline);
      authReadyListener = handleAuthReady;
      authFailedListener = handleAuthFailed;
      
      // HMR support
      if (process.env.NODE_ENV === 'development') {
        // Check if this is an HMR update
        if (window.__webpack_require__?.hmrC || window.__NEXT_HMR) {
          console.log('🔄 HMR: Detected hot module replacement environment');
          hmrCleanup = handleHMRUpdate();
        }
      }
    }
    
    // Fallback: Check current auth state if already authenticated
    const userId = user?.profileid || user?.id;
    const authInitialized = _debug ? _debug.initializationState?.completed : !isLoading;
    
    console.log('🔍 SOCKET useEffect: Current state check:', {
      isAuthenticated,
      hasUser: !!user,
      userId: userId,
      hasProfileId: !!user?.profileid,
      hasId: !!user?.id,
      authInitialized,
      hasSocket: !!socket,
      socketConnected: isConnected,
      fallbackConnectionNeeded: isAuthenticated && userId && authInitialized && !socket
    });
    
    // Fallback initialization if auth is already ready but no socket connection
    // Only attempt fallback if we're not already initializing and don't have a connected socket
    if (isAuthenticated && userId && authInitialized && !socketRef.current && !initializationInProgress.current && !isConnected) {
      console.log('🔄 SOCKET: Fallback initialization - auth already ready');
      // 🔄 CRITICAL FIX: Prevent multiple fallback attempts
      if (!hasAttemptedInit) {
        hasAttemptedInit = true;
        handleAuthReady({
          detail: {
            user: user,
            isAuthenticated: isAuthenticated,
            initializationComplete: true
          }
        });
      }
    }
    
    // 🔄 CRITICAL FIX: Handle authentication state changes
    // If user becomes unauthenticated, clean up existing connections
    if (!isAuthenticated && socketRef.current) {
      console.log('🔒 SOCKET: User no longer authenticated, cleaning up connection');
      if (cleanup) cleanup();
      hasAttemptedInit = false;
    }
    
    // Cleanup function
    return () => {
      if (authReadyListener && typeof window !== 'undefined') {
        window.removeEventListener('auth-socket-ready', authReadyListener);
      }
      if (authFailedListener && typeof window !== 'undefined') {
        window.removeEventListener('auth-failed', authFailedListener);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('network-online', handleNetworkOnline);
      }
      
      // HMR cleanup
      if (hmrCleanup) {
        hmrCleanup();
      } else if (cleanup) {
        // Normal cleanup (not HMR)
        cleanup();
      }
      
      // Clear any pending timeouts
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      
      // Reset initialization flag on cleanup
      hasAttemptedInit = false;
    };
  }, [isAuthenticated, user, isLoading, isConnected, initializeSocket]); // Simplified dependencies

  // ========================================
  // PUBLIC API METHODS
  // ========================================
  
  const joinChat = useCallback((chatid) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_chat', chatid);
    }
  }, []);

  const leaveChat = useCallback((chatid) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave_chat', chatid);
    }
  }, []);

  const sendMessage = useCallback((messageData, callback) => {
    // Check for duplicate message using clientMessageId
    const clientMessageId = messageData.clientMessageId || messageData.id;
    if (clientMessageId && isDuplicateMessage(clientMessageId)) {
      console.warn(`⚠️ DEDUP: Skipping duplicate message send: ${clientMessageId}`);
      if (callback) callback({ success: false, error: 'duplicate', messageId: clientMessageId });
      return null;
    }
    
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('⚠️ SOCKET: Cannot send message - not connected');
      // Queue the message for later sending
      const messageId = queueMessage(messageData);
      if (callback) callback({ success: false, queued: true, messageId });
      return messageId;
    }

    // Send immediately if connected
    socketRef.current.emit('send_message', messageData, callback);
    return null; // Not queued
  }, [queueMessage, isDuplicateMessage]);

  const startTyping = useCallback((chatid) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing_start', { chatid });
    }
  }, []);

  const stopTyping = useCallback((chatid) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing_stop', { chatid });
    }
  }, []);

  // Add the missing reactToMessage function
  const reactToMessage = useCallback((messageid, emoji, chatid) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('react_to_message', { messageid, emoji, chatid });
    }
  }, []);

  // Add the missing markChatAsRead function
  const markChatAsRead = useCallback((chatid) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('mark_chat_as_read', { chatid });
    }
  }, []);

  // ========================================
  // CONTEXT VALUE
  // ========================================
  
  const value = {
    socket: socketRef.current,
    isConnected,
    connectionStatus,
    connectionQuality, // Add connection quality metrics
    onlineUsers,
    messageQueue,
    pendingMessages,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    reactToMessage, // Add the new function to the context value
    markChatAsRead // Add the markChatAsRead function to the context value
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// HMR support for socket persistence
if (typeof module !== 'undefined' && module.hot && process.env.NODE_ENV === 'development') {
  module.hot.accept([], () => {
    console.log('🔄 HMR: SocketProvider hot reload accepted');
    // Preserve socket state during hot reload
  });
}
