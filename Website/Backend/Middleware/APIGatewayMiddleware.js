import { container, TYPES } from '../Config/DIContainer.js';

/**
 * @fileoverview API Gateway Middleware for unified request routing
 * @module APIGatewayMiddleware
 * 
 * Express middleware that routes all requests through the API gateway service
 * for consistent handling, logging, and monitoring.
 */

/**
 * API Gateway middleware function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function apiGatewayMiddleware(req, res, next) {
  try {
    // Get API gateway service from container
    const apiGatewayService = container.get(TYPES.APIGatewayService);
    
    // Route request through API gateway
    await apiGatewayService.routeRequest(req, res, next);
  } catch (error) {
    console.error('API Gateway middleware error:', error);
    next(error);
  }
}

export default apiGatewayMiddleware;