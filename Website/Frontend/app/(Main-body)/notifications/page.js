'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import { useNotificationStore } from '../../../store/notificationStore';
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATION_COUNT,
  MARK_ALL_NOTIFICATIONS_AS_READ
} from '../../../lib/graphql/notificationQueries';
import NotificationItem from '../../../Components/MainComponents/Notification/NotificationItem';
import { Bell, CheckCircle, RefreshCw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Notifications Page
 * Full page notification center with infinite scroll
 */
export default function NotificationsPage() {
  const { user, loading: authLoading } = useFixedSecureAuth();
  const router = useRouter();
  const observerTarget = useRef(null);
  
  const {
    notifications,
    unreadCount,
    filter,
    hasMore,
    isLoading,
    offset,
    limit,
    setNotifications,
    addNotifications,
    setUnreadCount,
    setFilter,
    setHasMore,
    setLoading,
    markAllAsRead,
    markFetched
  } = useNotificationStore();

  // Fetch notifications
  const { data, loading, refetch, fetchMore } = useQuery(GET_NOTIFICATIONS, {
    variables: { 
      profileid: user?.profileid, 
      limit,
      offset: 0
    },
    skip: !user?.profileid,
    onCompleted: (data) => {
      setNotifications(data?.getNotifications || []);
      setHasMore((data?.getNotifications?.length || 0) >= limit);
      markFetched();
    },
    errorPolicy: 'all'
  });

  // Fetch unread count
  const { data: countData } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    pollInterval: 30000,
    onCompleted: (data) => {
      setUnreadCount(data?.getUnreadNotificationCount || 0);
    }
  });

  // Mark all as read mutation
  const [markAllAsReadMutation] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, offset]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    try {
      const { data } = await fetchMore({
        variables: {
          offset: notifications.length,
          limit
        }
      });

      const newNotifications = data?.getNotifications || [];
      addNotifications(newNotifications);
      setHasMore(newNotifications.length >= limit);
    } catch (error) {
      console.error('Error loading more notifications:', error);
      toast.error('Failed to load more notifications');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, notifications.length, limit, fetchMore, addNotifications, setHasMore, setLoading]);

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation({ 
        variables: { profileid: user.profileid } 
      });
      markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Notifications refreshed');
    } catch (error) {
      toast.error('Failed to refresh');
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'mentions':
        return notification.type === 'mention';
      case 'likes':
        return notification.type === 'like';
      case 'comments':
        return notification.type === 'comment';
      case 'follows':
        return notification.type === 'follow' || notification.type === 'follow_request';
      default:
        return true;
    }
  });

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 
                       rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                         transition-colors flex items-center gap-2 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'mentions', 'likes', 'comments', 'follows'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all'
                ? "You're all caught up!"
                : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.notificationid}
                notification={notification}
                theme="light"
              />
            ))}
            
            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerTarget} className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}
            
            {!hasMore && filteredNotifications.length > 0 && (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No more notifications
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
