/**
 * 🚀 UNIFIED CHAT & CALL STATE MANAGEMENT
 * Centralized state management for perfect synchronization between MessageService and CallService
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 🏪 Unified Chat & Call Store with Zustand (Latest)
export const useUnifiedChatStore = create()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Message state
        messages: new Map(), // messageId -> message
        chats: new Map(), // chatId -> chat info
        drafts: new Map(), // chatId -> draft message
        typingUsers: new Map(), // chatId -> Set of userIds
        messagesByChat: new Map(), // chatId -> Set of messageIds
        unreadCounts: new Map(), // chatId -> count
        lastReadMessages: new Map(), // chatId -> messageId
        offlineMessages: new Map(), // tempId -> message
        messageStats: {
          totalMessages: 0,
          messagesSent: 0,
          messagesReceived: 0,
          messagesDelivered: 0,
          messagesRead: 0,
          failedMessages: 0,
          syncOperations: 0,
          conflictsResolved: 0
        },
        
        // Call state
        calls: new Map(), // callId -> call object
        activeCallId: null,
        callHistory: [],
        localStream: null,
        remoteStreams: new Map(), // participantId -> stream
        peerConnections: new Map(), // participantId -> RTCPeerConnection
        connectionStats: new Map(), // participantId -> stats
        callStats: {
          totalCalls: 0,
          completedCalls: 0,
          failedCalls: 0,
          averageCallDuration: 0,
          totalCallTime: 0,
          connectionIssues: 0,
          mediaErrors: 0
        },
        
        // UI state
        uiState: {
          isCallWindowOpen: false,
          isMinimized: false,
          currentView: 'grid', // grid, spotlight, presentation
          showControls: true,
          showChat: false,
          showParticipants: false
        },
        
        // Sync state
        isSyncing: false,
        lastSyncTime: null,
        syncStatus: 'synced', // 'synced', 'syncing', 'error'
        
        // Connection state
        isConnected: false,
        isOnline: navigator.onLine,
        
        // Message Actions
        addMessage: (message) => set((state) => {
          const messageId = message.id || message.tempId;
          state.messages.set(messageId, message);
          
          // Add to chat index
          if (!state.messagesByChat.has(message.chatId)) {
            state.messagesByChat.set(message.chatId, new Set());
          }
          state.messagesByChat.get(message.chatId).add(messageId);
          
          state.messageStats.totalMessages++;
        }),
        
        updateMessage: (message) => set((state) => {
          const messageId = message.id || message.tempId;
          state.messages.set(messageId, message);
        }),
        
        removeMessage: (messageId) => set((state) => {
          const message = state.messages.get(messageId);
          if (message) {
            state.messages.delete(messageId);
            
            // Remove from chat index
            if (state.messagesByChat.has(message.chatId)) {
              state.messagesByChat.get(message.chatId).delete(messageId);
            }
            
            state.messageStats.totalMessages = Math.max(0, state.messageStats.totalMessages - 1);
          }
        }),
        
        addMessagesToChat: (chatId, messages) => set((state) => {
          if (!state.messagesByChat.has(chatId)) {
            state.messagesByChat.set(chatId, new Set());
          }
          
          messages.forEach(message => {
            const messageId = message.id || message.tempId;
            state.messages.set(messageId, message);
            state.messagesByChat.get(chatId).add(messageId);
          });
          
          state.messageStats.totalMessages += messages.length;
        }),
        
        updateUnreadCount: (chatId, count) => set((state) => {
          state.unreadCounts.set(chatId, count);
        }),
        
        updateLastReadMessage: (chatId, messageId) => set((state) => {
          state.lastReadMessages.set(chatId, messageId);
        }),
        
        setTypingUsers: (chatId, userIds) => set((state) => {
          state.typingUsers.set(chatId, new Set(userIds));
        }),
        
        addTypingUser: (chatId, userId) => set((state) => {
          if (!state.typingUsers.has(chatId)) {
            state.typingUsers.set(chatId, new Set());
          }
          state.typingUsers.get(chatId).add(userId);
        }),
        
        removeTypingUser: (chatId, userId) => set((state) => {
          if (state.typingUsers.has(chatId)) {
            state.typingUsers.get(chatId).delete(userId);
            if (state.typingUsers.get(chatId).size === 0) {
              state.typingUsers.delete(chatId);
            }
          }
        }),
        
        addOfflineMessage: (message) => set((state) => {
          const tempId = message.tempId;
          state.offlineMessages.set(tempId, message);
        }),
        
        removeOfflineMessage: (tempId) => set((state) => {
          state.offlineMessages.delete(tempId);
        }),
        
        clearOfflineMessages: () => set((state) => {
          state.offlineMessages.clear();
        }),
        
        // Call Actions
        addCall: (call) => set((state) => {
          state.calls.set(call.id, call);
          state.callStats.totalCalls++;
        }),
        
        updateCall: (call) => set((state) => {
          state.calls.set(call.id, call);
        }),
        
        removeCall: (callId) => set((state) => {
          state.calls.delete(callId);
        }),
        
        setActiveCall: (callId) => set((state) => {
          state.activeCallId = callId;
        }),
        
        addCallHistory: (call) => set((state) => {
          state.callHistory.unshift(call);
          // Limit history size
          if (state.callHistory.length > 100) {
            state.callHistory = state.callHistory.slice(0, 100);
          }
        }),
        
        setLocalStream: (stream) => set((state) => {
          state.localStream = stream;
        }),
        
        addRemoteStream: (participantId, stream) => set((state) => {
          state.remoteStreams.set(participantId, stream);
        }),
        
        removeRemoteStream: (participantId) => set((state) => {
          state.remoteStreams.delete(participantId);
        }),
        
        addPeerConnection: (participantId, connection) => set((state) => {
          state.peerConnections.set(participantId, connection);
        }),
        
        removePeerConnection: (participantId) => set((state) => {
          state.peerConnections.delete(participantId);
        }),
        
        updateConnectionStats: (participantId, stats) => set((state) => {
          state.connectionStats.set(participantId, stats);
        }),
        
        // UI Actions
        updateUIState: (updates) => set((state) => {
          state.uiState = { ...state.uiState, ...updates };
        }),
        
        // Sync Actions
        setSyncing: (syncing) => set((state) => {
          state.isSyncing = syncing;
        }),
        
        setLastSyncTime: (time) => set((state) => {
          state.lastSyncTime = time;
        }),
        
        setSyncStatus: (status) => set((state) => {
          state.syncStatus = status;
        }),
        
        // Connection Actions
        setConnected: (connected) => set((state) => {
          state.isConnected = connected;
        }),
        
        setOnline: (online) => set((state) => {
          state.isOnline = online;
        }),
        
        // Stats Actions
        updateMessageStats: (stats) => set((state) => {
          state.messageStats = { ...state.messageStats, ...stats };
        }),
        
        updateCallStats: (stats) => set((state) => {
          state.callStats = { ...state.callStats, ...stats };
        }),
        
        // Reset Actions
        resetChatState: () => set((state) => {
          state.messages.clear();
          state.chats.clear();
          state.drafts.clear();
          state.typingUsers.clear();
          state.messagesByChat.clear();
          state.unreadCounts.clear();
          state.lastReadMessages.clear();
          state.offlineMessages.clear();
          state.messageStats = {
            totalMessages: 0,
            messagesSent: 0,
            messagesReceived: 0,
            messagesDelivered: 0,
            messagesRead: 0,
            failedMessages: 0,
            syncOperations: 0,
            conflictsResolved: 0
          };
        }),
        
        resetCallState: () => set((state) => {
          state.calls.clear();
          state.activeCallId = null;
          state.callHistory = [];
          state.localStream = null;
          state.remoteStreams.clear();
          state.peerConnections.clear();
          state.connectionStats.clear();
          state.callStats = {
            totalCalls: 0,
            completedCalls: 0,
            failedCalls: 0,
            averageCallDuration: 0,
            totalCallTime: 0,
            connectionIssues: 0,
            mediaErrors: 0
          };
        }),
        
        // Getters
        getMessagesForChat: (chatId) => {
          const state = get();
          const messageIds = state.messagesByChat.get(chatId);
          if (!messageIds) return [];
          
          return Array.from(messageIds)
            .map(id => state.messages.get(id))
            .filter(msg => msg && msg.state !== 'deleted')
            .sort((a, b) => a.timestamp - b.timestamp);
        },
        
        getUnreadCount: (chatId) => {
          const state = get();
          return state.unreadCounts.get(chatId) || 0;
        },
        
        getTypingUsers: (chatId) => {
          const state = get();
          return state.typingUsers.has(chatId) ? Array.from(state.typingUsers.get(chatId)) : [];
        },
        
        getActiveCall: () => {
          const state = get();
          return state.activeCallId ? state.calls.get(state.activeCallId) : null;
        },
        
        getCall: (callId) => {
          const state = get();
          return state.calls.get(callId);
        },
        
        getCallHistory: (limit = 50) => {
          const state = get();
          return state.callHistory.slice(0, limit);
        },
        
        getConnectionStats: (participantId) => {
          const state = get();
          return state.connectionStats.get(participantId);
        },
        
        getAllConnectionStats: () => {
          const state = get();
          return Object.fromEntries(state.connectionStats);
        },
        
        getLocalStream: () => {
          const state = get();
          return state.localStream;
        },
        
        getRemoteStream: (participantId) => {
          const state = get();
          return state.remoteStreams.get(participantId);
        },
        
        getAllRemoteStreams: () => {
          const state = get();
          return Object.fromEntries(state.remoteStreams);
        },
        
        isInCall: () => {
          const state = get();
          const activeCall = state.getActiveCall();
          return !!activeCall && activeCall.state === 'connected';
        }
      }))
    ),
    {
      name: 'swaggo-unified-chat-store',
      version: 1,
    }
  )
);

// 🎯 Performance selector hooks
export const useMessages = () => useUnifiedChatStore((state) => ({
  messages: state.messages,
  messagesByChat: state.messagesByChat,
  unreadCounts: state.unreadCounts,
  lastReadMessages: state.lastReadMessages,
  typingUsers: state.typingUsers,
  offlineMessages: state.offlineMessages,
  messageStats: state.messageStats,
  addMessage: state.addMessage,
  updateMessage: state.updateMessage,
  removeMessage: state.removeMessage,
  addMessagesToChat: state.addMessagesToChat,
  updateUnreadCount: state.updateUnreadCount,
  updateLastReadMessage: state.updateLastReadMessage,
  setTypingUsers: state.setTypingUsers,
  addTypingUser: state.addTypingUser,
  removeTypingUser: state.removeTypingUser,
  addOfflineMessage: state.addOfflineMessage,
  removeOfflineMessage: state.removeOfflineMessage,
  clearOfflineMessages: state.clearOfflineMessages,
  getMessagesForChat: state.getMessagesForChat,
  getUnreadCount: state.getUnreadCount,
  getTypingUsers: state.getTypingUsers
}));

export const useCalls = () => useUnifiedChatStore((state) => ({
  calls: state.calls,
  activeCallId: state.activeCallId,
  callHistory: state.callHistory,
  localStream: state.localStream,
  remoteStreams: state.remoteStreams,
  peerConnections: state.peerConnections,
  connectionStats: state.connectionStats,
  callStats: state.callStats,
  addCall: state.addCall,
  updateCall: state.updateCall,
  removeCall: state.removeCall,
  setActiveCall: state.setActiveCall,
  addCallHistory: state.addCallHistory,
  setLocalStream: state.setLocalStream,
  addRemoteStream: state.addRemoteStream,
  removeRemoteStream: state.removeRemoteStream,
  addPeerConnection: state.addPeerConnection,
  removePeerConnection: state.removePeerConnection,
  updateConnectionStats: state.updateConnectionStats,
  getActiveCall: state.getActiveCall,
  getCall: state.getCall,
  getCallHistory: state.getCallHistory,
  getConnectionStats: state.getConnectionStats,
  getAllConnectionStats: state.getAllConnectionStats,
  getLocalStream: state.getLocalStream,
  getRemoteStream: state.getRemoteStream,
  getAllRemoteStreams: state.getAllRemoteStreams,
  isInCall: state.isInCall
}));

export const useChatUI = () => useUnifiedChatStore((state) => ({
  uiState: state.uiState,
  syncStatus: state.syncStatus,
  isConnected: state.isConnected,
  isOnline: state.isOnline,
  isSyncing: state.isSyncing,
  lastSyncTime: state.lastSyncTime,
  updateUIState: state.updateUIState,
  setSyncStatus: state.setSyncStatus,
  setConnected: state.setConnected,
  setOnline: state.setOnline,
  setSyncing: state.setSyncing,
  setLastSyncTime: state.setLastSyncTime
}));

export const useChatStats = () => useUnifiedChatStore((state) => ({
  messageStats: state.messageStats,
  callStats: state.callStats,
  updateMessageStats: state.updateMessageStats,
  updateCallStats: state.updateCallStats
}));

export const useChatActions = () => useUnifiedChatStore((state) => ({
  resetChatState: state.resetChatState,
  resetCallState: state.resetCallState
}));