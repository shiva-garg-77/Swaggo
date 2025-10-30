import { create } from 'zustand';

/**
 * Hashtag Store
 * Manages hashtag posts and statistics
 */
export const useHashtagStore = create((set, get) => ({
  // State
  currentHashtag: null,
  posts: [],
  stats: null,
  isLoading: false,
  error: null,
  hasMore: true,
  offset: 0,
  limit: 20,
  viewMode: 'feed', // 'feed' or 'grid'

  // Actions

  /**
   * Set current hashtag
   */
  setCurrentHashtag: (hashtag) => {
    set({ 
      currentHashtag: hashtag,
      posts: [],
      offset: 0,
      hasMore: true
    });
  },

  /**
   * Set posts
   */
  setPosts: (posts) => {
    set({ posts });
  },

  /**
   * Add posts (pagination)
   */
  addPosts: (newPosts) => {
    set((state) => ({
      posts: [...state.posts, ...newPosts],
      offset: state.offset + newPosts.length
    }));
  },

  /**
   * Set stats
   */
  setStats: (stats) => {
    set({ stats });
  },

  /**
   * Set view mode
   */
  setViewMode: (viewMode) => {
    set({ viewMode });
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
   * Set has more
   */
  setHasMore: (hasMore) => {
    set({ hasMore });
  },

  /**
   * Reset
   */
  reset: () => {
    set({
      currentHashtag: null,
      posts: [],
      stats: null,
      isLoading: false,
      error: null,
      hasMore: true,
      offset: 0,
      viewMode: 'feed'
    });
  }
}));

export default useHashtagStore;
