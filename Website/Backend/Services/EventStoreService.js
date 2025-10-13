import Event from '../Models/Event.js';
import Snapshot from '../Models/Snapshot.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * @fileoverview Event Store Service for event sourcing implementation
 * @module EventStoreService
 */

class EventStoreService {
  /**
   * @constructor
   * @description Initialize event store service
   */
  constructor() {
    this.snapshotFrequency = 10; // Create snapshot every 10 events
  }

  /**
   * Save an event to the event store
   * @param {Object} eventData - Event data to store
   * @returns {Promise<Object>} Saved event
   */
  async saveEvent(eventData) {
    try {
      const event = new Event({
        eventId: eventData.eventId || uuidv4(),
        eventType: eventData.eventType,
        aggregateId: eventData.aggregateId,
        aggregateType: eventData.aggregateType,
        payload: eventData.payload,
        timestamp: eventData.timestamp || new Date(),
        version: eventData.version || 1,
        correlationId: eventData.correlationId,
        causationId: eventData.causationId,
        metadata: eventData.metadata || {}
      });

      const savedEvent = await event.save();
      
      logger.debug('Event saved to store', {
        eventId: savedEvent.eventId,
        eventType: savedEvent.eventType,
        aggregateId: savedEvent.aggregateId
      });

      // Check if we should create a snapshot
      await this.checkAndCreateSnapshot(eventData.aggregateId, eventData.aggregateType);

      return savedEvent;
    } catch (error) {
      logger.error('Failed to save event', {
        error: error.message,
        eventData
      });
      throw error;
    }
  }

  /**
   * Get events for an aggregate
   * @param {string} aggregateId - Aggregate identifier
   * @param {string} aggregateType - Aggregate type
   * @param {Date} since - Optional timestamp to get events since
   * @returns {Promise<Array>} Array of events
   */
  async getEvents(aggregateId, aggregateType, since = null) {
    try {
      let query = { aggregateId, aggregateType };
      
      if (since) {
        query.timestamp = { $gte: since };
      }

      const events = await Event.find(query)
        .sort({ timestamp: 1, version: 1 })
        .lean();

      logger.debug('Events retrieved from store', {
        aggregateId,
        aggregateType,
        eventCount: events.length
      });

      return events;
    } catch (error) {
      logger.error('Failed to retrieve events', {
        error: error.message,
        aggregateId,
        aggregateType
      });
      throw error;
    }
  }

  /**
   * Get events by type
   * @param {string} eventType - Event type to filter by
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of events
   */
  async getEventsByType(eventType, options = {}) {
    try {
      const { limit = 100, skip = 0, since = null } = options;
      
      let query = { eventType };
      
      if (since) {
        query.timestamp = { $gte: since };
      }

      const events = await Event.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      logger.debug('Events retrieved by type', {
        eventType,
        eventCount: events.length
      });

      return events;
    } catch (error) {
      logger.error('Failed to retrieve events by type', {
        error: error.message,
        eventType
      });
      throw error;
    }
  }

  /**
   * Save a snapshot of an aggregate state
   * @param {string} aggregateId - Aggregate identifier
   * @param {string} aggregateType - Aggregate type
   * @param {Object} state - Current state of the aggregate
   * @param {string} lastEventId - ID of the last event included in snapshot
   * @returns {Promise<Object>} Saved snapshot
   */
  async saveSnapshot(aggregateId, aggregateType, state, lastEventId) {
    try {
      // Get the latest snapshot version
      const latestSnapshot = await Snapshot.findOne({ aggregateId, aggregateType })
        .sort({ version: -1 })
        .lean();

      const version = latestSnapshot ? latestSnapshot.version + 1 : 1;

      const snapshot = new Snapshot({
        aggregateId,
        aggregateType,
        version,
        state,
        timestamp: new Date(),
        lastEventId
      });

      const savedSnapshot = await snapshot.save();
      
      logger.debug('Snapshot saved', {
        aggregateId,
        aggregateType,
        version
      });

      return savedSnapshot;
    } catch (error) {
      logger.error('Failed to save snapshot', {
        error: error.message,
        aggregateId,
        aggregateType
      });
      throw error;
    }
  }

  /**
   * Get the latest snapshot for an aggregate
   * @param {string} aggregateId - Aggregate identifier
   * @param {string} aggregateType - Aggregate type
   * @returns {Promise<Object|null>} Latest snapshot or null
   */
  async getLatestSnapshot(aggregateId, aggregateType) {
    try {
      const snapshot = await Snapshot.findOne({ aggregateId, aggregateType })
        .sort({ version: -1 })
        .lean();

      if (snapshot) {
        logger.debug('Latest snapshot retrieved', {
          aggregateId,
          aggregateType,
          version: snapshot.version
        });
      }

      return snapshot;
    } catch (error) {
      logger.error('Failed to retrieve latest snapshot', {
        error: error.message,
        aggregateId,
        aggregateType
      });
      throw error;
    }
  }

