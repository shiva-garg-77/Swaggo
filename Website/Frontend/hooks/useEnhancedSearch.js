import { useState, useEffect, useCallback, useMemo } from 'react';
import enhancedSearchService from '../services/EnhancedSearchService';

/**
 * React hook for enhanced search functionality
 * Provides search capabilities with better performance and filtering
 */
export const useEnhancedSearch = (messages = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({
    messageTypes: [],
    senders: [],
    dateRange: 'all',
    sentiment: 'all',
    importance: 'all',
    priority: 'all',
    hasAttachments: false,
    hasReactions: false,
    isEdited: false
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchMetrics, setSearchMetrics] = useState(enhancedSearchService.getMetrics());
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  // Create search index when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      enhancedSearchService.createIndex(messages);
    }
  }, [messages]);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSearchMetrics(enhancedSearchService.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Perform search with debouncing
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() && !hasActiveFilters()) {
        setSearchResults([]);
        setCurrentResultIndex(0);
        return;
      }

      setIsSearching(true);
      
      try {
        // Small delay to allow for debouncing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const results = enhancedSearchService.search(messages, searchQuery, filters);
        setSearchResults(results);
        setCurrentResultIndex(results.length > 0 ? 0 : 0);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters, messages]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return (
      filters.messageTypes.length > 0 ||
      filters.senders.length > 0 ||
      filters.dateRange !== 'all' ||
      filters.sentiment !== 'all' ||
      filters.importance !== 'all' ||
      filters.priority !== 'all' ||
      filters.hasAttachments ||
      filters.hasReactions ||
      filters.isEdited
    );
  }, [filters]);

  // Toggle filter
  const toggleFilter = useCallback((filterType, value) => {
    setFilters(prev => {
      const current = prev[filterType] || [];
      
      // Handle boolean filters
      if (typeof value === 'boolean') {
        return { ...prev, [filterType]: value };
      }
      
      // Handle array filters
      const updated = Array.isArray(current) 
        ? (current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value])
        : current;
          
      return { ...prev, [filterType]: updated };
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      messageTypes: [],
      senders: [],
      dateRange: 'all',
      sentiment: 'all',
      importance: 'all',
      priority: 'all',
      hasAttachments: false,
      hasReactions: false,
      isEdited: false
    });
  }, []);

  // Navigate to next/previous result
  const navigateResult = useCallback((direction) => {
    if (searchResults.length === 0) return;

    let newIndex = currentResultIndex;
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % searchResults.length;
    } else {
      newIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
    }

    setCurrentResultIndex(newIndex);
  }, [searchResults, currentResultIndex]);

  // Jump to specific result
  const jumpToResult = useCallback((index) => {
    if (index >= 0 && index < searchResults.length) {
      setCurrentResultIndex(index);
    }
  }, [searchResults]);

  // Highlight text with search terms
  const highlightText = useCallback((text) => {
    return enhancedSearchService.highlightText(text, searchQuery);
  }, [searchQuery]);

  // Get unique senders from messages
  const uniqueSenders = useMemo(() => {
    if (!messages) return [];
    
    const sendersMap = new Map();
    messages.forEach(message => {
      if (message.sender && message.senderid) {
        sendersMap.set(message.senderid, {
          id: message.senderid,
          name: message.sender.name || message.sender.username || 'Unknown'
        });
      }
    });
    
    return Array.from(sendersMap.values());
  }, [messages]);

  // Get message type counts
  const messageTypeCounts = useMemo(() => {
    if (!messages) return {};
    
    const counts = {};
    messages.forEach(message => {
      const type = message.messageType || 'text';
      counts[type] = (counts[type] || 0) + 1;
    });
    
    return counts;
  }, [messages]);

  // Clear search cache
  const clearSearchCache = useCallback(() => {
    enhancedSearchService.clearCache();
    setSearchMetrics(enhancedSearchService.getMetrics());
  }, []);

  return {
    // State
    searchQuery,
    setSearchQuery,
    searchResults,
    filters,
    setFilters,
    isSearching,
    searchMetrics,
    currentResultIndex,
    uniqueSenders,
    messageTypeCounts,
    
    // Actions
    toggleFilter,
    clearFilters,
    navigateResult,
    jumpToResult,
    highlightText,
    clearSearchCache,
    hasActiveFilters
  };
};

export default useEnhancedSearch;