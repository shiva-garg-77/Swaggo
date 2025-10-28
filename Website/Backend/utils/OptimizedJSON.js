/**
 * 🚀 OPTIMIZED JSON HANDLING
 * 
 * Utility for optimized JSON parsing and serialization with performance enhancements
 * and security features for API responses
 */

class OptimizedJSON {
  constructor() {
    // Configuration for JSON optimization
    this.config = {
      // Maximum JSON response size (in bytes) to prevent DoS attacks
      maxResponseSize: parseInt(process.env.MAX_JSON_RESPONSE_SIZE) || 10 * 1024 * 1024, // 10MB default
      
      // Enable streaming for large JSON responses
      enableStreaming: process.env.ENABLE_JSON_STREAMING === 'true',
      
      // Buffer size for streaming (in bytes)
      streamBufferSize: parseInt(process.env.JSON_STREAM_BUFFER_SIZE) || 64 * 1024, // 64KB default
      
      // Enable compression for large responses
      enableCompression: process.env.ENABLE_JSON_COMPRESSION !== 'false',
      
      // Pretty print in development for easier debugging
      prettyPrint: process.env.NODE_ENV === 'development',
      
      // Circular reference handling
      handleCircularRefs: process.env.HANDLE_CIRCULAR_REFS === 'true'
    };
    
    // Performance tracking
    this.stats = {
      totalParseOperations: 0,
      totalStringifyOperations: 0,
      totalParseTime: 0,
      totalStringifyTime: 0,
      largeResponses: 0,
      streamingResponses: 0
    };
  }
  
