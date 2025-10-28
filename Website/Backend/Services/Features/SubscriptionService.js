import Subscription from '../../Models/Subscription.js';
import User from '../../Models/User.js';
import { v4 as uuidv4 } from 'uuid';
import BaseService from '../System/BaseService.js';
import { NotFoundError, ValidationError, AuthorizationError } from '../../Helper/UnifiedErrorHandling.js';
import { TYPES } from '../../Config/DIContainer.js';

/**
 * @fileoverview Subscription service handling all subscription-related business logic
 * @module SubscriptionService
 */

class SubscriptionService extends BaseService {
  /**
   * @constructor
   * @description Initialize subscription service
   */
  constructor() {
    super();
  }

  /**
   * Create a new subscription for a user
   * @param {string} userId - User ID
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(userId, subscriptionData) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ userId, subscriptionData }, ['userId', 'subscriptionData']);
      
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Validate subscription data
      const { plan, payment, startDate, endDate, trial, autoRenew = true } = subscriptionData;
      
      if (!plan || !plan.name || !plan.price) {
        throw new ValidationError('Invalid plan data');
      }
      
      if (!startDate || !endDate) {
        throw new ValidationError('Start date and end date are required');
      }
      
      // Check if user already has an active subscription
      const existingActiveSubscription = await Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gte: new Date() }
      });
      
      if (existingActiveSubscription) {
        throw new ValidationError('User already has an active subscription');
      }
      
      // Create subscription
      const subscription = new Subscription({
        subscriptionId: uuidv4(),
        userId,
        plan,
        status: 'active',
        payment,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        trial,
        autoRenew,
        usage: {
          messages: 0,
          storage: 0,
          bandwidth: 0
        }
      });
      
      await subscription.save();
      
      // Update user with subscription info
      user.subscription = {
        subscriptionId: subscription.subscriptionId,
        plan: subscription.plan.name,
        status: subscription.status,
        endDate: subscription.endDate
      };
      
      await user.save();
      
      return this.formatEntity(subscription);
    }, 'createSubscription');
  }

  /**
   * Get subscription by ID
   * @param {string} subscriptionId - Subscription ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscription(subscriptionId, userId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ subscriptionId }, ['subscriptionId']);
      
      const subscription = await Subscription.findOne({ subscriptionId });
      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }
      
      // Check authorization
      if (userId && subscription.userId !== userId) {
        throw new AuthorizationError('Not authorized to access this subscription');
      }
      
      return this.formatEntity(subscription);
    }, 'getSubscription');
  }

  /**
   * Get all subscriptions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User subscriptions
   */
  async getUserSubscriptions(userId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ userId }, ['userId']);
      
      const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });
      return subscriptions.map(sub => this.formatEntity(sub));
    }, 'getUserSubscriptions');
  }

  /**
   * Update subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(subscriptionId, updateData, userId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ subscriptionId, updateData }, ['subscriptionId', 'updateData']);
      
      const subscription = await Subscription.findOne({ subscriptionId });
      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }
      
      // Check authorization
      if (userId && subscription.userId !== userId) {
        throw new AuthorizationError('Not authorized to update this subscription');
      }
      
      // Update allowed fields
      const allowedUpdates = [
        'status', 'autoRenew', 'payment', 'plan', 'endDate'
      ];
      
      for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
          subscription[key] = updateData[key];
        }
      }
      
      // Update timestamps
      subscription.updatedAt = new Date();
      
      await subscription.save();
      
      // Update user subscription info if needed
      if (userId) {
        const user = await User.findById(userId);
        if (user && user.subscription && user.subscription.subscriptionId === subscriptionId) {
          user.subscription.status = subscription.status;
          user.subscription.endDate = subscription.endDate;
          user.subscription.plan = subscription.plan.name;
          await user.save();
        }
      }
      
      return this.formatEntity(subscription);
    }, 'updateSubscription');
  }

  /**
   * Cancel subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} cancellationData - Cancellation data
   * @returns {Promise<Object>} Cancelled subscription
   */
  async cancelSubscription(subscriptionId, userId, cancellationData = {}) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ subscriptionId }, ['subscriptionId']);
      
      const subscription = await Subscription.findOne({ subscriptionId });
      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }
      
      // Check authorization
      if (userId && subscription.userId !== userId) {
        throw new AuthorizationError('Not authorized to cancel this subscription');
      }
      
      // Cancel subscription
      subscription.status = 'cancelled';
      subscription.autoRenew = false;
      subscription.cancellation = {
        requestedAt: new Date(),
        reason: cancellationData.reason,
        feedback: cancellationData.feedback
      };
      
      await subscription.save();
      
      // Update user subscription info
      if (userId) {
        const user = await User.findById(userId);
        if (user && user.subscription && user.subscription.subscriptionId === subscriptionId) {
          user.subscription.status = 'cancelled';
          await user.save();
        }
      }
      
      return this.formatEntity(subscription);
    }, 'cancelSubscription');
  }

  /**
   * Renew subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} renewalData - Renewal data
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Renewed subscription
   */
  async renewSubscription(subscriptionId, renewalData, userId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ subscriptionId, renewalData }, ['subscriptionId', 'renewalData']);
      
      const subscription = await Subscription.findOne({ subscriptionId });
      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }
      
      // Check authorization
      if (userId && subscription.userId !== userId) {
        throw new UnauthorizedError('Not authorized to renew this subscription');
      }
      
      // Renew subscription
      subscription.status = 'active';
      subscription.startDate = new Date();
      subscription.endDate = renewalData.endDate || 
                            new Date(subscription.endDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      subscription.plan = renewalData.plan || subscription.plan;
      subscription.autoRenew = renewalData.autoRenew !== undefined ? 
                              renewalData.autoRenew : subscription.autoRenew;
      
      await subscription.save();
      
      // Update user subscription info
      if (userId) {
        const user = await User.findById(userId);
        if (user && user.subscription && user.subscription.subscriptionId === subscriptionId) {
          user.subscription.status = 'active';
          user.subscription.endDate = subscription.endDate;
          user.subscription.plan = subscription.plan.name;
          await user.save();
        }
      }
      
      return this.formatEntity(subscription);
    }, 'renewSubscription');
  }

  /**
   * Update usage metrics for a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} usageData - Usage data
   * @returns {Promise<Object>} Updated subscription
   */
  async updateUsage(subscriptionId, usageData) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ subscriptionId, usageData }, ['subscriptionId', 'usageData']);
      
      const subscription = await Subscription.findOne({ subscriptionId });
      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }
      
      // Update usage
      if (usageData.messages) {
        subscription.usage.messages += usageData.messages;
      }
      
      if (usageData.storage) {
        subscription.usage.storage += usageData.storage;
      }
      
      if (usageData.bandwidth) {
        subscription.usage.bandwidth += usageData.bandwidth;
      }
      
      await subscription.save();
      
      return this.formatEntity(subscription);
    }, 'updateUsage');
  }

  /**
   * Check if user has active subscription
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user has active subscription
   */
  async hasActiveSubscription(userId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ userId }, ['userId']);
      
      const subscription = await Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gte: new Date() }
      });
      
      return !!subscription;
    }, 'hasActiveSubscription');
  }

  /**
   * Get subscription status for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Subscription status
   */
  async getSubscriptionStatus(userId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ userId }, ['userId']);
      
      const subscription = await Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gte: new Date() }
      });
      
      if (!subscription) {
        return {
          hasSubscription: false,
          status: 'none'
        };
      }
      
      return {
        hasSubscription: true,
        status: subscription.status,
        plan: subscription.plan,
        endDate: subscription.endDate,
        daysUntilExpiration: subscription.daysUntilExpiration(),
        isInTrial: subscription.isInTrial(),
        usage: subscription.usage
      };
    }, 'getSubscriptionStatus');
  }

  /**
   * Process subscription expiration
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Processed subscription
   */
  async processExpiration(subscriptionId) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ subscriptionId }, ['subscriptionId']);
      
      const subscription = await Subscription.findOne({ subscriptionId });
      if (!subscription) {
        throw new NotFoundError('Subscription not found');
      }
      
      // Check if subscription is actually expired
      if (subscription.endDate >= new Date()) {
        throw new ValidationError('Subscription is not yet expired');
      }
      
      // Update status to expired
      subscription.status = 'expired';
      subscription.autoRenew = false;
      
      await subscription.save();
      
      // Update user subscription info
      const user = await User.findById(subscription.userId);
      if (user && user.subscription && user.subscription.subscriptionId === subscriptionId) {
        user.subscription.status = 'expired';
        await user.save();
      }
      
      return this.formatEntity(subscription);
    }, 'processExpiration');
  }

  /**
   * Get expiring subscriptions
   * @param {number} days - Days until expiration
   * @returns {Promise<Array>} Expiring subscriptions
   */
  async getExpiringSubscriptions(days = 7) {
    return this.handleOperation(async () => {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      
      const subscriptions = await Subscription.find({
        status: 'active',
        endDate: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate('userId', 'username email');
      
      return subscriptions.map(sub => this.formatEntity(sub));
    }, 'getExpiringSubscriptions');
  }

  /**
   * Get expired subscriptions
   * @returns {Promise<Array>} Expired subscriptions
   */
  async getExpiredSubscriptions() {
    return this.handleOperation(async () => {
      const subscriptions = await Subscription.findExpired().populate('userId', 'username email');
      return subscriptions.map(sub => this.formatEntity(sub));
    }, 'getExpiredSubscriptions');
  }
}

export default SubscriptionService;