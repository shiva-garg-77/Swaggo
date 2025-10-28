import APMIntegration from '../../utils/APMIntegration.js';

/**
 * @fileoverview APM Middleware for Express applications
 * @module APMMiddleware
 */

/**
 * APM middleware for tracking HTTP requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const apmMiddleware = (req, res, next) => {
  // Start transaction tracking
  const traceId = APMIntegration.startTransaction(`${req.method} ${req.path}`, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.headers['x-request-id'] || req.id
  });
  
  // Attach trace ID to request for later use
  req.traceId = traceId;
  
  // Track response time
  const startTime = Date.now();
  
  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // End transaction
    APMIntegration.endTransaction(traceId, {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration,
      contentLength: res.get('Content-Length'),
      contentType: res.get('Content-Type')
    });
    
    // Record response time metric
    APMIntegration.recordMetric('http.response_time', duration, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode
    });
  });
  
  // Capture errors
  res.on('error', (error) => {
    APMIntegration.recordError(traceId, error);
  });
  
  next();
};

/**
 * Error tracking middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const apmErrorMiddleware = (error, req, res, next) => {
  // Record error in APM
  if (req.traceId) {
    APMIntegration.recordError(req.traceId, error);
  }
  
  // Record error metric
  APMIntegration.recordMetric('http.errors', 1, {
    method: req.method,
    path: req.path,
    error: error.name,
    statusCode: res.statusCode || 500
  });
  
  // Log error
  console.error('APM Error:', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    traceId: req.traceId
  });
  
  next(error);
};

export { apmMiddleware, apmErrorMiddleware };