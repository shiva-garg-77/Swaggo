import EventStoreService from './EventStoreService.js';
import eventBus from './EventBus.js';
import { logger } from '../utils/SanitizedLogger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @fileoverview Event Publisher Service for event sourcing implementation
 * @module EventPublisherService
 */

class EventPublisherService {
  /**
   * @constructor
   * @description Initialize event publisher service
   */
  constructor() {
    this.eventStore = EventStoreService;
  }

  /**
   * Publish an event to both event store and event bus
   * @param {string} eventType - Type of event
   * @param {Object} payload - Event payload
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Published event
   */
  async publish(eventType, payload, options = {}) {
    try {
      const {
        aggregateId,
        aggregateType,
        correlationId,
        causationId,
        metadata = {},
        publishToBus = true
      } = options;

      // Create event data
      const eventData = {
        eventId: uuidv4(),
        eventType,
        aggregateId,
        aggregateType,
        payload,
        timestamp: new Date(),
        correlationId,
        causationId,
        metadata: {
          ...metadata,
          source: 'event-publisher',
          publishedAt: new Date().toISOString()
        }
      };

      // Store event in event store
      const storedEvent = await this.eventStore.saveEvent(eventData);

      // Publish to event bus if requested
      if (publishToBus) {
        eventBus.emit(eventType, {
          ...payload,
          eventId: eventData.eventId,
          aggregateId,
          aggregateType,
          timestamp: eventData.timestamp,
          correlationId,
          causationId
        });

        logger.debug('Event published to bus', {
          eventType,
          eventId: eventData.eventId
        });
      }

      logger.info('Event published successfully', {
        eventType,
        eventId: eventData.eventId,
        aggregateId,
        aggregateType
      });

      return storedEvent;
    } catch (error) {
      logger.error('Failed to publish event', {
        error: error.message,
        eventType,
        payload,
        options
      });
      throw error;
    }
  }

  /**
   * Publish multiple events as a batch
   * @param {Array} events - Array of events to publish
   * @returns {Promise<Array>} Array of published events
   */
  async publishBatch(events) {
    try {
      const publishedEvents = [];
      
      for (const event of events) {
        const { eventType, payload, options = {} } = event;
        const publishedEvent = await this.publish(eventType, payload, options);
        publishedEvents.push(publishedEvent);
      }

      logger.info('Batch events published successfully', {
        eventCount: publishedEvents.length
      });

      return publishedEvents;
    } catch (error) {
      logger.error('Failed to publish batch events', {
        error: error.message,
        eventCount: events.length
      });
      throw error;
    }
  }

  /**
   * Replay events for an aggregate
   * @param {string} aggregateId - Aggregate identifier
   * @param {string} aggregateType - Aggregate type
   * @param {Function} eventHandler - Function to handle each event
   * @returns {Promise<number>} Number of events replayed
   */
  async replayEvents(aggregateId, aggregateType, eventHandler) {
    try {
      // Get events since last snapshot
      const events = await this.eventStore.getEventsSinceLastSnapshot(aggregateId, aggregateType);
      
      let replayCount = 0;
      
      for (const event of events) {
        try {
          await eventHandler(event);
          replayCount++;
        } catch (handlerError) {
          logger.error('Failed to handle replayed event', {
            error: handlerError.message,
            eventId: event.eventId,
            eventType: event.eventType
          });
          
          // Continue with other events
        }
      }

      logger.info('Events replayed successfully', {
        aggregateId,
        aggregateType,
        replayCount
      });

      return replayCount;
    } catch (error) {
      logger.error('Failed to replay events', {
        error: error.message,
        aggregateId,
        aggregateType
      });
      throw error;
    }
  }

  /**
   * Get events for replay with filtering
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Array>} Events matching filter
   */
  async getEventsForReplay(filter = {}) {
    try {
      const { eventType, aggregateType, since, limit = 1000 } = filter;
      
      let query = {};
      
      if (eventType) query.eventType = eventType;
      if (aggregateType) query.aggregateType = aggregateType;
      if (since) query.timestamp = { $gte: since };

      const events = await EventStoreService.getEventsByType(eventType, {
        limit,
        since
      });

      logger.debug('Events retrieved for replay', {
        filter,
        eventCount: events.length
      });

      return events;
    } catch (error) {
      logger.error('Failed to get events for replay', {
        error: error.message,
        filter
      });
      throw error;
    }
  }

  /**
   * Create a snapshot for an aggregate
   * @param {string} aggregateId - Aggregate identifier
   * @param {string} aggregateType - Aggregate type
   * @param {Object} state - Current state
   * @param {string} lastEventId - Last event ID included in snapshot
   * @returns {Promise<Object>} Created snapshot
   */
  async createSnapshot(aggregateId, aggregateType, state, lastEventId) {
    try {
      const snapshot = await this.eventStore.saveSnapshot(
        aggregateId,
        aggregateType,
        state,
        lastEventId
      );

      logger.info('Snapshot created successfully', {
        aggregateId,
        aggregateType,
        snapshotId: snapshot._id
      });

      return snapshot;
    } catch (error) {
      logger.error('Failed to create snapshot', {
        error: error.message,
        aggregateId,
        aggregateType
      });
      throw error;
    }
  }
}

export default new EventPublisherService();