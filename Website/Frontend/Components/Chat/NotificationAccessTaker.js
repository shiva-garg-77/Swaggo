'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFixedSecureAuth as useSecureAuth } from '../../context/FixedSecureAuthContext.jsx';
import { useSocket } from '../Helper/PerfectSocketProvider';
import { useTheme } from '../Helper/ThemeProvider';
// import NotificationPermissionModal from './NotificationPermissionModal';
// import NotificationBadge from './NotificationBadge';
import notificationService from '../../services/UnifiedNotificationService.js';
import { toast } from 'react-hot-toast';

export default function NotificationAccessTaker({
  children,
  onNotificationUpdate,
  showBadge = true,
  autoRequest = true,
  delayBeforeRequest = 5000 // 5 seconds delay before auto-requesting
}) {
  const { user } = useSecureAuth();
  const { socket, isConnected } = useSocket();
  const { theme } = useTheme();

  // Component state
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState(null);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [isServiceReady, setIsServiceReady] = useState(false);

  // Initialize notification service and check current permission
  useEffect(() => {
    const initializeService = async () => {
      if (!user?.profileid) return;

      try {
        console.log('🔄 Starting notification service initialization...');
        console.log('NotificationService methods:', {
          hasRequestPermission: typeof notificationService.requestPermission === 'function',
          hasShow: typeof notificationService.show === 'function',
          hasIsBrowser: notificationService.isBrowser,
          service: notificationService
        });
        
        // Initialize the enhanced NotificationService
        await notificationService.initialize(user.profileid);
        console.log('✅ NotificationService.initialize completed');
        
        // Check if service is ready
        const isReady = notificationService.isServiceReady();
        console.log('📊 Service ready status:', isReady);
        setIsServiceReady(isReady);

        // Get current permission status
        const currentStatus = notificationService.getPermissionStatus();
        console.log('📊 Permission status:', currentStatus);
        setPermissionStatus(currentStatus);

        // Load stored notification preferences
        const hasRequested = localStorage.getItem(`notification_requested_${user.profileid}`) === 'true';
        setHasRequestedPermission(hasRequested);

        // Load unread count from storage
        const storedCount = localStorage.getItem(`unread_messages_${user.profileid}`);
        if (storedCount) {
          setUnreadCount(parseInt(storedCount, 10));
        }

        console.log('✅ NotificationAccessTaker initialized', {
          permission: currentStatus,
          hasRequested,
          unreadCount: storedCount || 0,
          serviceReady: isReady
        });

      } catch (error) {
        console.error('❌ Failed to initialize notification service:', error);
        console.error('Error stack:', error.stack);
        console.error('Service object:', notificationService);
        toast.error('Failed to initialize notifications: ' + error.message);
        setIsServiceReady(false);
      }
    };

    initializeService();
  }, [user?.profileid]);

  // Auto-request permission if enabled and conditions are met
  useEffect(() => {
    if (!autoRequest || !isServiceReady || !user?.profileid) return;
    if (permissionStatus !== 'default' || hasRequestedPermission) return;

    const requestTimer = setTimeout(() => {
      if (notificationService.shouldRequestPermission()) {
        setShowPermissionModal(true);
      }
    }, delayBeforeRequest);

    return () => clearTimeout(requestTimer);
  }, [autoRequest, isServiceReady, permissionStatus, hasRequestedPermission, delayBeforeRequest, user?.profileid]);

  // Socket event handlers for real-time notifications
  useEffect(() => {
    if (!socket || !isConnected || !user?.profileid) return;

    const handleNewMessage = (data) => {
      console.log('📨 New message notification received:', data);

      try {
        // Don't show notification for own messages
        if (data.message?.senderid === user.profileid) return;

        // Update unread count
        const newCount = unreadCount + 1;
        setUnreadCount(newCount);
        updateStoredUnreadCount(newCount);

        // Show notification if permission granted
        if (permissionStatus === 'granted') {
          notificationService.showMessageNotification(
            data.message,
            data.chat,
            data.sender
          );
          
          // Update notification history
          setNotificationHistory(prev => [{
            id: Date.now(),
            type: 'message',
            data: data,
            timestamp: new Date(),
            shown: true
          }, ...prev.slice(0, 49)]); // Keep last 50 notifications
        } else {
          // Store notification for later if permission not granted
          setNotificationHistory(prev => [{
            id: Date.now(),
            type: 'message',
            data: data,
            timestamp: new Date(),
            shown: false,
            pending: true
          }, ...prev.slice(0, 49)]);
        }

        setLastNotificationTime(new Date());
        
        // Callback for parent component
        if (onNotificationUpdate) {
          onNotificationUpdate({
            type: 'message',
            count: newCount,
            data: data
          });
        }

      } catch (error) {
        console.error('❌ Error handling new message notification:', error);
      }
    };

    const handleMessageRead = (data) => {
      console.log('✅ Message read notification received:', data);
      
      // Decrease unread count
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      updateStoredUnreadCount(newCount);

      if (onNotificationUpdate) {
        onNotificationUpdate({
          type: 'read',
          count: newCount,
          data: data
        });
      }
    };

    const handleBulkMessageRead = (data) => {
      console.log('✅ Bulk messages read:', data);
      
      const newCount = Math.max(0, unreadCount - (data.readCount || 0));
      setUnreadCount(newCount);
      updateStoredUnreadCount(newCount);

      if (onNotificationUpdate) {
        onNotificationUpdate({
          type: 'bulk_read',
          count: newCount,
          data: data
        });
      }
    };

    // Register socket event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('bulk_messages_read', handleBulkMessageRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('bulk_messages_read', handleBulkMessageRead);
    };
  }, [socket, isConnected, user?.profileid, permissionStatus, unreadCount, onNotificationUpdate]);

  // Update stored unread count
  const updateStoredUnreadCount = useCallback((count) => {
    if (user?.profileid) {
      localStorage.setItem(`unread_messages_${user.profileid}`, count.toString());
    }
  }, [user?.profileid]);

  // Handle permission request
  const handleRequestPermission = async () => {
    if (!isServiceReady) {
      toast.error('Notification service not ready');
      return false;
    }

    try {
      setHasRequestedPermission(true);
      if (user?.profileid) {
        localStorage.setItem(`notification_requested_${user.profileid}`, 'true');
      }

      const granted = await notificationService.requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');

      if (granted) {
        toast.success('🔔 Notifications enabled! You\'ll now get real-time chat updates.');
        
        // Show pending notifications if any
        const pendingNotifications = notificationHistory.filter(n => n.pending);
        if (pendingNotifications.length > 0) {
          toast.success(`📬 ${pendingNotifications.length} missed notifications are now active!`);
          
          // Mark pending notifications as shown
          setNotificationHistory(prev => 
            prev.map(n => n.pending ? { ...n, pending: false, shown: true } : n)
          );
        }

        // Test notification
        setTimeout(() => {
          notificationService.testNotification();
        }, 1000);

      } else {
        toast.error('❌ Notifications blocked. You can enable them later in browser settings.');
      }

      setShowPermissionModal(false);
      return granted;

    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  };

  // Handle permission denial
  const handleDenyPermission = () => {
    setHasRequestedPermission(true);
    setPermissionStatus('denied');
    setShowPermissionModal(false);
    
    if (user?.profileid) {
      localStorage.setItem(`notification_requested_${user.profileid}`, 'true');
    }

    toast('You can enable notifications later from the chat settings.', {
      icon: '💬',
      duration: 4000
    });
  };

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setUnreadCount(0);
    updateStoredUnreadCount(0);
    setNotificationHistory([]);
    
    if (permissionStatus === 'granted' && notificationService.dismissAll) {
      notificationService.dismissAll();
    }

    if (onNotificationUpdate) {
      onNotificationUpdate({
        type: 'clear',
        count: 0,
        data: null
      });
    }
  }, [permissionStatus, onNotificationUpdate, updateStoredUnreadCount]);

  // Show permission modal manually
  const showPermissionPrompt = useCallback(() => {
    if (permissionStatus === 'granted') {
      toast.success('🔔 Notifications are already enabled!');
      return;
    }
    
    if (permissionStatus === 'denied') {
      toast.error('Notifications are blocked. Please enable them in your browser settings and refresh.');
      return;
    }

    setShowPermissionModal(true);
  }, [permissionStatus]);

  // Get notification stats
  const getNotificationStats = useCallback(() => {
    return {
      permission: permissionStatus,
      unreadCount,
      lastNotificationTime,
      totalNotifications: notificationHistory.length,
      pendingNotifications: notificationHistory.filter(n => n.pending).length,
      isServiceReady,
      hasRequestedPermission
    };
  }, [permissionStatus, unreadCount, lastNotificationTime, notificationHistory, isServiceReady, hasRequestedPermission]);

  // Provide context to children
  const notificationContext = {
    permissionStatus,
    unreadCount,
    clearNotifications,
    showPermissionPrompt,
    getNotificationStats,
    isServiceReady,
    lastNotificationTime,
    notificationHistory: notificationHistory.slice(0, 10), // Only provide recent 10
    hasRequestedPermission
  };

  return (
    <div className="notification-access-taker">
      {/* Notification Badge */}
      {/* {showBadge && unreadCount > 0 && (
        <NotificationBadge
          count={unreadCount}
          onClick={clearNotifications}
          theme={theme}
          className="fixed top-4 right-4 z-40"
        />
      )} */}

      {/* Permission Modal */}
      {/* <NotificationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onAllow={handleRequestPermission}
        onDeny={handleDenyPermission}
        theme={theme}
        stats={{
          pendingCount: notificationHistory.filter(n => n.pending).length,
          isConnected,
          userName: user?.name || user?.username
        }}
      /> */}

      {/* Render children with notification context */}
      {typeof children === 'function' 
        ? children(notificationContext)
        : React.cloneElement(children, { notificationContext })
      }

      {/* Debug Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className={`p-3 rounded-lg border shadow-lg text-xs max-w-xs ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}>
            <div className="font-semibold mb-2">🔔 Notification Debug</div>
            <div>Permission: <span className={`font-mono ${
              permissionStatus === 'granted' ? 'text-green-500' : 
              permissionStatus === 'denied' ? 'text-red-500' : 'text-yellow-500'
            }`}>{permissionStatus}</span></div>
            <div>Unread: <span className="font-mono text-blue-500">{unreadCount}</span></div>
            <div>Service: <span className={`font-mono ${
              isServiceReady ? 'text-green-500' : 'text-red-500'
            }`}>{isServiceReady ? 'Ready' : 'Not Ready'}</span></div>
            <div>History: <span className="font-mono text-purple-500">{notificationHistory.length}</span></div>
            <div className="flex gap-1 mt-2">
              <button
                onClick={showPermissionPrompt}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Request
              </button>
              <button
                onClick={clearNotifications}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Clear
              </button>
              <button
                onClick={() => toast('Test clicked')}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to use notification context in child components
export const useNotificationAccess = () => {
  const context = React.useContext(React.createContext(null));
  if (!context) {
    console.warn('useNotificationAccess must be used within NotificationAccessTaker');
  }
  return context || {};
};