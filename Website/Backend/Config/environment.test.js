/**
 * 🧪 TEST ENVIRONMENT CONFIGURATION
 * 
 * Configuration overrides for test environment
 * Used when NODE_ENV=test
 */

export default {
  // Application
  app: {
    port: 45799,
    baseUrl: '/api',
    debug: true,
    logLevel: 'error'
  },
  
  // Database
  database: {
    host: 'localhost',
    port: 27017,
    name: 'SwaggoTest',
    user: '',
    password: '',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      writeConcern: { w: 'majority' }
    }
  },
  
  // Redis
  redis: {
    host: 'localhost',
    port: 6380, // Different port for test Redis instance
    db: 1, // Different database for test
    ttl: 60, // 1 minute for testing
    maxMemory: '128mb',
    maxMemoryPolicy: 'allkeys-lru'
  },
  
  // Security
  security: {
    jwt: {
      secret: 'test-jwt-secret-key-for-testing-only',
      expiresIn: '1h',
      refreshSecret: 'test-refresh-token-secret-for-testing-only',
      refreshExpiresIn: '2h'
    },
    session: {
      secret: 'test-session-secret-for-testing-only',
      maxSessions: 10,
      timeout: 900000 // 15 minutes
    },
    encryption: {
      key: 'test-encryption-key-here12345678901234567890'
    },
    csrf: {
      secret: 'test-csrf-secret-for-testing-only'
    }
  },
  
  // Features
  features: {
    chat: true,
    videoCalls: true,
    stories: true,
    liveStreaming: true
  },
  
  // Performance
  performance: {
    rateLimit: {
      windowMs: 60000, // 1 minute for testing
      max: 1000 // Higher limit for testing
    },
    cache: {
      ttl: 60 // 1 minute for testing
    }
  },
  
  // Logging
  logging: {
    level: 'error',
    transports: ['console'],
    file: {
      path: './logs/test.log',
      maxSize: '10m',
      maxFiles: 5
    }
  },
  
  // External Services
  services: {
    email: {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: ''
      }
    },
    cloudStorage: {
      provider: 'local',
      bucket: 'swaggo-test-uploads',
      region: 'us-east-1'
    }
  },
  
  // Monitoring
  monitoring: {
    apm: {
      enabled: false
    }
  }
};