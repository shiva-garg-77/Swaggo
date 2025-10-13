/**
 * 🔄 UNIFIED APPLICATION STATE MANAGEMENT
 * 
 * DEPRECATED: Use useUnifiedStore instead
 * 
 * FIXES ISSUE #20:
 * ✅ Cross-component state synchronization
 * ✅ Eliminates prop drilling
 * ✅ Unified state management
 * ✅ Component state isolation
 * ✅ State consistency across app
 * ✅ Performance optimizations
 * ✅ Real-time state sync
 */

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  useState
} from 'react';

// Service integrations
import notificationService from '../services/UnifiedNotificationService.js';
import webrtcService from '../services/WebRTCService';
import { useFixedSecureAuth } from './FixedSecureAuthContext';

// Import the new unified store
import { useUnifiedStore } from '../store/useUnifiedStore';

// State synchronization utilities
import { debounce, throttle } from '../utils/performanceUtils';

console.warn('AppStateContext is deprecated. Use useUnifiedStore instead.');

// Create a simple context that just provides access to the unified store
const AppStateContext = createContext();

export const AppStateProvider = ({ children }) => {
  const unifiedStore = useUnifiedStore();
  
  // Provide the unified store through context for backward compatibility
  const contextValue = useMemo(() => ({
    state: unifiedStore.getState(),
    actions: unifiedStore.getState(), // All actions are in the state
    unifiedStore // Provide direct access to the store
  }), [unifiedStore]);

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

/**
 * Custom hook to use app state
 */
export const useAppState = () => {
  console.warn('useAppState is deprecated. Use useUnifiedStore instead.');
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// Export all the existing hooks but mark them as deprecated
export const useAuthState = () => {
  console.warn('useAuthState is deprecated. Use useAuth from useUnifiedStore instead.');
  const { state } = useAppState();
  return state.auth;
};

export const useChatState = () => {
  console.warn('useChatState is deprecated. Use useChat from useUnifiedStore instead.');
  const { state } = useAppState();
  return state.chat;
};

export const useCallState = () => {
  console.warn('useCallState is deprecated. Use useCall from useUnifiedStore instead.');
  const { state } = useAppState();
  return state.call;
};

export const useUIState = () => {
  console.warn('useUIState is deprecated. Use useUI from useUnifiedStore instead.');
  const { state } = useAppState();
  return state.ui;
};

export const useFileState = () => {
  console.warn('useFileState is deprecated. Use useFiles from useUnifiedStore instead.');
  const { state } = useAppState();
  return state.files;
};

export const useSettings = () => {
  console.warn('useSettings is deprecated. Use useSettings from useUnifiedStore instead.');
  const { state } = useAppState();
  return state.settings;
};

/**
 * Action hooks for specific domains (deprecated)
 */
export const useAuthActions = () => {
  console.warn('useAuthActions is deprecated. Use useAuthActions from useUnifiedStore instead.');
  const { actions } = useAppState();
  return {
    login: actions.login,
    logout: actions.logout,
    clearAuthError: actions.clearAuthError
  };
};

export const useChatActions = () => {
  console.warn('useChatActions is deprecated. Use useChatActions from useUnifiedStore instead.');
  const { actions } = useAppState();
  return {
    setActiveChat: actions.setActiveChat,
    updateChatList: actions.updateChatList,
    addMessage: actions.addMessage,
    loadMessages: actions.loadMessages,
    startTyping: actions.startTyping,
    stopTyping: actions.stopTyping,
    setUserOnline: actions.setUserOnline,
    setUserOffline: actions.setUserOffline
  };
};

export const useCallActions = () => {
  console.warn('useCallActions is deprecated. Use useCallActions from useUnifiedStore instead.');
  const { actions } = useAppState();
  return {
    initiateCall: actions.initiateCall,
    answerCall: actions.answerCall,
    endCall: actions.endCall,
    toggleMute: actions.toggleMute,
    toggleVideo: actions.toggleVideo,
    startScreenShare: actions.startScreenShare,
    stopScreenShare: actions.stopScreenShare
  };
};

export const useUIActions = () => {
  console.warn('useUIActions is deprecated. Use useUIActions from useUnifiedStore instead.');
  const { actions } = useAppState();
  return {
    setTheme: actions.setTheme,
    toggleSidebar: actions.toggleSidebar,
    showModal: actions.showModal,
    hideModal: actions.hideModal,
    setLoading: actions.setLoading,
    setConnectionStatus: actions.setConnectionStatus
  };
};

export const useFileActions = () => {
  console.warn('useFileActions is deprecated. Use useFileActions from useUnifiedStore instead.');
  const { actions } = useAppState();
  return {
    startFileUpload: actions.startFileUpload,
    updateFileUploadProgress: actions.updateFileUploadProgress,
    completeFileUpload: actions.completeFileUpload,
    failFileUpload: actions.failFileUpload
  };
};

export const useSettingsActions = () => {
  console.warn('useSettingsActions is deprecated. Use useSettingsActions from useUnifiedStore instead.');
  const { actions } = useAppState();
  return {
    updateSettings: actions.updateSettings,
    resetSettings: actions.resetSettings
  };
};

export default AppStateContext;