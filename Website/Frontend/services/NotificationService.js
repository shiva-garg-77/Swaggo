/**
 * Centralized Notification Service
 * Consolidates all notification functionality into a single service
 */

import toast from 'react-hot-toast';
import authService from './AuthService';

/**
 * Notification Types
 */
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading',
  CUSTOM: 'custom'
};

/**
 * Notification Categories
 */
const NOTIFICATION_CATEGORIES = {
  AUTH: 'authentication',
  CHAT: 'chat',
  CALL: 'call',
  FILE: 'file_upload',
  SYSTEM: 'system',
  USER: 'user_action'
};

/**
 * Push Notification Permission States
 */
const PERMISSION_STATES = {
  GRANTED: 'granted',
  DENIED: 'denied',
  DEFAULT: 'default',
  UNSUPPORTED: 'unsupported'
};

/**
 * Notification Service Class
 */
class NotificationService {
  constructor() {
    // Browser notification support
    this.isPushSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.isServiceWorkerSupported = 'serviceWorker' in navigator;
    
    // Permission state
    this.permissionState = this.isPushSupported 
      ? Notification.permission 
      : PERMISSION_STATES.UNSUPPORTED;
    
    // Active notifications tracking
    this.activeNotifications = new Map();
    this.notificationHistory = [];
    this.maxHistorySize = 100;
    
    // Configuration
    this.config = {
      defaultDuration: 4000,
      maxActiveToasts: 3,
      enableSound: true,
      enableVibration: true,
      enablePush: true,
      persistImportant: true
    };
    
    // Event listeners
    this.listeners = new Set();
    
    // Initialize service worker for push notifications
    this.initializeServiceWorker();
    
    // Setup default notification handlers
    this.setupDefaultHandlers();
  }

