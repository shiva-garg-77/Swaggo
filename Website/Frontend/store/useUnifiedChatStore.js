/**
 * 🚀 UNIFIED CHAT & CALL STATE MANAGEMENT
 * Centralized state management for perfect synchronization between MessageService and CallService
 * 
 * DEPRECATED: Use useUnifiedStore instead
 */

import { useUnifiedStore } from './useUnifiedStore';

// 🏪 Unified Chat & Call Store with Zustand (Latest)
export const useUnifiedChatStore = () => {
  console.warn('useUnifiedChatStore is deprecated. Use useUnifiedStore instead.');
  return useUnifiedStore();
};

// 🎯 Performance selector hooks (deprecated)
export const useMessages = (chatId) => {
  console.warn('useMessages is deprecated. Use useMessages from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.chat.messages[chatId] || []);
};

export const useChats = () => {
  console.warn('useChats is deprecated. Use useChatList from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.chat.chatList);
};

export const useDrafts = () => {
  console.warn('useDrafts is deprecated. Use useChat from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.chat.drafts);
};

export const useTypingUsers = () => {
  console.warn('useTypingUsers is deprecated. Use useChat from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.chat.typingUsers);
};

export const useUnreadCounts = () => {
  console.warn('useUnreadCounts is deprecated. Use useUnreadCounts from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.chat.unreadCounts);
};

export const useLastReadMessages = () => {
  console.warn('useLastReadMessages is deprecated. Use useChat from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.chat.lastReadMessages);
};

export const useOfflineMessages = () => {
  console.warn('useOfflineMessages is deprecated. Use useChat from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.chat.offlineMessages);
};

export const useMessageStats = () => {
  console.warn('useMessageStats is deprecated. Use useChat from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.chat.messageStats);
};

export const useCalls = () => {
  console.warn('useCalls is deprecated. Use useCall from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.call);
};

export const useActiveCallId = () => {
  console.warn('useActiveCallId is deprecated. Use useCurrentCall from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.call.currentCall?.callId || null);
};

export const useCallHistory = () => {
  console.warn('useCallHistory is deprecated. Use useCall from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.call.callHistory);
};

export const useLocalStream = () => {
  console.warn('useLocalStream is deprecated. Use useCall from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.call.localStream);
};

export const useRemoteStream = () => {
  console.warn('useRemoteStream is deprecated. Use useCall from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.call.remoteStream);
};

export const useCallStats = () => {
  console.warn('useCallStats is deprecated. Use useCall from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.call.callStats);
};

export const useIsMuted = () => {
  console.warn('useIsMuted is deprecated. Use useCall from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.call.isMuted);
};

export const useIsVideoEnabled = () => {
  console.warn('useIsVideoEnabled is deprecated. Use useCall from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.call.isVideoEnabled);
};

export const useIsScreenSharing = () => {
  console.warn('useIsScreenSharing is deprecated. Use useCall from useUnifiedStore instead.');
  return useUnifiedStore((state) => state.call.isScreenSharing);
};

export const useCallActions = () => {
  console.warn('useCallActions is deprecated. Use useCallActions from useUnifiedStore instead.');
  return useUnifiedStore((state) => ({
    initiateCall: state.initiateCall,
    answerCall: state.answerCall,
    endCall: state.endCall,
    toggleMute: state.toggleMute,
    toggleVideo: state.toggleVideo,
    startScreenShare: state.startScreenShare,
    stopScreenShare: state.stopScreenShare,
    setLocalStream: state.setLocalStream,
    setRemoteStream: state.setRemoteStream,
    updateCallStats: state.updateCallStats,
    setCallHistory: state.setCallHistory
  }));
};

export const useChatActions = () => {
  console.warn('useChatActions is deprecated. Use useChatActions from useUnifiedStore instead.');
  return useUnifiedStore((state) => ({
    addMessage: state.addMessage,
    loadMessages: state.loadMessages,
    startTyping: state.startTyping,
    stopTyping: state.stopTyping,
    updateUnreadCount: state.updateUnreadCount
  }));
};

export const useChatUI = () => {
  console.warn('useChatUI is deprecated. Use useUI from useUnifiedStore instead.');
  return useUnifiedStore((state) => ({
    uiState: state.ui,
    updateUIState: (updates) => state.setTheme(updates.theme)
  }));
};

export const useChatStats = () => {
  console.warn('useChatStats is deprecated. Use useChat and useCall from useUnifiedStore instead.');
  return useUnifiedStore((state) => ({
    messageStats: state.chat.messageStats,
    callStats: state.call.callStats,
    updateMessageStats: state.updateMessageStats,
    updateCallStats: state.updateCallStats
  }));
};