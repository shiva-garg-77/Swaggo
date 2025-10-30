'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, UserPlus, AtSign, Eye, Share2, Trash2 } from 'lucide-react';
import { MARK_NOTIFICATION_AS_READ, DELETE_NOTIFICATION } from '../../../lib/graphql/notificationQueries';
import { useNotificationStore } from '../../../store/notificationStore';
import toast from 'react-hot-toast';

/**
 * Notification Item Component
 * Reusable notification card with different layouts per type
 */
export default function NotificationItem({ notification, theme = 'light' }) {
  const router = useRouter();
  const { markAsRead, removeNotification } = useNotificationStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const [markAsReadMutation] = useMutation(MARK_NOTIFICATION_AS_READ);
  const [deleteNotificationMutation] = useMutation(DELETE_NOTIFICATION);

  const isDark = theme === 'dark';

  // Get notification icon
  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
      case 'follow_request':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      case 'story_view':
        return <Eye className="w-5 h-5 text-orange-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-teal-500" />;
      default:
        return <Heart className="w-5 h-5 text-gray-500" />;
    }
  };

  // Handle click
  const handleClick = async () => {
    // Mark as read
    if (!notification.isread) {
      try {
        await markAsReadMutation({ 
          variables: { notificationid: notification.notificationid } 
        });
        markAsRead(notification.notificationid);
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // Navigate based on type
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'mention':
        if (notification.relatedid) {
          router.push(`/post/${notification.relatedid}`);
        }
        break;
      case 'follow':
      case 'follow_request':
        if (notification.senderid) {
          router.push(`/profile?user=${notification.senderid}`);
        }
        break;
      case 'story_view':
        router.push('/stories');
        break;
      default:
        break;
    }
  };

  // Handle delete
  const handleDelete = async (e) => {
    e.stopPropagation();
    
    setIsDeleting(true);
    try {
      await deleteNotificationMutation({ 
        variables: { notificationid: notification.notificationid } 
      });
      removeNotification(notification.notificationid);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    } finally {
      setIsDeleting(false);
    }
  };

  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div
      className={`
        relative border-b cursor-pointer transition-all duration-200
        ${!notification.isread
          ? isDark
            ? 'bg-blue-900/20 border-gray-700'
            : 'bg-blue-50 border-gray-200'
          : isDark
          ? 'hover:bg-gray-750 border-gray-700'
          : 'hover:bg-gray-50 border-gray-200'
        }
        ${isDeleting ? 'opacity-50' : ''}
      `}
    >
      {/* Make entire item clickable (Issue 7.4) */}
      <div onClick={handleClick} className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {notification.content}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {timeAgo}
            </p>
          </div>

          {/* Unread indicator & Delete button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!notification.isread && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`
                p-1.5 rounded-lg transition-colors
                ${isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400'
                  : 'hover:bg-gray-200 text-gray-500 hover:text-red-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title="Delete notification"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function (Issue 7.9 - More accurate timing)
function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  // More precise intervals
  if (diffInSeconds < 10) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}
