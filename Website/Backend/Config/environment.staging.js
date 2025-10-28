/**
 * 🚧 STAGING ENVIRONMENT CONFIGURATION
 * 
 * Configuration overrides for staging environment
 * Used when NODE_ENV=staging
 */

export default {
  // Application
  app: {
    port: 45799,
    baseUrl: '/api',
    debug: false,
    logLevel: 'info'
  },
  
  // Database
  database: {
    host: 'staging-db.swaggo.com',
    port: 27017,
    name: 'SwaggoStaging',
    user: 'swaggo_staging_user',
    password: process.env.DB_PASSWORD || '',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      writeConcern: { w: 'majority' },
      ssl: true
    }
  },
  
  // Redis
  redis: {
    host: 'staging-redis.swaggo.com',
    port: 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: 0,
    ssl: true,
    ttl: 300, // 5 minutes
    maxMemory: '512mb',
    maxMemoryPolicy: 'allkeys-lru'
  },
  
  // Security
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'staging-jwt-secret-key-change-in-production',
      expiresIn: '24h',
      refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'staging-refresh-token-secret-change-in-production',
      refreshExpiresIn: '7d'
    },
    session: {
      secret: process.env.SESSION_SECRET || 'staging-session-secret-change-in-production',
      maxSessions: 5,
      timeout: 1800000 // 30 minutes
    },
    encryption: {
      key: process.env.ENCRYPTION_KEY || 'staging-encryption-key-here12345678901234567890'
    },
    csrf: {
      secret: process.env.CSRF_SECRET || 'staging-csrf-secret-change-in-production'
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
      max: 500 // limit each IP to 500 requests per windowMs
    },
    cache: {
      ttl: 300 // 5 minutes
    }
  },
  
  // Logging
  logging: {
    level: 'info',
    transports: ['file'],
    file: {
      path: './logs/staging.log',
      maxSize: '100m',
      maxFiles: 10
    }
  },
  
  // External Services
  services: {
    email: {
      host: 'smtp.swaggo.com',
      port: 587,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || ''
      }
    },
    cloudStorage: {
      provider: 'aws',
      bucket: 'swaggo-staging-uploads',
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    }
  },
  
  // Monitoring
  monitoring: {
    apm: {
      enabled: true,
      serverUrl: 'https://apm.staging.swaggo.com',
      token: process.env.APM_TOKEN || ''
    }
  }
};