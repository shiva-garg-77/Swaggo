import BaseService from './BaseService.js';
import { logger } from '../../utils/SanitizedLogger.js';
import EventBus from '../CQRS/EventBus.js';

/**
 * @fileoverview System monitoring service that subscribes to events for system health tracking
 * @module SystemMonitoringService
 * 
 * Demonstrates event bus usage by subscribing to various system events
 * and tracking system health metrics.
 */

class SystemMonitoringService extends BaseService {
  /**
   * @constructor
   * @description Initialize system monitoring service
   */
  constructor() {
    super();
    // 🔧 FIX: Initialize EventBus directly (not using DI container)
    this.eventBus = EventBus;
    
    // System health metrics
    this.metrics = {
      userConnections: 0,
      messagesSent: 0,
      callsInitiated: 0,
      chatsJoined: 0,
      errors: 0
    };
    
    // Subscribe to events (will be called after injection)
    // this.subscribeToEvents();
    
    // Log initialization
    logger.info('SystemMonitoringService initialized');
  }
  
  /**
   * Subscribe to system events
   */
  subscribeToEvents() {
    // User connection events
    this.eventBus.on('user.connected', (payload) => {
      this.metrics.userConnections++;
      logger.info('User connected', { 
        userId: payload.userId, 
        username: payload.username,
        connections: this.metrics.userConnections
      });
    });
    
    this.eventBus.on('user.disconnected', (payload) => {
      this.metrics.userConnections = Math.max(0, this.metrics.userConnections - 1);
      logger.info('User disconnected', { 
        userId: payload.userId, 
        username: payload.username,
        reason: payload.reason,
        connections: this.metrics.userConnections
      });
    });
    
    // Message events
    this.eventBus.on('message.sent', (payload) => {
      this.metrics.messagesSent++;
      logger.debug('Message sent', { 
        messageId: payload.messageId,
        chatId: payload.chatId,
        sender: payload.senderUsername,
        messages: this.metrics.messagesSent
      });
    });
    
    // Call events
    this.eventBus.on('call.initiated', (payload) => {
      this.metrics.callsInitiated++;
      logger.info('Call initiated', { 
        callId: payload.callId,
        caller: payload.callerUsername,
        receiver: payload.receiverUsername,
        calls: this.metrics.callsInitiated
      });
    });
    
    // Chat events
    this.eventBus.on('chat.joined', (payload) => {
      this.metrics.chatsJoined++;
      logger.debug('Chat joined', { 
        chatId: payload.chatId,
        user: payload.username,
        chats: this.metrics.chatsJoined
      });
    });
    
    this.eventBus.on('chat.left', (payload) => {
      this.metrics.chatsJoined = Math.max(0, this.metrics.chatsJoined - 1);
      logger.debug('Chat left', { 
        chatId: payload.chatId,
        user: payload.username,
        chats: this.metrics.chatsJoined
      });
    });
    
    // System events
    this.eventBus.on('system.shutdown', (payload) => {
      logger.info('System shutdown initiated', { 
        reason: payload.reason,
        metrics: this.getMetrics()
      });
    });
    
    // Error events
    this.eventBus.on('system.error', (payload) => {
      this.metrics.errors++;
      logger.error('System error occurred', { 
        error: payload.error,
        stack: payload.stack,
        errors: this.metrics.errors
      });
    });
  }
  
  /**
   * Get current system metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Get system health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      status: 'healthy',
      metrics: this.getMetrics(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    logger.info('SystemMonitoringService shutting down', {
      finalMetrics: this.getMetrics()
    });
  }
}

export default SystemMonitoringService;