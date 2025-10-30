/**
 * @fileoverview Hook for Notification Socket.IO real-time updates
 * @module hooks/useNotificationSocket
 */

import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import toast from 'react-hot-toast';

/**
 * Hook for handling real-time notification updates via Socket.IO
 * @param {Object} socket - Socket.IO instance
 * @param {Object} user - Current user object
 */
export function useNotificationSocket(socket, user) {
  const { addNotification, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!socket || !user) return;

    // Listen for new notifications
    const handleNotificationReceived = (data) => {
      console.log('Notification received:', data);
      
      // Add to store
      addNotification({
        notificationid: data.notificationId,
        recipientid: user.profileid,
        senderid: data.senderId,
        type: data.type,
        content: data.content || data.message,
        relatedid: data.relatedId,
        relatedtype: data.relatedType,
        isread: false,
        createdAt: new Date().toISOString(),
        sender: data.sender
      });

      // Show toast notification based on type
      const toastConfig = getToastConfig(data.type, data);
      if (toastConfig) {
        toast(toastConfig.message, {
          icon: toastConfig.icon,
          duration: 4000,
          ...toastConfig.options
        });
      }
    };

    // Listen for unread count updates
    const handleUnreadCountUpdate = (data) => {
      console.log('Unread count updated:', data);
      setUnreadCount(data.count);
    };

    // Register event listeners
    socket.on('notification_received', handleNotificationReceived);
    socket.on('unread_count_update', handleUnreadCountUpdate);

    // Cleanup on unmount
    return () => {
      socket.off('notification_received', handleNotificationReceived);
      socket.off('unread_count_update', handleUnreadCountUpdate);
    };
  }, [socket, user, addNotification, setUnreadCount]);
}

/**
 * Get toast configuration based on notification type
 */
function getToastConfig(type, data) {
  const username = data.sender?.username || data.username || 'Someone';

  switch (type) {
    case 'like':
      return {
        message: `${username} liked your post`,
        icon: '❤️',
        options: { style: { background: '#fee2e2', color: '#991b1b' } }
      };
    
    case 'comment':
      return {
        message: `${username} commented on your post`,
        icon: '💬',
        options: { style: { background: '#dbeafe', color: '#1e40af' } }
      };
    
    case 'follow':
      return {
        message: `${username} started following you`,
        icon: '👤',
        options: { style: { background: '#d1fae5', color: '#065f46' } }
      };
    
    case 'follow_request':
      return {
        message: `${username} wants to follow you`,
        icon: '👥',
        options: { style: { background: '#fef3c7', color: '#92400e' } }
      };
    
    case 'mention':
      return {
        message: `${username} mentioned you`,
        icon: '@',
        options: { style: { background: '#e9d5ff', color: '#6b21a8' } }
      };
    
    case 'story_view':
      return {
        message: `${username} viewed your story`,
        icon: '👁️',
        options: { style: { background: '#fed7aa', color: '#9a3412' } }
      };
    
    case 'share':
      return {
        message: `${username} shared your post`,
        icon: '🔄',
        options: { style: { background: '#ccfbf1', color: '#115e59' } }
      };
    
    case 'message':
      return {
        message: `New message from ${username}`,
        icon: '✉️',
        options: { style: { background: '#dbeafe', color: '#1e40af' } }
      };
    
    default:
      return {
        message: data.content || data.message || 'New notification',
        icon: '🔔',
        options: {}
      };
  }
}

export default useNotificationSocket;
