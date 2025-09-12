'use client';

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
    this.soundEnabled = true;
    this.lastNotificationTime = {};
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    
    this.init();
  }

  async init() {
    if (!this.isSupported) {
      console.warn('Browser does not support notifications');
      return;
    }

    this.permission = Notification.permission;
    
    // Load settings from localStorage
    const settings = this.getStoredSettings();
    this.soundEnabled = settings.soundEnabled;
  }

  getStoredSettings() {
    if (typeof window === 'undefined') return { soundEnabled: true };
    
    const stored = localStorage.getItem('chat_notification_settings');
    return stored ? JSON.parse(stored) : { soundEnabled: true };
  }

  saveSettings(settings) {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('chat_notification_settings', JSON.stringify(settings));
  }

  async requestPermission() {
    if (!this.isSupported) return false;
    
    if (this.permission === 'granted') return true;
    
    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Throttle notifications to prevent spam
  shouldShowNotification(chatId) {
    const now = Date.now();
    const lastTime = this.lastNotificationTime[chatId] || 0;
    const throttleTime = 3000; // 3 seconds

    if (now - lastTime < throttleTime) {
      return false;
    }

    this.lastNotificationTime[chatId] = now;
    return true;
  }

  playNotificationSound() {
    if (!this.soundEnabled) return;

    try {
      // Create audio context for better browser support
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a simple notification tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
      // Fallback to simple beep
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LKeSsFJH7K79iQQAUUXrTp66hVFApGn+LyvmIYAy2EzPPfhzEHE2m98OOgUQQUXq/l76xTEAhMrOTyu2EcBjN+y/PKfS0GIHvI8N2EOgsXZ7Tr7qlYFgdBqOX0r2IZBCh7xPDNfzEIA2m16dSjbxgJTaHj7K1bFQpNn+LrvGsePgJDb8tOOhAIUqfhyqWxDgAFRc/Jb2vFgAACBwfNzqW1DgEFRs/Jb2vFgAACBwfNzqW1DgEFR8/Jb2vGgAACBwfNzqW1DgEFRs/Jb2vFgAACBwfNzqW1DgEFRs/Jb2vFgAACBwfNzqW1Dg==');
        audio.play();
      } catch (fallbackError) {
        console.warn('Fallback notification sound also failed:', fallbackError);
      }
    }
  }

  showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return null;
    }

    // Enhanced options with chat-specific styling
    const notificationOptions = {
      icon: '/icons/message-icon-192.png',
      badge: '/icons/message-badge-72.png',
      tag: `chat-${options.chatId || 'general'}`,
      renotify: true,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      ...options
    };

    try {
      const notification = new Notification(title, notificationOptions);
      
      // Auto-close after 5 seconds if not interacted with
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification interactions
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to chat if callback provided
        if (options.onClick) {
          options.onClick();
        }
      };

      notification.onclose = () => {
        if (options.onClose) {
          options.onClose();
        }
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  async showMessageNotification(message, chat, sender) {
    // Check if we should show notification
    if (!this.shouldShowNotification(chat.chatid)) {
      return;
    }

    // Don't show notification if page is visible and chat is active
    if (!document.hidden && this.isCurrentChat(chat.chatid)) {
      this.playNotificationSound();
      return;
    }

    const title = chat.chatType === 'group' 
      ? `${sender.username} in ${chat.chatName || 'Group Chat'}`
      : sender.name || sender.username;

    const body = this.formatMessageForNotification(message);
    
    const options = {
      body,
      chatId: chat.chatid,
      data: {
        chatId: chat.chatid,
        messageId: message.messageid,
        senderId: sender.profileid
      },
      onClick: () => {
        // This will be handled by the parent component
        if (this.onNotificationClick) {
          this.onNotificationClick(chat.chatid);
        }
      }
    };

    this.showNotification(title, options);
    this.playNotificationSound();
  }

  formatMessageForNotification(message) {
    if (!message.content && message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0];
      switch (attachment.type) {
        case 'image': return '📷 Sent a photo';
        case 'video': return '🎥 Sent a video';
        case 'audio': return '🎵 Sent an audio message';
        case 'file': return '📎 Sent a file';
        default: return 'Sent an attachment';
      }
    }
    
    // Truncate long messages
    const content = message.content || 'Sent a message';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  // Queue system for rapid notifications
  queueNotification(title, options) {
    this.notificationQueue.push({ title, options, timestamp: Date.now() });
    
    if (!this.isProcessingQueue) {
      this.processNotificationQueue();
    }
  }

  async processNotificationQueue() {
    if (this.notificationQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const { title, options } = this.notificationQueue.shift();
    
    this.showNotification(title, options);
    
    // Wait a bit before processing next notification
    setTimeout(() => {
      this.processNotificationQueue();
    }, 500);
  }

  // Badge management for app icon
  updateBadgeCount(count) {
    if ('navigator' in window && 'setAppBadge' in navigator) {
      navigator.setAppBadge(count).catch(err => {
        console.warn('Could not set app badge:', err);
      });
    }
  }

  clearBadge() {
    if ('navigator' in window && 'clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(err => {
        console.warn('Could not clear app badge:', err);
      });
    }
  }

  // Settings management
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    this.saveSettings({ soundEnabled: enabled });
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }

  // Utility methods
  isCurrentChat(chatId) {
    // This should be set by the parent component
    return this.currentChatId === chatId;
  }

  setCurrentChat(chatId) {
    this.currentChatId = chatId;
  }

  setNotificationClickHandler(handler) {
    this.onNotificationClick = handler;
  }

  // Cleanup
  destroy() {
    this.notificationQueue = [];
    this.lastNotificationTime = {};
    this.isProcessingQueue = false;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
