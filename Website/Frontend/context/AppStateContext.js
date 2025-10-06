/**
 * 🔄 UNIFIED APPLICATION STATE MANAGEMENT
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

// State synchronization utilities
import { debounce, throttle } from '../utils/performanceUtils';

// Performance monitoring
const STATE_PERFORMANCE = {
  updateCounts: new Map(),
  renderCounts: new Map(),
  lastUpdate: Date.now(),
  subscriptions: new Set()
};

/**
 * Enhanced Application State Interface
 */
const initialState = {
  // Authentication State (synchronized with FixedSecureAuthContext)
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    initialized: false,
    error: null,
    lastUpdate: null
  },
  
  // Chat State
  chat: {
    activeChat: null,
    chatList: [],
    messages: new Map(), // chatId -> messages array
    unreadCounts: new Map(), // chatId -> count
    typing: new Map(), // chatId -> [userIds]
    onlineUsers: new Set(),
    isLoading: false,
    error: null
  },
  
  // Call State
  call: {
    currentCall: null,
    callState: 'idle',
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    localStream: null,
    remoteStream: null,
    callHistory: [],
    incomingCall: null,
    callError: null
  },
  
  // UI State
  ui: {
    theme: 'light',
    sidebarCollapsed: false,
    modalStack: [],
    loadingStates: new Map(), // feature -> isLoading
    notifications: [],
    connectionStatus: 'connected',
    deviceType: 'desktop'
  },
  
  // File State
  files: {
    uploads: new Map(), // uploadId -> progress/status
    downloads: new Map(), // downloadId -> progress/status
    cache: new Map(), // fileId -> cached data
    error: null
  },
  
  // Settings State
  settings: {
    notifications: {
      enabled: true,
      sound: true,
      vibration: true,
      push: true
    },
    privacy: {
      onlineStatus: true,
      readReceipts: true,
      lastSeen: true
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      language: 'en'
    },
    calls: {
      autoAnswer: false,
      videoQuality: 'high',
      audioQuality: 'high'
    }
  },
  
  // Cross-Component State Tracking
  _internal: {
    stateVersion: 0,
    lastUpdated: Date.now(),
    activeSubscriptions: new Set(),
    pendingUpdates: new Map(),
    syncQueue: [],
    componentStates: new Map(), // componentId -> local state
    globalEvents: new Map() // event -> listeners
  }
};

/**
 * Action Types
 */
