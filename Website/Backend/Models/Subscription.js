import mongoose from 'mongoose';

/**
 * @fileoverview Subscription model for managing user subscriptions
 * @module Subscription
 */

const SubscriptionSchema = new mongoose.Schema({
  // Unique subscription ID
  subscriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Reference to the user
  userId: {
    type: String,
    required: true,
    index: true,
    ref: 'User'
  },
  
  // Subscription plan details
  plan: {
    type: {
      name: {
        type: String,
        required: true,
        enum: ['basic', 'premium', 'enterprise']
      },
      price: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'USD'
      },
      features: {
        type: [String],
        default: []
      }
    },
    required: true
  },
  
  // Subscription status
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'pending', 'cancelled', 'expired'],
    default: 'pending',
    index: true
  },
  
  // Payment details
  payment: {
    type: {
      method: {
        type: String,
        enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto']
      },
      last4: String, // Last 4 digits of payment method
      expiryDate: Date, // Expiry date for payment method
      provider: String // Payment provider (Stripe, PayPal, etc.)
    }
  },
  
  // Subscription period
  startDate: {
    type: Date,
    required: true
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  // Trial period (if applicable)
  trial: {
    type: {
      startDate: Date,
      endDate: Date,
      isActive: Boolean
    }
  },
  
  // Auto-renewal settings
  autoRenew: {
    type: Boolean,
    default: true
  },
  
  // Cancellation details
  cancellation: {
    type: {
      requestedAt: Date,
      reason: String,
      feedback: String
    }
  },
  
  // Usage tracking
  usage: {
    type: {
      messages: {
        type: Number,
        default: 0
      },
      storage: {
        type: Number,
        default: 0 // in MB
      },
      bandwidth: {
        type: Number,
        default: 0 // in MB
      }
    }
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1 });
SubscriptionSchema.index({ status: 1, autoRenew: 1 });

// Middleware to update the updatedAt field
SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
SubscriptionSchema.methods = {
  /**
   * Check if subscription is active
   * @returns {boolean} Whether subscription is active
   */
  isActive() {
    return this.status === 'active' && this.endDate > new Date();
  },
  
  /**
   * Check if subscription is in trial
   * @returns {boolean} Whether subscription is in trial period
   */
  isInTrial() {
    return this.trial && this.trial.isActive && 
           this.trial.startDate <= new Date() && 
           this.trial.endDate >= new Date();
  },
  
  /**
   * Check if subscription is expired
   * @returns {boolean} Whether subscription is expired
   */
  isExpired() {
    return this.endDate < new Date();
  },
  
  /**
   * Check if subscription can be renewed
   * @returns {boolean} Whether subscription can be renewed
   */
  canBeRenewed() {
    return this.autoRenew && (this.status === 'active' || this.status === 'expired');
  },
  
  /**
   * Calculate days until expiration
   * @returns {number} Days until subscription expires
   */
  daysUntilExpiration() {
    const today = new Date();
    const diffTime = this.endDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  
  /**
   * Update usage metrics
   * @param {Object} usageData - Usage data to update
   */
  updateUsage(usageData) {
    if (usageData.messages) {
      this.usage.messages += usageData.messages;
    }
    
    if (usageData.storage) {
      this.usage.storage += usageData.storage;
    }
    
    if (usageData.bandwidth) {
      this.usage.bandwidth += usageData.bandwidth;
    }
    
    return this.save();
  },
  
  /**
   * Cancel subscription
   * @param {string} reason - Reason for cancellation
   * @param {string} feedback - User feedback
   */
  cancel(reason, feedback) {
    this.status = 'cancelled';
    this.cancellation = {
      requestedAt: new Date(),
      reason,
      feedback
    };
    this.autoRenew = false;
    return this.save();
  },
  
  /**
   * Renew subscription
   * @param {Object} renewalData - Renewal data
   */
  renew(renewalData) {
    this.status = 'active';
    this.startDate = new Date();
    this.endDate = renewalData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
    this.plan = renewalData.plan || this.plan;
    this.autoRenew = renewalData.autoRenew !== undefined ? renewalData.autoRenew : this.autoRenew;
    return this.save();
  }
};

// Static methods
SubscriptionSchema.statics = {
  /**
   * Find active subscriptions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Active subscriptions
   */
  findActiveByUser(userId) {
    return this.find({
      userId,
      status: 'active',
      endDate: { $gte: new Date() }
    });
  },
  
  /**
   * Find expiring subscriptions
   * @param {number} days - Days until expiration
   * @returns {Promise<Array>} Expiring subscriptions
   */
  findExpiring(days = 7) {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    return this.find({
      status: 'active',
      endDate: {
        $gte: startDate,
        $lte: endDate
      }
    });
  },
  
  /**
   * Find expired subscriptions
   * @returns {Promise<Array>} Expired subscriptions
   */
  findExpired() {
    return this.find({
      $or: [
        { status: 'active', endDate: { $lt: new Date() } },
        { status: 'expired' }
      ]
    });
  }
};

export default mongoose.model('Subscription', SubscriptionSchema);