import { create } from 'zustand';

/**
 * Explore Store
 * Manages trending posts and explore state
 */
export const useExploreStore = create((set, get) => ({
    // State
    trendingPosts: [],
    timeRange: '24h', // 24h, 7d, 30d, all
    isLoading: false,
    error: null,
    hasMore: true,
    offset: 0,
    limit: 20,

    // Actions

    /**
     * Set trending posts
     */
    setTrendingPosts: (posts) => {
        set({ trendingPosts: posts });
    },

    /**
     * Add trending posts (pagination)
     */
    addTrendingPosts: (posts) => {
        set((state) => ({
            trendingPosts: [...state.trendingPosts, ...posts],
            offset: state.offset + posts.length
        }));
    },

    /**
     * Set time range
     */
    setTimeRange: (timeRange) => {
        set({ timeRange, trendingPosts: [], offset: 0, hasMore: true });
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
            trendingPosts: [],
            timeRange: '24h',
            isLoading: false,
            error: null,
            hasMore: true,
            offset: 0
        });
    }
}));

export default useExploreStore;
