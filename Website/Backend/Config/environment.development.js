/**
 * 🛠️ DEVELOPMENT ENVIRONMENT CONFIGURATION
 * 
 * Configuration overrides for development environment
 * Used when NODE_ENV=development
 */

export default {
  // Application
  app: {
    port: 45799,
    baseUrl: '/api',
    debug: true,
    logLevel: 'debug'
  },
  
  // Database
  database: {
    host: 'localhost',
    port: 27017,
    name: 'SwaggoDev',
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
    port: 6379,
    db: 0,
    ttl: 300, // 5 minutes
    maxMemory: '256mb',
    maxMemoryPolicy: 'allkeys-lru'
  },
  
  // Security
  security: {
    jwt: {
      secret: 'dev-jwt-secret-key-change-in-production',
      expiresIn: '24h',
      refreshSecret: 'dev-refresh-token-secret-change-in-production',
      refreshExpiresIn: '7d'
    },
    session: {
      secret: 'dev-session-secret-change-in-production',
      maxSessions: 10,
      timeout: 3600000 // 1 hour
    },
    encryption: {
      key: 'dev-encryption-key-here12345678901234567890'
    },
    csrf: {
      secret: 'dev-csrf-secret-change-in-production'
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
      windowMs: 900000, // 15 minutes
      max: 1000 // limit each IP to 1000 requests per windowMs
    },
    cache: {
      ttl: 300 // 5 minutes
    }
  },
  
  // Logging
  logging: {
    level: 'debug',
    transports: ['console', 'file'],
    file: {
      path: './logs/dev.log',
      maxSize: '50m',
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
      bucket: 'swaggo-dev-uploads',
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