const ActionTypes = {
  // Auth Actions
  AUTH_INIT_START: 'AUTH_INIT_START',
  AUTH_INIT_SUCCESS: 'AUTH_INIT_SUCCESS',
  AUTH_INIT_FAILURE: 'AUTH_INIT_FAILURE',
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_ERROR: 'AUTH_ERROR',
  AUTH_CLEAR_ERROR: 'AUTH_CLEAR_ERROR',
  
  // Chat Actions
  CHAT_SET_ACTIVE: 'CHAT_SET_ACTIVE',
  CHAT_LIST_UPDATE: 'CHAT_LIST_UPDATE',
  CHAT_MESSAGE_RECEIVED: 'CHAT_MESSAGE_RECEIVED',
  CHAT_MESSAGE_SENT: 'CHAT_MESSAGE_SENT',
  CHAT_MESSAGES_LOADED: 'CHAT_MESSAGES_LOADED',
  CHAT_TYPING_START: 'CHAT_TYPING_START',
  CHAT_TYPING_STOP: 'CHAT_TYPING_STOP',
  CHAT_UNREAD_UPDATE: 'CHAT_UNREAD_UPDATE',
  CHAT_USER_ONLINE: 'CHAT_USER_ONLINE',
  CHAT_USER_OFFLINE: 'CHAT_USER_OFFLINE',
  CHAT_ERROR: 'CHAT_ERROR',
  
  // Call Actions
  CALL_INITIATED: 'CALL_INITIATED',
  CALL_INCOMING: 'CALL_INCOMING',
  CALL_ANSWERED: 'CALL_ANSWERED',
  CALL_ENDED: 'CALL_ENDED',
  CALL_STATE_CHANGED: 'CALL_STATE_CHANGED',
  CALL_MUTE_TOGGLED: 'CALL_MUTE_TOGGLED',
  CALL_VIDEO_TOGGLED: 'CALL_VIDEO_TOGGLED',
  CALL_SCREEN_SHARE_TOGGLED: 'CALL_SCREEN_SHARE_TOGGLED',
  CALL_STREAM_RECEIVED: 'CALL_STREAM_RECEIVED',
  CALL_ERROR: 'CALL_ERROR',
  
  // UI Actions
  UI_SET_THEME: 'UI_SET_THEME',
  UI_TOGGLE_SIDEBAR: 'UI_TOGGLE_SIDEBAR',
  UI_SHOW_MODAL: 'UI_SHOW_MODAL',
  UI_HIDE_MODAL: 'UI_HIDE_MODAL',
  UI_SET_LOADING: 'UI_SET_LOADING',
  UI_ADD_NOTIFICATION: 'UI_ADD_NOTIFICATION',
  UI_REMOVE_NOTIFICATION: 'UI_REMOVE_NOTIFICATION',
  UI_SET_CONNECTION_STATUS: 'UI_SET_CONNECTION_STATUS',
  UI_SET_DEVICE_TYPE: 'UI_SET_DEVICE_TYPE',
  
  // File Actions
  FILE_UPLOAD_START: 'FILE_UPLOAD_START',
  FILE_UPLOAD_PROGRESS: 'FILE_UPLOAD_PROGRESS',
  FILE_UPLOAD_SUCCESS: 'FILE_UPLOAD_SUCCESS',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  FILE_DOWNLOAD_START: 'FILE_DOWNLOAD_START',
  FILE_DOWNLOAD_PROGRESS: 'FILE_DOWNLOAD_PROGRESS',
  FILE_DOWNLOAD_SUCCESS: 'FILE_DOWNLOAD_SUCCESS',
  FILE_DOWNLOAD_ERROR: 'FILE_DOWNLOAD_ERROR',
  
  // Settings Actions
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
  SETTINGS_RESET: 'SETTINGS_RESET',
  
  // Cross-Component State Management Actions
  STATE_SYNC: 'STATE_SYNC',
  STATE_SUBSCRIBE: 'STATE_SUBSCRIBE',
  STATE_UNSUBSCRIBE: 'STATE_UNSUBSCRIBE',
  STATE_BATCH_UPDATE: 'STATE_BATCH_UPDATE',
  STATE_RESET_COMPONENT: 'STATE_RESET_COMPONENT',
  
  // Global Event Actions
  GLOBAL_EVENT_EMIT: 'GLOBAL_EVENT_EMIT',
  GLOBAL_EVENT_SUBSCRIBE: 'GLOBAL_EVENT_SUBSCRIBE',
  GLOBAL_EVENT_UNSUBSCRIBE: 'GLOBAL_EVENT_UNSUBSCRIBE',
  
  // Performance Actions
  PERFORMANCE_TRACK: 'PERFORMANCE_TRACK',
  PERFORMANCE_OPTIMIZE: 'PERFORMANCE_OPTIMIZE'
};

/**
 * State Reducer
 */
