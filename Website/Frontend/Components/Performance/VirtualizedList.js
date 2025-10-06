'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMemoryCleanup } from '../../hooks/useMemoryCleanup';

/**
 * High-Performance Virtualized List Component
 * Optimized for rendering large datasets without performance degradation
 */
const VirtualizedList = ({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  renderItem,
  getItemId = (item, index) => index,
  overscan = 5,
  scrollThreshold = 100,
  onScrollEnd,
  onItemsRendered,
  className = '',
  style = {},
  enableSmoothScrolling = true,
  loadingComponent = null,
  emptyComponent = null,
  isLoading = false,
  headerComponent = null,
  footerComponent = null
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const [containerRef, setContainerRef] = useState(null);
  const scrollTimeoutRef = useRef(null);
  const { safeSetTimeout, trackEventListener } = useMemoryCleanup('VirtualizedList');

  // Calculate visible items
  const visibleItems = useMemo(() => {
    if (!items.length) return { start: 0, end: 0, items: [] };

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length
    );
    
    // Apply overscan
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length, visibleEnd + overscan);
    
    return {
      start,
      end,
      items: items.slice(start, end),
      visibleStart,
      visibleEnd
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    setScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scroll end timeout
    scrollTimeoutRef.current = safeSetTimeout(() => {
      setScrolling(false);
      
      // Check if we're near the end for infinite loading
      if (onScrollEnd) {
        const scrollBottom = newScrollTop + containerHeight;
        const totalHeight = items.length * itemHeight;
        
        if (totalHeight - scrollBottom < scrollThreshold) {
          onScrollEnd();
        }
      }
    }, 150);

    // Notify parent about rendered items
    if (onItemsRendered) {
      onItemsRendered({
        visibleStart: visibleItems.visibleStart,
        visibleEnd: visibleItems.visibleEnd,
        totalItems: items.length
      });
    }
  }, [
    containerHeight,
    itemHeight,
    items.length,
    onScrollEnd,
    onItemsRendered,
    scrollThreshold,
    visibleItems.visibleStart,
    visibleItems.visibleEnd,
    safeSetTimeout
  ]);

  // Set up scroll event listener
  useEffect(() => {
    if (!containerRef) return;
    
    return trackEventListener(containerRef, 'scroll', handleScroll, { passive: true });
  }, [containerRef, handleScroll, trackEventListener]);

  // Scroll to specific item
  const scrollToItem = useCallback((index, align = 'auto') => {
    if (!containerRef) return;

    const itemTop = index * itemHeight;
    let scrollPosition = itemTop;

    if (align === 'center') {
      scrollPosition = itemTop - (containerHeight - itemHeight) / 2;
    } else if (align === 'end') {
      scrollPosition = itemTop - containerHeight + itemHeight;
    }

    containerRef.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: enableSmoothScrolling ? 'smooth' : 'auto'
    });
  }, [containerRef, itemHeight, containerHeight, enableSmoothScrolling]);

  // Get scroll-to-item function for parent
  const scrollToIndex = useCallback(scrollToItem, [scrollToItem]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Render individual item
  const renderVirtualizedItem = useCallback((item, index) => {
    const actualIndex = visibleItems.start + index;
    const itemId = getItemId(item, actualIndex);
    const itemStyle = {
      position: 'absolute',
      top: actualIndex * itemHeight,
      left: 0,
      right: 0,
      height: itemHeight,
      overflow: 'hidden'
    };

    return (
      <div
        key={itemId}
        style={itemStyle}
        className="virtualized-item"
      >
        {renderItem(item, actualIndex, {
          isScrolling: scrolling,
          isVisible: actualIndex >= visibleItems.visibleStart && actualIndex < visibleItems.visibleEnd
        })}
      </div>
    );
  }, [
    visibleItems.start,
    visibleItems.visibleStart,
    visibleItems.visibleEnd,
    getItemId,
    itemHeight,
    renderItem,
    scrolling
  ]);

  // Loading state
  if (isLoading && loadingComponent) {
    return (
      <div
        className={`virtualized-list-loading ${className}`}
        style={{ height: containerHeight, ...style }}
      >
        {loadingComponent}
      </div>
    );
  }

  // Empty state
  if (!items.length && emptyComponent) {
    return (
      <div
        className={`virtualized-list-empty ${className}`}
        style={{ height: containerHeight, ...style }}
      >
        {emptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={setContainerRef}
      className={`virtualized-list ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        ...style
      }}
    >
      {headerComponent && (
        <div className="virtualized-list-header">
          {headerComponent}
        </div>
      )}
      
      <div
        className="virtualized-list-content"
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems.items.map(renderVirtualizedItem)}
      </div>
      
      {footerComponent && (
        <div className="virtualized-list-footer">
          {footerComponent}
        </div>
      )}
    </div>
  );
};

/**
 * Memoized Virtualized List for better performance
 */
export const MemoizedVirtualizedList = React.memo(VirtualizedList);

/**
 * Grid Virtualization Component
 */
export const VirtualizedGrid = ({
  items = [],
  itemWidth = 200,
  itemHeight = 200,
  containerWidth = 800,
  containerHeight = 600,
  renderItem,
  getItemId = (item, index) => index,
  gap = 10,
  overscan = 2,
  ...props
}) => {
  const itemsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const totalRows = Math.ceil(items.length / itemsPerRow);

  // Convert grid items to rows
  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < totalRows; i++) {
      const startIndex = i * itemsPerRow;
      const endIndex = Math.min(startIndex + itemsPerRow, items.length);
      result.push({
        index: i,
        items: items.slice(startIndex, endIndex),
        startIndex
      });
    }
    return result;
  }, [items, itemsPerRow, totalRows]);

  const renderRow = useCallback((row, rowIndex) => {
    return (
      <div
        className="virtualized-grid-row"
        style={{
          display: 'flex',
          gap: `${gap}px`,
          height: itemHeight,
          alignItems: 'flex-start'
        }}
      >
        {row.items.map((item, itemIndex) => {
          const actualIndex = row.startIndex + itemIndex;
          const itemId = getItemId(item, actualIndex);
          
          return (
            <div
              key={itemId}
              className="virtualized-grid-item"
              style={{
                width: itemWidth,
                height: itemHeight,
                flexShrink: 0
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    );
  }, [gap, itemHeight, itemWidth, getItemId, renderItem]);

  return (
    <MemoizedVirtualizedList
      items={rows}
      itemHeight={itemHeight + gap}
      containerHeight={containerHeight}
      renderItem={renderRow}
      getItemId={(row) => row.index}
      overscan={overscan}
      {...props}
    />
  );
};

/**
 * Hook for virtualized list control
 */
export const useVirtualizedList = () => {
  const [scrollToIndex, setScrollToIndex] = useState(null);
  
  const scrollTo = useCallback((index, align) => {
    setScrollToIndex({ index, align });
  }, []);
  
  const scrollToTop = useCallback(() => {
    scrollTo(0, 'start');
  }, [scrollTo]);
  
  const scrollToBottom = useCallback((totalItems) => {
    scrollTo(totalItems - 1, 'end');
  }, [scrollTo]);
  
  return {
    scrollTo,
    scrollToTop,
    scrollToBottom,
    scrollToIndex
  };
};

/**
 * Performance optimized list item wrapper
 */
export const OptimizedListItem = React.memo(({ 
  children, 
  isScrolling, 
  isVisible,
  placeholder = null 
}) => {
  // Show placeholder during scrolling for better performance
  if (isScrolling && placeholder) {
    return placeholder;
  }
  
  // Only render if visible (additional optimization)
  if (!isVisible && placeholder) {
    return placeholder;
  }
  
  return children;
});

OptimizedListItem.displayName = 'OptimizedListItem';

export default VirtualizedList;