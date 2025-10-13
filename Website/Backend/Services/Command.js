import { v4 as uuidv4 } from 'uuid';

/**
 * @fileoverview Base Command class for CQRS implementation
 * @module Command
 */

class Command {
  /**
   * @constructor
   * @param {string} commandType - Type of command
   * @param {Object} payload - Command payload
   * @param {Object} metadata - Additional metadata
   */
  constructor(commandType, payload, metadata = {}) {
    this.commandId = uuidv4();
    this.commandType = commandType;
    this.payload = payload;
    this.timestamp = new Date();
    this.metadata = {
      ...metadata,
      source: 'cqrs-command'
    };
  }

  /**
   * Validate command payload
   * @returns {boolean} Validation result
   */
  validate() {
    // Base implementation - should be overridden by subclasses
    return !!this.commandType && !!this.payload;
  }
}

export default Command;