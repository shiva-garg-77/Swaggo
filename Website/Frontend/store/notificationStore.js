import { create } from 'zustand';

/**
 * Notification Store
 * Manages notification state across the application
 */
export const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  filter: 'all', // all, mentions, likes, comments, follows
  hasMore: true,
  isLoading: false,
  error: null,
  lastFetched: null,
  offset: 0,
  limit: 20,

  // Actions

  /**
   * Set notifications
   */
  setNotifications: (notifications) => {
    set({ notifications });
  },

  /**
   * Add notifications (for pagination)
   */
  addNotifications: (newNotifications) => {
    set((state) => ({
      notifications: [...state.notifications, ...newNotifications],
      offset: state.offset + newNotifications.length
    }));
  },

  /**
   * Add a single notification (real-time)
   */
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isread ? state.unreadCount : state.unreadCount + 1
    }));
  },

  /**
   * Update notification
   */
  updateNotification: (notificationId, updates) => {
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.notificationid === notificationId ? { ...n, ...updates } : n
      )
    }));
  },

  /**
   * Remove notification
   */
  removeNotification: (notificationId) => {
    set((state) => {
      const notification = state.notifications.find(n => n.notificationid === notificationId);
      const wasUnread = notification && !notification.isread;
      
      return {
        notifications: state.notifications.filter(n => n.notificationid !== notificationId),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    });
  },

  /**
   * Mark notification as read
   */
  markAsRead: (notificationId) => {
    set((state) => {
      const notification = state.notifications.find(n => n.notificationid === notificationId);
      const wasUnread = notification && !notification.isread;
      
      return {
        notifications: state.notifications.map(n =>
          n.notificationid === notificationId ? { ...n, isread: true } : n
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    });
  },

  /**
   * Mark all as read
   */
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, isread: true })),
      unreadCount: 0
    }));
  },

  /**
   * Set unread count
   */
  setUnreadCount: (count) => {
    set({ unreadCount: count });
  },

  /**
   * Set filter
   */
  setFilter: (filter) => {
    set({ filter, offset: 0, notifications: [], hasMore: true });
  },

  /**
   * Set has more
   */
  setHasMore: (hasMore) => {
    set({ hasMore });
  },

  /**
   * Set loading
   */
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  /**
   * Set error
   */
  setError: (error) => {
    set({ error });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Mark as fetched
   */
  markFetched: () => {
    set({ lastFetched: new Date() });
  },

  /**
   * Reset pagination
   */
  resetPagination: () => {
    set({ offset: 0, hasMore: true, notifications: [] });
  },

  /**
   * Reset store
   */
  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      filter: 'all',
      hasMore: true,
      isLoading: false,
      error: null,
      lastFetched: null,
      offset: 0
    });
  }
}));

export default useNotificationStore;
