import { logger } from '../utils/SanitizedLogger.js';
import { TYPES } from '../Config/DIContainer.js';

/**
 * @fileoverview API Gateway Service for unified access to REST, GraphQL, and Socket.IO
 * @module APIGatewayService
 * 
 * Implements a unified API gateway that routes requests to appropriate services
 * based on path prefixes and provides consistent error handling, logging, and monitoring.
 */

class APIGatewayService {
  /**
   * @constructor
   * @description Initialize API gateway service
   */
  constructor() {
    // Gateway configuration
    this.config = {
      // Service endpoints
      endpoints: {
        rest: '/api',
        graphql: '/graphql',
        socketio: '/socket.io',
        uploads: '/uploads'
      },
      
      // Rate limiting
      rateLimits: {
        rest: 1000, // requests per minute
        graphql: 500, // requests per minute
        socketio: 2000 // connections per minute
      },
      
      // Health check configuration
      health: {
        timeout: 5000, // 5 seconds
        retries: 3
      }
    };
    
    // Service registry
    this.services = new Map();
    
    // Request tracking
    this.requestStats = {
      total: 0,
      rest: 0,
      graphql: 0,
      socketio: 0,
      errors: 0
    };
    
    // Initialize gateway
    this.initialize();
  }
  
  /**
   * Initialize API gateway
   */
  initialize() {
    logger.info('APIGatewayService initialized', {
      config: this.config,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Register a service with the gateway
   * @param {string} name - Service name
   * @param {Object} service - Service instance
   */
  registerService(name, service) {
    this.services.set(name, service);
    logger.info('Service registered with API gateway', { name });
  }
  
  /**
   * Route request to appropriate service
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async routeRequest(req, res, next) {
    const startTime = Date.now();
    const path = req.path;
    const method = req.method;
    
    // Track request
    this.requestStats.total++;
    
    try {
      // Log request
      logger.info('API Gateway request received', {
        method,
        path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });
      
      // Route based on path prefix
      if (path.startsWith(this.config.endpoints.rest)) {
        this.requestStats.rest++;
        return await this.handleRESTRequest(req, res, next);
      } else if (path.startsWith(this.config.endpoints.graphql)) {
        this.requestStats.graphql++;
        return await this.handleGraphQLRequest(req, res, next);
      } else if (path.startsWith(this.config.endpoints.uploads)) {
        this.requestStats.rest++;
        return await this.handleUploadRequest(req, res, next);
      } else if (path === '/' || path === '/health') {
        return await this.handleHealthRequest(req, res, next);
      } else {
        // Default handler
        return await this.handleDefaultRequest(req, res, next);
      }
    } catch (error) {
      this.requestStats.errors++;
      logger.error('API Gateway routing error', {
        error: error.message,
        stack: error.stack,
        path,
        method,
        timestamp: new Date().toISOString()
      });
      
      return this.sendErrorResponse(res, 500, 'Internal server error');
    } finally {
      // Log response time
      const duration = Date.now() - startTime;
      logger.debug('API Gateway request completed', {
        method,
        path,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Handle REST API requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async handleRESTRequest(req, res, next) {
    logger.debug('Routing REST request', {
      path: req.path,
      method: req.method
    });
    
    // Pass through to existing REST routes
    next();
  }
  
  /**
   * Handle GraphQL requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async handleGraphQLRequest(req, res, next) {
    logger.debug('Routing GraphQL request', {
      path: req.path,
      method: req.method
    });
    
    // Pass through to existing GraphQL middleware
    next();
  }
  
  /**
   * Handle file upload requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async handleUploadRequest(req, res, next) {
    logger.debug('Routing upload request', {
      path: req.path,
      method: req.method
    });
    
    // Pass through to existing upload routes
    next();
  }
  
  /**
   * Handle health check requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async handleHealthRequest(req, res, next) {
    logger.debug('Handling health check request', {
      path: req.path
    });
    
    // Return health status
    res.json({
      status: 'ok',
      message: 'API Gateway is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      stats: this.getRequestStats()
    });
  }
  
  /**
   * Handle default requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async handleDefaultRequest(req, res, next) {
    logger.debug('Handling default request', {
      path: req.path
    });
    
    // Return welcome message
    res.json({
      message: 'Welcome to Swaggo API Gateway',
      version: '1.0.0',
      endpoints: {
        rest: this.config.endpoints.rest,
        graphql: this.config.endpoints.graphql,
        socketio: this.config.endpoints.socketio,
        uploads: this.config.endpoints.uploads,
        health: '/health'
      }
    });
  }
  
  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  sendErrorResponse(res, statusCode, message, details = {}) {
    res.status(statusCode).json({
      error: true,
      message,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
  
  /**
   * Get request statistics
   * @returns {Object} Request statistics
   */
  getRequestStats() {
    return { ...this.requestStats };
  }
  
  /**
   * Get service health status
   * @returns {Object} Health status
   */
  async getHealthStatus() {
    const services = {};
    for (const [name, service] of this.services) {
      if (typeof service.getHealthStatus === 'function') {
        try {
          services[name] = await service.getHealthStatus();
        } catch (error) {
          services[name] = {
            status: 'error',
            error: error.message
          };
        }
      } else {
        services[name] = {
          status: 'unknown',
          message: 'Health check not implemented'
        };
      }
    }
    
    return {
      gateway: {
        status: 'healthy',
        uptime: process.uptime(),
        stats: this.getRequestStats()
      },
      services
    };
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('APIGatewayService shutting down', {
      finalStats: this.getRequestStats()
    });
    
    // Clean up resources
    this.services.clear();
  }
}

APIGatewayService.$inject = [];

export default APIGatewayService;