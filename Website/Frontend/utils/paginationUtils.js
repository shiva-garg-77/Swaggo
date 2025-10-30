/**
 * 📄 Pagination Utilities
 * 
 * Provides utilities for implementing proper pagination on all list endpoints
 * to improve performance and reduce memory usage.
 */

import { useState } from 'react';

/**
 * Pagination Manager
 * Handles pagination state and API calls for list endpoints
 */
class PaginationManager {
  constructor(options = {}) {
    this.pageSize = options.pageSize || 20;
    this.defaultSort = options.defaultSort || { field: 'createdAt', order: 'desc' };
    this.cache = new Map();
    this.cacheTimeouts = new Map();
  }

  /**
   * Create pagination parameters for API requests
   * @param {Object} options - Pagination options
   * @param {number} options.page - Current page (1-based)
   * @param {number} options.limit - Items per page
   * @param {Object} options.sort - Sort configuration
   * @param {Object} options.filters - Filter criteria
   * @returns {Object} Pagination parameters
   */
  createPaginationParams(options = {}) {
    const {
      page = 1,
      limit = this.pageSize,
      sort = this.defaultSort,
      filters = {}
    } = options;

    return {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)), // Limit between 1-100
      sort: sort.field,
      order: sort.order,
      ...filters
    };
  }

  /**
   * Generate cache key for pagination request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Pagination parameters
   * @returns {string} Cache key
   */
  generateCacheKey(endpoint, params) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  /**
   * Fetch paginated data with caching
   * @param {string} endpoint - API endpoint
   * @param {Object} paginationParams - Pagination parameters
   * @param {Function} fetchFn - Function to fetch data
   * @param {number} cacheTtl - Cache TTL in milliseconds
   * @returns {Promise} Paginated data
   */
  async fetchPaginatedData(endpoint, paginationParams, fetchFn, cacheTtl = 30000) {
    const cacheKey = this.generateCacheKey(endpoint, paginationParams);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTtl) {
        console.log(`🔄 Using cached pagination data for: ${cacheKey}`);
        return cached.data;
      } else {
        // Expired cache
        this.cache.delete(cacheKey);
        if (this.cacheTimeouts.has(cacheKey)) {
          clearTimeout(this.cacheTimeouts.get(cacheKey));
          this.cacheTimeouts.delete(cacheKey);
        }
      }
    }

    // Fetch fresh data
    const data = await fetchFn(paginationParams);
    
    // Cache result
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Set cache expiration
    const cacheTimeout = setTimeout(() => {
      this.cache.delete(cacheKey);
      this.cacheTimeouts.delete(cacheKey);
    }, cacheTtl);
    
    this.cacheTimeouts.set(cacheKey, cacheTimeout);
    
    return data;
  }

  /**
   * Clear cache for specific endpoint
   * @param {string} endpoint - API endpoint
   */
  clearCacheForEndpoint(endpoint) {
    const keysToDelete = [];
    this.cache.forEach((value, key) => {
      if (key.startsWith(endpoint)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      if (this.cacheTimeouts.has(key)) {
        clearTimeout(this.cacheTimeouts.get(key));
        this.cacheTimeouts.delete(key);
      }
    });
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
    this.cacheTimeouts.forEach(timeout => clearTimeout(timeout));
    this.cacheTimeouts.clear();
  }

  /**
   * Calculate pagination metadata
   * @param {number} totalItems - Total number of items
   * @param {number} currentPage - Current page (1-based)
   * @param {number} pageSize - Items per page
   * @returns {Object} Pagination metadata
   */
  calculatePaginationMetadata(totalItems, currentPage, pageSize) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    
    return {
      totalItems,
      currentPage,
      pageSize,
      totalPages,
      hasNextPage,
      hasPrevPage,
      startIndex: (currentPage - 1) * pageSize,
      endIndex: Math.min(currentPage * pageSize - 1, totalItems - 1)
    };
  }
}

/**
 * React Hook for Pagination
 * Provides pagination state management for React components
 */
