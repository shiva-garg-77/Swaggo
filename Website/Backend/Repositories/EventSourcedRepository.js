import EventStoreService from '../Services/EventStoreService.js';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * @fileoverview Repository for event-sourced aggregates
 * @module EventSourcedRepository
 */

class EventSourcedRepository {
  /**
   * @constructor
   * @param {class} aggregateClass - Aggregate class
   */
  constructor(aggregateClass) {
    this.aggregateClass = aggregateClass;
    this.eventStore = EventStoreService;
  }

  /**
   * Save an aggregate
   * @param {AggregateRoot} aggregate - Aggregate to save
   * @returns {Promise<AggregateRoot>} Saved aggregate
   */
  async save(aggregate) {
    try {
      // Commit uncommitted events
      await aggregate.commit();
      
      logger.debug('Aggregate saved', {
        aggregateId: aggregate.id,
        aggregateType: aggregate.type
      });

      return aggregate;
    } catch (error) {
      logger.error('Failed to save aggregate', {
        error: error.message,
        aggregateId: aggregate.id,
        aggregateType: aggregate.type
      });
      throw error;
    }
  }

  /**
   * Get an aggregate by ID
   * @param {string} id - Aggregate ID
   * @returns {Promise<AggregateRoot>} Retrieved aggregate
   */
  async getById(id) {
    try {
      const aggregate = new this.aggregateClass(id);
      
      // Get events from store
      const events = await this.eventStore.getEvents(id, aggregate.type);
      
      // Load aggregate from events
      aggregate.loadFromEvents(events);
      
      logger.debug('Aggregate loaded', {
        aggregateId: id,
        aggregateType: aggregate.type,
        eventCount: events.length
      });

      return aggregate;
    } catch (error) {
      logger.error('Failed to get aggregate', {
        error: error.message,
        aggregateId: id,
        aggregateType: this.aggregateClass.name
      });
      throw error;
    }
  }

  /**
   * Get an aggregate by ID with snapshot optimization
   * @param {string} id - Aggregate ID
   * @returns {Promise<AggregateRoot>} Retrieved aggregate
   */
  async getByIdWithSnapshot(id) {
    try {
      const aggregate = new this.aggregateClass(id);
      
      // Get latest snapshot
      const snapshot = await this.eventStore.getLatestSnapshot(id, aggregate.type);
      
      if (snapshot) {
        // Load state from snapshot
        Object.assign(aggregate, snapshot.state);
        
        // Get events since last snapshot
        const events = await this.eventStore.getEventsSinceLastSnapshot(id, aggregate.type);
        
        // Replay events since snapshot
        await aggregate.replayEvents(events);
      } else {
        // No snapshot, load from all events
        const events = await this.eventStore.getEvents(id, aggregate.type);
        aggregate.loadFromEvents(events);
      }
      
      logger.debug('Aggregate loaded with snapshot optimization', {
        aggregateId: id,
        aggregateType: aggregate.type,
        hasSnapshot: !!snapshot
      });

      return aggregate;
    } catch (error) {
      logger.error('Failed to get aggregate with snapshot', {
        error: error.message,
        aggregateId: id,
        aggregateType: this.aggregateClass.name
      });
      throw error;
    }
  }

  /**
   * Create a new aggregate
   * @param {string} id - Aggregate ID (optional)
   * @returns {AggregateRoot} New aggregate
   */
  create(id = null) {
    return new this.aggregateClass(id);
  }

  /**
   * Delete an aggregate
   * @param {string} id - Aggregate ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      // In a real implementation, we might want to mark the aggregate as deleted
      // rather than actually deleting the events for audit purposes
      await this.eventStore.deleteEvents(id, this.aggregateClass.name);
      await this.eventStore.deleteSnapshots(id, this.aggregateClass.name);
      
      logger.warn('Aggregate deleted', {
        aggregateId: id,
        aggregateType: this.aggregateClass.name
      });
    } catch (error) {
      logger.error('Failed to delete aggregate', {
        error: error.message,
        aggregateId: id,
        aggregateType: this.aggregateClass.name
      });
      throw error;
    }
  }

  /**
   * Get events for an aggregate
   * @param {string} id - Aggregate ID
   * @param {Date} since - Optional timestamp to get events since
   * @returns {Promise<Array>} Events
   */
  async getEvents(id, since = null) {
    try {
      const events = await this.eventStore.getEvents(id, this.aggregateClass.name, since);
      
      logger.debug('Events retrieved for aggregate', {
        aggregateId: id,
        aggregateType: this.aggregateClass.name,
        eventCount: events.length
      });

      return events;
    } catch (error) {
      logger.error('Failed to get events for aggregate', {
        error: error.message,
        aggregateId: id,
        aggregateType: this.aggregateClass.name
      });
      throw error;
    }
  }

  /**
   * Get statistics for this aggregate type
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    try {
      // This would typically involve querying the event store for statistics
      // specific to this aggregate type
      const stats = await this.eventStore.getStatistics();
      
      logger.debug('Aggregate repository statistics retrieved', {
        aggregateType: this.aggregateClass.name,
        stats
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get aggregate repository statistics', {
        error: error.message,
        aggregateType: this.aggregateClass.name
      });
      throw error;
    }
  }
}

export default EventSourcedRepository;