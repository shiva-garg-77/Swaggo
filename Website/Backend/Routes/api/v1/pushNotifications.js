import express from 'express';
import webpush from 'web-push';
import Profile from '../../../Models/FeedModels/Profile.js';
import PushSubscription from '../../../Models/FeedModels/PushSubscription.js';

const router = express.Router();

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@swaggo.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing subscription or user ID'
      });
    }

    // Validate subscription format
    if (!subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription format'
      });
    }

    // Check if user exists
    const user = await Profile.findOne({ profileid: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Save or update subscription
    await PushSubscription.findOneAndUpdate(
      { userId: userId },
      {
        userId: userId,
        subscription: subscription,
        userAgent: req.get('User-Agent'),
        isActive: true,
        lastUsed: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Push notification subscription saved successfully'
    });

  } catch (error) {
    console.error('Push subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save push subscription'
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing user ID'
      });
    }

    await PushSubscription.findOneAndUpdate(
      { userId: userId },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Push notifications disabled successfully'
    });

  } catch (error) {
    console.error('Push unsubscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from push notifications'
    });
  }
});

// Send test notification (for development)
router.post('/test', async (req, res) => {
  try {
    const { userId, title, body } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing user ID'
      });
    }

    const pushSub = await PushSubscription.findOne({ 
      userId: userId, 
      isActive: true 
    });

    if (!pushSub) {
      return res.status(404).json({
        success: false,
        message: 'No active push subscription found for user'
      });
    }

    const payload = JSON.stringify({
      title: title || 'Test Notification',
      body: body || 'This is a test notification from SwagGo',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    });

    await webpush.sendNotification(pushSub.subscription, payload);

    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

// Send notification to user
const sendNotificationToUser = async (userId, payload, options = {}) => {
  try {
    const pushSub = await PushSubscription.findOne({ 
      userId: userId, 
      isActive: true 
    });

    if (!pushSub) {
      console.log(`No active push subscription for user: ${userId}`);
      return false;
    }

    // Update last used timestamp
    pushSub.lastUsed = new Date();
    await pushSub.save();

    const notificationPayload = JSON.stringify({
      ...payload,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      timestamp: new Date().toISOString()
    });

    await webpush.sendNotification(
      pushSub.subscription, 
      notificationPayload,
      {
        TTL: options.ttl || 86400, // 24 hours
        urgency: options.urgency || 'normal', // low, normal, high
        topic: options.topic || undefined
      }
    );

    console.log(`Notification sent to user: ${userId}`);
    return true;

  } catch (error) {
    console.error(`Failed to send notification to user ${userId}:`, error);
    
    // If subscription is invalid, mark it as inactive
    if (error.statusCode === 410 || error.statusCode === 404) {
      await PushSubscription.findOneAndUpdate(
        { userId: userId },
        { isActive: false }
      );
      console.log(`Marked push subscription as inactive for user: ${userId}`);
    }
    
    return false;
  }
};

// Send notification to multiple users
const sendNotificationToUsers = async (userIds, payload, options = {}) => {
  const promises = userIds.map(userId => 
    sendNotificationToUser(userId, payload, options)
  );
  
  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value === true
  ).length;
  
  console.log(`Sent notifications to ${successful}/${userIds.length} users`);
  return successful;
};

// Clean up inactive subscriptions (run periodically)
router.delete('/cleanup', async (req, res) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDays(cutoffDate.getDate() - 30); // 30 days old

    const result = await PushSubscription.deleteMany({
      $or: [
        { isActive: false },
        { lastUsed: { $lt: cutoffDate } }
      ]
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} inactive subscriptions`
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up subscriptions'
    });
  }
});

// Get subscription status for user
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await PushSubscription.findOne({ 
      userId: userId,
      isActive: true 
    });

    res.json({
      success: true,
      hasSubscription: !!subscription,
      lastUsed: subscription?.lastUsed || null
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription status'
    });
  }
});

export { router, sendNotificationToUser, sendNotificationToUsers };