export const usePagination = (initialOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSort = { field: 'createdAt', order: 'desc' }
  } = initialOptions;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sort, setSort] = useState(initialSort);
  const [filters, setFilters] = useState({});
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginationMetadata, setPaginationMetadata] = useState({
    totalItems: 0,
    currentPage: initialPage,
    pageSize: initialLimit,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  /**
   * Load paginated data
   * @param {Function} fetchFn - Function to fetch data
   * @param {Object} options - Load options
   */
  const loadPage = async (fetchFn, options = {}) => {
    const {
      page: targetPage = page,
      limit: targetLimit = limit,
      sort: targetSort = sort,
      filters: targetFilters = filters
    } = options;

    setLoading(true);
    setError(null);

    try {
      const paginationParams = {
        page: targetPage,
        limit: targetLimit,
        sort: targetSort,
        filters: targetFilters
      };

      const result = await fetchFn(paginationParams);
      
      setData(result.data || []);
      setPaginationMetadata(result.metadata || {
        totalItems: result.data?.length || 0,
        currentPage: targetPage,
        pageSize: targetLimit,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
      
      // Update state if options were provided
      if (options.page !== undefined) setPage(targetPage);
      if (options.limit !== undefined) setLimit(targetLimit);
      if (options.sort !== undefined) setSort(targetSort);
      if (options.filters !== undefined) setFilters(targetFilters);
    } catch (err) {
      setError(err);
      setData([]);
      setPaginationMetadata({
        totalItems: 0,
        currentPage: targetPage,
        pageSize: targetLimit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Go to specific page
   * @param {number} newPage - Page number
   * @param {Function} fetchFn - Function to fetch data
   */
  const goToPage = (newPage, fetchFn) => {
    if (newPage >= 1 && newPage <= paginationMetadata.totalPages) {
      loadPage(fetchFn, { page: newPage });
    }
  };

  /**
   * Change page size
   * @param {number} newLimit - New page size
   * @param {Function} fetchFn - Function to fetch data
   */
  const changePageSize = (newLimit, fetchFn) => {
    loadPage(fetchFn, { page: 1, limit: newLimit });
  };

  /**
   * Sort by field
   * @param {string} field - Field to sort by
   * @param {Function} fetchFn - Function to fetch data
   */
  const sortBy = (field, fetchFn) => {
    const newSort = {
      field,
      order: sort.field === field && sort.order === 'asc' ? 'desc' : 'asc'
    };
    loadPage(fetchFn, { page: 1, sort: newSort });
  };

  /**
   * Apply filters
   * @param {Object} newFilters - Filter criteria
   * @param {Function} fetchFn - Function to fetch data
   */
  const applyFilters = (newFilters, fetchFn) => {
    loadPage(fetchFn, { page: 1, filters: newFilters });
  };

  /**
   * Refresh current page
   * @param {Function} fetchFn - Function to fetch data
   */
  const refresh = (fetchFn) => {
    loadPage(fetchFn);
  };

  /**
   * Reset pagination
   * @param {Function} fetchFn - Function to fetch data
   */
  const reset = (fetchFn) => {
    setPage(initialPage);
    setLimit(initialLimit);
    setSort(initialSort);
    setFilters({});
    loadPage(fetchFn, {
      page: initialPage,
      limit: initialLimit,
      sort: initialSort,
      filters: {}
    });
  };

  return {
    // State
    page,
    limit,
    sort,
    filters,
    data,
    loading,
    error,
    paginationMetadata,
    
    // Actions
    loadPage,
    goToPage,
    changePageSize,
    sortBy,
    applyFilters,
    refresh,
    reset
  };
};

/**
 * GraphQL Pagination Hook
 * Specialized hook for GraphQL pagination with cursor-based pagination
 */
export const useGraphQLPagination = (query, options = {}) => {
  const {
    initialLimit = 20,
    initialCursor = null
  } = options;

  const [limit, setLimit] = useState(initialLimit);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(true);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { fetchMore } = useQuery(query, {
    variables: { 
      limit,
      cursor: initialCursor
    },
    onCompleted: (result) => {
      // Handle initial data
      const pageInfo = result.pageInfo || {};
      setHasMore(pageInfo.hasNextPage || false);
      setData(result.data || []);
    },
    onError: (err) => {
      setError(err);
      setData([]);
    }
  });

  /**
   * Load more data
   */
  const loadMore = async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchMore({
        variables: {
          limit,
          cursor
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          
          const newData = fetchMoreResult.data || [];
          const pageInfo = fetchMoreResult.pageInfo || {};
          
          setHasMore(pageInfo.hasNextPage || false);
          setCursor(pageInfo.endCursor || null);
          
          return {
            ...prev,
            data: [...(prev.data || []), ...newData]
          };
        }
      });
      
      setData(result.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset pagination
   */
  const reset = () => {
    setCursor(initialCursor);
    setHasMore(true);
    setData([]);
    setError(null);
  };

  return {
    data,
    loading,
    error,
    hasMore,
    cursor,
    loadMore,
    reset
  };
};

// Create singleton instance
const paginationManager = new PaginationManager();

export {
  PaginationManager,
  paginationManager
};

export default {
  PaginationManager,
  paginationManager,
  usePagination,
  useGraphQLPagination
};