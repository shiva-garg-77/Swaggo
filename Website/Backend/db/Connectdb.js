import mongoose from 'mongoose';
const { connect, connection } = mongoose;
import dotenv from 'dotenv';
import crypto from 'crypto';

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
      console.log('🟢 MongoDB connected successfully');
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.connectionHealth.status = 'connected';
      this.logSecurityEvent('database_connected', { timestamp: new Date() });
    });
    
    // Connection error
    connection.on('error', (error) => {
      console.error('🔴 MongoDB connection error:', error.message);
      this.isConnected = false;
      this.connectionHealth.status = 'error';
      this.logSecurityEvent('database_connection_error', { 
        error: error.message,
        timestamp: new Date() 
      });
    });
    
    // Connection disconnected
    connection.on('disconnected', () => {
      console.log('🟡 MongoDB disconnected');
      this.isConnected = false;
      this.connectionHealth.status = 'disconnected';
      this.logSecurityEvent('database_disconnected', { timestamp: new Date() });
      
      // Attempt reconnection if not intentional
      if (this.connectionAttempts < this.maxRetries) {
        this.scheduleReconnection();
      }
    });
    
    // Process termination
    process.on('SIGINT', () => {
      console.log('\n🔶 Received SIGINT, closing MongoDB connection...');
      this.closeConnection();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🔶 Received SIGTERM, closing MongoDB connection...');
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
      maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE ? parseInt(process.env.MONGODB_MAX_POOL_SIZE) : 10,
      minPoolSize: process.env.MONGODB_MIN_POOL_SIZE ? parseInt(process.env.MONGODB_MIN_POOL_SIZE) : 1,
      maxIdleTimeMS: process.env.MONGODB_MAX_IDLE_TIME_MS ? parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS) : 30000,
      serverSelectionTimeoutMS: process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ? parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) : 10000,
      socketTimeoutMS: process.env.MONGODB_SOCKET_TIMEOUT_MS ? parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS) : 45000,
      connectTimeoutMS: process.env.MONGODB_CONNECT_TIMEOUT_MS ? parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS) : 10000,
      
      // Connection pool monitoring
      monitorCommands: true,
      waitQueueTimeoutMS: process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS ? parseInt(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS) : 5000,
      
      // Heartbeat settings
      heartbeatFrequencyMS: process.env.MONGODB_HEARTBEAT_FREQUENCY_MS ? parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS) : 10000,
      
      // Modern Mongoose connection settings
      bufferCommands: false, // Disable mongoose buffering
      // bufferMaxEntries: 0, // REMOVED: Deprecated in Mongoose 8.x
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Read/Write concerns for data integrity
      readPreference: 'primary',
      writeConcern: {
        w: 'majority',
        j: true, // Journal
        wtimeout: 10000
      },
      readConcern: { level: 'majority' },
      
      // Security settings - only for production with authentication
      // authSource: 'admin',
      // authMechanism: 'SCRAM-SHA-256'
    };
    
    // Add TLS settings if in production
    if (process.env.NODE_ENV === 'production') {
      options.tls = true;
      options.tlsAllowInvalidCertificates = false;
      options.tlsAllowInvalidHostnames = false;
      
      // Additional security in production
      options.compressors = ['zstd', 'snappy', 'zlib'];
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
      console.log('🔄 Initializing secure MongoDB connection...');
      
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
      
      console.log(`✅ MongoDB connected successfully in ${this.connectionHealth.latency}ms`);
      console.log(`📊 Connection pool stats: max=${options.maxPoolSize}, min=${options.minPoolSize}`);
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      return connection;
      
    } catch (error) {
      this.connectionAttempts++;
      console.error(`❌ MongoDB connection failed (attempt ${this.connectionAttempts}/${this.maxRetries}):`, error.message);
      
      this.logSecurityEvent('database_connection_failed', {
        attempt: this.connectionAttempts,
        error: error.message,
        timestamp: new Date()
      });
      
      if (this.connectionAttempts < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, this.connectionAttempts - 1);
        console.log(`🔄 Retrying connection in ${delay}ms...`);
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
    console.log(`⏰ Scheduling reconnection in ${delay}ms...`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('🔴 Reconnection failed:', error.message);
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
          console.warn(`⚠️ High database latency: ${this.connectionHealth.latency}ms`);
        }
        
        // Check for connection pool exhaustion
        if (poolStats.poolSize >= (process.env.MONGODB_MAX_POOL_SIZE || 10) * 0.9) {
          console.warn(`⚠️ Database connection pool nearly exhausted: ${poolStats.poolSize}/${process.env.MONGODB_MAX_POOL_SIZE || 10} connections`);
        }
        
      } catch (error) {
        console.error('🔴 Database health check failed:', error.message);
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
      console.log('✅ MongoDB connection closed gracefully');
      this.logSecurityEvent('database_disconnected_graceful', { timestamp: new Date() });
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error.message);
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
        maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE || 10,
        minPoolSize: process.env.MONGODB_MIN_POOL_SIZE || 1,
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
      console.log(`🔐 Security Event [${eventType}]:`, JSON.stringify(event, null, 2));
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