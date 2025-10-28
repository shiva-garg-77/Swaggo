import mongoose from 'mongoose';
const { connect, connection } = mongoose;
import dotenv from 'dotenv';
import crypto from 'crypto';

// 🔧 PERFORMANCE FIX #32: Import Winston logger
import appLogger from '../utils/logger.js';

dotenv.config({ path: '.env.local' });

/**
 * 🔒 SECURITY-HARDENED DATABASE CONNECTION
 * 
 * Features:
 * - Connection pooling with security limits
 * - TLS/SSL encryption
 * - Connection monitoring
 * - Automatic reconnection with backoff
 * - Security event logging
 * - Connection health checks
 * - Connection timeout management
 */

class SecureDatabaseConnection {
  constructor() {
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000;
    this.isConnected = false;
    this.connectionHealth = {
      lastCheck: null,
      latency: 0,
      status: 'disconnected'
    };
    
    // Setup connection event listeners
    this.setupEventListeners();
  }
  
  /**
   * Setup MongoDB connection event listeners
   */
  setupEventListeners() {
    // Connection successful
    connection.on('connected', () => {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('🟢 MongoDB connected successfully');
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.connectionHealth.status = 'connected';
      this.logSecurityEvent('database_connected', { timestamp: new Date() });
    });
    
    // Connection error
    connection.on('error', (error) => {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
      appLogger.error('🔴 MongoDB connection error:', { error: error.message });
      this.isConnected = false;
      this.connectionHealth.status = 'error';
      this.logSecurityEvent('database_connection_error', { 
        error: error.message,
        timestamp: new Date() 
      });
    });
    
    // Connection disconnected
    connection.on('disconnected', () => {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('🟡 MongoDB disconnected');
      this.isConnected = false;
      this.connectionHealth.status = 'disconnected';
      this.logSecurityEvent('database_disconnected', { timestamp: new Date() });
      
      // Don't auto-reconnect to prevent reconnection loops
      // Only reconnect on connection errors, not normal disconnections
      // if (this.connectionAttempts < this.maxRetries) {
      //   this.scheduleReconnection();
      // }
    });
    
    // Process termination
    process.on('SIGINT', () => {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('🔶 Received SIGINT, closing MongoDB connection...');
      this.closeConnection();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('🔶 Received SIGTERM, closing MongoDB connection...');
      this.closeConnection();
      process.exit(0);
    });
  }
  
