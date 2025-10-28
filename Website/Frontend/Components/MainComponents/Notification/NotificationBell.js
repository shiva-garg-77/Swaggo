"use client";

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useTheme } from '../../Helper/ThemeProvider';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATION_COUNT,
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_AS_READ,
  DELETE_NOTIFICATION
} from '../../../lib/graphql/notificationQueries';
import { Bell, Check, Trash2, Heart, MessageCircle, UserPlus, AtSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Notification Bell with dropdown
 * Shows unread count badge and notification list
 */
export default function NotificationBell() {
  const { theme } = useTheme();
  const { user } = useFixedSecureAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Queries
  const { data: countData, refetch: refetchCount } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    pollInterval: 30000, // Refresh every 30 seconds
    errorPolicy: 'all'
  });

  const { data: notificationsData, loading, refetch: refetchNotifications } = useQuery(GET_NOTIFICATIONS, {
    variables: { profileid: user?.profileid, limit: 20, offset: 0 },
    skip: !user?.profileid || !isOpen,
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  });

  // Mutations
  const [markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ);
  const [markAllAsRead] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ);
  const [deleteNotification] = useMutation(DELETE_NOTIFICATION);

  const unreadCount = countData?.getUnreadNotificationCount || 0;
  const notifications = notificationsData?.getNotifications || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationid) => {
    try {
      await markAsRead({ variables: { notificationid } });
      refetchNotifications();
      refetchCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({ variables: { profileid: user.profileid } });
      refetchNotifications();
      refetchCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationid) => {
    try {
      await deleteNotification({ variables: { notificationid } });
      refetchNotifications();
      refetchCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isread) {
      handleMarkAsRead(notification.notificationid);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
        router.push(`/post/${notification.relatedid}`);
        break;
      case 'comment':
        router.push(`/post/${notification.relatedid}`);
        break;
      case 'follow':
        router.push(`/Profile?username=${notification.senderid}`);
        break;
      case 'mention':
        router.push(`/post/${notification.relatedid}`);
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${
          theme === 'dark'
            ? 'hover:bg-gray-700 text-gray-300'
            : 'hover:bg-gray-100 text-gray-600'
        }`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-96 max-h-[600px] overflow-y-auto rounded-lg shadow-2xl border z-50 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`p-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No notifications yet
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.notificationid}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      !notification.isread
                        ? theme === 'dark'
                          ? 'bg-blue-900/20 border-gray-700'
                          : 'bg-blue-50 border-gray-200'
                        : theme === 'dark'
                        ? 'hover:bg-gray-750 border-gray-700'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {notification.content}
                        </p>
                        <p className={`text-xs mt-1 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {!notification.isread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.notificationid);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-blue-500" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.notificationid);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
