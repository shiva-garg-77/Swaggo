'use client';

import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle, RefreshCw, Send, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Message Status System - WhatsApp-like message status indicators
 * 
 * Status Flow:
 * sending (⏰) → sent (✓) → delivered (✓✓) → read (✓✓ blue)
 * failed (⚠️) → retry option
 */

export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent', 
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  PENDING: 'pending' // for offline messages
};

/**
 * MessageStatusIcon - Individual status icon component
 */
export const MessageStatusIcon = ({ 
  status, 
  isOwn = true, 
  onRetry = null,
  size = 'sm',
  showTooltip = true,
  animate = true 
}) => {
  if (!isOwn) return null;

  const iconSize = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getStatusConfig = () => {
    switch (status) {
      case MESSAGE_STATUS.SENDING:
        return {
          icon: Clock,
          className: `${iconSize[size]} text-gray-400`,
          tooltip: 'Sending...',
          animate: true
        };
      
      case MESSAGE_STATUS.PENDING:
        return {
          icon: WifiOff,
          className: `${iconSize[size]} text-orange-400`,
          tooltip: 'Waiting for connection',
          animate: true
        };
        
      case MESSAGE_STATUS.SENT:
        return {
          icon: Check,
          className: `${iconSize[size]} text-gray-400`,
          tooltip: 'Sent'
        };
        
      case MESSAGE_STATUS.DELIVERED:
        return {
          icon: CheckCheck,
          className: `${iconSize[size]} text-gray-400`,
          tooltip: 'Delivered'
        };
        
      case MESSAGE_STATUS.READ:
        return {
          icon: CheckCheck,
          className: `${iconSize[size]} text-blue-500`,
          tooltip: 'Read'
        };
        
      case MESSAGE_STATUS.FAILED:
        return {
          icon: AlertCircle,
          className: `${iconSize[size]} text-red-500 cursor-pointer hover:text-red-700`,
          tooltip: 'Failed to send. Click to retry',
          onClick: onRetry
        };
        
      default:
        return {
          icon: Clock,
          className: `${iconSize[size]} text-gray-400`,
          tooltip: 'Unknown status'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const iconElement = (
    <IconComponent 
      className={config.className}
      onClick={config.onClick}
    />
  );

  // Add animations for certain statuses
  if (animate && config.animate) {
    return (
      <motion.div
        initial={status === MESSAGE_STATUS.SENDING ? { rotate: 0 } : { scale: 0 }}
        animate={
          status === MESSAGE_STATUS.SENDING 
            ? { rotate: 360 } 
            : { scale: 1 }
        }
        transition={
          status === MESSAGE_STATUS.SENDING
            ? { duration: 2, repeat: Infinity, ease: "linear" }
            : { duration: 0.3, ease: "backOut" }
        }
        title={showTooltip ? config.tooltip : undefined}
      >
        {iconElement}
      </motion.div>
    );
  }

  return (
    <div title={showTooltip ? config.tooltip : undefined}>
      {iconElement}
    </div>
  );
};

/**
 * MessageRetryButton - Retry button for failed messages
 */
export const MessageRetryButton = ({ 
  onRetry, 
  isLoading = false,
  className = "" 
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onRetry}
      disabled={isLoading}
      className={`
        inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
        bg-red-50 text-red-600 border border-red-200
        hover:bg-red-100 hover:border-red-300
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
      title="Click to retry sending"
    >
      <RefreshCw 
        className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} 
      />
      <span>Retry</span>
    </motion.button>
  );
};

/**
 * MessageStatusBadge - Comprehensive status badge with text
 */
export const MessageStatusBadge = ({ 
  status, 
  timestamp = null,
  deliveredTo = [],
  readBy = [],
  totalRecipients = 1,
  isGroupChat = false,
  showDetails = false 
}) => {
  const getStatusText = () => {
    switch (status) {
      case MESSAGE_STATUS.SENDING:
        return 'Sending...';
      case MESSAGE_STATUS.PENDING:
        return 'Pending';
      case MESSAGE_STATUS.SENT:
        return 'Sent';
      case MESSAGE_STATUS.DELIVERED:
        if (isGroupChat) {
          return `Delivered to ${deliveredTo.length}/${totalRecipients}`;
        }
        return 'Delivered';
      case MESSAGE_STATUS.READ:
        if (isGroupChat) {
          return `Read by ${readBy.length}/${totalRecipients}`;
        }
        return 'Read';
      case MESSAGE_STATUS.FAILED:
        return 'Failed to send';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case MESSAGE_STATUS.SENDING:
      case MESSAGE_STATUS.PENDING:
        return 'text-orange-500';
      case MESSAGE_STATUS.SENT:
      case MESSAGE_STATUS.DELIVERED:
        return 'text-gray-500';
      case MESSAGE_STATUS.READ:
        return 'text-blue-500';
      case MESSAGE_STATUS.FAILED:
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`flex items-center space-x-1 text-xs ${getStatusColor()}`}>
      <MessageStatusIcon 
        status={status} 
        size="xs" 
        showTooltip={false}
        animate={false}
      />
      <span>{getStatusText()}</span>
      {timestamp && (
        <span className="text-gray-400">
          • {new Date(timestamp).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

/**
 * BulkMessageStatus - Status for multiple messages
 */
export const BulkMessageStatus = ({ 
  messages = [], 
  isVisible = true 
}) => {
  if (!isVisible || messages.length === 0) return null;

  const statusCounts = messages.reduce((acc, msg) => {
    acc[msg.status] = (acc[msg.status] || 0) + 1;
    return acc;
  }, {});

  const totalMessages = messages.length;
  const sentCount = statusCounts[MESSAGE_STATUS.SENT] || 0;
  const deliveredCount = statusCounts[MESSAGE_STATUS.DELIVERED] || 0;
  const readCount = statusCounts[MESSAGE_STATUS.READ] || 0;
  const failedCount = statusCounts[MESSAGE_STATUS.FAILED] || 0;
  const sendingCount = statusCounts[MESSAGE_STATUS.SENDING] || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 
                 bg-white dark:bg-gray-800 rounded-lg shadow-lg border 
                 border-gray-200 dark:border-gray-600 p-3 min-w-64"
    >
      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        Message Status ({totalMessages} messages)
      </div>
      
      <div className="space-y-1">
        {sendingCount > 0 && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-gray-400 animate-pulse" />
              <span>Sending</span>
            </div>
            <span className="font-medium">{sendingCount}</span>
          </div>
        )}
        
        {sentCount > 0 && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Check className="w-3 h-3 text-gray-400" />
              <span>Sent</span>
            </div>
            <span className="font-medium">{sentCount}</span>
          </div>
        )}
        
        {deliveredCount > 0 && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <CheckCheck className="w-3 h-3 text-gray-400" />
              <span>Delivered</span>
            </div>
            <span className="font-medium">{deliveredCount}</span>
          </div>
        )}
        
        {readCount > 0 && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <CheckCheck className="w-3 h-3 text-blue-500" />
              <span>Read</span>
            </div>
            <span className="font-medium">{readCount}</span>
          </div>
        )}
        
        {failedCount > 0 && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span>Failed</span>
            </div>
            <span className="font-medium text-red-500">{failedCount}</span>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
        <div 
          className="bg-gradient-to-r from-green-400 to-blue-500 h-1 rounded-full transition-all duration-300"
          style={{ 
            width: `${((deliveredCount + readCount) / totalMessages) * 100}%` 
          }}
        />
      </div>
    </motion.div>
  );
};

/**
 * OfflineIndicator - Shows when messages are queued for offline sending
 */
export const OfflineIndicator = ({ 
  queuedCount = 0, 
  isOnline = true,
  onRetryAll = null 
}) => {
  if (isOnline && queuedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50
                 bg-orange-100 border border-orange-300 text-orange-800 
                 px-4 py-2 rounded-lg shadow-lg"
    >
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">
          {!isOnline ? 
            `Offline - ${queuedCount} messages queued` : 
            `${queuedCount} messages pending`
          }
        </span>
        {onRetryAll && isOnline && queuedCount > 0 && (
          <button
            onClick={onRetryAll}
            className="ml-2 px-2 py-1 bg-orange-200 hover:bg-orange-300 
                     rounded text-xs font-medium transition-colors"
          >
            Retry All
          </button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * MessageStatusManager - Hook for managing message status
 */
export const useMessageStatus = () => {
  const updateMessageStatus = (messageId, newStatus, additionalData = {}) => {
    // This would typically dispatch to a Redux store or update React state
    console.log('Updating message status:', { messageId, newStatus, additionalData });
    
    // Emit status update event for other components to listen
    window.dispatchEvent(new CustomEvent('messageStatusUpdate', {
      detail: { messageId, status: newStatus, ...additionalData }
    }));
  };

  const retryMessage = async (messageId, messageData) => {
    try {
      updateMessageStatus(messageId, MESSAGE_STATUS.SENDING);
      
      // Attempt to resend message
      // This would call your socket.emit or API endpoint
      
      updateMessageStatus(messageId, MESSAGE_STATUS.SENT);
      
    } catch (error) {
      console.error('Failed to retry message:', error);
      updateMessageStatus(messageId, MESSAGE_STATUS.FAILED);
    }
  };

  const markAsDelivered = (messageId, deliveredTo) => {
    updateMessageStatus(messageId, MESSAGE_STATUS.DELIVERED, { deliveredTo });
  };

  const markAsRead = (messageId, readBy) => {
    updateMessageStatus(messageId, MESSAGE_STATUS.READ, { readBy });
  };

  return {
    updateMessageStatus,
    retryMessage,
    markAsDelivered,
    markAsRead,
    MESSAGE_STATUS
  };
};

/**
 * Utility functions for message status
 */
export const MessageStatusUtils = {
  /**
   * Get the overall status for a message in group chat
   */
  getGroupMessageStatus: (deliveredTo = [], readBy = [], totalRecipients = 1) => {
    if (readBy.length === totalRecipients) {
      return MESSAGE_STATUS.READ;
    } else if (readBy.length > 0) {
      return MESSAGE_STATUS.READ; // Partially read
    } else if (deliveredTo.length === totalRecipients) {
      return MESSAGE_STATUS.DELIVERED;
    } else if (deliveredTo.length > 0) {
      return MESSAGE_STATUS.DELIVERED; // Partially delivered
    } else {
      return MESSAGE_STATUS.SENT;
    }
  },

  /**
   * Check if message needs retry
   */
  needsRetry: (status) => {
    return status === MESSAGE_STATUS.FAILED;
  },

  /**
   * Check if message is pending (offline/sending)
   */
  isPending: (status) => {
    return [MESSAGE_STATUS.SENDING, MESSAGE_STATUS.PENDING].includes(status);
  },

  /**
   * Get status priority for sorting
   */
  getStatusPriority: (status) => {
    const priorities = {
      [MESSAGE_STATUS.FAILED]: 1,
      [MESSAGE_STATUS.SENDING]: 2,
      [MESSAGE_STATUS.PENDING]: 3,
      [MESSAGE_STATUS.SENT]: 4,
      [MESSAGE_STATUS.DELIVERED]: 5,
      [MESSAGE_STATUS.READ]: 6
    };
    return priorities[status] || 0;
  },

  /**
   * Format status for display
   */
  formatStatus: (status, isGroupChat = false, deliveredCount = 0, readCount = 0, totalRecipients = 1) => {
    if (!isGroupChat) {
      const statusLabels = {
        [MESSAGE_STATUS.SENDING]: 'Sending...',
        [MESSAGE_STATUS.PENDING]: 'Pending',
        [MESSAGE_STATUS.SENT]: 'Sent',
        [MESSAGE_STATUS.DELIVERED]: 'Delivered',
        [MESSAGE_STATUS.READ]: 'Read',
        [MESSAGE_STATUS.FAILED]: 'Failed'
      };
      return statusLabels[status] || 'Unknown';
    }

    // Group chat formatting
    switch (status) {
      case MESSAGE_STATUS.DELIVERED:
        return `Delivered to ${deliveredCount}/${totalRecipients}`;
      case MESSAGE_STATUS.READ:
        return `Read by ${readCount}/${totalRecipients}`;
      default:
        return MessageStatusUtils.formatStatus(status, false);
    }
  }
};

export default {
  MessageStatusIcon,
  MessageRetryButton, 
  MessageStatusBadge,
  BulkMessageStatus,
  OfflineIndicator,
  useMessageStatus,
  MessageStatusUtils,
  MESSAGE_STATUS
};