  /**
   * Get secure MongoDB connection options with proper connection pooling
   */
  getConnectionOptions() {
    const options = {
      // Connection pool settings - FIXED: Proper connection pool limits
      maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE ? parseInt(process.env.MONGODB_MAX_POOL_SIZE) : 100,
      minPoolSize: process.env.MONGODB_MIN_POOL_SIZE ? parseInt(process.env.MONGODB_MIN_POOL_SIZE) : 10,
      maxIdleTimeMS: process.env.MONGODB_MAX_IDLE_TIME_MS ? parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS) : 30000,
      serverSelectionTimeoutMS: process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ? parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) : 5000,
      socketTimeoutMS: process.env.MONGODB_SOCKET_TIMEOUT_MS ? parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS) : 45000,
      connectTimeoutMS: process.env.MONGODB_CONNECT_TIMEOUT_MS ? parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS) : 10000,
      
      // 🔧 DATABASE CONNECTION POOLING OPTIMIZATION #149: Add connection pool optimization settings
      maxConnecting: process.env.MONGODB_MAX_CONNECTING ? parseInt(process.env.MONGODB_MAX_CONNECTING) : 5,
      waitQueueTimeoutMS: process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS ? parseInt(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS) : 5000,
      
      // Connection pool monitoring
      monitorCommands: true,
      
      // Heartbeat settings
      heartbeatFrequencyMS: process.env.MONGODB_HEARTBEAT_FREQUENCY_MS ? parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS) : 10000,
      
      // Modern Mongoose connection settings
      bufferCommands: false, // Disable mongoose buffering
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Read/Write concerns for data integrity
      readPreference: 'primaryPreferred',
      writeConcern: {
        w: 'majority',
        j: true, // Journal
        wtimeout: 10000
      },
      readConcern: { level: 'majority' },
      
      // 🔧 DATABASE QUERY OPTIMIZATION #139: Add performance optimization settings
      // Enable compression for better network performance (snappy disabled due to dependency issues)
      // compressors: ['snappy', 'zlib'],
      
      // Security settings - only for production with authentication
      // authSource: 'admin',
      // authMechanism: 'SCRAM-SHA-256'
    };
    
    // Add TLS settings if in production
    if (process.env.NODE_ENV === 'production') {
      options.tls = true;
      options.tlsAllowInvalidCertificates = false;
      options.tlsAllowInvalidHostnames = false;
      
      // Additional security in production (compression disabled due to dependency issues)
      // options.compressors = ['zstd', 'snappy', 'zlib'];
    }
    
    return options;
  }
  
  /**
   * Get MongoDB URI with fallbacks
   */
  getMongoURI() {
    const possibleURIs = [
      process.env.MONGODB_URI,
      process.env.MONGOURI,
      process.env.MONGO_URI,
      process.env.DATABASE_URL
    ];
    
    const uri = possibleURIs.find(uri => uri && uri.trim());
    
    if (!uri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    return uri;
  }
  
  /**
   * Connect to MongoDB with security enhancements
   */
  async connect() {
    try {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('🔄 Initializing secure MongoDB connection...');
      
      const uri = this.getMongoURI();
      const options = this.getConnectionOptions();
      
      // Log connection attempt (without sensitive data)
      this.logSecurityEvent('database_connection_attempt', {
        attempt: this.connectionAttempts + 1,
        maxRetries: this.maxRetries,
        maxPoolSize: options.maxPoolSize,
        minPoolSize: options.minPoolSize,
        timestamp: new Date()
      });
      
      const startTime = Date.now();
      await connect(uri, options);
      const endTime = Date.now();
      
      this.connectionHealth.latency = endTime - startTime;
      this.connectionHealth.lastCheck = new Date();
      
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info(`✅ MongoDB connected successfully in ${this.connectionHealth.latency}ms`);
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info(`📊 Connection pool stats: max=${options.maxPoolSize}, min=${options.minPoolSize}`);
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      return connection;
      
    } catch (error) {
      this.connectionAttempts++;
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
      appLogger.error(`❌ MongoDB connection failed (attempt ${this.connectionAttempts}/${this.maxRetries}):`, { error: error.message });
      
      this.logSecurityEvent('database_connection_failed', {
        attempt: this.connectionAttempts,
        error: error.message,
        timestamp: new Date()
      });
      
      if (this.connectionAttempts < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, this.connectionAttempts - 1);
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.info(`🔄 Retrying connection in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connect();
      }
      
      throw new Error(`MongoDB connection failed after ${this.maxRetries} attempts: ${error.message}`);
    }
  }
  
  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnection() {
    const delay = this.retryDelay * Math.pow(2, this.connectionAttempts);
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.info(`⏰ Scheduling reconnection in ${delay}ms...`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
        appLogger.error('🔴 Reconnection failed:', { error: error.message });
      }
    }, delay);
  }
  
  /**
   * Start health monitoring with connection pool stats
   */
  startHealthMonitoring() {
    setInterval(async () => {
      try {
        const startTime = Date.now();
        await connection.db.admin().ping();
        const endTime = Date.now();
        
        this.connectionHealth.latency = endTime - startTime;
        this.connectionHealth.lastCheck = new Date();
        this.connectionHealth.status = 'healthy';
        
        // Log connection pool stats
        const poolStats = {
          connections: connection.readyState,
          poolSize: connection.client?.topology?.s?.coreTopology?.s?.pool?.totalConnectionCount || 0,
          availableConnections: connection.client?.topology?.s?.coreTopology?.s?.pool?.availableConnectionCount || 0
        };
        
        if (this.connectionHealth.latency > 1000) {
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.warn
          appLogger.warn(`⚠️ High database latency: ${this.connectionHealth.latency}ms`);
        }
        
        // Check for connection pool exhaustion
        if (poolStats.poolSize >= (process.env.MONGODB_MAX_POOL_SIZE || 50) * 0.9) {
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.warn
          appLogger.warn(`⚠️ Database connection pool nearly exhausted: ${poolStats.poolSize}/${process.env.MONGODB_MAX_POOL_SIZE || 50} connections`);
        }
        
      } catch (error) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
        appLogger.error('🔴 Database health check failed:', { error: error.message });
        this.connectionHealth.status = 'unhealthy';
      }
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Close connection gracefully
   */
  async closeConnection() {
    try {
      await connection.close();
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info('✅ MongoDB connection closed gracefully');
      this.logSecurityEvent('database_disconnected_graceful', { timestamp: new Date() });
    } catch (error) {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
      appLogger.error('❌ Error closing MongoDB connection:', { error: error.message });
    }
  }
  
  /**
   * Get connection health status
   */
  getHealthStatus() {
    return {
      isConnected: this.isConnected,
      ...this.connectionHealth,
      readyState: connection.readyState,
      readyStateText: this.getReadyStateText(connection.readyState),
      poolStats: {
        maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE || 50,
        minPoolSize: process.env.MONGODB_MIN_POOL_SIZE || 5,
        currentPoolSize: connection.client?.topology?.s?.coreTopology?.s?.pool?.totalConnectionCount || 0,
        availableConnections: connection.client?.topology?.s?.coreTopology?.s?.pool?.availableConnectionCount || 0
      }
    };
  }
  
  /**
   * Convert ready state number to text
   */
  getReadyStateText(state) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[state] || 'unknown';
  }
  
  /**
   * Log security events (integrate with existing security monitoring)
   */
  logSecurityEvent(eventType, data) {
    const event = {
      eventType,
      component: 'database_connection',
      timestamp: new Date(),
      ...data
    };
    
    // In production, this would integrate with SecurityMonitoringCore
    if (process.env.NODE_ENV === 'development') {
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug(`🔐 Security Event [${eventType}]:`, { event: JSON.stringify(event, null, 2) });
    }
    
    // Integrate with existing SecurityMonitoringCore if available
    if (typeof SecurityMonitoringCore !== 'undefined') {
      try {
        SecurityMonitoringCore.logEvent(event);
      } catch (err) {
        // SecurityMonitoringCore not available, continue with console logging
      }
    }
  }
}

// Create singleton instance
const secureDbConnection = new SecureDatabaseConnection();

// Legacy function for backward compatibility
const Connectdb = async () => {
  return await secureDbConnection.connect();
};

// Export both new and legacy interfaces
export { Connectdb, secureDbConnection as SecureDatabaseConnection };
export default secureDbConnection;