  /**
   * Initialize service worker for push notifications
   */
  async initializeServiceWorker() {
    if (!this.isServiceWorkerSupported) return;
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
      
      this.serviceWorkerRegistration = registration;
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  /**
   * Handle messages from service worker
   */
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'NOTIFICATION_CLICK':
        this.handleNotificationClick(data);
        break;
      case 'NOTIFICATION_CLOSE':
        this.handleNotificationClose(data);
        break;
      default:
        console.log('Unknown service worker message:', event.data);
    }
  }

  /**
   * Setup default notification handlers for different services
   */
  setupDefaultHandlers() {
    // Authentication notifications
    authService.addAuthListener((authState) => {
      if (authState.isAuthenticated && authState.user) {
        this.show({
          type: NOTIFICATION_TYPES.SUCCESS,
          title: 'Welcome back!',
          message: `Hello ${authState.user.username}`,
          category: NOTIFICATION_CATEGORIES.AUTH
        });
      }
      
      if (authState.error) {
        this.show({
          type: NOTIFICATION_TYPES.ERROR,
          title: 'Authentication Error',
          message: authState.error.message,
          category: NOTIFICATION_CATEGORIES.AUTH
        });
      }
    });
  }

  /**
   * Request push notification permission
   */
  async requestPermission() {
    if (!this.isPushSupported) {
      return PERMISSION_STATES.UNSUPPORTED;
    }
    
    if (this.permissionState === PERMISSION_STATES.GRANTED) {
      return PERMISSION_STATES.GRANTED;
    }
    
    try {
      const permission = await Notification.requestPermission();
      this.permissionState = permission;
      
      this.emit('permissionChanged', { permission });
      
      if (permission === PERMISSION_STATES.GRANTED) {
        this.show({
          type: NOTIFICATION_TYPES.SUCCESS,
          title: 'Notifications Enabled',
          message: 'You will now receive push notifications',
          category: NOTIFICATION_CATEGORIES.SYSTEM
        });
        
        // Subscribe to push notifications
        await this.subscribeToPush();
      }
      
      return permission;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return PERMISSION_STATES.DENIED;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush() {
    if (!this.serviceWorkerRegistration || !this.isPushSupported) {
      console.warn('Push notifications not supported');
      return null;
    }
    
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured');
        return null;
      }
      
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log('✅ Push subscription created:', subscription);
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to push:', error);
      return null;
    }
  }

  /**
   * Send push subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;
      
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getCurrentToken()}`
        },
        body: JSON.stringify({
          subscription,
          userId: user.profileid || user.id
        })
      });
      
      if (response.ok) {
        console.log('✅ Push subscription sent to server');
      } else {
        console.error('❌ Failed to send push subscription to server');
      }
    } catch (error) {
      console.error('❌ Error sending subscription to server:', error);
    }
  }

  /**
   * Main notification display method
   */
  show(notification) {
    const {
      type = NOTIFICATION_TYPES.INFO,
      title,
      message,
      category = NOTIFICATION_CATEGORIES.SYSTEM,
      duration,
      persistent = false,
      actions = [],
      data = {},
      sound = this.config.enableSound,
      vibration = this.config.enableVibration,
      push = this.config.enablePush,
      onClick,
      onClose
    } = notification;

    // Generate unique ID
    const id = this.generateNotificationId();
    
    // Create notification object
    const notificationData = {
      id,
      type,
      title,
      message,
      category,
      duration: duration || this.config.defaultDuration,
      persistent,
      actions,
      data,
      timestamp: Date.now(),
      onClick,
      onClose,
      read: false
    };

    // Add to active notifications
    this.activeNotifications.set(id, notificationData);
    
    // Add to history
    this.addToHistory(notificationData);
    
    // Show toast notification
    this.showToast(notificationData);
    
    // Play sound if enabled
    if (sound) {
      this.playNotificationSound(type);
    }
    
    // Vibrate if enabled and supported
    if (vibration && navigator.vibrate) {
      this.vibrateDevice(type);
    }
    
    // Show push notification if enabled and user is not focused
    if (push && this.shouldShowPush()) {
      this.showPushNotification(notificationData);
    }
    
    // Emit event
    this.emit('notificationShown', notificationData);
    
    return id;
  }

  /**
   * Show toast notification using react-hot-toast
   */
  showToast(notification) {
    const { id, type, title, message, duration, persistent, onClick } = notification;
    
    const toastContent = (
      <div 
        className="notification-content"
        onClick={() => onClick && onClick(notification)}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        {title && <div className="notification-title font-semibold">{title}</div>}
        {message && <div className="notification-message text-sm opacity-90">{message}</div>}
      </div>
    );
    
    const toastOptions = {
      id,
      duration: persistent ? Infinity : duration,
      position: 'top-right',
      style: this.getToastStyle(type),
      className: `notification-toast notification-${type}`,
      ariaProps: {
        role: 'status',
        'aria-live': type === NOTIFICATION_TYPES.ERROR ? 'assertive' : 'polite'
      }
    };

    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        toast.success(toastContent, toastOptions);
        break;
      case NOTIFICATION_TYPES.ERROR:
        toast.error(toastContent, toastOptions);
        break;
      case NOTIFICATION_TYPES.WARNING:
        toast(toastContent, { ...toastOptions, icon: '⚠️' });
        break;
      case NOTIFICATION_TYPES.LOADING:
        toast.loading(toastContent, toastOptions);
        break;
      case NOTIFICATION_TYPES.CUSTOM:
        toast.custom(toastContent, toastOptions);
        break;
      default:
        toast(toastContent, toastOptions);
    }
  }

  /**
   * Show browser push notification
   */
  async showPushNotification(notification) {
    if (!this.isPushSupported || this.permissionState !== PERMISSION_STATES.GRANTED) {
      return;
    }
    
    const { title, message, data, actions } = notification;
    
    const options = {
      body: message,
      icon: '/icons/notification-icon.png',
      badge: '/icons/notification-badge.png',
      data: {
        ...data,
        notificationId: notification.id,
        timestamp: notification.timestamp
      },
      tag: `notification-${notification.id}`,
      requireInteraction: notification.persistent,
      silent: false,
      actions: actions.map(action => ({
        action: action.id,
        title: action.title,
        icon: action.icon
      }))
    };
    
    try {
      const pushNotification = new Notification(title, options);
      
      pushNotification.onclick = () => {
        this.handleNotificationClick(notification);
        pushNotification.close();
      };
      
      pushNotification.onclose = () => {
        this.handleNotificationClose(notification);
      };
      
      // Auto-close after duration if not persistent
      if (!notification.persistent) {
        setTimeout(() => {
          pushNotification.close();
        }, notification.duration);
      }
      
    } catch (error) {
      console.error('❌ Error showing push notification:', error);
    }
  }

  /**
   * Notification type shortcuts
   */
  success(title, message, options = {}) {
    return this.show({
      type: NOTIFICATION_TYPES.SUCCESS,
      title,
      message,
      ...options
    });
  }

  error(title, message, options = {}) {
    return this.show({
      type: NOTIFICATION_TYPES.ERROR,
      title,
      message,
      persistent: true, // Errors are persistent by default
      ...options
    });
  }

  warning(title, message, options = {}) {
    return this.show({
      type: NOTIFICATION_TYPES.WARNING,
      title,
      message,
      ...options
    });
  }

  info(title, message, options = {}) {
    return this.show({
      type: NOTIFICATION_TYPES.INFO,
      title,
      message,
      ...options
    });
  }

  loading(title, message, options = {}) {
    return this.show({
      type: NOTIFICATION_TYPES.LOADING,
      title,
      message,
      persistent: true,
      ...options
    });
  }

  /**
   * Context-specific notification methods
   */
  
  // Chat notifications
  newMessage(sender, message, chatId) {
    return this.show({
      type: NOTIFICATION_TYPES.INFO,
      title: `New message from ${sender}`,
      message: message.length > 50 ? message.substring(0, 47) + '...' : message,
      category: NOTIFICATION_CATEGORIES.CHAT,
      data: { chatId, senderId: sender },
      sound: true,
      vibration: true,
      push: true,
      onClick: (notification) => {
        // Navigate to chat
        window.location.href = `/chat/${chatId}`;
      }
    });
  }

  // Call notifications
  incomingCall(caller, callType = 'voice') {
    return this.show({
      type: NOTIFICATION_TYPES.CUSTOM,
      title: `Incoming ${callType} call`,
      message: `${caller.username} is calling you`,
      category: NOTIFICATION_CATEGORIES.CALL,
      persistent: true,
      sound: true,
      vibration: [200, 100, 200],
      push: true,
      actions: [
        { id: 'answer', title: 'Answer', icon: '/icons/phone-answer.png' },
        { id: 'decline', title: 'Decline', icon: '/icons/phone-decline.png' }
      ],
      data: { 
        callerId: caller.profileid,
        callerName: caller.username,
        callType 
      }
    });
  }

  callEnded(caller, duration) {
    const durationText = this.formatDuration(duration);
    return this.show({
      type: NOTIFICATION_TYPES.INFO,
      title: 'Call ended',
      message: `Call with ${caller.username} lasted ${durationText}`,
      category: NOTIFICATION_CATEGORIES.CALL,
      data: { callerId: caller.profileid, duration }
    });
  }

  missedCall(caller) {
    return this.show({
      type: NOTIFICATION_TYPES.WARNING,
      title: 'Missed call',
      message: `You missed a call from ${caller.username}`,
      category: NOTIFICATION_CATEGORIES.CALL,
      persistent: true,
      data: { callerId: caller.profileid },
      onClick: () => {
        // Navigate to call history or chat
        window.location.href = `/chat/${caller.profileid}`;
      }
    });
  }

  // File upload notifications
  fileUploadProgress(filename, progress) {
    const id = `upload-${filename}`;
    
    if (progress >= 100) {
      // Upload complete
      toast.dismiss(id);
      return this.success(
        'Upload complete',
        `${filename} has been uploaded successfully`
      );
    } else {
      // Show progress
      return toast.loading(
        `Uploading ${filename}... ${Math.round(progress)}%`,
        { id }
      );
    }
  }

  fileUploadError(filename, error) {
    const id = `upload-${filename}`;
    toast.dismiss(id);
    
    return this.error(
      'Upload failed',
      `Failed to upload ${filename}: ${error}`,
      { category: NOTIFICATION_CATEGORIES.FILE }
    );
  }

  // Authentication notifications
  loginSuccess(username) {
    return this.success(
      'Login successful',
      `Welcome back, ${username}!`,
      { category: NOTIFICATION_CATEGORIES.AUTH }
    );
  }

  loginError(error) {
    return this.error(
      'Login failed',
      error.message || 'Invalid credentials',
      { category: NOTIFICATION_CATEGORIES.AUTH }
    );
  }

  sessionExpired() {
    return this.warning(
      'Session expired',
      'Please log in again to continue',
      { 
        category: NOTIFICATION_CATEGORIES.AUTH,
        persistent: true,
        onClick: () => {
          window.location.href = '/login';
        }
      }
    );
  }

  // System notifications
  connectionLost() {
    return this.warning(
      'Connection lost',
      'Trying to reconnect...',
      { 
        category: NOTIFICATION_CATEGORIES.SYSTEM,
        persistent: true 
      }
    );
  }

  connectionRestored() {
    return this.success(
      'Connection restored',
      'You are back online',
      { category: NOTIFICATION_CATEGORIES.SYSTEM }
    );
  }

  /**
   * Notification management methods
   */
  
  // Dismiss notification
  dismiss(id) {
    toast.dismiss(id);
    this.activeNotifications.delete(id);
    this.emit('notificationDismissed', { id });
  }

  // Dismiss all notifications
  dismissAll() {
    toast.dismiss();
    this.activeNotifications.clear();
    this.emit('allNotificationsDismissed');
  }

  // Dismiss by category
  dismissByCategory(category) {
    for (const [id, notification] of this.activeNotifications) {
      if (notification.category === category) {
        this.dismiss(id);
      }
    }
  }

  // Mark notification as read
  markAsRead(id) {
    const notification = this.activeNotifications.get(id);
    if (notification) {
      notification.read = true;
      this.emit('notificationRead', notification);
    }
  }

  // Mark all as read
  markAllAsRead() {
    for (const notification of this.activeNotifications.values()) {
      notification.read = true;
    }
    this.emit('allNotificationsRead');
  }

  /**
   * Configuration methods
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  getConfig() {
    return { ...this.config };
  }

  /**
   * Event handling
   */
  on(event, callback) {
    this.listeners.add({ event, callback });
    return () => this.listeners.delete({ event, callback });
  }

  off(event, callback) {
    this.listeners = new Set(
      Array.from(this.listeners).filter(l => 
        l.event !== event || l.callback !== callback
      )
    );
  }

  emit(event, data) {
    this.listeners.forEach(({ event: listenerEvent, callback }) => {
      if (listenerEvent === event) {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      }
    });
  }

  /**
   * Notification history
   */
  addToHistory(notification) {
    this.notificationHistory.unshift(notification);
    
    // Limit history size
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(0, this.maxHistorySize);
    }
  }

  getHistory(category = null, limit = null) {
    let history = this.notificationHistory;
    
    if (category) {
      history = history.filter(n => n.category === category);
    }
    
    if (limit) {
      history = history.slice(0, limit);
    }
    
    return history;
  }

  clearHistory() {
    this.notificationHistory = [];
    this.emit('historyCleared');
  }

  /**
   * Utility methods
   */
  generateNotificationId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  shouldShowPush() {
    // Show push notifications when page is not focused or minimized
    return document.hidden || !document.hasFocus();
  }

  getToastStyle(type) {
    const baseStyle = {
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      maxWidth: '400px'
    };

    const typeStyles = {
      [NOTIFICATION_TYPES.SUCCESS]: {
        background: '#10b981',
        color: 'white'
      },
      [NOTIFICATION_TYPES.ERROR]: {
        background: '#ef4444',
        color: 'white'
      },
      [NOTIFICATION_TYPES.WARNING]: {
        background: '#f59e0b',
        color: 'white'
      },
      [NOTIFICATION_TYPES.INFO]: {
        background: '#3b82f6',
        color: 'white'
      },
      [NOTIFICATION_TYPES.LOADING]: {
        background: '#6b7280',
        color: 'white'
      }
    };

    return {
      ...baseStyle,
      ...(typeStyles[type] || typeStyles[NOTIFICATION_TYPES.INFO])
    };
  }

  playNotificationSound(type) {
    try {
      const audio = new Audio();
      
      switch (type) {
        case NOTIFICATION_TYPES.SUCCESS:
          audio.src = '/sounds/success.mp3';
          break;
        case NOTIFICATION_TYPES.ERROR:
          audio.src = '/sounds/error.mp3';
          break;
        case NOTIFICATION_TYPES.WARNING:
          audio.src = '/sounds/warning.mp3';
          break;
        default:
          audio.src = '/sounds/notification.mp3';
      }
      
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore autoplay policy errors
      });
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  vibrateDevice(type) {
    if (!navigator.vibrate) return;
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        navigator.vibrate([100, 50, 100]);
        break;
      case NOTIFICATION_TYPES.ERROR:
        navigator.vibrate([200, 100, 200, 100, 200]);
        break;
      case NOTIFICATION_TYPES.WARNING:
        navigator.vibrate([150, 100, 150]);
        break;
      default:
        navigator.vibrate(100);
    }
  }

  handleNotificationClick(notification) {
    if (notification.onClick) {
      notification.onClick(notification);
    }
    
    this.markAsRead(notification.id);
    this.emit('notificationClicked', notification);
  }

  handleNotificationClose(notification) {
    if (notification.onClose) {
      notification.onClose(notification);
    }
    
    this.activeNotifications.delete(notification.id);
    this.emit('notificationClosed', notification);
  }

  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Analytics and debugging
   */
  getStats() {
    return {
      permissionState: this.permissionState,
      isPushSupported: this.isPushSupported,
      activeNotifications: this.activeNotifications.size,
      historySize: this.notificationHistory.length,
      config: this.config
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.dismissAll();
    this.listeners.clear();
    this.activeNotifications.clear();
    this.notificationHistory = [];
    
    if (navigator.serviceWorker) {
      navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
export { NOTIFICATION_TYPES, NOTIFICATION_CATEGORIES, PERMISSION_STATES };