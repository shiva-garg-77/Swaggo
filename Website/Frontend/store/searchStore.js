import { create } from 'zustand';

/**
 * Search Store
 * Manages search state and history
 */
export const useSearchStore = create((set, get) => ({
  // State
  query: '',
  results: [],
  searchHistory: [],
  filters: {
    type: 'all', // all, posts, profiles, hashtags
    dateRange: null,
    location: null,
    verified: false
  },
  isLoading: false,
  error: null,
  hasMore: true,
  offset: 0,
  limit: 20,

  // Actions

  /**
   * Set query
   */
  setQuery: (query) => {
    set({ query, results: [], offset: 0, hasMore: true });
  },

  /**
   * Set results
   */
  setResults: (results) => {
    set({ results });
  },

  /**
   * Add results (pagination)
   */
  addResults: (newResults) => {
    set((state) => ({
      results: [...state.results, ...newResults],
      offset: state.offset + newResults.length
    }));
  },

  /**
   * Add to search history
   */
  addToHistory: (query) => {
    set((state) => {
      const history = [query, ...state.searchHistory.filter(q => q !== query)].slice(0, 10);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('searchHistory', JSON.stringify(history));
      }
      return { searchHistory: history };
    });
  },

  /**
   * Load search history
   */
  loadHistory: () => {
    if (typeof window !== 'undefined') {
      const history = localStorage.getItem('searchHistory');
      if (history) {
        set({ searchHistory: JSON.parse(history) });
      }
    }
  },

  /**
   * Clear search history
   */
  clearHistory: () => {
    set({ searchHistory: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('searchHistory');
    }
  },

  /**
   * Set filters
   */
  setFilters: (filters) => {
    set({ filters, results: [], offset: 0, hasMore: true });
  },

  /**
   * Update filter
   */
  updateFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      results: [],
      offset: 0,
      hasMore: true
    }));
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
      query: '',
      results: [],
      filters: {
        type: 'all',
        dateRange: null,
        location: null,
        verified: false
      },
      isLoading: false,
      error: null,
      hasMore: true,
      offset: 0
    });
  }
}));

export default useSearchStore;
