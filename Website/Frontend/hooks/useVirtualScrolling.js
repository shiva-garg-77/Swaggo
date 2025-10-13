import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * React hook for virtual scrolling
 * Optimizes rendering of large lists by only rendering visible items
 * 🔧 PERFORMANCE FIX #35: Enhanced virtual scrolling with better performance optimizations
 */

export const useVirtualScrolling = (items, itemHeight, containerRef, options = {}) => {
  const {
    buffer = 5,
    overscan = 2,
    onScroll = null,
    onRangeChange = null
  } = options;

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const previousRange = useRef({ start: 0, end: 0 });
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef(null);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return items.length * itemHeight;
  }, [items.length, itemHeight]);

  // Calculate visible range with performance optimizations
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef?.current || itemHeight <= 0) {
      return { start: 0, end: Math.min(items.length - 1, 20) };
    }

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;

    // Calculate visible indices with better buffer management
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + clientHeight) / itemHeight) + buffer + overscan
    );

    return { start: startIndex, end: endIndex, scrollTop, clientHeight };
  }, [containerRef, itemHeight, items.length, buffer, overscan]);

  // Update visible range with debouncing for better performance
  const updateVisibleRange = useCallback(() => {
    // Debounce updates during scrolling for better performance
    if (isScrollingRef.current) {
      return;
    }
    
    const range = calculateVisibleRange();
    setScrollPosition(range.scrollTop || 0);
    setViewportHeight(range.clientHeight || 0);
    setVisibleRange({ start: range.start, end: range.end });

    // Notify about range changes
    if (onRangeChange && (
      range.start !== previousRange.current.start || 
      range.end !== previousRange.current.end
    )) {
      onRangeChange(range);
      previousRange.current = { start: range.start, end: range.end };
    }
  }, [calculateVisibleRange, onRangeChange]);

  // Handle scroll events with performance optimizations
  const handleScroll = useCallback((e) => {
    // Set scrolling flag
    isScrollingRef.current = true;
    
    // Clear previous timer
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }
    
    // Update scroll position immediately for smooth UI updates
    setScrollPosition(e.target.scrollTop);
    
    // Debounce the actual range update for better performance
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      updateVisibleRange();
    }, 16); // ~60fps
    
    // Notify about scroll events
    if (onScroll) {
      onScroll(e);
    }
  }, [updateVisibleRange, onScroll]);

  // Scroll to specific item
  const scrollToItem = useCallback((index) => {
    if (containerRef?.current && itemHeight > 0) {
      const scrollTop = index * itemHeight;
      containerRef.current.scrollTop = scrollTop;
      // Force immediate update for direct scrolls
      isScrollingRef.current = false;
      updateVisibleRange();
    }
  }, [containerRef, itemHeight, updateVisibleRange]);

  // Scroll to bottom with optimizations
  const scrollToBottom = useCallback(() => {
    if (containerRef?.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      // Force immediate update for direct scrolls
      isScrollingRef.current = false;
      updateVisibleRange();
    }
  }, [containerRef, updateVisibleRange]);

  // Get visible items with memoization
  const visibleItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    const { start, end } = visibleRange;
    return items.slice(start, end + 1).map((item, index) => ({
      item,
      index: start + index,
      offset: (start + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    // Initial calculation
    updateVisibleRange();
    
    // Add scroll listener with passive flag for better performance
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Set up resize observer for viewport changes
    const resizeObserver = new ResizeObserver(() => {
      updateVisibleRange();
    });
    
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [containerRef, handleScroll, updateVisibleRange]);

  // Update when items change
  useEffect(() => {
    // Reset scrolling state when items change
    isScrollingRef.current = false;
    updateVisibleRange();
  }, [items, updateVisibleRange]);

  // Check if item is visible
  const isItemVisible = useCallback((index) => {
    const { start, end } = visibleRange;
    return index >= start && index <= end;
  }, [visibleRange]);

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    scrollPosition,
    viewportHeight,
    scrollToItem,
    scrollToBottom,
    isItemVisible,
    updateVisibleRange
  };
};

export default useVirtualScrolling;