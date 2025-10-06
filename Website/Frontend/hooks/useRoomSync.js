/**
 * Real-time Room Synchronization Hook
 * Manages room state, typing indicators, participant presence, and message ordering
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import messageService from '../services/MessageService';
import { useFixedSecureAuth } from '../context/FixedSecureAuthContext';

export function useRoomSync(chatId) {
  const { user } = useFixedSecureAuth();
  const [roomState, setRoomState] = useState(null);
  const [participants, setParticipants] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [messageOrder, setMessageOrder] = useState(0);
  const [lastActivity, setLastActivity] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'error'

  const typingTimeoutRef = useRef(null);
  const lastTypingRef = useRef(0);
  const syncTimeoutRef = useRef(null);

  // Initialize room state when chatId changes
  useEffect(() => {
    if (!chatId) return;

    const initialState = messageService.getRoomState(chatId);
    setRoomState(initialState);
    setParticipants(new Map(initialState.participants));
    setTypingUsers(Array.from(initialState.typingUsers));
    setMessageOrder(initialState.messageOrder);
    setLastActivity(initialState.lastActivity);
  }, [chatId]);

  // Listen for room events from MessageService
  useEffect(() => {
    if (!chatId) return;

    const handleRoomJoined = ({ chatId: eventChatId, userId, roomState: updatedRoomState }) => {
      if (eventChatId === chatId) {
        setRoomState(updatedRoomState);
        setParticipants(new Map(updatedRoomState.participants));
        console.log(`👥 Room sync: User ${userId} joined`);
      }
    };

    const handleRoomLeft = ({ chatId: eventChatId, userId, roomState: updatedRoomState }) => {
      if (eventChatId === chatId) {
        setRoomState(updatedRoomState);
        setParticipants(new Map(updatedRoomState.participants));
        
        // Remove from typing users if they were typing
        setTypingUsers(prev => prev.filter(id => id !== userId));
        console.log(`👤 Room sync: User ${userId} left`);
      }
    };

    const handleRoomStateUpdate = ({ chatId: eventChatId, state, roomState: updatedRoomState }) => {
      if (eventChatId === chatId) {
        setRoomState(updatedRoomState);
        
        if (state.messageOrder) {
          setMessageOrder(state.messageOrder);
        }
        
        if (state.lastActivity) {
          setLastActivity(state.lastActivity);
        }
        
        setSyncStatus('synced');
        console.log(`🔄 Room state updated for ${chatId}`);
      }
    };

    const handleTypingUpdate = ({ chatId: eventChatId, typingUsers: users, participantCount }) => {
      if (eventChatId === chatId) {
        // Filter out current user from typing display
        const otherTypingUsers = users.filter(userId => userId !== user?.profileid);
        setTypingUsers(otherTypingUsers);
        
        // Update connection status based on participant count
        setIsConnected(participantCount > 0);
      }
    };

    const handleMessageReordered = ({ chatId: eventChatId, messages, newOrder }) => {
      if (eventChatId === chatId) {
        setMessageOrder(prev => prev + 1);
        setSyncStatus('synced');
        console.log(`🔄 Messages reordered in ${chatId}: ${messages.length} messages`);
      }
    };

    const handleMessageOrderUpdate = ({ chatId: eventChatId, sequence, serverTimestamp }) => {
      if (eventChatId === chatId) {
        setMessageOrder(sequence);
        setLastActivity(serverTimestamp);
        setSyncStatus('synced');
      }
    };

    // Register event listeners
    messageService.on('room_joined', handleRoomJoined);
    messageService.on('room_left', handleRoomLeft);
    messageService.on('room_state_updated', handleRoomStateUpdate);
    messageService.on('room_typing_update', handleTypingUpdate);
    messageService.on('messages_reordered', handleMessageReordered);
    messageService.on('message_order_updated', handleMessageOrderUpdate);

    return () => {
      messageService.off('room_joined', handleRoomJoined);
      messageService.off('room_left', handleRoomLeft);
      messageService.off('room_state_updated', handleRoomStateUpdate);
      messageService.off('room_typing_update', handleTypingUpdate);
      messageService.off('messages_reordered', handleMessageReordered);
      messageService.off('message_order_updated', handleMessageOrderUpdate);
    };
  }, [chatId, user?.profileid]);

  // Start typing with debouncing
  const startTyping = useCallback(() => {
    if (!chatId || !user?.profileid) return;

    const now = Date.now();
    
    // Debounce typing start events
    if (now - lastTypingRef.current < 1000) {
      return;
    }

    lastTypingRef.current = now;
    
    if (!isTyping) {
      setIsTyping(true);
      messageService.startTyping(chatId);
      
      // Auto-stop typing after timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } else {
      // Extend typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    }
  }, [chatId, user?.profileid, isTyping]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!chatId || !user?.profileid || !isTyping) return;

    setIsTyping(false);
    messageService.stopTyping(chatId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [chatId, user?.profileid, isTyping]);

  // Manual room sync
  const syncRoom = useCallback(() => {
    if (!chatId) return;

    setSyncStatus('syncing');
    messageService.requestRoomSync(chatId);
    
    // Set timeout for sync status
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      setSyncStatus('error');
    }, 10000); // 10 second timeout
  }, [chatId]);

  // Get typing indicator text
  const getTypingText = useCallback(() => {
    if (typingUsers.length === 0) return null;
    
    const names = typingUsers.map(userId => {
      const participant = participants.get(userId);
      return participant?.name || participant?.username || 'Someone';
    });
    
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (names.length > 2) {
      return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`;
    }
    
    return null;
  }, [typingUsers, participants]);

  // Get participant list
  const getParticipants = useCallback(() => {
    return Array.from(participants.entries()).map(([userId, info]) => ({
      userId,
      ...info,
      isTyping: typingUsers.includes(userId),
      isCurrentUser: userId === user?.profileid
    }));
  }, [participants, typingUsers, user?.profileid]);

  // Get room statistics
  const getRoomStats = useCallback(() => {
    return {
      participantCount: participants.size,
      typingCount: typingUsers.length,
      messageOrder,
      lastActivity,
      isConnected,
      syncStatus,
      isUserTyping: isTyping
    };
  }, [participants.size, typingUsers.length, messageOrder, lastActivity, isConnected, syncStatus, isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      // Stop typing if currently typing
      if (isTyping && chatId) {
        messageService.stopTyping(chatId);
      }
    };
  }, [isTyping, chatId]);

  return {
    // Room state
    roomState,
    participants,
    typingUsers,
    messageOrder,
    lastActivity,
    
    // Connection state
    isConnected,
    syncStatus,
    
    // Typing state
    isTyping,
    typingText: getTypingText(),
    
    // Actions
    startTyping,
    stopTyping,
    syncRoom,
    
    // Helpers
    getParticipants,
    getRoomStats
  };
}

export default useRoomSync;