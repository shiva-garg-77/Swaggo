'use client';

import React, { useRef, useCallback, memo } from 'react';
import useVirtualScrolling from '../../../hooks/useVirtualScrolling';
import MessageBubble from '../Messaging/MessageBubble';

/**
 * Virtual Message List Component
 * Renders chat messages with virtual scrolling for performance optimization
 * 🔧 PERFORMANCE FIX #35: Enhanced virtual scrolling implementation
 */

// Memoized Message Item component to prevent unnecessary re-renders
const MessageItem = memo(({ 
  message, 
  index, 
  offset, 
  itemHeight,
  user,
  chat,
  onReply,
  onEdit,
  onDelete,
  onRetryMessage,
  selectedMessages,
  isMultiSelectMode,
  onSelectionToggle
}) => {
  if (!message) return null;

  return (
    <div
      key={message.messageid || `temp-${index}`}
      id={`message-${message.messageid}`}
      style={{
        position: 'absolute',
        top: `${offset}px`,
        left: 0,
        right: 0,
        height: `${itemHeight}px`
      }}
      className="px-4"
    >
      <MessageBubble
        message={message}
        isOwn={message.senderid === user?.profileid}
        showAvatar={true} // Always show avatar in virtual list
        chat={chat}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onRetryMessage={onRetryMessage}
        isSelected={selectedMessages.includes(message.messageid)}
        isMultiSelectMode={isMultiSelectMode}
        onSelectToggle={() => onSelectionToggle && onSelectionToggle(message.messageid)}
      />
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

const VirtualMessageList = ({ 
  messages = [], 
  user, 
  chat, 
  onReply, 
  onEdit, 
  onDelete, 
  onRetryMessage,
  selectedMessages = [],
  isMultiSelectMode = false,
  onSelectionToggle,
  itemHeight = 80, // Approximate height of a message bubble
  buffer = 10,
  onScroll,
  isLoadingMore = false,
  hasMoreMessages = false,
  onLoadMore
}) => {
  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Use virtual scrolling hook with optimized parameters
  const {
    visibleItems,
    totalHeight,
    scrollToBottom,
    updateVisibleRange
  } = useVirtualScrolling(messages, itemHeight, containerRef, {
    buffer,
    overscan: 5, // Increased overscan for smoother scrolling
    onScroll,
    onRangeChange: (range) => {
      // Load more messages when scrolling near the top with debouncing
      if (range.start < 10 && hasMoreMessages && onLoadMore) {
        // Debounce load more calls
        const loadMoreTimer = setTimeout(() => {
          onLoadMore();
        }, 100);
        return () => clearTimeout(loadMoreTimer);
      }
    }
  });

  // Render a single message using memoized component
  const renderMessage = useCallback(({ item: message, index, offset }) => {
    return (
      <MessageItem
        key={message.messageid || `temp-${index}`}
        message={message}
        index={index}
        offset={offset}
        itemHeight={itemHeight}
        user={user}
        chat={chat}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onRetryMessage={onRetryMessage}
        selectedMessages={selectedMessages}
        isMultiSelectMode={isMultiSelectMode}
        onSelectionToggle={onSelectionToggle}
      />
    );
  }, [user, chat, onReply, onEdit, onDelete, onRetryMessage, selectedMessages, isMultiSelectMode, onSelectionToggle, itemHeight]);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (messages.length > 0) {
      // Scroll to bottom after a short delay to ensure DOM is updated
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50); // Reduced delay for better responsiveness
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);

  // Update visible range when messages change
  React.useEffect(() => {
    updateVisibleRange();
  }, [messages, updateVisibleRange]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto relative bg-gray-50 dark:bg-gray-800"
      // Add momentum scrolling for better mobile experience
      style={{ 
        height: '100%',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Total height spacer */}
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {/* Loading indicator at top */}
        {isLoadingMore && hasMoreMessages && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '10px', 
              left: 0, 
              right: 0, 
              display: 'flex', 
              justifyContent: 'center' 
            }}
          >
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-4 py-2 rounded-lg shadow-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm">Loading older messages...</span>
            </div>
          </div>
        )}
        
        {/* Visible messages */}
        {visibleItems.map(renderMessage)}
      </div>
      
      {/* Scroll anchor for new messages */}
      <div ref={messagesEndRef} style={{ height: '1px' }} />
    </div>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export default memo(VirtualMessageList);