  /**
   * Optimized JSON parsing with error handling and security features
   * @param {string} jsonString - JSON string to parse
   * @param {Object} options - Parsing options
   * @returns {Object} Parsed JSON object
   */
  parse(jsonString, options = {}) {
    const startTime = Date.now();
    
    try {
      // Input validation
      if (typeof jsonString !== 'string') {
        throw new TypeError('Input must be a string');
      }
      
      // Check for empty string
      if (jsonString.trim() === '') {
        return null;
      }
      
      // Security: Check string length to prevent DoS
      if (jsonString.length > this.config.maxResponseSize) {
        throw new Error(`JSON string too large: ${jsonString.length} bytes exceeds limit of ${this.config.maxResponseSize} bytes`);
      }
      
      // Parse with native JSON parser for maximum performance
      const result = JSON.parse(jsonString);
      
      // Track statistics
      const parseTime = Date.now() - startTime;
      this.stats.totalParseOperations++;
      this.stats.totalParseTime += parseTime;
      
      return result;
    } catch (error) {
      // Enhanced error handling with context
      const context = {
        error: error.message,
        inputLength: jsonString ? jsonString.length : 0,
        inputPreview: jsonString ? jsonString.substring(0, 100) : '',
        stack: error.stack
      };
      
      console.error('JSON parsing error:', context);
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }
  
  /**
   * Optimized JSON stringification with performance enhancements
   * @param {Object} obj - Object to stringify
   * @param {Object} options - Stringification options
   * @returns {string} JSON string
   */
  stringify(obj, options = {}) {
    const startTime = Date.now();
    const {
      pretty = this.config.prettyPrint,
      replacer = null,
      space = pretty ? 2 : 0,
      maxSize = this.config.maxResponseSize,
      handleCircular = this.config.handleCircularRefs
    } = options;
    
    try {
      // Handle circular references if enabled
      let objectToSerialize = obj;
      if (handleCircular && obj && typeof obj === 'object') {
        objectToSerialize = this.handleCircularReferences(obj);
      }
      
      // Stringify with native JSON.stringify for maximum performance
      const jsonString = JSON.stringify(objectToSerialize, replacer, space);
      
      // Security: Check result size to prevent DoS
      if (jsonString.length > maxSize) {
        throw new Error(`JSON result too large: ${jsonString.length} bytes exceeds limit of ${maxSize} bytes`);
      }
      
      // Track statistics
      const stringifyTime = Date.now() - startTime;
      this.stats.totalStringifyOperations++;
      this.stats.totalStringifyTime += stringifyTime;
      
      // Track large responses
      if (jsonString.length > 1024 * 1024) { // 1MB
        this.stats.largeResponses++;
      }
      
      return jsonString;
    } catch (error) {
      // Enhanced error handling with context
      const context = {
        error: error.message,
        inputType: typeof obj,
        inputKeys: obj && typeof obj === 'object' ? Object.keys(obj).slice(0, 10) : [],
        stack: error.stack
      };
      
      console.error('JSON stringification error:', context);
      throw new Error(`Failed to stringify JSON: ${error.message}`);
    }
  }
  
  /**
   * Handle circular references in objects
   * @param {Object} obj - Object to process
   * @returns {Object} Object with circular references removed
   */
  handleCircularReferences(obj) {
    const seen = new WeakSet();
    
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    }));
  }
  
  /**
   * Stream large JSON responses for better memory efficiency
   * @param {Object} obj - Object to stream
   * @param {Object} res - Express response object
   * @param {Object} options - Streaming options
   */
  async stream(obj, res, options = {}) {
    const {
      bufferSize = this.config.streamBufferSize,
      compress = this.config.enableCompression
    } = options;
    
    try {
      // Set appropriate headers
      res.setHeader('Content-Type', 'application/json');
      
      if (compress) {
        res.setHeader('Content-Encoding', 'gzip');
      }
      
      // Convert object to JSON string
      const jsonString = this.stringify(obj);
      
      // For small responses, send normally
      if (jsonString.length <= bufferSize) {
        res.send(jsonString);
        return;
      }
      
      // Track streaming response
      this.stats.streamingResponses++;
      
      // For large responses, stream in chunks
      let offset = 0;
      const sendChunk = () => {
        if (offset >= jsonString.length) {
          res.end();
          return;
        }
        
        const chunk = jsonString.slice(offset, offset + bufferSize);
        res.write(chunk);
        offset += bufferSize;
        
        // Use setImmediate to avoid blocking the event loop
        setImmediate(sendChunk);
      };
      
      sendChunk();
    } catch (error) {
      console.error('JSON streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream JSON response' });
      } else {
        res.end();
      }
    }
  }
  
  /**
   * Optimized Express.js JSON response middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  jsonResponseMiddleware(req, res, next) {
    // Override res.json method with optimized version
    const originalJson = res.json;
    
    res.json = (obj) => {
      try {
        // Use the singleton instance
        const optimizer = optimizedJSON;
        
        // Use optimized stringify
        const jsonString = optimizer.stringify(obj);
        
        // For large responses, consider streaming
        if (jsonString.length > optimizer.config.streamBufferSize && optimizer.config.enableStreaming) {
          return optimizer.stream(obj, res);
        }
        
        // For normal responses, use standard approach
        if (typeof originalJson === 'function') {
          return originalJson.call(res, obj);
        } else {
          // Set headers only for fallback
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Length', Buffer.byteLength(jsonString));
          return res.send(jsonString);
        }
      } catch (error) {
        console.error('Optimized JSON response error:', error);
        // Check if headers have already been sent
        if (res.headersSent) {
          // If headers are already sent, we can't send another response
          return;
        }
        
        if (typeof originalJson === 'function') {
          return originalJson.call(res, { error: 'Failed to generate JSON response' });
        } else {
          // Fallback to standard error response
          res.setHeader('Content-Type', 'application/json');
          return res.status(500).send(JSON.stringify({ error: 'Failed to generate JSON response' }));
        }
      }
    };
    
    next();
  }
  
  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      averageParseTime: this.stats.totalParseOperations > 0 ? 
        this.stats.totalParseTime / this.stats.totalParseOperations : 0,
      averageStringifyTime: this.stats.totalStringifyOperations > 0 ? 
        this.stats.totalStringifyTime / this.stats.totalStringifyOperations : 0,
      config: this.config
    };
  }
  
  /**
   * Reset performance statistics
   */
  resetStats() {
    this.stats = {
      totalParseOperations: 0,
      totalStringifyOperations: 0,
      totalParseTime: 0,
      totalStringifyTime: 0,
      largeResponses: 0,
      streamingResponses: 0
    };
  }
  
  /**
   * Health check for JSON optimization
   * @returns {Object} Health status
   */
  healthCheck() {
    const stats = this.getStats();
    
    return {
      status: 'healthy',
      timestamp: new Date(),
      stats,
      issues: this.getHealthIssues(stats)
    };
  }
  
  /**
   * Get health issues based on statistics
   * @param {Object} stats - Performance statistics
   * @returns {Array} Array of issues
   */
  getHealthIssues(stats) {
    const issues = [];
    
    // Check for slow average parse times
    if (stats.averageParseTime > 100) { // 100ms
      issues.push({
        type: 'warning',
        message: `Average JSON parse time is high: ${stats.averageParseTime.toFixed(2)}ms`,
        severity: 'medium'
      });
    }
    
    // Check for slow average stringify times
    if (stats.averageStringifyTime > 100) { // 100ms
      issues.push({
        type: 'warning',
        message: `Average JSON stringify time is high: ${stats.averageStringifyTime.toFixed(2)}ms`,
        severity: 'medium'
      });
    }
    
    // Check for too many large responses
    if (stats.largeResponses > 1000) {
      issues.push({
        type: 'warning',
        message: `High number of large JSON responses: ${stats.largeResponses}`,
        severity: 'medium'
      });
    }
    
    return issues;
  }
}

// Export singleton instance
const optimizedJSON = new OptimizedJSON();

export default optimizedJSON;