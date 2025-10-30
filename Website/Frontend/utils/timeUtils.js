/**
 * TIME UTILITIES
 * Comprehensive time formatting and relative time functions
 */

import { useState, useEffect } from 'react';

/**
 * Get relative time string (e.g., "2h ago", "just now")
 * @param {Date|string|number} date - The date to format
 * @param {boolean} short - Use short format (2h vs 2 hours ago)
 * @returns {string} Relative time string
 */
export function getRelativeTime(date, short = false) {
  if (!date) return '';
  
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);
  
  if (seconds < 0) return 'just now';
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    
    if (interval >= 1) {
      if (short) {
        const shortUnits = {
          year: 'y',
          month: 'mo',
          week: 'w',
          day: 'd',
          hour: 'h',
          minute: 'm',
          second: 's'
        };
        return `${interval}${shortUnits[unit]}`;
      }
      
      return interval === 1
        ? `1 ${unit} ago`
        : `${interval} ${unit}s ago`;
    }
  }
  
  return 'just now';
}

/**
 * Format date for display
 * @param {Date|string|number} date
 * @param {string} format - 'short', 'long', 'time', 'date'
 * @returns {string}
 */
export function formatDate(date, format = 'short') {
  if (!date) return '';
  
  const d = new Date(date);
  
  const options = {
    short: { month: 'short', day: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    date: { year: 'numeric', month: '2-digit', day: '2-digit' }
  };
  
  return d.toLocaleDateString('en-US', options[format] || options.short);
}

/**
 * Hook to update relative time dynamically
 * @param {Date|string|number} date
 * @param {number} updateInterval - Update interval in ms (default 60000 = 1 minute)
 * @returns {string} Relative time that updates automatically
 */
export function useRelativeTime(date, updateInterval = 60000) {
  const [relativeTime, setRelativeTime] = useState(() => getRelativeTime(date));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTime(getRelativeTime(date));
    }, updateInterval);
    
    return () => clearInterval(timer);
  }, [date, updateInterval]);
  
  return relativeTime;
}

/**
 * Check if date is today
 */
export function isToday(date) {
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date);
  return d.getDate() === yesterday.getDate() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getFullYear() === yesterday.getFullYear();
}

/**
 * Group items by date (today, yesterday, this week, etc.)
 */
export function groupByDate(items, dateKey = 'createdAt') {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: []
  };
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  items.forEach(item => {
    const date = new Date(item[dateKey]);
    
    if (isToday(date)) {
      groups.today.push(item);
    } else if (isYesterday(date)) {
      groups.yesterday.push(item);
    } else if (date > weekAgo) {
      groups.thisWeek.push(item);
    } else if (date > monthAgo) {
      groups.thisMonth.push(item);
    } else {
      groups.older.push(item);
    }
  });
  
  return groups;
}
