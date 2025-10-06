'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { 
  GET_NOTIFICATIONS, 
  GET_UNREAD_NOTIFICATION_COUNT, 
  MARK_ALL_NOTIFICATIONS_AS_READ 
} from '../../../lib/graphql/queries';
import FollowRequestNotification from './FollowRequestNotification';
import { Bell, X, CheckCircle } from 'lucide-react';
import notificationService from '../../../services/UnifiedNotificationService.js';

export default function NotificationCenter({ 
  user, 
  isOpen, 
  onClose, 
  theme = 'light' 
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  
  // Query notifications
  const { data: notificationsData, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { 
      profileid: user?.profileid, 
      limit: 50, 
      offset: 0 
    },
    skip: !user?.profileid || !isOpen,
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      setNotifications(data?.getNotifications || []);
    }
  });

  // Query unread count
  const { data: unreadCountData } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    pollInterval: 30000 // Poll every 30 seconds
  });

  // Mark all as read mutation
  const [markAllAsReadMutation] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ, {
    onCompleted: () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      notificationService.showToast('success', 'All notifications marked as read');
      refetch();
    }
  });

  // Auto-refresh notifications
  useEffect(() => {
    if (isOpen && user?.profileid) {
      const interval = setInterval(() => {
        refetch();
      }, 10000); // Refresh every 10 seconds when open

      return () => clearInterval(interval);
    }
  }, [isOpen, user?.profileid, refetch]);

  const handleMarkAllAsRead = async () => {
    if (!user?.profileid) return;
    
    try {
      await markAllAsReadMutation({
        variables: { profileid: user.profileid }
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      notificationService.showToast('error', 'Failed to mark all as read');
    }
  };

  const handleAcceptFollow = (notification) => {
    // Update the local notification state
    setNotifications(prev => 
      prev.map(n => 
        n.notificationid === notification.notificationid 
          ? { ...n, isActioned: true, isRead: true }
          : n
      )
    );
    refetch();
  };

  const handleRejectFollow = (notification) => {
    // Remove the notification from the list
    setNotifications(prev => 
      prev.filter(n => n.notificationid !== notification.notificationid)
    );
    refetch();
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'requests':
        return notification.type === 'follow_request';
      case 'activity':
        return ['like', 'comment', 'mention', 'new_follower'].includes(notification.type);
      case 'social':
        return ['follow_request_accepted', 'follow_back_suggestion'].includes(notification.type);
      default:
        return true;
    }
  });

  const unreadCount = unreadCountData?.getUnreadNotificationCount || 0;
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Bell className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } flex items-center gap-1`}
              >
                <CheckCircle className="w-4 h-4" />
                Mark all read
              </button>
            )}
            
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'requests', label: 'Requests' },
              { id: 'activity', label: 'Activity' },
              { id: 'social', label: 'Social' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-700'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className={`text-lg mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Error loading notifications
              </p>
              <button
                onClick={() => refetch()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No notifications yet
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                You'll see notifications here when people interact with you
              </p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map(notification => {
                // Render different notification types
                switch (notification.type) {
                  case 'follow_request':
                    return (
                      <FollowRequestNotification
                        key={notification.notificationid}
                        notification={notification}
                        onAccept={handleAcceptFollow}
                        onReject={handleRejectFollow}
                        theme={theme}
                      />
                    );
                  
                  default:
                    return (
                      <GenericNotification
                        key={notification.notificationid}
                        notification={notification}
                        theme={theme}
                      />
                    );
                }
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center`}>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Notifications are updated in real-time
          </p>
        </div>
      </div>
    </div>
  );
}

// Generic notification component for other notification types
function GenericNotification({ notification, theme = 'light' }) {
  const isDark = theme === 'dark';
  const timeAgo = getTimeAgo(notification.createdAt);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'mention':
        return '@';
      case 'new_follower':
        return '👥';
      case 'follow_request_accepted':
        return '✅';
      case 'follow_back_suggestion':
        return '🔄';
      default:
        return '🔔';
    }
  };

  const handleClick = () => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div 
      className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} 
                  ${!notification.isRead ? (isDark ? 'bg-gray-750' : 'bg-blue-50') : ''} 
                  hover:${isDark ? 'bg-gray-750' : 'bg-gray-50'} transition-colors duration-200
                  ${notification.actionUrl ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon or Profile Picture */}
        <div className="flex-shrink-0">
          {notification.sender?.profilePic ? (
            <img
              src={notification.sender.profilePic}
              alt={notification.sender.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg">
              {getNotificationIcon(notification.type)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {notification.title}
            </h3>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
          </div>
          
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
            {notification.message}
          </p>
          
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {timeAgo}
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to format time ago
function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}
