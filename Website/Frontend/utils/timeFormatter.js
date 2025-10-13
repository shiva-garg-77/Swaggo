/**
 * Standardized time formatting utility for consistent time display across the application
 */

/**
 * Format a timestamp into a human-readable string
 * @param {string|Date} timestamp - The timestamp to format
 * @param {Object} options - Formatting options
 * @param {string} options.timezone - Timezone to use for formatting (default: user's local timezone)
 * @param {boolean} options.useLocaleDate - Whether to use locale date format for older dates (default: true)
 * @returns {string} Formatted time string
 */
export const formatMessageTime = (timestamp, options = {}) => {
  // Handle null/undefined gracefully
  if (!timestamp) {
    return '';
  }

  // Ensure we have a valid Date object
  const messageTime = new Date(timestamp);
  
  // Check if the date is valid
  if (isNaN(messageTime.getTime())) {
    console.warn('Invalid timestamp provided to formatMessageTime:', timestamp);
    return '';
  }

  const now = new Date();
  const diffInMs = now - messageTime;
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // Use consistent timezone handling
  const timezone = options.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  try {
    // Within the last minute
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return minutes < 1 ? 'now' : `${minutes}m`;
    }
    
    // Within the last 24 hours
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    }
    
    // Within the last 7 days
    if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d`;
    }
    
    // Older than 7 days - use locale date format if requested
    if (options.useLocaleDate !== false) {
      return messageTime.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Fallback to ISO date format
    return messageTime.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting time:', error);
    // Fallback to simple date string
    return messageTime.toISOString().split('T')[0];
  }
};

/**
 * Format a timestamp into a detailed time string (for message bubbles, tooltips, etc.)
 * @param {string|Date} timestamp - The timestamp to format
 * @param {Object} options - Formatting options
 * @returns {string} Detailed formatted time string
 */
export const formatDetailedTime = (timestamp, options = {}) => {
  if (!timestamp) {
    return '';
  }

  const messageTime = new Date(timestamp);
  
  if (isNaN(messageTime.getTime())) {
    return '';
  }

  const now = new Date();
  const diffInDays = (now - messageTime) / (1000 * 60 * 60 * 24);

  try {
    // Today - show time only
    if (diffInDays < 1) {
      return messageTime.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // This year - show month and day
    if (messageTime.getFullYear() === now.getFullYear()) {
      return messageTime.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Different year - show full date
    return messageTime.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting detailed time:', error);
    return messageTime.toString();
  }
};

/**
 * Ensure image path is absolute and provide fallback
 * @param {string} imagePath - The image path to validate
 * @param {string} fallbackPath - The fallback image path (default: '/default-avatar.png')
 * @returns {string} Valid absolute image path or fallback
 */
export const getValidImageUrl = (imagePath, fallbackPath = '/default-avatar.png') => {
  // Handle null/undefined/empty paths
  if (!imagePath) {
    return fallbackPath;
  }

  // If already an absolute URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's already an absolute path, return as-is
  if (imagePath.startsWith('/')) {
    return imagePath;
  }

  // If it's a relative path, make it absolute
  if (imagePath.startsWith('./') || imagePath.startsWith('../')) {
    // For relative paths, we'll use the fallback since we don't know the base path
    return fallbackPath;
  }

  // For any other case, assume it's a relative path and use fallback
  return fallbackPath;
};

/**
 * Handle image loading errors by providing a fallback
 * @param {Event} event - The error event
 * @param {string} fallbackPath - The fallback image path (default: '/default-avatar.png')
 */
export const handleImageError = (event, fallbackPath = '/default-avatar.png') => {
  if (event && event.target) {
    event.target.src = fallbackPath;
  }
};

export default {
  formatMessageTime,
  formatDetailedTime,
  getValidImageUrl,
  handleImageError
};