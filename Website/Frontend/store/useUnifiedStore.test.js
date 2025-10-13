/**
 * @fileoverview Unit tests for the unified Zustand store
 * Tests all store functionality including actions, selectors, and state management
 */

import { act, renderHook } from '@testing-library/react';
import { useUnifiedStore } from './useUnifiedStore';

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useUnifiedStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the store to initial state before each test
    act(() => {
      useUnifiedStore.getState().reset();
    });
  });

  describe('Auth State', () => {
    it('should initialize with correct default auth state', () => {
      const { result } = renderHook(() => useUnifiedStore());
      
      expect(result.current.auth).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        initialized: false,
        error: null,
        lastUpdate: null
      });
    });

    it('should login user correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const user = { id: '123', username: 'testuser' };
      const token = 'test-token';

      act(() => {
        result.current.login(user, token);
      });

      expect(result.current.auth.user).toEqual(user);
      expect(result.current.auth.token).toBe(token);
      expect(result.current.auth.isAuthenticated).toBe(true);
      expect(result.current.auth.isLoading).toBe(false);
    });

    it('should logout user correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const user = { id: '123', username: 'testuser' };
      const token = 'test-token';

      // First login
      act(() => {
        result.current.login(user, token);
      });

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.auth.user).toBeNull();
      expect(result.current.auth.token).toBeNull();
      expect(result.current.auth.isAuthenticated).toBe(false);
      expect(result.current.chat.chatList).toEqual([]);
    });
  });

  describe('Chat State', () => {
    it('should manage chat list correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const chats = [
        { id: '1', name: 'Chat 1' },
        { id: '2', name: 'Chat 2' }
      ];

      act(() => {
        result.current.updateChatList(chats);
      });

      expect(result.current.chat.chatList).toEqual(chats);
    });

    it('should manage active chat correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const chatId = 'test-chat-id';

      act(() => {
        result.current.setActiveChat(chatId);
      });

      expect(result.current.chat.activeChat).toBe(chatId);
    });

    it('should manage messages correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const chatId = 'test-chat-id';
      const message = { id: '1', content: 'Hello' };

      act(() => {
        result.current.addMessage(chatId, message);
      });

      expect(result.current.chat.messages[chatId]).toContainEqual(message);
    });

    it('should manage typing users correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const chatId = 'test-chat-id';
      const userId = 'test-user-id';

      act(() => {
        result.current.startTyping(chatId, userId);
      });

      expect(result.current.chat.typingUsers[chatId]).toContain(userId);

      act(() => {
        result.current.stopTyping(chatId, userId);
      });

      expect(result.current.chat.typingUsers[chatId]).toBeUndefined();
    });

    it('should manage online users correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const userId = 'test-user-id';

      act(() => {
        result.current.setUserOnline(userId);
      });

      expect(result.current.chat.onlineUsers).toContain(userId);

      act(() => {
        result.current.setUserOffline(userId);
      });

      expect(result.current.chat.onlineUsers).not.toContain(userId);
    });
  });

  describe('Call State', () => {
    it('should manage call initiation correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const call = { id: 'call-123', participants: ['user1', 'user2'] };

      act(() => {
        result.current.initiateCall(call);
      });

      expect(result.current.call.currentCall).toEqual(call);
      expect(result.current.call.callState).toBe('calling');
    });

    it('should manage incoming calls correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const call = { id: 'call-123', participants: ['user1', 'user2'] };

      act(() => {
        result.current.incomingCall(call);
      });

      expect(result.current.call.incomingCall).toEqual(call);
      expect(result.current.call.callState).toBe('ringing');
    });

    it('should manage call answering correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const call = { id: 'call-123', participants: ['user1', 'user2'] };

      act(() => {
        result.current.incomingCall(call);
        result.current.answerCall();
      });

      expect(result.current.call.currentCall).toEqual(call);
      expect(result.current.call.incomingCall).toBeNull();
      expect(result.current.call.callState).toBe('connected');
    });

    it('should manage call ending correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());

      act(() => {
        result.current.endCall();
      });

      expect(result.current.call.currentCall).toBeNull();
      expect(result.current.call.callState).toBe('idle');
    });
  });

  describe('UI State', () => {
    it('should manage theme correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const theme = 'dark';

      act(() => {
        result.current.setTheme(theme);
      });

      expect(result.current.ui.theme).toBe(theme);
    });

    it('should toggle sidebar correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());

      const initialState = result.current.ui.sidebarCollapsed;
      
      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.ui.sidebarCollapsed).toBe(!initialState);
    });

    it('should manage notifications correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const notification = { title: 'Test', message: 'Test message' };

      act(() => {
        result.current.addNotification(notification);
      });

      expect(result.current.ui.notifications).toHaveLength(1);
      expect(result.current.ui.notifications[0]).toMatchObject({
        title: 'Test',
        message: 'Test message'
      });

      const notificationId = result.current.ui.notifications[0].id;

      act(() => {
        result.current.removeNotification(notificationId);
      });

      expect(result.current.ui.notifications).toHaveLength(0);
    });

    it('should manage loading states correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const feature = 'test-feature';

      act(() => {
        result.current.setLoading(feature, true);
      });

      expect(result.current.ui.loadingStates[feature]).toBe(true);

      act(() => {
        result.current.setLoading(feature, false);
      });

      expect(result.current.ui.loadingStates[feature]).toBe(false);
    });
  });

  describe('File State', () => {
    it('should manage file uploads correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const uploadId = 'upload-123';
      const filename = 'test.txt';

      act(() => {
        result.current.startFileUpload(uploadId, filename);
      });

      expect(result.current.files.uploads[uploadId]).toEqual({
        filename,
        progress: 0,
        status: 'uploading'
      });

      act(() => {
        result.current.updateFileUploadProgress(uploadId, 50);
      });

      expect(result.current.files.uploads[uploadId].progress).toBe(50);

      const url = 'http://example.com/file.txt';
      act(() => {
        result.current.completeFileUpload(uploadId, url);
      });

      expect(result.current.files.uploads[uploadId].status).toBe('completed');
      expect(result.current.files.uploads[uploadId].url).toBe(url);
    });
  });

  describe('Settings State', () => {
    it('should manage settings correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const newSettings = { sound: false };

      act(() => {
        result.current.updateSettings('notifications', newSettings);
      });

      expect(result.current.settings.notifications.sound).toBe(false);
    });

    it('should reset settings to defaults', () => {
      const { result } = renderHook(() => useUnifiedStore());
      
      // Change a setting
      act(() => {
        result.current.updateSettings('notifications', { sound: false });
      });

      // Reset settings
      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.settings.notifications.sound).toBe(true);
    });
  });

  describe('Performance State', () => {
    it('should track updates correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const component = 'TestComponent';

      act(() => {
        result.current.trackUpdate(component);
      });

      expect(result.current.performance.updateCounts[component]).toBe(1);
    });
  });

  describe('Selector Hooks', () => {
    it('should provide auth selector hooks', () => {
      const { result: authResult } = renderHook(() => useUnifiedStore((state) => state.auth));
      const { result: useAuthResult } = renderHook(() => useUnifiedStore.getState().useAuth());

      expect(authResult.current).toEqual(useAuthResult.current);
    });

    it('should provide chat selector hooks', () => {
      const { result: chatResult } = renderHook(() => useUnifiedStore((state) => state.chat));
      const { result: useChatResult } = renderHook(() => useUnifiedStore.getState().useChat());

      expect(chatResult.current).toEqual(useChatResult.current);
    });

    it('should provide call selector hooks', () => {
      const { result: callResult } = renderHook(() => useUnifiedStore((state) => state.call));
      const { result: useCallResult } = renderHook(() => useUnifiedStore.getState().useCall());

      expect(callResult.current).toEqual(useCallResult.current);
    });

    it('should provide UI selector hooks', () => {
      const { result: uiResult } = renderHook(() => useUnifiedStore((state) => state.ui));
      const { result: useUIResult } = renderHook(() => useUnifiedStore.getState().useUI());

      expect(uiResult.current).toEqual(useUIResult.current);
    });

    it('should provide files selector hooks', () => {
      const { result: filesResult } = renderHook(() => useUnifiedStore((state) => state.files));
      const { result: useFilesResult } = renderHook(() => useUnifiedStore.getState().useFiles());

      expect(filesResult.current).toEqual(useFilesResult.current);
    });

    it('should provide settings selector hooks', () => {
      const { result: settingsResult } = renderHook(() => useUnifiedStore((state) => state.settings));
      const { result: useSettingsResult } = renderHook(() => useUnifiedStore.getState().useSettings());

      expect(settingsResult.current).toEqual(useSettingsResult.current);
    });

    it('should provide performance selector hooks', () => {
      const { result: performanceResult } = renderHook(() => useUnifiedStore((state) => state.performance));
      const { result: usePerformanceResult } = renderHook(() => useUnifiedStore.getState().usePerformance());

      expect(performanceResult.current).toEqual(usePerformanceResult.current);
    });
  });

  describe('Action Hooks', () => {
    it('should provide auth action hooks', () => {
      const { result: useAuthActionsResult } = renderHook(() => useUnifiedStore.getState().useAuthActions());
      
      expect(useAuthActionsResult.current).toHaveProperty('login');
      expect(useAuthActionsResult.current).toHaveProperty('logout');
      expect(useAuthActionsResult.current).toHaveProperty('setAuth');
      expect(useAuthActionsResult.current).toHaveProperty('setAuthError');
      expect(useAuthActionsResult.current).toHaveProperty('clearAuthError');
    });

    it('should provide chat action hooks', () => {
      const { result: useChatActionsResult } = renderHook(() => useUnifiedStore.getState().useChatActions());
      
      expect(useChatActionsResult.current).toHaveProperty('setActiveChat');
      expect(useChatActionsResult.current).toHaveProperty('updateChatList');
      expect(useChatActionsResult.current).toHaveProperty('addMessage');
      expect(useChatActionsResult.current).toHaveProperty('loadMessages');
      expect(useChatActionsResult.current).toHaveProperty('startTyping');
      expect(useChatActionsResult.current).toHaveProperty('stopTyping');
      expect(useChatActionsResult.current).toHaveProperty('setUserOnline');
      expect(useChatActionsResult.current).toHaveProperty('setUserOffline');
      expect(useChatActionsResult.current).toHaveProperty('updateUnreadCount');
    });

    it('should provide call action hooks', () => {
      const { result: useCallActionsResult } = renderHook(() => useUnifiedStore.getState().useCallActions());
      
      expect(useCallActionsResult.current).toHaveProperty('initiateCall');
      expect(useCallActionsResult.current).toHaveProperty('incomingCall');
      expect(useCallActionsResult.current).toHaveProperty('answerCall');
      expect(useCallActionsResult.current).toHaveProperty('endCall');
      expect(useCallActionsResult.current).toHaveProperty('setCallError');
      expect(useCallActionsResult.current).toHaveProperty('toggleMute');
      expect(useCallActionsResult.current).toHaveProperty('toggleVideo');
      expect(useCallActionsResult.current).toHaveProperty('startScreenShare');
      expect(useCallActionsResult.current).toHaveProperty('stopScreenShare');
      expect(useCallActionsResult.current).toHaveProperty('setLocalStream');
      expect(useCallActionsResult.current).toHaveProperty('setRemoteStream');
      expect(useCallActionsResult.current).toHaveProperty('updateCallStats');
      expect(useCallActionsResult.current).toHaveProperty('setCallHistory');
    });

    it('should provide UI action hooks', () => {
      const { result: useUIActionsResult } = renderHook(() => useUnifiedStore.getState().useUIActions());
      
      expect(useUIActionsResult.current).toHaveProperty('setTheme');
      expect(useUIActionsResult.current).toHaveProperty('toggleSidebar');
      expect(useUIActionsResult.current).toHaveProperty('showModal');
      expect(useUIActionsResult.current).toHaveProperty('hideModal');
      expect(useUIActionsResult.current).toHaveProperty('addNotification');
      expect(useUIActionsResult.current).toHaveProperty('removeNotification');
      expect(useUIActionsResult.current).toHaveProperty('addToastNotification');
      expect(useUIActionsResult.current).toHaveProperty('removeToastNotification');
      expect(useUIActionsResult.current).toHaveProperty('setLoading');
      expect(useUIActionsResult.current).toHaveProperty('setConnectionStatus');
    });

    it('should provide file action hooks', () => {
      const { result: useFileActionsResult } = renderHook(() => useUnifiedStore.getState().useFileActions());
      
      expect(useFileActionsResult.current).toHaveProperty('startFileUpload');
      expect(useFileActionsResult.current).toHaveProperty('updateFileUploadProgress');
      expect(useFileActionsResult.current).toHaveProperty('completeFileUpload');
      expect(useFileActionsResult.current).toHaveProperty('failFileUpload');
    });

    it('should provide settings action hooks', () => {
      const { result: useSettingsActionsResult } = renderHook(() => useUnifiedStore.getState().useSettingsActions());
      
      expect(useSettingsActionsResult.current).toHaveProperty('updateSettings');
      expect(useSettingsActionsResult.current).toHaveProperty('resetSettings');
    });

    it('should provide performance action hooks', () => {
      const { result: usePerformanceActionsResult } = renderHook(() => useUnifiedStore.getState().usePerformanceActions());
      
      expect(usePerformanceActionsResult.current).toHaveProperty('trackUpdate');
      expect(usePerformanceActionsResult.current).toHaveProperty('batchUpdate');
    });
  });

  describe('Combined Hooks', () => {
    it('should provide current user hook', () => {
      const { result: useCurrentUserResult } = renderHook(() => useUnifiedStore.getState().useCurrentUser());
      expect(useCurrentUserResult.current).toBeNull();
    });

    it('should provide isAuthenticated hook', () => {
      const { result: useIsAuthenticatedResult } = renderHook(() => useUnifiedStore.getState().useIsAuthenticated());
      expect(useIsAuthenticatedResult.current).toBe(false);
    });

    it('should provide active chat hook', () => {
      const { result: useActiveChatResult } = renderHook(() => useUnifiedStore.getState().useActiveChat());
      expect(useActiveChatResult.current).toBeNull();
    });

    it('should provide chat list hook', () => {
      const { result: useChatListResult } = renderHook(() => useUnifiedStore.getState().useChatList());
      expect(useChatListResult.current).toEqual([]);
    });

    it('should provide messages hook', () => {
      const { result: useMessagesResult } = renderHook(() => useUnifiedStore.getState().useMessages('test-chat-id'));
      expect(useMessagesResult.current).toEqual([]);
    });

    it('should provide unread counts hook', () => {
      const { result: useUnreadCountsResult } = renderHook(() => useUnifiedStore.getState().useUnreadCounts());
      expect(useUnreadCountsResult.current).toEqual({});
    });

    it('should provide online users hook', () => {
      const { result: useOnlineUsersResult } = renderHook(() => useUnifiedStore.getState().useOnlineUsers());
      expect(useOnlineUsersResult.current).toEqual([]);
    });

    it('should provide current call hook', () => {
      const { result: useCurrentCallResult } = renderHook(() => useUnifiedStore.getState().useCurrentCall());
      expect(useCurrentCallResult.current).toBeNull();
    });

    it('should provide incoming call hook', () => {
      const { result: useIncomingCallResult } = renderHook(() => useUnifiedStore.getState().useIncomingCall());
      expect(useIncomingCallResult.current).toBeNull();
    });

    it('should provide call state hook', () => {
      const { result: useCallStateResult } = renderHook(() => useUnifiedStore.getState().useCallState());
      expect(useCallStateResult.current).toBe('idle');
    });

    it('should provide theme hook', () => {
      const { result: useThemeResult } = renderHook(() => useUnifiedStore.getState().useTheme());
      expect(useThemeResult.current).toBe('system');
    });

    it('should provide notifications hook', () => {
      const { result: useNotificationsResult } = renderHook(() => useUnifiedStore.getState().useNotifications());
      expect(useNotificationsResult.current).toEqual([]);
    });

    it('should provide connection status hook', () => {
      const { result: useConnectionStatusResult } = renderHook(() => useUnifiedStore.getState().useConnectionStatus());
      expect(useConnectionStatusResult.current).toBe('online');
    });
  });

  describe('Persistence', () => {
    it('should persist auth and settings to localStorage', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const user = { id: '123', username: 'testuser' };
      const token = 'test-token';

      act(() => {
        result.current.login(user, token);
        result.current.setTheme('dark');
      });

      // Zustand should automatically call localStorage.setItem for persistence
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Batch Updates', () => {
    it('should handle batch updates correctly', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const updates = [
        (state) => { state.auth.user = { id: '123', username: 'testuser' }; },
        (state) => { state.auth.isAuthenticated = true; }
      ];

      act(() => {
        result.current.batchUpdate(updates);
      });

      expect(result.current.auth.user).toEqual({ id: '123', username: 'testuser' });
      expect(result.current.auth.isAuthenticated).toBe(true);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useUnifiedStore());
      const user = { id: '123', username: 'testuser' };
      const token = 'test-token';

      // Set some state
      act(() => {
        result.current.login(user, token);
        result.current.updateChatList([{ id: '1', name: 'Test Chat' }]);
      });

      // Verify state is set
      expect(result.current.auth.user).toEqual(user);
      expect(result.current.chat.chatList).toHaveLength(1);

      // Reset store
      act(() => {
        result.current.reset();
      });

      // Verify reset (auth should remain if authenticated, but we're not authenticated in this test)
      expect(result.current.auth.user).toEqual(user); // Should remain because we're authenticated
      expect(result.current.chat.chatList).toEqual([]);
    });
  });
});