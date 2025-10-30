'use client';

import { Clock, Edit, Trash2, Send, AlertCircle } from 'lucide-react';

export default function ScheduledMessageItem({ message, onEdit, onDelete, onSendNow, theme = 'light' }) {
  const isDark = theme === 'dark';
  const scheduledDate = new Date(message.scheduledFor);
  const now = new Date();
  const isPast = scheduledDate <= now;
  const timeUntil = scheduledDate - now;
  const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
  const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

  const statusColors = {
    pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    sent: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    failed: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    cancelled: 'text-gray-600 bg-gray-100 dark:bg-gray-700'
  };

  return (
    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {message.content}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[message.status]}`}>
          {message.status}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <Clock className="w-4 h-4" />
            {scheduledDate.toLocaleString()}
          </span>
          {message.status === 'pending' && !isPast && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              in {hoursUntil}h {minutesUntil}m
            </span>
          )}
          {message.status === 'failed' && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {message.failureReason}
            </span>
          )}
        </div>
        {message.status === 'pending' && (
          <div className="flex items-center gap-2">
            <button onClick={() => onSendNow(message)} className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded" title="Send now">
              <Send className="w-4 h-4 text-green-600" />
            </button>
            <button onClick={() => onEdit(message)} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded" title="Edit">
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
            <button onClick={() => onDelete(message)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded" title="Delete">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
