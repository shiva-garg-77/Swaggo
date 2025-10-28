/**
 * Backend Notification Service
 * Handles server-side notification logic, push notifications, and notification management
 */

import webpush from 'web-push';
import { performance } from 'perf_hooks';
import User from '../Models/User.js';
import { getConfig } from '../Config/EnvironmentValidator.js';

class NotificationService {
  constructor() {
    // Initialize web push with VAPID keys
    this.initializeWebPush();
    
    // Performance metrics
    this.metrics = {
      totalNotifications: 0,
      successfulNotifications: 0,
      failedNotifications: 0,
      averageProcessingTime: 0
    };
    
    // Notification types
    this.NOTIFICATION_TYPES = {
      CHAT_MESSAGE: 'chat_message',
      CALL: 'call',
      FRIEND_REQUEST: 'friend_request',
      SYSTEM: 'system',
      MENTION: 'mention',
      REACTION: 'reaction'
    };
    
    // Notification priorities
    this.PRIORITY_LEVELS = {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      URGENT: 'urgent'
    };
  }

  /**
   * Initialize Web Push with VAPID keys
   */
  initializeWebPush() {
    try {
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      
      if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(
          'mailto:' + (process.env.ADMIN_EMAIL || 'admin@swaggo.com'),
          vapidPublicKey,
          vapidPrivateKey
        );
        console.log('✅ Web Push initialized with VAPID keys');
      } else {
        console.warn('⚠️ VAPID keys not configured - push notifications disabled');
      }
    } catch (error) {
      console.error('❌ Error initializing Web Push:', error);
    }
  }

  /**
   * Send push notification to a user
   */
  async sendPushNotification(userId, notificationData) {
    const startTime = performance.now();
    this.metrics.totalNotifications++;
    
    try {
      // Get user with push subscriptions
      const user = await User.findById(userId).select('pushSubscriptions');
      if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
        throw new Error('User not found or no push subscriptions');
      }
      
      // Prepare notification payload
      const payload = JSON.stringify({
        title: notificationData.title,
        body: notificationData.body,
        icon: notificationData.icon || '/icons/notification-icon.png',
        badge: notificationData.badge || '/icons/notification-badge.png',
        data: {
          ...notificationData.data,
          timestamp: Date.now(),
          userId: userId
        },
        tag: notificationData.tag || `notification-${Date.now()}`,
        requireInteraction: notificationData.requireInteraction || false,
        silent: notificationData.silent || false
      });
      
      // Send to all user's subscriptions
      const sendPromises = user.pushSubscriptions.map(subscription => {
        return webpush.sendNotification(subscription, payload)
          .catch(error => {
            console.error(`❌ Failed to send push notification to subscription:`, error);
            // Remove invalid subscription
            return this.removeInvalidSubscription(userId, subscription);
          });
      });
      
      await Promise.all(sendPromises);
      
      // Update metrics
      const processingTime = performance.now() - startTime;
      this.metrics.successfulNotifications++;
      this.metrics.averageProcessingTime = (
        (this.metrics.averageProcessingTime * (this.metrics.successfulNotifications - 1) + processingTime) / 
        this.metrics.successfulNotifications
      );
      
      console.log(`✅ Push notification sent to user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error sending push notification to user ${userId}:`, error);
      
      // Update metrics
      this.metrics.failedNotifications++;
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove invalid push subscription
   */
  async removeInvalidSubscription(userId, subscription) {
    try {
      await User.findByIdAndUpdate(userId, {
        $pull: { pushSubscriptions: subscription }
      });
      console.log(`✅ Removed invalid push subscription for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error removing invalid subscription for user ${userId}:`, error);
    }
  }

  /**
   * Store push subscription for a user
   */
  async storePushSubscription(userId, subscription) {
    try {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { pushSubscriptions: subscription }
      });
      console.log(`✅ Stored push subscription for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error storing push subscription for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove push subscription for a user
   */
  async removePushSubscription(userId, subscription) {
    try {
      await User.findByIdAndUpdate(userId, {
        $pull: { pushSubscriptions: subscription }
      });
      console.log(`✅ Removed push subscription for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error removing push subscription for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(userId, notificationData) {
    // This would typically store the notification in a database
    // For now, we'll just log it
    console.log(`📧 In-app notification for user ${userId}:`, notificationData);
    return { success: true, notificationId: `notification_${Date.now()}` };
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(userId, notificationData) {
    // This would integrate with an email service
    // For now, we'll just log it
    console.log(`📧 Email notification for user ${userId}:`, notificationData);
    return { success: true };
  }

  /**
   * Send notification through all channels
   */
  async sendNotification(userId, notificationData, channels = ['push', 'inapp']) {
    const results = {};
    
    if (channels.includes('push')) {
      results.push = await this.sendPushNotification(userId, notificationData);
    }
    
    if (channels.includes('inapp')) {
      results.inapp = await this.sendInAppNotification(userId, notificationData);
    }
    
    if (channels.includes('email')) {
      results.email = await this.sendEmailNotification(userId, notificationData);
    }
    
    return results;
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(userIds, notificationData, channels = ['push', 'inapp']) {
    const results = {};
    
    for (const userId of userIds) {
      results[userId] = await this.sendNotification(userId, notificationData, channels);
    }
    
    return results;
  }

  /**
   * Send chat message notification
   */
  async sendChatMessageNotification(recipientId, sender, message, chatId) {
    const notificationData = {
      title: `New message from ${sender.username}`,
      body: message.content.length > 50 ? message.content.substring(0, 47) + '...' : message.content,
      icon: sender.avatar || '/icons/user-icon.png',
      tag: `chat-${chatId}`,
      data: {
        type: this.NOTIFICATION_TYPES.CHAT_MESSAGE,
        chatId: chatId,
        messageId: message.messageid,
        senderId: sender.profileid
      }
    };
    
    return await this.sendNotification(recipientId, notificationData, ['push', 'inapp']);
  }

  /**
   * Send call notification
   */
  async sendCallNotification(recipientId, caller, callType, callId) {
    const notificationData = {
      title: `Incoming ${callType} call`,
      body: `${caller.username} is calling you`,
      icon: caller.avatar || '/icons/user-icon.png',
      tag: `call-${callId}`,
      requireInteraction: true,
      data: {
        type: this.NOTIFICATION_TYPES.CALL,
        callId: callId,
        callerId: caller.profileid,
        callType: callType
      }
    };
    
    return await this.sendNotification(recipientId, notificationData, ['push']);
  }

  /**
   * Get notification metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Clear notification metrics
   */
  clearMetrics() {
    this.metrics = {
      totalNotifications: 0,
      successfulNotifications: 0,
      failedNotifications: 0,
      averageProcessingTime: 0
    };
  }
}

// Export singleton instance
export default new NotificationService();