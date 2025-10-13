import EventPublisherService from './EventPublisherService.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * @fileoverview Base Aggregate Root class for event sourcing
 * @module AggregateRoot
 */

class AggregateRoot {
  /**
   * @constructor
   * @param {string} id - Aggregate identifier
   * @param {string} type - Aggregate type
   */
  constructor(id, type) {
    this.id = id || uuidv4();
    this.type = type;
    this.version = 0;
    this.changes = []; // Uncommitted events
    this.correlationId = null;
    this.causationId = null;
  }

  /**
   * Apply an event to the aggregate
   * @param {Object} event - Event to apply
   */
  applyEvent(event) {
    const handlerName = `on${event.eventType}`;
    const handler = this[handlerName];
    
    if (handler) {
      handler.call(this, event.payload);
      this.version = event.version || (this.version + 1);
    } else {
      logger.warn('No handler found for event type', {
        eventType: event.eventType,
        aggregateId: this.id,
        aggregateType: this.type
      });
    }
  }

  /**
   * Raise a new event
   * @param {string} eventType - Type of event
   * @param {Object} payload - Event payload
   * @param {Object} options - Additional options
   */
  raiseEvent(eventType, payload, options = {}) {
    const event = {
      eventType,
      payload,
      aggregateId: this.id,
      aggregateType: this.type,
      version: this.version + 1,
      correlationId: options.correlationId || this.correlationId,
      causationId: options.causationId || this.causationId,
      metadata: options.metadata || {}
    };

    // Apply the event to update the aggregate state
    this.applyEvent(event);
    
    // Add to uncommitted changes
    this.changes.push(event);
  }

  /**
   * Commit all uncommitted events
   * @returns {Promise<Array>} Committed events
   */
  async commit() {
    try {
      const committedEvents = [];
      
      for (const event of this.changes) {
        const committedEvent = await EventPublisherService.publish(
          event.eventType,
          event.payload,
          {
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            correlationId: event.correlationId,
            causationId: event.causationId,
            metadata: event.metadata
          }
        );
        
        committedEvents.push(committedEvent);
      }

      // Clear uncommitted changes
      this.changes = [];
      
      logger.debug('Aggregate changes committed', {
        aggregateId: this.id,
        aggregateType: this.type,
        eventCount: committedEvents.length
      });

      return committedEvents;
    } catch (error) {
      logger.error('Failed to commit aggregate changes', {
        error: error.message,
        aggregateId: this.id,
        aggregateType: this.type
      });
      throw error;
    }
  }

  /**
   * Load the aggregate from events
   * @param {Array} events - Events to load
   */
  loadFromEvents(events) {
    for (const event of events) {
      this.applyEvent(event);
    }
    
    // Clear any uncommitted changes
    this.changes = [];
  }

  /**
   * Replay events to reconstruct the aggregate state
   * @param {Array} events - Events to replay
   */
  async replayEvents(events) {
    try {
      for (const event of events) {
        this.applyEvent(event);
      }
      
      logger.debug('Aggregate events replayed', {
        aggregateId: this.id,
        aggregateType: this.type,
        eventCount: events.length
      });
    } catch (error) {
      logger.error('Failed to replay aggregate events', {
        error: error.message,
        aggregateId: this.id,
        aggregateType: this.type
      });
      throw error;
    }
  }

  /**
   * Get the current state of the aggregate
   * @returns {Object} Current state
   */
  getState() {
    // This should be implemented by subclasses
    return {
      id: this.id,
      type: this.type,
      version: this.version
    };
  }

  /**
   * Create a snapshot of the current state
   * @returns {Promise<Object>} Snapshot
   */
  async createSnapshot() {
    try {
      const state = this.getState();
      const lastEventId = this.changes.length > 0 
        ? this.changes[this.changes.length - 1].eventId 
        : null;

      const snapshot = await EventPublisherService.createSnapshot(
        this.id,
        this.type,
        state,
        lastEventId
      );

      logger.debug('Aggregate snapshot created', {
        aggregateId: this.id,
        aggregateType: this.type,
        snapshotId: snapshot._id
      });

      return snapshot;
    } catch (error) {
      logger.error('Failed to create aggregate snapshot', {
        error: error.message,
        aggregateId: this.id,
        aggregateType: this.type
      });
      throw error;
    }
  }

  /**
   * Set correlation ID for tracking related events
   * @param {string} correlationId - Correlation ID
   */
  setCorrelationId(correlationId) {
    this.correlationId = correlationId;
  }

  /**
   * Set causation ID for tracking event causation
   * @param {string} causationId - Causation ID
   */
  setCausationId(causationId) {
    this.causationId = causationId;
  }

  /**
   * Get uncommitted events
   * @returns {Array} Uncommitted events
   */
  getUncommittedEvents() {
    return [...this.changes];
  }

  /**
   * Clear uncommitted events
   */
  clearUncommittedEvents() {
    this.changes = [];
  }
}

export default AggregateRoot;