/**
 * Consolidated Notification Service for SwagGo
 * Single implementation combining features from previous services
 */

import toast from 'react-hot-toast';
import { getConfig, webSocketConfig, notificationConfig } from '../config/environment.js';

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
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
export const NOTIFICATION_CATEGORIES = {
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
export const PERMISSION_STATES = {
  GRANTED: 'granted',
  DENIED: 'denied',
  DEFAULT: 'default',
  UNSUPPORTED: 'unsupported'
};

/**
 * Unified Notification Service Class
 * This combines both notification service implementations with conflict resolution
 */
class UnifiedNotificationService {
  constructor() {
    // Environment detection
    this.isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
    this.isServer = typeof window === 'undefined';
    
    // Core notification support
    this.isPushSupported = this.isBrowser && 
      'Notification' in window && 'serviceWorker' in navigator;
    this.isServiceWorkerSupported = this.isBrowser && 'serviceWorker' in navigator;
    
    // Permission state
    this.permissionState = this.isBrowser && this.isPushSupported 
      ? Notification.permission 
      : PERMISSION_STATES.UNSUPPORTED;
    
    // Ready state management - ALWAYS READY for basic functionality
    this.isReady = true; // Start ready for basic toast notifications
    this.readyPromise = null;
    this.initializationAttempts = 0;
    this.maxInitializationAttempts = 3;
    this.basicFunctionalityReady = true; // Always enable basic notifications
    
    // Service Worker state
    this.serviceWorkerRegistration = null;
    this.pushSubscription = null;
    
    // VAPID configuration
    this.vapidKeys = {
      publicKey: null,
      privateKey: null // Server-side only
    };
    
    // Active notifications tracking
    this.activeNotifications = new Map();
    this.notificationHistory = [];
    this.maxHistorySize = 100;
    
    // Configuration with safe defaults
    this.config = {
      defaultDuration: 4000,
      maxActiveToasts: 3,
      enableSound: true,
      enableVibration: true,
      enablePush: true,
      persistImportant: true
    };
    
    // Event system
    this.listeners = new Map();
    
    // Chat-specific state
    this.userId = null;
    this.currentChatId = null;
    this.chatSettings = null;
    
    // Legacy compatibility properties
    this.ready = false; // For backward compatibility
    this.permission = this.permissionState; // For backward compatibility
    this.isSupported = this.isPushSupported; // For backward compatibility
    
    // Handler references for cleanup
    this.boundHandlers = new Map();
    
    // FIXED: Initialize with proper error handling and retries
    this.initializeWithRetry();
  }
  
  /**
   * FIXED: Initialize with retry mechanism
   */
  async initializeWithRetry() {
    try {
      // Always enable basic functionality first
      this.isReady = true;
      this.ready = true;
      console.log('✅ NotificationService: Basic functionality enabled immediately');
      
      // Then try full initialization in background
      this.readyPromise = this.initializeService();
      await this.readyPromise;
      
    } catch (error) {
      console.error(`❌ NotificationService initialization failed (attempt ${this.initializationAttempts + 1}):`, error);
      
      this.initializationAttempts++;
      
      if (this.initializationAttempts < this.maxInitializationAttempts) {
        console.log(`🔄 Retrying initialization in 2 seconds...`);
        setTimeout(() => this.initializeService(), 2000);
      } else {
        console.warn('⚠️ Max initialization attempts reached. Service will run with basic functionality only.');
        // Keep basic functionality enabled
        this.isReady = true;
        this.ready = true;
        this.emit('initError', { 
          error: 'Full initialization failed, running in basic mode',
          attempts: this.initializationAttempts 
        });
      }
    }
  }
  
  /**
   * FIXED: Comprehensive service initialization
   */
  async initializeService() {
    try {
      console.log('🚀 UnifiedNotificationService: Starting initialization...');
      
      // Step 1: Environment validation
      if (this.isServer) {
        console.log('⚙️ Server-side initialization - limited functionality');
        this.isReady = true;
        this.ready = true;
        return;
      }
      
      // Step 2: Load VAPID keys (non-blocking)
      try {
        await this.loadVapidKeys();
      } catch (error) {
        console.warn('⚠️ VAPID keys loading failed, continuing without push notifications:', error.message);
      }
      
      // Step 3: Initialize service worker (non-blocking)
      try {
        await this.initializeServiceWorker();
      } catch (error) {
        console.warn('⚠️ Service Worker initialization failed, continuing without push notifications:', error.message);
        // Don't fail the entire initialization
      }
      
      // Step 4: Setup default handlers
      this.setupDefaultHandlers();
      
      // Step 5: Load user settings if available
      this.loadStoredSettings();
      
      // Step 6: FIXED - Mark as ready only when ALL dependencies are fulfilled
      const readyState = this.getReadyState();
      const allCriticalSystemsReady = (
        this.isBrowser || this.isServer
      ) && (
        !this.isBrowser || // Server doesn't need these checks
        (
          this.isPushSupported &&
          (this.serviceWorkerRegistration || !this.isServiceWorkerSupported) &&
          this.vapidKeys.publicKey // VAPID key is critical for push notifications
        )
      );
      
      console.log('🔍 Service readiness validation:', {
        isBrowser: this.isBrowser,
        isServer: this.isServer,
        isPushSupported: this.isPushSupported,
        hasServiceWorker: !!this.serviceWorkerRegistration,
        serviceWorkerSupported: this.isServiceWorkerSupported,
        hasVapidKey: !!this.vapidKeys.publicKey,
        allCriticalSystemsReady
      });
      
      if (allCriticalSystemsReady) {
        this.isReady = true;
        this.ready = true; // Backward compatibility
        
        console.log('✅ UnifiedNotificationService: All critical systems ready - marking service as ready');
        
        // Emit ready event
        this.emit('ready', { 
          timestamp: Date.now(),
          status: this.getReadyState()
        });
      } else {
        this.isReady = false;
        this.ready = false;
        
        console.warn('⚠️ UnifiedNotificationService: Not all critical systems ready - service marked as NOT ready');
        console.warn('Missing dependencies:', {
          needsVapidKey: !this.vapidKeys.publicKey,
          needsServiceWorker: this.isBrowser && this.isServiceWorkerSupported && !this.serviceWorkerRegistration,
          needsPushSupport: this.isBrowser && !this.isPushSupported
        });
        
        // Emit not ready event
        this.emit('notReady', { 
          timestamp: Date.now(),
          status: this.getReadyState(),
          missingDependencies: {
            vapidKey: !this.vapidKeys.publicKey,
            serviceWorker: this.isBrowser && this.isServiceWorkerSupported && !this.serviceWorkerRegistration,
            pushSupport: this.isBrowser && !this.isPushSupported
          }
        });
      }
      
      console.log('📊 Final service status:', this.getReadyState());
      
    } catch (error) {
      console.error('❌ UnifiedNotificationService initialization failed:', error);
      throw error; // Let retry mechanism handle it
    }
  }
  
  /**
   * FIXED: Get ready state with comprehensive validation
   */
  getReadyState() {
    return {
      isReady: this.isReady,
      ready: this.ready, // Backward compatibility
      isBrowser: this.isBrowser,
      isPushSupported: this.isPushSupported,
      isServiceWorkerSupported: this.isServiceWorkerSupported,
      hasServiceWorkerRegistration: !!this.serviceWorkerRegistration,
      hasVapidKey: !!this.vapidKeys.publicKey,
      permissionState: this.permissionState,
      permission: this.permission, // Backward compatibility
      initializationAttempts: this.initializationAttempts,
      status: this.isReady ? 'ready' : 'initializing'
    };
  }
  
  /**
   * Debug method to log current service status
   */
  logStatus() {
    const status = this.getReadyState();
    console.log('🔔 NotificationService Status:', status);
    return status;
  }
  
  /**
   * FIXED: Check if service is ready with timeout
   */
  async waitForReady(timeout = 10000) {
    if (this.isReady) {
      return true;
    }
    
    try {
      await Promise.race([
        this.readyPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), timeout)
        )
      ]);
      
      return this.isReady;
    } catch (error) {
      console.warn('⚠️ NotificationService initialization timeout:', error.message);
      return this.isReady;
    }
  }
  
  /**
   * FIXED: Synchronous ready check for UI components
   */
  isServiceReady() {
    return this.isReady && this.ready;
  }
  
  /**
   * FIXED: Load VAPID keys with comprehensive configuration support - Issues #6, #7
   */
  async loadVapidKeys() {
    try {
      console.log('🔑 Loading VAPID keys from configuration...');
      
      console.log('✅ Notification config imported successfully', {
        hasConfig: !!notificationConfig,
        hasVapidKeys: notificationConfig?.hasVapidKeys
      });
      
      // Try multiple sources for VAPID key with priority order
      let publicKey;
      
      // First try notification config
      if (notificationConfig?.vapidPublicKey) {
        publicKey = notificationConfig.vapidPublicKey;
        console.log('🔑 Using VAPID key from notificationConfig');
      }
      // Then try environment variable from getConfig function
      else if (getConfig?.('NEXT_PUBLIC_VAPID_PUBLIC_KEY')) {
        publicKey = getConfig('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
        console.log('🔑 Using VAPID key from getConfig');
      }
      // Then try process.env (Node.js environment)
      else if (process?.env?.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        console.log('🔑 Using VAPID key from process.env');
      }
      // Finally try window object (browser environment)
      else if (this.isBrowser && window.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        publicKey = window.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        console.log('🔑 Using VAPID key from window object');
      }
      
      // Handle case where we get an object instead of a string (common Next.js issue)
      if (publicKey && typeof publicKey === 'object') {
        console.warn('⚠️ VAPID key received as object, attempting to extract string value');
        
        // Try common object patterns
        if (publicKey.default) {
          publicKey = publicKey.default;
        } else if (publicKey.value) {
          publicKey = publicKey.value;
        } else if (publicKey.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
          publicKey = publicKey.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        } else {
          // Convert object to string if it has a meaningful toString
          const stringValue = String(publicKey);
          if (stringValue !== '[object Object]') {
            publicKey = stringValue;
          } else {
            console.error('❌ Could not extract VAPID key from object:', Object.keys(publicKey));
            publicKey = null;
          }
        }
      }
      
      console.log('🔍 VAPID key search results:', {
        fromNotificationConfig: !!(notificationConfig?.vapidPublicKey),
        fromGetConfig: !!getConfig?.('NEXT_PUBLIC_VAPID_PUBLIC_KEY'),
        fromProcessEnv: !!process?.env?.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        fromWindow: !!(this.isBrowser && window.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        finalKey: !!publicKey,
        keyType: typeof publicKey,
        keyLength: publicKey ? String(publicKey).length : 0,
        keyPreview: publicKey ? String(publicKey).substring(0, 20) + '...' : 'null',
        errorState: !publicKey ? 'NO_KEY_FOUND' : (typeof publicKey === 'object' ? 'OBJECT_INSTEAD_OF_STRING' : 'OK')
      });
      
      if (!publicKey) {
        console.warn('⚠️ VAPID public key not found - push notifications will be limited');
        console.warn('💡 Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to your .env.local file');
        console.warn('📝 Example: NEXT_PUBLIC_VAPID_PUBLIC_KEY="YOUR_VAPID_PUBLIC_KEY_HERE"');
        
        // Set notification config URLs if available
        if (notificationConfig) {
          this.config.iconUrl = notificationConfig.iconUrl;
          this.config.badgeUrl = notificationConfig.badgeUrl;
        }
        return;
      }
      
      // Validate VAPID key format
      if (typeof publicKey !== 'string') {
        console.error('❌ VAPID public key must be a string, got:', typeof publicKey);
        console.error('📝 VAPID key value:', publicKey);
        console.error('💡 This usually means your environment variable is not properly loaded');
        console.error('🔧 Check your .env.local file and ensure NEXT_PUBLIC_VAPID_PUBLIC_KEY is set correctly');
        return;
      }
      
      if (publicKey.length < 40) {
        console.error('❌ VAPID public key too short, got:', publicKey.length, 'chars, expected at least 40');
        return;
      }
      
      // Validate key format (base64url)
      if (!/^[A-Za-z0-9_-]+$/.test(publicKey)) {
        console.error('❌ VAPID public key contains invalid characters, expected base64url format');
        return;
      }
      
      this.vapidKeys.publicKey = publicKey;
      
      // Set notification config if available
      if (notificationConfig) {
        this.config.iconUrl = notificationConfig.iconUrl || '/icons/notification-icon.png';
        this.config.badgeUrl = notificationConfig.badgeUrl || '/icons/notification-badge.png';
        this.config.enablePush = notificationConfig.enabled !== false;
      }
      
      console.log('✅ VAPID public key loaded and validated successfully', {
        keyLength: publicKey.length,
        keyPrefix: publicKey.substring(0, 10) + '...',
        hasNotificationConfig: !!notificationConfig,
        iconUrl: this.config.iconUrl,
        badgeUrl: this.config.badgeUrl
      });
      
    } catch (error) {
      console.error('❌ Error loading VAPID keys:', error);
      // Continue without VAPID keys but log detailed error
      console.error('VAPID loading error stack:', error.stack);
    }
  }
  
  /**
   * FIXED: Service Worker initialization with better error handling
   */
  async initializeServiceWorker() {
    if (!this.isBrowser || !this.isServiceWorkerSupported) {
      console.log('🚫 Service Worker not supported - using toast notifications only');
      return;
    }
    
    try {
      console.log('🔄 Registering service worker...');
      
      // Check if service worker file exists first
      try {
        const swResponse = await fetch('/sw.js', { method: 'HEAD' });
        if (!swResponse.ok) {
          throw new Error(`Service Worker file not found: ${swResponse.status} ${swResponse.statusText}`);
        }
      } catch (fetchError) {
        throw new Error(`Cannot access service worker file: ${fetchError.message}`);
      }
      
      // Register service worker with abort handling
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports'
      }).catch(error => {
        // Handle specific abort errors that occur during page navigation
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          console.log('🔄 Service Worker registration aborted (page navigation) - this is normal');
          return null; // Don't treat as fatal error
        }
        throw error; // Re-throw other errors
      });
      
      // If registration was aborted, exit gracefully
      if (!registration) {
        console.log('ℹ️ Service Worker registration skipped due to page navigation');
        return;
      }
      
      // Security: Verify scope
      if (!registration.scope.includes(window.location.origin)) {
        throw new Error('Service Worker scope validation failed');
      }
      
      console.log('✅ Service Worker registered:', {
        scope: registration.scope,
        state: registration.active?.state || 'installing'
      });
      
      this.serviceWorkerRegistration = registration;
      
      // Set up lifecycle listeners
      this.setupServiceWorkerListeners(registration);
      
      // Wait for service worker to be ready
      await this.waitForServiceWorkerReady(registration);
      
      console.log('✅ Service Worker ready for push notifications');
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      
      // Handle different types of errors gracefully
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        console.log('ℹ️ Service Worker registration aborted - continuing without push notifications');
        this.serviceWorkerRegistration = null;
        return; // Don't throw for abort errors
      }
      
      if (error.message.includes('Service Worker file not found')) {
        console.warn('⚠️ Service Worker file not found - running without push notifications');
        this.serviceWorkerRegistration = null;
        return; // Don't throw for missing file
      }
      
      // Clean up partial state
      this.serviceWorkerRegistration = null;
      console.warn('⚠️ Continuing without Service Worker support due to:', error.message);
      
      // Don't throw error - just continue without service worker
      // throw error; // Re-throw to be handled by caller
    }
  }
  
  /**
   * FIXED: Setup service worker event listeners with cleanup
   */
  setupServiceWorkerListeners(registration) {
    // Update found handler
    const updateHandler = () => {
      console.log('🔄 Service Worker update available');
      this.emit('updateAvailable', { registration });
    };
    
    // Message handler with security validation
    const messageHandler = (event) => {
      // Security: Validate origin
      if (event.origin !== window.location.origin) {
        console.error('🚨 Rejected service worker message from invalid origin:', event.origin);
        return;
      }
      this.handleServiceWorkerMessage(event);
    };
    
    // Store handlers for cleanup
    this.boundHandlers.set('sw-update', updateHandler);
    this.boundHandlers.set('sw-message', messageHandler);
    
    // Add listeners
    registration.addEventListener('updatefound', updateHandler);
    navigator.serviceWorker.addEventListener('message', messageHandler);
  }
  
  /**
   * FIXED: Wait for service worker with timeout and better state handling
   */
  async waitForServiceWorkerReady(registration, timeout = 15000) {
    // If already active, return immediately
    if (registration.active && registration.active.state === 'activated') {
      return;
    }
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Service Worker activation timeout'));
      }, timeout);
      
      const checkState = () => {
        if (registration.active && registration.active.state === 'activated') {
          clearTimeout(timeoutId);
          resolve();
          return;
        }
        
        // If installing, wait for state change
        const worker = registration.installing || registration.waiting || registration.active;
        if (worker) {
          const handleStateChange = () => {
            if (worker.state === 'activated') {
              clearTimeout(timeoutId);
              worker.removeEventListener('statechange', handleStateChange);
              resolve();
            } else if (worker.state === 'redundant') {
              clearTimeout(timeoutId);
              worker.removeEventListener('statechange', handleStateChange);
              reject(new Error('Service Worker became redundant'));
            }
          };
          
          worker.addEventListener('statechange', handleStateChange);
          
          // Trigger skip waiting if worker is waiting
          if (worker.state === 'installed' && registration.waiting) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        } else {
          // No worker found, reject
          clearTimeout(timeoutId);
          reject(new Error('No service worker found'));
        }
      };
      
      checkState();
    });
  }
  
  /**
   * Handle service worker messages securely
   */
  handleServiceWorkerMessage(event) {
    if (!event?.data || typeof event.data !== 'object') {
      return;
    }
    
    const { type, data } = event.data;
    const allowedTypes = ['NOTIFICATION_CLICK', 'NOTIFICATION_CLOSE', 'SW_UPDATE_AVAILABLE', 'SW_READY'];
    
    if (!allowedTypes.includes(type)) {
      console.warn('⚠️ Unknown service worker message type:', type);
      return;
    }
    
    switch (type) {
      case 'NOTIFICATION_CLICK':
        this.emit('notificationClick', data);
        break;
      case 'NOTIFICATION_CLOSE':
        this.emit('notificationClose', data);
        break;
      case 'SW_UPDATE_AVAILABLE':
        this.emit('updateAvailable', data);
        break;
      case 'SW_READY':
        this.emit('serviceWorkerReady', data);
        break;
    }
  }
  
  /**
   * Setup default handlers and configurations
   */
  setupDefaultHandlers() {
    // Load configuration from environment
    if (this.isBrowser) {
      // Setup default notification click behavior
      this.on('notificationClick', (data) => {
        if (data?.chatId) {
          // Try to focus existing window or open new one
          if (typeof window !== 'undefined') {
            window.focus();
            // You can customize navigation behavior here
          }
        }
      });
    }
  }
  
  /**
   * Load stored settings from localStorage
   */
  loadStoredSettings() {
    if (!this.isBrowser) return;
    
    try {
      const stored = localStorage.getItem('swaggo_notification_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.config = { ...this.config, ...settings };
      }
    } catch (error) {
      console.warn('⚠️ Failed to load notification settings:', error);
    }
  }
  
  /**
   * Save settings to localStorage
   */
  saveSettings() {
    if (!this.isBrowser) return;
    
    try {
      localStorage.setItem('swaggo_notification_settings', JSON.stringify(this.config));
    } catch (error) {
      console.warn('⚠️ Failed to save notification settings:', error);
    }
  }
  
  /**
   * FIXED: Get comprehensive ready state
   */
  getReadyState() {
    return {
      isReady: this.isReady,
      ready: this.ready, // Backward compatibility
      isBrowser: this.isBrowser,
      isPushSupported: this.isPushSupported,
      isServiceWorkerSupported: this.isServiceWorkerSupported,
      hasServiceWorkerRegistration: !!this.serviceWorkerRegistration,
      hasVapidKey: !!this.vapidKeys.publicKey,
      permissionState: this.permissionState,
      permission: this.permission, // Backward compatibility
      initializationAttempts: this.initializationAttempts
    };
  }
  
  /**
   * FIXED: Wait for readiness with timeout
   */
  async waitForReady(timeout = 10000) {
    if (this.isReady) return true;
    
    try {
      await Promise.race([
        this.readyPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), timeout)
        )
      ]);
      return this.isReady;
    } catch (error) {
      console.warn('⚠️ Service initialization timeout:', error.message);
      return this.isReady; // Return current state even if timeout
    }
  }
  
  /**
   * UNIFIED: Main notification display method
   */
  show(notification) {
    // Check if we're in browser environment
    if (!this.isBrowser) {
      console.warn('⚠️ NotificationService: Not in browser environment');
      return null;
    }
    
    // If not ready, try to initialize basic functionality
    if (!this.isReady && !this.ready) {
      console.warn('⚠️ NotificationService not ready, enabling basic functionality');
      // Enable basic functionality immediately for toast notifications
      this.isReady = true;
      this.ready = true;
      console.log('✅ NotificationService: Basic functionality enabled');
    }
    
    const {
      type = NOTIFICATION_TYPES.INFO,
      title,
      message,
      category = NOTIFICATION_CATEGORIES.SYSTEM,
      duration = this.config.defaultDuration,
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
      duration,
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
    this.addToHistory(notificationData);
    
    // Show toast notification (always available)
    this.showToast(notificationData);
    
    // Play sound if enabled
    if (sound) {
      this.playNotificationSound(type);
    }
    
    // Vibrate if enabled and supported
    if (vibration && this.isBrowser && navigator.vibrate) {
      this.vibrateDevice(type);
    }
    
    // Show push notification if enabled and page is not focused
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
        className="notification-content cursor-pointer"
        onClick={() => onClick && onClick(notification)}
      >
        {title && <div className="notification-title font-semibold">{title}</div>}
        {message && <div className="notification-message text-sm opacity-90">{message}</div>}
      </div>
    );
    
    const toastOptions = {
      id,
      duration: persistent ? Infinity : duration,
      position: 'top-right',
      style: this.getToastStyle(type)
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
    if (!this.isBrowser || 
        !this.isPushSupported || 
        this.permissionState !== PERMISSION_STATES.GRANTED) {
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
        if (notification.onClick) {
          notification.onClick(notification);
        }
        this.emit('notificationClicked', notification);
        pushNotification.close();
      };
      
      pushNotification.onclose = () => {
        if (notification.onClose) {
          notification.onClose(notification);
        }
        this.emit('notificationClosed', notification);
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
   * Request push notification permission
   */
  async requestPermission() {
    try {
      // Check if Notification API is available
      if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return 'denied';
      }

      // Check current permission status
      if (Notification.permission === 'granted') {
        this.permission = 'granted';
        return 'granted';
      }

      // If permission is denied, don't ask again
      if (Notification.permission === 'denied') {
        this.permission = 'denied';
        return 'denied';
      }

      // Request permission
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      // Update registration if we have a service worker
      if (this.registration && permission === 'granted') {
        try {
          await this.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.vapidPublicKey
          });
        } catch (error) {
          console.error('Failed to subscribe to push notifications:', error);
        }
      }
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a browser notification with ringtone for incoming calls
   */
  async showCallNotification(title, options = {}) {
    try {
      // Request permission if not already granted
      if (this.permission !== 'granted') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          console.warn('Notification permission not granted');
          return null;
        }
      }

      // Play ringtone if specified
      if (options.ringtone) {
        this.playRingtone(options.ringtone);
      }

      // Create notification
      const notification = new Notification(title, {
        body: options.body || '',
        icon: options.icon || '/logo192.png',
        tag: options.tag || 'call-notification',
        requireInteraction: true, // Keep notification until user interacts
        ...options
      });

      // Handle notification events
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };

      notification.onclose = () => {
        if (options.onClose) {
          options.onClose();
        }
        this.stopRingtone();
      };

      return notification;
    } catch (error) {
      console.error('Error showing call notification:', error);
      return null;
    }
  }

  /**
   * Play ringtone for incoming calls
   */
  playRingtone(ringtoneUrl) {
    try {
      // Stop any existing ringtone
      this.stopRingtone();
      
      // Create audio element
      this.ringtoneAudio = new Audio(ringtoneUrl);
      this.ringtoneAudio.loop = true;
      this.ringtoneAudio.volume = 0.8;
      
      // Play the ringtone
      this.ringtoneAudio.play().catch(error => {
        console.warn('Failed to play ringtone:', error);
      });
    } catch (error) {
      console.warn('Error playing ringtone:', error);
    }
  }

  /**
   * Stop ringtone
   */
  stopRingtone() {
    try {
      if (this.ringtoneAudio) {
        this.ringtoneAudio.pause();
        this.ringtoneAudio = null;
      }
    } catch (error) {
      console.warn('Error stopping ringtone:', error);
    }
  }

  /**
   * Persist notification until answered/rejected
   */
  async showPersistentNotification(title, options = {}) {
    try {
      // Request permission if not granted
      if (this.permission !== 'granted') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          return null;
        }
      }

      // Create persistent notification
      const notification = new Notification(title, {
        body: options.body || '',
        icon: options.icon || '/logo192.png',
        tag: options.tag || 'persistent-notification',
        requireInteraction: true, // Keep notification until user interacts
        ...options
      });

      // Handle notification events
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
      };

      return notification;
    } catch (error) {
      console.error('Error showing persistent notification:', error);
      return null;
    }
  }
  
  /**
   * Utility methods
   */
  generateNotificationId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  shouldShowPush() {
    if (!this.isBrowser) return false;
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
      [NOTIFICATION_TYPES.SUCCESS]: { background: '#10b981', color: 'white' },
      [NOTIFICATION_TYPES.ERROR]: { background: '#ef4444', color: 'white' },
      [NOTIFICATION_TYPES.WARNING]: { background: '#f59e0b', color: 'white' },
      [NOTIFICATION_TYPES.INFO]: { background: '#3b82f6', color: 'white' },
      [NOTIFICATION_TYPES.LOADING]: { background: '#6b7280', color: 'white' }
    };

    return {
      ...baseStyle,
      ...(typeStyles[type] || typeStyles[NOTIFICATION_TYPES.INFO])
    };
  }
  
  playNotificationSound(type) {
    if (!this.isBrowser) return;
    
    try {
      // Use Web Audio API for better control
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different tones for different types
      switch (type) {
        case NOTIFICATION_TYPES.SUCCESS:
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
          break;
        case NOTIFICATION_TYPES.ERROR:
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.2);
          break;
        default:
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      }
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }
  
  vibrateDevice(type) {
    if (!this.isBrowser || !navigator.vibrate) return;
    
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
  
  /**
   * Notification management
   */
  dismiss(id) {
    toast.dismiss(id);
    this.activeNotifications.delete(id);
    this.emit('notificationDismissed', { id });
  }
  
  dismissAll() {
    toast.dismiss();
    this.activeNotifications.clear();
    this.emit('allNotificationsDismissed');
  }
  
  addToHistory(notification) {
    this.notificationHistory.unshift(notification);
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(0, this.maxHistorySize);
    }
  }
  
  /**
   * Event system
   */
  on(eventName, listener) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(listener);
    
    return () => this.off(eventName, listener);
  }
  
  off(eventName, listener) {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  emit(eventName, data) {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for '${eventName}':`, error);
        }
      });
    }
  }
  
  /**
   * Convenience methods for different notification types
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
   * BACKWARD COMPATIBILITY METHODS
   */
  
  // Legacy initialization method
  async initialize(userId, options = {}) {
    try {
      console.log('🔔 UnifiedNotificationService: Legacy initialize called with userId:', userId);
      
      this.userId = userId;
      
      // Wait for service to be ready
      await this.waitForReady(15000);
      
      // Request permissions if needed
      if (this.permissionState === PERMISSION_STATES.DEFAULT && options.autoRequestPermission !== false) {
        await this.requestPermission();
      }
      
      // Setup chat features if userId provided
      if (userId) {
        this.setupChatFeatures(userId);
      }
      
      console.log('✅ UnifiedNotificationService: Legacy initialization complete');
      return true;
      
    } catch (error) {
      console.error('❌ UnifiedNotificationService: Legacy initialization failed:', error);
      throw error;
    }
  }
  
  // Chat-specific setup
  setupChatFeatures(userId) {
    this.userId = userId;
    this.currentChatId = null;
    this.chatSettings = {
      soundEnabled: this.config.enableSound,
      vibrationEnabled: this.config.enableVibration,
      showPreview: true,
      doNotDisturb: false
    };
    
    console.log('💬 Chat features setup for userId:', userId);
  }
  
  // Legacy ready check
  isReady() {
    return this.isReady && this.ready;
  }
  
  // Legacy permission methods
  getPermissionStatus() {
    return this.permissionState || this.permission;
  }
  
  shouldRequestPermission() {
    const permission = this.getPermissionStatus();
    return permission === PERMISSION_STATES.DEFAULT && this.isPushSupported;
  }
  
  // Legacy handler setters
  setUserId(userId) {
    this.setupChatFeatures(userId);
  }
  
  setCurrentChat(chatId) {
    this.currentChatId = chatId;
  }
  
  setNotificationClickHandler(handler) {
    this.on('notificationClick', handler);
  }
  
  setCallClickHandler(handler) {
    this.on('callClick', handler);
  }
  
  setCallBackHandler(handler) {
    this.on('callBack', handler);
  }
  
  setMarkReadHandler(handler) {
    this.on('markRead', handler);
  }
  
  // Legacy toast methods with backward compatibility
  showLegacyToast(type, message, options = {}) {
    return this.show({
      type: type || NOTIFICATION_TYPES.INFO,
      title: options.title || '',
      message,
      ...options
    });
  }
  
  // Legacy message notification
  showMessageNotification(message, chat, sender) {
    const senderName = sender?.username || sender?.name || 'Unknown';
    const chatName = chat?.chatName || `Chat with ${senderName}`;
    
    return this.show({
      type: NOTIFICATION_TYPES.INFO,
      title: `New message from ${senderName}`,
      message: message?.content || 'New message',
      category: NOTIFICATION_CATEGORIES.CHAT,
      data: { 
        chatId: chat?.chatid,
        messageId: message?.messageid,
        senderId: sender?.profileid 
      }
    });
  }
  
  // Badge management
  updateBadgeCount(count) {
    if (this.isBrowser && 'setAppBadge' in navigator) {
      navigator.setAppBadge(count).catch(err => {
        console.warn('Could not set app badge:', err);
      });
    }
  }
  
  // Test notification method
  testNotification() {
    return this.show({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: '🎉 Test Notification',
      message: 'Notifications are working correctly! This is a test message.',
      category: NOTIFICATION_CATEGORIES.SYSTEM,
      duration: 5000,
      sound: true,
      vibration: true,
      push: true
    });
  }
  
  // Legacy showNotification method for backward compatibility
  showNotification(title, options = {}) {
    if (!this.isBrowser || !this.isPushSupported || this.permissionState !== PERMISSION_STATES.GRANTED) {
      return null;
    }
    
    const {
      body = '',
      icon = '/icons/notification-icon.png',
      badge = '/icons/notification-badge.png',
      tag = 'swaggo-notification',
      data = {},
      requireInteraction = false,
      silent = false,
      actions = [],
      onClick,
      onClose
    } = options;
    
    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge,
        tag,
        data: {
          ...data,
          timestamp: Date.now()
        },
        requireInteraction,
        silent,
        actions: actions.map(action => ({
          action: action.action || action.id,
          title: action.title,
          icon: action.icon
        }))
      });
      
      notification.onclick = () => {
        if (onClick) {
          onClick(notification);
        }
        this.emit('notificationClicked', { title, data });
        notification.close();
      };
      
      notification.onclose = () => {
        if (onClose) {
          onClose(notification);
        }
        this.emit('notificationClosed', { title, data });
      };
      
      // Auto-close after 5 seconds if not persistent
      if (!requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
      
      return notification;
      
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return null;
    }
  }
  
  // Call notification method
  showCallNotification(caller, callType, chatId, callId) {
    const callerName = caller?.username || caller?.name || 'Unknown Caller';
    const typeText = callType === 'video' ? 'Video Call' : 'Voice Call';
    
    return this.show({
      type: NOTIFICATION_TYPES.CUSTOM,
      title: `Incoming ${typeText}`,
      message: `${callerName} is calling you`,
      category: NOTIFICATION_CATEGORIES.CALL,
      persistent: true,
      sound: true,
      vibration: [200, 100, 200, 100, 200],
      push: true,
      actions: [
        { id: 'answer', title: 'Answer', icon: '/icons/phone-answer.png' },
        { id: 'decline', title: 'Decline', icon: '/icons/phone-decline.png' }
      ],
      data: { 
        chatId,
        callType,
        callerId: caller?.profileid,
        callId,
        type: 'incoming_call'
      },
      onClick: () => {
        if (this.isBrowser) {
          window.focus();
        }
        this.emit('callClick', { chatId, callType, callerId: caller?.profileid, action: 'answer' });
      }
    });
  }
  
  /**
   * Cleanup method
   */
  destroy() {
    // Clean up event listeners
    if (this.isBrowser) {
      // Remove service worker listeners
      this.boundHandlers.forEach((handler, key) => {
        if (key.startsWith('sw-')) {
          // Clean up service worker listeners
          if (this.serviceWorkerRegistration && key === 'sw-update') {
            this.serviceWorkerRegistration.removeEventListener('updatefound', handler);
          } else if (key === 'sw-message') {
            navigator.serviceWorker.removeEventListener('message', handler);
          }
        }
      });
    }
    
    // Clear all notifications
    this.dismissAll();
    
    // Clear internal state
    this.listeners.clear();
    this.activeNotifications.clear();
    this.notificationHistory = [];
    this.boundHandlers.clear();
    
    // Reset ready state
    this.isReady = false;
    this.ready = false;
    
    console.log('🧹 UnifiedNotificationService destroyed and cleaned up');
  }
}

// Create singleton instance
const unifiedNotificationService = new UnifiedNotificationService();

// For browser environment, make it globally available for debugging
if (typeof window !== 'undefined') {
  window.unifiedNotificationService = unifiedNotificationService;
  console.log('🔔 UnifiedNotificationService loaded and available globally');
}

export default unifiedNotificationService;
export { UnifiedNotificationService };