  /**
   * Get events since the last snapshot
   * @param {string} aggregateId - Aggregate identifier
   * @param {string} aggregateType - Aggregate type
   * @returns {Promise<Array>} Events since last snapshot
   */
  async getEventsSinceLastSnapshot(aggregateId, aggregateType) {
    try {
      const latestSnapshot = await this.getLatestSnapshot(aggregateId, aggregateType);
      
      if (!latestSnapshot) {
        // No snapshot exists, get all events
        return await this.getEvents(aggregateId, aggregateType);
      }

      // Get events after the last snapshot
      const events = await Event.find({
        aggregateId,
        aggregateType,
        timestamp: { $gt: latestSnapshot.timestamp }
      })
      .sort({ timestamp: 1, version: 1 })
      .lean();

      logger.debug('Events since last snapshot retrieved', {
        aggregateId,
        aggregateType,
        snapshotVersion: latestSnapshot.version,
        eventCount: events.length
      });

      return events;
    } catch (error) {
      logger.error('Failed to retrieve events since last snapshot', {
        error: error.message,
        aggregateId,
        aggregateType
      });
      throw error;
    }
  }

  /**
   * Check if we should create a snapshot and create one if needed
   * @param {string} aggregateId - Aggregate identifier
   * @param {string} aggregateType - Aggregate type
   */
  async checkAndCreateSnapshot(aggregateId, aggregateType) {
    try {
      // Count events for this aggregate
      const eventCount = await Event.countDocuments({ aggregateId, aggregateType });

      // Check if we should create a snapshot
      if (eventCount % this.snapshotFrequency === 0) {
        logger.info('Snapshot creation triggered by event frequency', {
          aggregateId,
          aggregateType,
          eventCount
        });

        // In a real implementation, we would get the current state from the aggregate
        // and save it as a snapshot. For now, we'll just log that a snapshot should be created.
        // The actual snapshot creation would be handled by the aggregate root.
      }
    } catch (error) {
      logger.error('Failed to check snapshot creation', {
        error: error.message,
        aggregateId,
        aggregateType
      });
    }
  }

  /**
   * Get event store statistics
   * @returns {Promise<Object>} Event store statistics
   */
  async getStatistics() {
    try {
      const eventCount = await Event.countDocuments();
      const snapshotCount = await Snapshot.countDocuments();
      const eventTypes = await Event.distinct('eventType');
      const aggregateTypes = await Event.distinct('aggregateType');

      const stats = {
        eventCount,
        snapshotCount,
        eventTypes: eventTypes.length,
        aggregateTypes: aggregateTypes.length,
        eventTypesList: eventTypes,
        aggregateTypesList: aggregateTypes
      };

      logger.debug('Event store statistics retrieved', stats);

      return stats;
    } catch (error) {
      logger.error('Failed to retrieve event store statistics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete events for an aggregate (use with caution)
   * @param {string} aggregateId - Aggregate identifier
   * @param {string} aggregateType - Aggregate type
   * @returns {Promise<Object>} Deletion result
   */
  async deleteEvents(aggregateId, aggregateType) {
    try {
      const result = await Event.deleteMany({ aggregateId, aggregateType });
      
      logger.warn('Events deleted for aggregate', {
        aggregateId,
        aggregateType,
        deletedCount: result.deletedCount
      });

      return result;
    } catch (error) {
      logger.error('Failed to delete events', {
        error: error.message,
        aggregateId,
        aggregateType
      });
      throw error;
    }
  }

  /**
   * Delete snapshots for an aggregate (use with caution)
   * @param {string} aggregateId - Aggregate identifier
   * @param {string} aggregateType - Aggregate type
   * @returns {Promise<Object>} Deletion result
   */
  async deleteSnapshots(aggregateId, aggregateType) {
    try {
      const result = await Snapshot.deleteMany({ aggregateId, aggregateType });
      
      logger.warn('Snapshots deleted for aggregate', {
        aggregateId,
        aggregateType,
        deletedCount: result.deletedCount
      });

      return result;
    } catch (error) {
      logger.error('Failed to delete snapshots', {
        error: error.message,
        aggregateId,
        aggregateType
      });
      throw error;
    }
  }
}

export default new EventStoreService();