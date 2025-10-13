import { EventEmitter } from 'events';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * @fileoverview Event bus implementation for event-driven architecture
 * @module EventBus
 * 
 * Implements a centralized event bus for loose coupling between services.
 * Allows services to communicate through events rather than direct dependencies.
 */

class EventBus extends EventEmitter {
  /**
   * @constructor
   * @description Initialize event bus with configuration
   */
  constructor(options = {}) {
    super();
    
    // Set maximum listeners to prevent memory leaks
    this.setMaxListeners(options.maxListeners || 100);
    
    // Event tracking for debugging
    this.eventStats = new Map();
    
    // Event validation
    this.validEvents = new Set([
      // Connection events
      'user.connected',
      'user.disconnected',
      'connection.heartbeat',
      
      // Message events
      'message.sent',
      'message.delivered',
      'message.read',
      'message.updated',
      'message.deleted',
      
      // Chat events
      'chat.created',
      'chat.updated',
      'chat.deleted',
      'chat.joined',
      'chat.left',
      
      // Call events
      'call.initiated',
      'call.accepted',
      'call.rejected',
      'call.ended',
      
      // User events
      'user.status.changed',
      'user.profile.updated',
      
      // System events
      'system.shutdown',
      'system.error',
      'system.health.check'
    ]);
    
    // Log event bus initialization
    logger.info('EventBus initialized', {
      maxListeners: this.getMaxListeners(),
      validEvents: Array.from(this.validEvents)
    });
  }
  
  /**
   * Emit an event with validation
   * @param {string} event - Event name
   * @param {Object} payload - Event payload
   * @returns {boolean} - Whether the event had listeners
   */
  emit(event, payload = {}) {
    // Validate event
    if (!this.validEvents.has(event)) {
      logger.warn('Unknown event emitted', { event, payload });
      // Optionally add to valid events for dynamic registration
      // this.validEvents.add(event);
    }
    
    // Track event statistics
    const currentCount = this.eventStats.get(event) || 0;
    this.eventStats.set(event, currentCount + 1);
    
    // Add timestamp to payload
    const eventPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId()
    };
    
    // Log event emission
    logger.debug(`Event emitted: ${event}`, { event, payload: eventPayload });
    
    // Emit the event
    return super.emit(event, eventPayload);
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} listener - Event listener function
   * @returns {Function} - Unsubscribe function
   */
  on(event, listener) {
    // Validate event
    if (!this.validEvents.has(event)) {
      logger.warn('Subscribing to unknown event', { event });
    }
    
    // Add listener
    super.on(event, listener);
    
    // Return unsubscribe function
    return () => {
      this.removeListener(event, listener);
    };
  }
  
  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} listener - Event listener function
   * @returns {Function} - Unsubscribe function
   */
  once(event, listener) {
    // Validate event
    if (!this.validEvents.has(event)) {
      logger.warn('Subscribing once to unknown event', { event });
    }
    
    // Add listener
    super.once(event, listener);
    
    // Return unsubscribe function
    return () => {
      this.removeListener(event, listener);
    };
  }
  
  /**
   * Get event statistics
   * @returns {Object} Event statistics
   */
  getEventStats() {
    const stats = {};
    for (const [event, count] of this.eventStats) {
      stats[event] = count;
    }
    return stats;
  }
  
  /**
   * Get all registered events
   * @returns {Array} List of registered events
   */
  getRegisteredEvents() {
    return Array.from(this.validEvents);
  }
  
  /**
   * Add a new event type
   * @param {string} event - Event name to register
   */
  registerEvent(event) {
    if (!this.validEvents.has(event)) {
      this.validEvents.add(event);
      logger.info('New event registered', { event });
    }
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} listener - Listener function to remove
   */
  removeListener(event, listener) {
    super.removeListener(event, listener);
    logger.debug('Event listener removed', { event });
  }
  
  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    super.removeAllListeners(event);
    logger.debug('All event listeners removed', { event });
  }
  
  /**
   * Generate unique event ID
   * @returns {string} Unique event ID
   */
  generateEventId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('EventBus shutting down', {
      eventStats: this.getEventStats()
    });
    
    // Emit system shutdown event
    this.emit('system.shutdown', {
      reason: 'Application shutdown',
      stats: this.getEventStats()
    });
    
    // Remove all listeners
    this.removeAllListeners();
  }
}

// Create singleton instance
const eventBus = new EventBus();

export default eventBus;