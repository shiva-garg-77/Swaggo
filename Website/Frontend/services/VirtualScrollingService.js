/**
 * Virtual Scrolling Service
 * Optimizes rendering of large lists by only rendering visible items
 */

class VirtualScrollingService {
  constructor() {
    this.itemHeight = 0; // Will be calculated dynamically
    this.viewportHeight = 0;
    this.buffer = 5; // Number of items to render outside viewport for smooth scrolling
    this.scrollPosition = 0;
    this.items = [];
    this.visibleRange = { start: 0, end: 0 };
  }

  /**
   * Initialize virtual scrolling with container and items
   */
  initialize(container, items, itemHeight = null) {
    this.container = container;
    this.items = items || [];
    
    // Calculate item height if not provided
    if (itemHeight) {
      this.itemHeight = itemHeight;
    } else {
      this.calculateItemHeight();
    }
    
    // Get viewport height
    this.viewportHeight = container.clientHeight;
    
    // Set up scroll listener
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
    
    // Calculate initial visible range
    this.calculateVisibleRange();
  }

  /**
   * Calculate average item height from sample items
   */
  calculateItemHeight() {
    if (this.items.length === 0) return;
    
    // Sample first few items to estimate height
    const sampleSize = Math.min(5, this.items.length);
    let totalHeight = 0;
    let sampleCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const item = this.items[i];
      const element = this.renderItem(item, i);
      if (element) {
        totalHeight += element.offsetHeight;
        sampleCount++;
        // Clean up temporary element
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }
    }
    
    this.itemHeight = sampleCount > 0 ? Math.ceil(totalHeight / sampleCount) : 60;
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    this.scrollPosition = this.container.scrollTop;
    this.calculateVisibleRange();
  }

  /**
   * Calculate visible range of items
   */
  calculateVisibleRange() {
    if (this.itemHeight <= 0 || this.items.length === 0) return;
    
    const startIndex = Math.max(0, Math.floor(this.scrollPosition / this.itemHeight) - this.buffer);
    const endIndex = Math.min(
      this.items.length - 1,
      Math.floor((this.scrollPosition + this.viewportHeight) / this.itemHeight) + this.buffer
    );
    
    this.visibleRange = { start: startIndex, end: endIndex };
  }

  /**
   * Get visible items for rendering
   */
  getVisibleItems() {
    if (!this.items || this.items.length === 0) return [];
    
    const { start, end } = this.visibleRange;
    return this.items.slice(start, end + 1).map((item, index) => ({
      item,
      index: start + index,
      offset: (start + index) * this.itemHeight
    }));
  }

  /**
   * Get total scroll height for container
   */
  getTotalHeight() {
    return this.items.length * this.itemHeight;
  }

  /**
   * Update items and recalculate
   */
  updateItems(newItems) {
    this.items = newItems || [];
    this.calculateVisibleRange();
  }

  /**
   * Update viewport height
   */
  updateViewportHeight() {
    if (this.container) {
      this.viewportHeight = this.container.clientHeight;
      this.calculateVisibleRange();
    }
  }

  /**
   * Render a single item (to be overridden by implementation)
   */
  renderItem(item, index) {
    // This should be implemented by the consumer
    const element = document.createElement('div');
    element.textContent = `Item ${index}: ${JSON.stringify(item)}`;
    return element;
  }

  /**
   * Scroll to specific item
   */
  scrollToItem(index) {
    if (this.container && this.itemHeight > 0) {
      const scrollTop = index * this.itemHeight;
      this.container.scrollTop = scrollTop;
      this.scrollPosition = scrollTop;
      this.calculateVisibleRange();
    }
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    if (this.container) {
      this.container.scrollTop = this.container.scrollHeight;
      this.scrollPosition = this.container.scrollHeight;
      this.calculateVisibleRange();
    }
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    if (this.container) {
      this.container.removeEventListener('scroll', this.handleScroll);
    }
  }

  /**
   * Get current scroll position
   */
  getScrollPosition() {
    return this.scrollPosition;
  }

  /**
   * Get visible range
   */
  getVisibleRange() {
    return { ...this.visibleRange };
  }

  /**
   * Check if item is visible
   */
  isItemVisible(index) {
    const { start, end } = this.visibleRange;
    return index >= start && index <= end;
  }
}

export default VirtualScrollingService;