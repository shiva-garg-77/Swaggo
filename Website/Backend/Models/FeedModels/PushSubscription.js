import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  // User ID reference
  userId: {
    type: String,
    required: true,
    index: true
  },

  // Push subscription object from browser
  subscription: {
    endpoint: {
      type: String,
      required: true
    },
    keys: {
      p256dh: {
        type: String,
        required: true
      },
      auth: {
        type: String,
        required: true
      }
    },
    expirationTime: {
      type: Date,
      default: null
    }
  },

  // Subscription metadata
  userAgent: {
    type: String,
    default: ''
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Usage tracking
  lastUsed: {
    type: Date,
    default: Date.now
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  // Device/browser information
  deviceInfo: {
    platform: String,
    browser: String,
    version: String,
    mobile: {
      type: Boolean,
      default: false
    }
  },

  // Notification preferences
  preferences: {
    messages: {
      type: Boolean,
      default: true
    },
    calls: {
      type: Boolean,
      default: true
    },
    mentions: {
      type: Boolean,
      default: true
    },
    reactions: {
      type: Boolean,
      default: false
    },
    groupMessages: {
      type: Boolean,
      default: true
    }
  },

  // Statistics
  stats: {
    totalNotificationsSent: {
      type: Number,
      default: 0
    },
    lastNotificationSent: Date,
    failureCount: {
      type: Number,
      default: 0
    },
    lastFailure: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
pushSubscriptionSchema.index({ userId: 1, isActive: 1 });
pushSubscriptionSchema.index({ lastUsed: 1 });
pushSubscriptionSchema.index({ 'subscription.endpoint': 1 }, { unique: true });

// Static methods
pushSubscriptionSchema.statics.getActiveSubscriptionByUserId = function(userId) {
  return this.findOne({ userId, isActive: true });
};

pushSubscriptionSchema.statics.getActiveSubscriptionsByUserIds = function(userIds) {
  return this.find({ 
    userId: { $in: userIds }, 
    isActive: true 
  });
};

pushSubscriptionSchema.statics.markAsUsed = async function(userId) {
  return this.findOneAndUpdate(
    { userId, isActive: true },
    { 
      lastUsed: new Date(),
      $inc: { 'stats.totalNotificationsSent': 1 },
      $set: { 'stats.lastNotificationSent': new Date() }
    }
  );
};

pushSubscriptionSchema.statics.markAsFailed = async function(userId, error) {
  return this.findOneAndUpdate(
    { userId, isActive: true },
    { 
      $inc: { 'stats.failureCount': 1 },
      $set: { 'stats.lastFailure': new Date() }
    }
  );
};

pushSubscriptionSchema.statics.deactivateByUserId = function(userId) {
  return this.findOneAndUpdate(
    { userId },
    { isActive: false }
  );
};

pushSubscriptionSchema.statics.cleanupInactive = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    $or: [
      { isActive: false },
      { lastUsed: { $lt: cutoffDate } },
      { 'stats.failureCount': { $gte: 10 } } // Too many failures
    ]
  });
};

// Instance methods
pushSubscriptionSchema.methods.updatePreferences = function(newPreferences) {
  this.preferences = { ...this.preferences.toObject(), ...newPreferences };
  return this.save();
};

pushSubscriptionSchema.methods.recordNotificationSent = function() {
  this.stats.totalNotificationsSent += 1;
  this.stats.lastNotificationSent = new Date();
  this.lastUsed = new Date();
  return this.save();
};

pushSubscriptionSchema.methods.recordFailure = function() {
  this.stats.failureCount += 1;
  this.stats.lastFailure = new Date();
  return this.save();
};

pushSubscriptionSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Virtual for subscription age
pushSubscriptionSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for days since last use
pushSubscriptionSchema.virtual('daysSinceLastUse').get(function() {
  return Math.floor((Date.now() - this.lastUsed.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for notification success rate
pushSubscriptionSchema.virtual('successRate').get(function() {
  const total = this.stats.totalNotificationsSent;
  const failures = this.stats.failureCount;
  if (total === 0) return 100;
  return Math.round(((total - failures) / total) * 100);
});

const PushSubscription = mongoose.models.PushSubscription || mongoose.model('PushSubscription', pushSubscriptionSchema);
export default PushSubscription;