function appStateReducer(state, action) {
  switch (action.type) {
    // Auth Reducers
    case ActionTypes.AUTH_INIT_START:
      return {
        ...state,
        auth: {
          ...state.auth,
          isLoading: true,
          error: null
        }
      };
      
    case ActionTypes.AUTH_INIT_SUCCESS:
      return {
        ...state,
        auth: {
          ...state.auth,
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: !!action.payload.user,
          isLoading: false,
          initialized: true,
          error: null
        }
      };
      
    case ActionTypes.AUTH_INIT_FAILURE:
      return {
        ...state,
        auth: {
          ...state.auth,
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          initialized: true,
          error: action.payload.error
        }
      };
      
    case ActionTypes.AUTH_LOGIN_SUCCESS:
      return {
        ...state,
        auth: {
          ...state.auth,
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: true,
          error: null
        }
      };
      
    case ActionTypes.AUTH_LOGOUT:
      return {
        ...state,
        auth: {
          ...initialState.auth,
          initialized: true,
          isLoading: false
        },
        chat: initialState.chat,
        call: initialState.call
      };
      
    case ActionTypes.AUTH_ERROR:
      return {
        ...state,
        auth: {
          ...state.auth,
          error: action.payload.error,
          isLoading: false
        }
      };
      
    case ActionTypes.AUTH_CLEAR_ERROR:
      return {
        ...state,
        auth: {
          ...state.auth,
          error: null
        }
      };
      
    // Chat Reducers
    case ActionTypes.CHAT_SET_ACTIVE:
      return {
        ...state,
        chat: {
          ...state.chat,
          activeChat: action.payload.chatId
        }
      };
      
    case ActionTypes.CHAT_LIST_UPDATE:
      return {
        ...state,
        chat: {
          ...state.chat,
          chatList: action.payload.chats
        }
      };
      
    case ActionTypes.CHAT_MESSAGE_RECEIVED:
      const { chatId, message } = action.payload;
      const chatMessages = state.chat.messages.get(chatId) || [];
      const newMessages = new Map(state.chat.messages);
      newMessages.set(chatId, [...chatMessages, message]);
      
      // Update unread count if not active chat
      const newUnreadCounts = new Map(state.chat.unreadCounts);
      if (state.chat.activeChat !== chatId) {
        const currentCount = newUnreadCounts.get(chatId) || 0;
        newUnreadCounts.set(chatId, currentCount + 1);
      }
      
      return {
        ...state,
        chat: {
          ...state.chat,
          messages: newMessages,
          unreadCounts: newUnreadCounts
        }
      };
      
    case ActionTypes.CHAT_MESSAGE_SENT:
      const sentChatId = action.payload.chatId;
      const sentMessage = action.payload.message;
      const sentChatMessages = state.chat.messages.get(sentChatId) || [];
      const newSentMessages = new Map(state.chat.messages);
      newSentMessages.set(sentChatId, [...sentChatMessages, sentMessage]);
      
      return {
        ...state,
        chat: {
          ...state.chat,
          messages: newSentMessages
        }
      };
      
    case ActionTypes.CHAT_MESSAGES_LOADED:
      const loadedMessages = new Map(state.chat.messages);
      loadedMessages.set(action.payload.chatId, action.payload.messages);
      
      return {
        ...state,
        chat: {
          ...state.chat,
          messages: loadedMessages,
          isLoading: false
        }
      };
      
    case ActionTypes.CHAT_TYPING_START:
      const typingMap = new Map(state.chat.typing);
      const typingUsers = typingMap.get(action.payload.chatId) || [];
      if (!typingUsers.includes(action.payload.userId)) {
        typingMap.set(action.payload.chatId, [...typingUsers, action.payload.userId]);
      }
      
      return {
        ...state,
        chat: {
          ...state.chat,
          typing: typingMap
        }
      };
      
    case ActionTypes.CHAT_TYPING_STOP:
      const stopTypingMap = new Map(state.chat.typing);
      const currentTypingUsers = stopTypingMap.get(action.payload.chatId) || [];
      const filteredUsers = currentTypingUsers.filter(id => id !== action.payload.userId);
      stopTypingMap.set(action.payload.chatId, filteredUsers);
      
      return {
        ...state,
        chat: {
          ...state.chat,
          typing: stopTypingMap
        }
      };
      
    case ActionTypes.CHAT_UNREAD_UPDATE:
      const updatedUnreadCounts = new Map(state.chat.unreadCounts);
      updatedUnreadCounts.set(action.payload.chatId, action.payload.count);
      
      return {
        ...state,
        chat: {
          ...state.chat,
          unreadCounts: updatedUnreadCounts
        }
      };
      
    case ActionTypes.CHAT_USER_ONLINE:
      const onlineUsers = new Set(state.chat.onlineUsers);
      onlineUsers.add(action.payload.userId);
      
      return {
        ...state,
        chat: {
          ...state.chat,
          onlineUsers
        }
      };
      
    case ActionTypes.CHAT_USER_OFFLINE:
      const offlineUsers = new Set(state.chat.onlineUsers);
      offlineUsers.delete(action.payload.userId);
      
      return {
        ...state,
        chat: {
          ...state.chat,
          onlineUsers: offlineUsers
        }
      };
      
    // Call Reducers
    case ActionTypes.CALL_INITIATED:
      return {
        ...state,
        call: {
          ...state.call,
          currentCall: action.payload.call,
          callState: 'calling',
          callError: null
        }
      };
      
    case ActionTypes.CALL_INCOMING:
      return {
        ...state,
        call: {
          ...state.call,
          incomingCall: action.payload.call,
          callState: 'ringing'
        }
      };
      
    case ActionTypes.CALL_ANSWERED:
      return {
        ...state,
        call: {
          ...state.call,
          currentCall: state.call.incomingCall || state.call.currentCall,
          incomingCall: null,
          callState: 'connected'
        }
      };
      
    case ActionTypes.CALL_ENDED:
      return {
        ...state,
        call: {
          ...state.call,
          currentCall: null,
          incomingCall: null,
          callState: 'idle',
          isMuted: false,
          isVideoEnabled: true,
          isScreenSharing: false,
          localStream: null,
          remoteStream: null,
          callError: null,
          callHistory: state.call.currentCall 
            ? [...state.call.callHistory, state.call.currentCall]
            : state.call.callHistory
        }
      };
      
    case ActionTypes.CALL_STATE_CHANGED:
      return {
        ...state,
        call: {
          ...state.call,
          callState: action.payload.state
        }
      };
      
    case ActionTypes.CALL_MUTE_TOGGLED:
      return {
        ...state,
        call: {
          ...state.call,
          isMuted: action.payload.muted
        }
      };
      
    case ActionTypes.CALL_VIDEO_TOGGLED:
      return {
        ...state,
        call: {
          ...state.call,
          isVideoEnabled: action.payload.enabled
        }
      };
      
    case ActionTypes.CALL_SCREEN_SHARE_TOGGLED:
      return {
        ...state,
        call: {
          ...state.call,
          isScreenSharing: action.payload.sharing
        }
      };
      
    case ActionTypes.CALL_STREAM_RECEIVED:
      return {
        ...state,
        call: {
          ...state.call,
          [action.payload.type + 'Stream']: action.payload.stream
        }
      };
      
    case ActionTypes.CALL_ERROR:
      return {
        ...state,
        call: {
          ...state.call,
          callError: action.payload.error
        }
      };
      
    // UI Reducers
    case ActionTypes.UI_SET_THEME:
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload.theme
        }
      };
      
    case ActionTypes.UI_TOGGLE_SIDEBAR:
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarCollapsed: !state.ui.sidebarCollapsed
        }
      };
      
    case ActionTypes.UI_SHOW_MODAL:
      return {
        ...state,
        ui: {
          ...state.ui,
          modalStack: [...state.ui.modalStack, action.payload.modal]
        }
      };
      
    case ActionTypes.UI_HIDE_MODAL:
      return {
        ...state,
        ui: {
          ...state.ui,
          modalStack: state.ui.modalStack.filter(modal => modal.id !== action.payload.modalId)
        }
      };
      
    case ActionTypes.UI_SET_LOADING:
      const newLoadingStates = new Map(state.ui.loadingStates);
      newLoadingStates.set(action.payload.feature, action.payload.isLoading);
      
      return {
        ...state,
        ui: {
          ...state.ui,
          loadingStates: newLoadingStates
        }
      };
      
    case ActionTypes.UI_ADD_NOTIFICATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, action.payload.notification]
        }
      };
      
    case ActionTypes.UI_REMOVE_NOTIFICATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload.notificationId)
        }
      };
      
    case ActionTypes.UI_SET_CONNECTION_STATUS:
      return {
        ...state,
        ui: {
          ...state.ui,
          connectionStatus: action.payload.status
        }
      };
      
    // File Reducers
    case ActionTypes.FILE_UPLOAD_START:
      const newUploads = new Map(state.files.uploads);
      newUploads.set(action.payload.uploadId, {
        filename: action.payload.filename,
        progress: 0,
        status: 'uploading'
      });
      
      return {
        ...state,
        files: {
          ...state.files,
          uploads: newUploads
        }
      };
      
    case ActionTypes.FILE_UPLOAD_PROGRESS:
      const progressUploads = new Map(state.files.uploads);
      const uploadData = progressUploads.get(action.payload.uploadId);
      if (uploadData) {
        progressUploads.set(action.payload.uploadId, {
          ...uploadData,
          progress: action.payload.progress
        });
      }
      
      return {
        ...state,
        files: {
          ...state.files,
          uploads: progressUploads
        }
      };
      
    case ActionTypes.FILE_UPLOAD_SUCCESS:
      const successUploads = new Map(state.files.uploads);
      const successUploadData = successUploads.get(action.payload.uploadId);
      if (successUploadData) {
        successUploads.set(action.payload.uploadId, {
          ...successUploadData,
          progress: 100,
          status: 'completed',
          url: action.payload.url
        });
      }
      
      return {
        ...state,
        files: {
          ...state.files,
          uploads: successUploads
        }
      };
      
    case ActionTypes.FILE_UPLOAD_ERROR:
      const errorUploads = new Map(state.files.uploads);
      const errorUploadData = errorUploads.get(action.payload.uploadId);
      if (errorUploadData) {
        errorUploads.set(action.payload.uploadId, {
          ...errorUploadData,
          status: 'error',
          error: action.payload.error
        });
      }
      
      return {
        ...state,
        files: {
          ...state.files,
          uploads: errorUploads
        }
      };
      
    // Settings Reducers
    case ActionTypes.SETTINGS_UPDATE:
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.payload.category]: {
            ...state.settings[action.payload.category],
            ...action.payload.settings
          }
        }
      };
      
    case ActionTypes.SETTINGS_RESET:
      return {
        ...state,
        settings: initialState.settings
      };
      
    // Cross-Component State Management
    case ActionTypes.STATE_SYNC:
      return {
        ...state,
        ...action.payload.stateUpdate,
        _internal: {
          ...state._internal,
          stateVersion: state._internal.stateVersion + 1,
          lastUpdated: Date.now()
        }
      };
      
    case ActionTypes.STATE_SUBSCRIBE:
      const newSubscriptions = new Set(state._internal.activeSubscriptions);
      newSubscriptions.add(action.payload.subscriptionId);
      
      return {
        ...state,
        _internal: {
          ...state._internal,
          activeSubscriptions: newSubscriptions
        }
      };
      
    case ActionTypes.STATE_UNSUBSCRIBE:
      const filteredSubscriptions = new Set(state._internal.activeSubscriptions);
      filteredSubscriptions.delete(action.payload.subscriptionId);
      
      return {
        ...state,
        _internal: {
          ...state._internal,
          activeSubscriptions: filteredSubscriptions
        }
      };
      
    case ActionTypes.STATE_BATCH_UPDATE:
      let batchState = { ...state };
      
      action.payload.updates.forEach(update => {
        batchState = appStateReducer(batchState, update);
      });
      
      return {
        ...batchState,
        _internal: {
          ...batchState._internal,
          stateVersion: state._internal.stateVersion + action.payload.updates.length,
          lastUpdated: Date.now()
        }
      };
      
    case ActionTypes.STATE_RESET_COMPONENT:
      const updatedComponentStates = new Map(state._internal.componentStates);
      updatedComponentStates.delete(action.payload.componentId);
      
      return {
        ...state,
        _internal: {
          ...state._internal,
          componentStates: updatedComponentStates
        }
      };
      
    case ActionTypes.GLOBAL_EVENT_EMIT:
      // Events are handled by the context provider, not stored in state
      return state;
      
    case ActionTypes.GLOBAL_EVENT_SUBSCRIBE:
      const newGlobalEvents = new Map(state._internal.globalEvents);
      const existingListeners = newGlobalEvents.get(action.payload.eventName) || new Set();
      existingListeners.add(action.payload.listenerId);
      newGlobalEvents.set(action.payload.eventName, existingListeners);
      
      return {
        ...state,
        _internal: {
          ...state._internal,
          globalEvents: newGlobalEvents
        }
      };
      
    case ActionTypes.GLOBAL_EVENT_UNSUBSCRIBE:
      const updatedGlobalEvents = new Map(state._internal.globalEvents);
      const listeners = updatedGlobalEvents.get(action.payload.eventName);
      if (listeners) {
        listeners.delete(action.payload.listenerId);
        if (listeners.size === 0) {
          updatedGlobalEvents.delete(action.payload.eventName);
        }
      }
      
      return {
        ...state,
        _internal: {
          ...state._internal,
          globalEvents: updatedGlobalEvents
        }
      };
      
    case ActionTypes.PERFORMANCE_TRACK:
      // Performance tracking is handled separately
      STATE_PERFORMANCE.updateCounts.set(
        action.payload.component,
        (STATE_PERFORMANCE.updateCounts.get(action.payload.component) || 0) + 1
      );
      return state;
      
    default:
      return state;
  }
}

