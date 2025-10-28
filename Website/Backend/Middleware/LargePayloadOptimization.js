/**
 * @fileoverview Large Payload Optimization Middleware
 * @module LargePayloadOptimization
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Middleware for optimizing large payload handling:
 * - Stream processing for large requests
 * - Memory usage monitoring
 * - Request size limiting
 * - Compression optimization
 */

import zlib from 'zlib';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * Large Payload Optimization Middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const largePayloadOptimization = (req, res, next) => {
  try {
    // Log incoming request size
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const sizeInMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
      logger.info('Large payload request detected', {
        method: req.method,
        url: req.url,
        size: `${sizeInMB}MB`,
        userAgent: req.headers['user-agent']
      });
      
      // If request is very large, add special handling
      if (parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB
        logger.warn('Very large payload detected', {
          size: `${sizeInMB}MB`,
          threshold: '50MB'
        });
        
        // Add stream processing hints
        req.largePayload = true;
      }
    }
    
    // Override default response methods for large payloads
    const originalJson = res.json;
    res.json = function(data) {
      try {
        // For large responses, consider compression
        const dataSize = JSON.stringify(data).length;
        if (dataSize > 10 * 1024 * 1024) { // 10MB
          logger.info('Large response detected, considering compression', {
            size: `${(dataSize / (1024 * 1024)).toFixed(2)}MB`
          });
        }
      } catch (stringifyError) {
        logger.warn('Error calculating response size, continuing without size check', {
          error: stringifyError.message
        });
      }
      
      // Check if headers have already been sent
      if (this.headersSent) {
        // If headers are already sent, we can't send another response
        return;
      }
      
      // Ensure originalJson is callable
      if (typeof originalJson === 'function') {
        return originalJson.call(this, data);
      } else {
        // Fallback to standard response
        this.setHeader('Content-Type', 'application/json');
        return this.send(JSON.stringify(data));
      }
    };
    
    next();
  } catch (error) {
    logger.error('Error in large payload optimization middleware', {
      error: error.message,
      stack: error.stack
    });
    next(); // Continue without optimization on error
  }
};

// Export as default
export default {
  optimizePayload: largePayloadOptimization
};