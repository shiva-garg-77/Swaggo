import { logger } from '../utils/SanitizedLogger.js';

/**
 * @fileoverview Command Bus for CQRS implementation
 * @module CommandBus
 */

class CommandBus {
  /**
   * @constructor
   * @description Initialize command bus
   */
  constructor() {
    this.handlers = new Map();
    this.middleware = [];
  }

  /**
   * Register a command handler
   * @param {string} commandType - Type of command
   * @param {Object} handler - Command handler
   */
  registerHandler(commandType, handler) {
    this.handlers.set(commandType, handler);
    logger.debug('Command handler registered', { commandType });
  }

  /**
   * Register middleware
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middleware.push(middleware);
    logger.debug('Middleware registered', { middlewareCount: this.middleware.length });
  }

  /**
   * Dispatch a command
   * @param {Command} command - Command to dispatch
   * @returns {Promise<any>} Command result
   */
  async dispatch(command) {
    try {
      // Validate command
      if (!command.validate()) {
        throw new Error('Invalid command');
      }

      const handler = this.handlers.get(command.commandType);
      if (!handler) {
        throw new Error(`No handler registered for command type: ${command.commandType}`);
      }

      // Apply middleware
      for (const middleware of this.middleware) {
        await middleware(command);
      }

      logger.debug('Command dispatched', {
        commandType: command.commandType,
        commandId: command.commandId
      });

      // Execute command handler
      const result = await handler.handle(command);
      
      logger.info('Command executed successfully', {
        commandType: command.commandType,
        commandId: command.commandId
      });

      return result;
    } catch (error) {
      logger.error('Command execution failed', {
        error: error.message,
        commandType: command?.commandType,
        commandId: command?.commandId
      });
      throw error;
    }
  }

  /**
   * Get registered command types
   * @returns {Array} Registered command types
   */
  getRegisteredCommands() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Remove a command handler
   * @param {string} commandType - Type of command
   */
  removeHandler(commandType) {
    this.handlers.delete(commandType);
    logger.debug('Command handler removed', { commandType });
  }
}

export default new CommandBus();