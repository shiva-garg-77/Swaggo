import { create } from 'zustand';

/**
 * Follow Request Store
 * Manages follow request state across the application
 */
export const useFollowRequestStore = create((set, get) => ({
  // State
  receivedRequests: [],
  sentRequests: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetched: null,

  // Actions

  /**
   * Set received requests
   */
  setReceivedRequests: (requests) => {
    set({ 
      receivedRequests: requests,
      unreadCount: requests.filter(r => r.status === 'pending').length
    });
  },

  /**
   * Set sent requests
   */
  setSentRequests: (requests) => {
    set({ sentRequests: requests });
  },

  /**
   * Add a new received request
   */
  addReceivedRequest: (request) => {
    set((state) => ({
      receivedRequests: [request, ...state.receivedRequests],
      unreadCount: state.unreadCount + 1
    }));
  },

  /**
   * Add a new sent request
   */
  addSentRequest: (request) => {
    set((state) => ({
      sentRequests: [request, ...state.sentRequests]
    }));
  },

  /**
   * Remove a received request
   */
  removeReceivedRequest: (requestId) => {
    set((state) => {
      const request = state.receivedRequests.find(r => r.requestid === requestId);
      const wasPending = request?.status === 'pending';
      
      return {
        receivedRequests: state.receivedRequests.filter(r => r.requestid !== requestId),
        unreadCount: wasPending ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    });
  },

  /**
   * Remove a sent request
   */
  removeSentRequest: (requestId) => {
    set((state) => ({
      sentRequests: state.sentRequests.filter(r => r.requestid !== requestId)
    }));
  },

  /**
   * Update request status
   */
  updateRequestStatus: (requestId, status) => {
    set((state) => {
      const updatedReceived = state.receivedRequests.map(r =>
        r.requestid === requestId ? { ...r, status } : r
      );
      
      const updatedSent = state.sentRequests.map(r =>
        r.requestid === requestId ? { ...r, status } : r
      );

      // Recalculate unread count
      const unreadCount = updatedReceived.filter(r => r.status === 'pending').length;

      return {
        receivedRequests: updatedReceived,
        sentRequests: updatedSent,
        unreadCount
      };
    });
  },

  /**
   * Update unread count
   */
  updateUnreadCount: (count) => {
    set({ unreadCount: count });
  },

  /**
   * Set loading state
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
   * Reset store
   */
  reset: () => {
    set({
      receivedRequests: [],
      sentRequests: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastFetched: null
    });
  }
}));

export default useFollowRequestStore;