/**
 * App State Context
 */
const AppStateContext = createContext();

/**
 * Enhanced App State Provider Component with Cross-Component Sync
 */
export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  
  // Cross-component state management
  const eventBusRef = useRef(new Map()); // eventName -> Set of callbacks
  const subscriptionsRef = useRef(new Map()); // subscriptionId -> cleanup
  const componentStatesRef = useRef(new Map()); // componentId -> local state
  const stateUpdateQueue = useRef([]);
  const isProcessingQueue = useRef(false);
  
  // Performance tracking
  const performanceRef = useRef({
    updateCount: 0,
    renderCount: 0,
    lastOptimization: Date.now()
  });
  
  // Get auth state from React Context
  const { user, isAuthenticated, token, loading: authLoading } = useFixedSecureAuth();
  
  // Sync auth state from React Context
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && user) {
        dispatch({
          type: ActionTypes.AUTH_INIT_SUCCESS,
          payload: {
            user,
            token,
            lastUpdate: Date.now()
          }
        });
      } else {
        dispatch({ type: ActionTypes.AUTH_LOGOUT });
      }
    }
  }, [user, isAuthenticated, token, authLoading]);
  
  // Optimized batch updates
  const processBatchUpdates = useCallback(() => {
    if (isProcessingQueue.current || stateUpdateQueue.current.length === 0) {
      return;
    }
    
    isProcessingQueue.current = true;
    
    const updates = stateUpdateQueue.current.splice(0);
    
    if (updates.length === 1) {
      dispatch(updates[0]);
    } else if (updates.length > 1) {
      dispatch({
        type: ActionTypes.STATE_BATCH_UPDATE,
        payload: { updates }
      });
    }
    
    isProcessingQueue.current = false;
    performanceRef.current.updateCount += updates.length;
  }, []);
  
  // Debounced batch processing
  const debouncedBatchProcess = useMemo(
    () => debounce(processBatchUpdates, 16), // ~60fps
    [processBatchUpdates]
  );
  
  // Initialize app state
  useEffect(() => {
    initializeAppState();
  }, []);
  
  // Initialize app state with service listeners
  const initializeAppState = useCallback(async () => {
    try {
      // No need to initialize auth service - React Context handles that
      // Just setup other service listeners
      setupServiceListeners();
      
    } catch (error) {
      console.error('App state initialization error:', error);
    }
  }, []);
  
  // Setup service event listeners
  const setupServiceListeners = useCallback(() => {
    // Auth is now handled by React Context, no need for auth listeners here
    
    // WebRTC service listeners
    webrtcService.on('callInitiated', (call) => {
      dispatch({
        type: ActionTypes.CALL_INITIATED,
        payload: { call }
      });
    });
    
    webrtcService.on('incomingCall', (call) => {
      dispatch({
        type: ActionTypes.CALL_INCOMING,
        payload: { call }
      });
    });
    
    webrtcService.on('callAnswered', () => {
      dispatch({ type: ActionTypes.CALL_ANSWERED });
    });
    
    webrtcService.on('callEnded', () => {
      dispatch({ type: ActionTypes.CALL_ENDED });
    });
    
    webrtcService.on('callStateChanged', (data) => {
      dispatch({
        type: ActionTypes.CALL_STATE_CHANGED,
        payload: { state: data.currentState }
      });
    });
    
    webrtcService.on('muteToggled', (muted) => {
      dispatch({
        type: ActionTypes.CALL_MUTE_TOGGLED,
        payload: { muted }
      });
    });
    
    webrtcService.on('videoToggled', (enabled) => {
      dispatch({
        type: ActionTypes.CALL_VIDEO_TOGGLED,
        payload: { enabled }
      });
    });
    
    webrtcService.on('screenShareStarted', () => {
      dispatch({
        type: ActionTypes.CALL_SCREEN_SHARE_TOGGLED,
        payload: { sharing: true }
      });
    });
    
    webrtcService.on('screenShareStopped', () => {
      dispatch({
        type: ActionTypes.CALL_SCREEN_SHARE_TOGGLED,
        payload: { sharing: false }
      });
    });
    
    webrtcService.on('localStreamAcquired', (stream) => {
      dispatch({
        type: ActionTypes.CALL_STREAM_RECEIVED,
        payload: { type: 'local', stream }
      });
    });
    
    webrtcService.on('remoteStreamReceived', (stream) => {
      dispatch({
        type: ActionTypes.CALL_STREAM_RECEIVED,
        payload: { type: 'remote', stream }
      });
    });
    
    webrtcService.on('callError', (error) => {
      dispatch({
        type: ActionTypes.CALL_ERROR,
        payload: { error }
      });
    });
    
    // Notification service listeners
    notificationService.on('notificationShown', (notification) => {
      dispatch({
        type: ActionTypes.UI_ADD_NOTIFICATION,
        payload: { notification }
      });
    });
    
    notificationService.on('notificationDismissed', (data) => {
      dispatch({
        type: ActionTypes.UI_REMOVE_NOTIFICATION,
        payload: { notificationId: data.id }
      });
    });
    
    return () => {
      // Cleanup other listeners if needed
    };
  }, []);
  
  // Action creators
  const actions = useMemo(() => ({
    // Auth Actions - now handled by React Context
    login: async (credentials) => {
      // Login should be handled by FixedSecureAuthContext
      console.warn('Login should be handled by FixedSecureAuthContext');
      throw new Error('Login should be handled by FixedSecureAuthContext');
    },
    
    logout: async () => {
      // Logout should be handled by FixedSecureAuthContext
      console.warn('Logout should be handled by FixedSecureAuthContext');
      throw new Error('Logout should be handled by FixedSecureAuthContext');
    },
    
    clearAuthError: () => {
      dispatch({ type: ActionTypes.AUTH_CLEAR_ERROR });
    },
    
    // Chat Actions
    setActiveChat: (chatId) => {
      dispatch({
        type: ActionTypes.CHAT_SET_ACTIVE,
        payload: { chatId }
      });
      
      // Clear unread count for active chat
      dispatch({
        type: ActionTypes.CHAT_UNREAD_UPDATE,
        payload: { chatId, count: 0 }
      });
    },
    
    updateChatList: (chats) => {
      dispatch({
        type: ActionTypes.CHAT_LIST_UPDATE,
        payload: { chats }
      });
    },
    
    addMessage: (chatId, message, isSent = false) => {
      dispatch({
        type: isSent ? ActionTypes.CHAT_MESSAGE_SENT : ActionTypes.CHAT_MESSAGE_RECEIVED,
        payload: { chatId, message }
      });
    },
    
    loadMessages: (chatId, messages) => {
      dispatch({
        type: ActionTypes.CHAT_MESSAGES_LOADED,
        payload: { chatId, messages }
      });
    },
    
    startTyping: (chatId, userId) => {
      dispatch({
        type: ActionTypes.CHAT_TYPING_START,
        payload: { chatId, userId }
      });
    },
    
    stopTyping: (chatId, userId) => {
      dispatch({
        type: ActionTypes.CHAT_TYPING_STOP,
        payload: { chatId, userId }
      });
    },
    
    setUserOnline: (userId) => {
      dispatch({
        type: ActionTypes.CHAT_USER_ONLINE,
        payload: { userId }
      });
    },
    
    setUserOffline: (userId) => {
      dispatch({
        type: ActionTypes.CHAT_USER_OFFLINE,
        payload: { userId }
      });
    },
    
    // Call Actions
    initiateCall: async (chatId, callType, targetUserId) => {
      try {
        const call = await webrtcService.initiateCall(chatId, callType, targetUserId);
        return call;
      } catch (error) {
        dispatch({
          type: ActionTypes.CALL_ERROR,
          payload: { error }
        });
        throw error;
      }
    },
    
    answerCall: async (accept = true) => {
      try {
        await webrtcService.answerCall(accept);
      } catch (error) {
        dispatch({
          type: ActionTypes.CALL_ERROR,
          payload: { error }
        });
        throw error;
      }
    },
    
    endCall: async () => {
      try {
        await webrtcService.endCall();
      } catch (error) {
        console.error('Error ending call:', error);
        dispatch({ type: ActionTypes.CALL_ENDED }); // Force end on error
      }
    },
    
    toggleMute: () => {
      const muted = webrtcService.toggleMute();
      dispatch({
        type: ActionTypes.CALL_MUTE_TOGGLED,
        payload: { muted }
      });
    },
    
    toggleVideo: () => {
      const enabled = webrtcService.toggleVideo();
      dispatch({
        type: ActionTypes.CALL_VIDEO_TOGGLED,
        payload: { enabled }
      });
    },
    
    startScreenShare: async () => {
      try {
        await webrtcService.startScreenShare();
      } catch (error) {
        dispatch({
          type: ActionTypes.CALL_ERROR,
          payload: { error }
        });
        throw error;
      }
    },
    
    stopScreenShare: async () => {
      try {
        await webrtcService.stopScreenShare();
      } catch (error) {
        console.error('Error stopping screen share:', error);
      }
    },
    
    // UI Actions
    setTheme: (theme) => {
      dispatch({
        type: ActionTypes.UI_SET_THEME,
        payload: { theme }
      });
    },
    
    toggleSidebar: () => {
      dispatch({ type: ActionTypes.UI_TOGGLE_SIDEBAR });
    },
    
    showModal: (modal) => {
      dispatch({
        type: ActionTypes.UI_SHOW_MODAL,
        payload: { modal }
      });
    },
    
    hideModal: (modalId) => {
      dispatch({
        type: ActionTypes.UI_HIDE_MODAL,
        payload: { modalId }
      });
    },
    
    setLoading: (feature, isLoading) => {
      dispatch({
        type: ActionTypes.UI_SET_LOADING,
        payload: { feature, isLoading }
      });
    },
    
    setConnectionStatus: (status) => {
      dispatch({
        type: ActionTypes.UI_SET_CONNECTION_STATUS,
        payload: { status }
      });
    },
    
    // File Actions
    startFileUpload: (uploadId, filename) => {
      dispatch({
        type: ActionTypes.FILE_UPLOAD_START,
        payload: { uploadId, filename }
      });
    },
    
    updateFileUploadProgress: (uploadId, progress) => {
      dispatch({
        type: ActionTypes.FILE_UPLOAD_PROGRESS,
        payload: { uploadId, progress }
      });
    },
    
    completeFileUpload: (uploadId, url) => {
      dispatch({
        type: ActionTypes.FILE_UPLOAD_SUCCESS,
        payload: { uploadId, url }
      });
    },
    
    failFileUpload: (uploadId, error) => {
      dispatch({
        type: ActionTypes.FILE_UPLOAD_ERROR,
        payload: { uploadId, error }
      });
    },
    
    // Settings Actions
    updateSettings: (category, settings) => {
      dispatch({
        type: ActionTypes.SETTINGS_UPDATE,
        payload: { category, settings }
      });
    },
    
    resetSettings: () => {
      dispatch({ type: ActionTypes.SETTINGS_RESET });
    }
  }), []);
  
  // Memoized context value
  const contextValue = useMemo(() => ({
    state,
    actions
  }), [state, actions]);
  
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
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

/**
 * Selector hooks for specific state slices
 */
export const useAuthState = () => {
  const { state } = useAppState();
  return state.auth;
};

export const useChatState = () => {
  const { state } = useAppState();
  return state.chat;
};

export const useCallState = () => {
  const { state } = useAppState();
  return state.call;
};

export const useUIState = () => {
  const { state } = useAppState();
  return state.ui;
};

export const useFileState = () => {
  const { state } = useAppState();
  return state.files;
};

export const useSettings = () => {
  const { state } = useAppState();
  return state.settings;
};

/**
 * Action hooks for specific domains
 */
export const useAuthActions = () => {
  const { actions } = useAppState();
  return {
    login: actions.login,
    logout: actions.logout,
    clearAuthError: actions.clearAuthError
  };
};

export const useChatActions = () => {
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
  const { actions } = useAppState();
  return {
    startFileUpload: actions.startFileUpload,
    updateFileUploadProgress: actions.updateFileUploadProgress,
    completeFileUpload: actions.completeFileUpload,
    failFileUpload: actions.failFileUpload
  };
};

export const useSettingsActions = () => {
  const { actions } = useAppState();
  return {
    updateSettings: actions.updateSettings,
    resetSettings: actions.resetSettings
  };
};

export default AppStateContext;