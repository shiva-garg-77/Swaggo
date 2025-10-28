/**
 * 🚀 PRODUCTION ENVIRONMENT CONFIGURATION
 * 
 * Configuration overrides for production environment
 * Used when NODE_ENV=production
 */

export default {
  // Application
  app: {
    port: process.env.PORT || 45799,
    baseUrl: '/api',
    debug: false,
    logLevel: 'warn'
  },
  
  // Database
  database: {
    host: process.env.DB_HOST || 'prod-db.swaggo.com',
    port: process.env.DB_PORT || 27017,
    name: process.env.DB_NAME || 'SwaggoProd',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      writeConcern: { w: 'majority' },
      ssl: true,
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'prod-redis.swaggo.com',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0,
    ssl: process.env.REDIS_SSL === 'true',
    ttl: process.env.CACHE_TTL || 300, // 5 minutes
    maxMemory: process.env.REDIS_MAX_MEMORY || '1gb',
    maxMemoryPolicy: process.env.REDIS_MAX_MEMORY_POLICY || 'allkeys-lru'
  },
  
  // Security
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || '',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshSecret: process.env.REFRESH_TOKEN_SECRET || '',
      refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    },
    session: {
      secret: process.env.SESSION_SECRET || '',
      maxSessions: process.env.MAX_SESSIONS || 3,
      timeout: process.env.SESSION_TIMEOUT || 1800000 // 30 minutes
    },
    encryption: {
      key: process.env.ENCRYPTION_KEY || ''
    },
    csrf: {
      secret: process.env.CSRF_SECRET || ''
    }
  },
  
  // Features
  features: {
    chat: process.env.FEATURE_CHAT_ENABLED === 'true',
    videoCalls: process.env.FEATURE_VIDEO_CALLS_ENABLED === 'true',
    stories: process.env.FEATURE_STORIES_ENABLED === 'true',
    liveStreaming: process.env.FEATURE_LIVE_STREAMING_ENABLED === 'true'
  },
  
  // Performance
  performance: {
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW || 900000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX || 100 // limit each IP to 100 requests per windowMs
    },
    cache: {
      ttl: process.env.CACHE_TTL || 300 // 5 minutes
    }
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'error',
    transports: ['file'],
    file: {
      path: process.env.LOG_FILE_PATH || './logs/prod.log',
      maxSize: process.env.LOG_MAX_SIZE || '100m',
      maxFiles: process.env.LOG_MAX_FILES || 10
    }
  },
  
  // External Services
  services: {
    email: {
      host: process.env.EMAIL_HOST || 'smtp.swaggo.com',
      port: process.env.EMAIL_PORT || 587,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || ''
      }
    },
    cloudStorage: {
      provider: 'aws',
      bucket: process.env.AWS_BUCKET_NAME || 'swaggo-prod-uploads',
      region: process.env.AWS_REGION || 'us-east-1',
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
      serverUrl: process.env.APM_SERVER_URL || 'https://apm.swaggo.com',
      token: process.env.APM_TOKEN || ''
    }
  }
};