'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { useScheduledMessageStore } from '../../../store/scheduledMessageStore';

/**
 * Scheduled Message Indicator
 * Shows count of scheduled messages in message input area
 */
export default function ScheduledMessageIndicator({ chatid, onClick, theme = 'light' }) {
  const { scheduledMessages } = useScheduledMessageStore();
  const [count, setCount] = useState(0);
  const [nextScheduled, setNextScheduled] = useState(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    // Filter scheduled messages for this chat that are pending
    const chatScheduled = scheduledMessages.filter(
      msg => msg.chatid === chatid && msg.status === 'pending'
    );
    
    setCount(chatScheduled.length);

    // Find next scheduled message
    if (chatScheduled.length > 0) {
      const sorted = [...chatScheduled].sort(
        (a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor)
      );
      setNextScheduled(sorted[0]);
    } else {
      setNextScheduled(null);
    }
  }, [scheduledMessages, chatid]);

  if (count === 0) return null;

  const getTimeUntil = (scheduledFor) => {
    const now = new Date();
    const scheduled = new Date(scheduledFor);
    const diff = scheduled - now;

    if (diff < 0) return 'Sending soon...';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `in ${minutes}m`;
    return 'in < 1m';
  };

  return (
    <button
      onClick={onClick}
      className={`relative px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
        isDark 
          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
          : 'bg-blue-50 hover:bg-blue-100 text-blue-900'
      }`}
      title="View scheduled messages"
    >
      <Clock className="w-4 h-4" />
      <div className="flex flex-col items-start">
        <span className="text-xs font-medium">
          {count} Scheduled
        </span>
        {nextScheduled && (
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
            Next {getTimeUntil(nextScheduled.scheduledFor)}
          </span>
        )}
      </div>
      
      {/* Badge */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
