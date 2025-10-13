import { renderHook, act } from '@testing-library/react';
import useVirtualScrolling from '../useVirtualScrolling';

describe('useVirtualScrolling', () => {
  let container;
  let containerRef;

  beforeEach(() => {
    // Create a mock container
    container = {
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 2000,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    
    containerRef = { current: container };
  });

  test('should calculate initial visible range', () => {
    const items = new Array(100).fill(null).map((_, i) => ({ id: i }));
    const itemHeight = 50;
    
    const { result } = renderHook(() => 
      useVirtualScrolling(items, itemHeight, containerRef)
    );
    
    expect(result.current.visibleRange).toEqual({ start: 0, end: 13 }); // 400/50 + buffer
    expect(result.current.totalHeight).toBe(5000); // 100 * 50
  });

  test('should update visible range on scroll', () => {
    const items = new Array(100).fill(null).map((_, i) => ({ id: i }));
    const itemHeight = 50;
    
    const { result } = renderHook(() => 
      useVirtualScrolling(items, itemHeight, containerRef)
    );
    
    // Simulate scroll
    act(() => {
      container.scrollTop = 1000; // Scroll to item 20 (1000/50)
      const scrollHandler = container.addEventListener.mock.calls.find(call => call[0] === 'scroll')[1];
      scrollHandler();
    });
    
    // Should show items around position 20
    expect(result.current.visibleRange.start).toBeGreaterThanOrEqual(10);
    expect(result.current.visibleRange.end).toBeLessThanOrEqual(30);
  });

  test('should return visible items', () => {
    const items = new Array(100).fill(null).map((_, i) => ({ id: i, name: `Item ${i}` }));
    const itemHeight = 50;
    
    const { result } = renderHook(() => 
      useVirtualScrolling(items, itemHeight, containerRef)
    );
    
    const visibleItems = result.current.visibleItems;
    expect(visibleItems).toHaveLength(14); // 0-13
    
    // Check structure
    expect(visibleItems[0]).toHaveProperty('item');
    expect(visibleItems[0]).toHaveProperty('index');
    expect(visibleItems[0]).toHaveProperty('offset');
    expect(visibleItems[0].offset).toBe(0);
  });

  test('should handle empty items', () => {
    const items = [];
    const itemHeight = 50;
    
    const { result } = renderHook(() => 
      useVirtualScrolling(items, itemHeight, containerRef)
    );
    
    expect(result.current.visibleItems).toHaveLength(0);
    expect(result.current.totalHeight).toBe(0);
    expect(result.current.visibleRange).toEqual({ start: 0, end: 0 });
  });

  test('should scroll to specific item', () => {
    const items = new Array(100).fill(null).map((_, i) => ({ id: i }));
    const itemHeight = 50;
    
    const scrollToItem = jest.fn();
    containerRef.current = { ...container, scrollToItem };
    
    const { result } = renderHook(() => 
      useVirtualScrolling(items, itemHeight, containerRef)
    );
    
    act(() => {
      result.current.scrollToItem(10);
    });
    
    // Should update scroll position
    expect(result.current.scrollPosition).toBe(500); // 10 * 50
  });

  test('should check if item is visible', () => {
    const items = new Array(100).fill(null).map((_, i) => ({ id: i }));
    const itemHeight = 50;
    
    const { result } = renderHook(() => 
      useVirtualScrolling(items, itemHeight, containerRef)
    );
    
    // Items 0-13 should be visible initially
    expect(result.current.isItemVisible(5)).toBe(true);
    expect(result.current.isItemVisible(20)).toBe(false);
  });

  test('should handle container resize', () => {
    const items = new Array(100).fill(null).map((_, i) => ({ id: i }));
    const itemHeight = 50;
    
    const { result } = renderHook(() => 
      useVirtualScrolling(items, itemHeight, containerRef)
    );
    
    // Simulate container resize
    act(() => {
      container.clientHeight = 800; // Double the height
      // In a real scenario, ResizeObserver would trigger this
      result.current.updateVisibleRange();
    });
    
    // Should show more items
    expect(result.current.visibleRange.end).toBeGreaterThan(13);
  });
});