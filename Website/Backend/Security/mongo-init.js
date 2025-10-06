// 🔒 MongoDB Security-Hardened Initialization Script
// This script runs during MongoDB container startup to create secure users and databases

print('🔐 Starting MongoDB security-hardened initialization...');

// Get environment variables
const rootUsername = _getEnv('MONGO_INITDB_ROOT_USERNAME') || 'admin';
const rootPassword = _getEnv('MONGO_INITDB_ROOT_PASSWORD') || 'defaultpassword';
const databaseName = _getEnv('MONGO_INITDB_DATABASE') || 'swaggo';
const appUsername = _getEnv('MONGO_APP_USERNAME') || 'swaggo_app';
const appPassword = _getEnv('MONGO_APP_PASSWORD') || 'secure_app_password';
const readOnlyUsername = _getEnv('MONGO_READONLY_USERNAME') || 'swaggo_readonly';
const readOnlyPassword = _getEnv('MONGO_READONLY_PASSWORD') || 'secure_readonly_password';

print('📋 Configuration loaded:');
print('  - Root user: ' + rootUsername);
print('  - Database: ' + databaseName);
print('  - App user: ' + appUsername);
print('  - Read-only user: ' + readOnlyUsername);

// Connect to admin database
db = db.getSiblingDB('admin');

try {
  // Authenticate as root user
  print('🔑 Authenticating as root user...');
  db.auth(rootUsername, rootPassword);
  
  // Switch to application database
  db = db.getSiblingDB(databaseName);
  
  // Create application user with read/write permissions
  print('👤 Creating application user...');
  db.createUser({
    user: appUsername,
    pwd: appPassword,
    roles: [
      {
        role: 'readWrite',
        db: databaseName
      },
      {
        role: 'dbAdmin',
        db: databaseName
      }
    ],
    mechanisms: ['SCRAM-SHA-256'],
    passwordDigestor: 'server'
  });
  
  // Create read-only user for monitoring/reporting
  print('👥 Creating read-only user...');
  db.createUser({
    user: readOnlyUsername,
    pwd: readOnlyPassword,
    roles: [
      {
        role: 'read',
        db: databaseName
      }
    ],
    mechanisms: ['SCRAM-SHA-256'],
    passwordDigestor: 'server'
  });
  
  // Create security-focused indexes and collections
  print('🗃️ Creating security collections and indexes...');
  
  // Users collection with security indexes
  db.users.createIndex(
    { "email": 1 }, 
    { 
      unique: true, 
      name: "email_unique_idx",
      partialFilterExpression: { "email": { $exists: true } }
    }
  );
  
  db.users.createIndex(
    { "username": 1 }, 
    { 
      unique: true, 
      name: "username_unique_idx",
      partialFilterExpression: { "username": { $exists: true } }
    }
  );
  
  db.users.createIndex(
    { "createdAt": 1 }, 
    { name: "created_at_idx" }
  );
  
  db.users.createIndex(
    { "lastLogin": 1 }, 
    { name: "last_login_idx" }
  );
  
  db.users.createIndex(
    { "isActive": 1, "email": 1 }, 
    { name: "active_users_idx" }
  );
  
  // Security audit log collection
  db.createCollection('security_audit_logs', {
    capped: true,
    size: 100 * 1024 * 1024, // 100MB
    max: 100000 // Maximum 100k documents
  });
  
  db.security_audit_logs.createIndex(
    { "timestamp": 1 }, 
    { name: "timestamp_idx" }
  );
  
  db.security_audit_logs.createIndex(
    { "eventType": 1, "timestamp": 1 }, 
    { name: "event_type_time_idx" }
  );
  
  db.security_audit_logs.createIndex(
    { "userId": 1, "timestamp": 1 }, 
    { name: "user_activity_idx" }
  );
  
  // Authentication sessions collection
  db.createCollection('auth_sessions');
  
  db.auth_sessions.createIndex(
    { "sessionId": 1 }, 
    { unique: true, name: "session_id_unique_idx" }
  );
  
  db.auth_sessions.createIndex(
    { "userId": 1 }, 
    { name: "user_sessions_idx" }
  );
  
  db.auth_sessions.createIndex(
    { "expiresAt": 1 }, 
    { expireAfterSeconds: 0, name: "session_ttl_idx" }
  );
  
  db.auth_sessions.createIndex(
    { "deviceFingerprint": 1, "userId": 1 }, 
    { name: "device_user_idx" }
  );
  
  // Failed login attempts collection (for security monitoring)
  db.createCollection('failed_login_attempts', {
    capped: true,
    size: 50 * 1024 * 1024, // 50MB
    max: 50000
  });
  
  db.failed_login_attempts.createIndex(
    { "email": 1, "timestamp": 1 }, 
    { name: "email_attempts_idx" }
  );
  
  db.failed_login_attempts.createIndex(
    { "ipAddress": 1, "timestamp": 1 }, 
    { name: "ip_attempts_idx" }
  );
  
  // Rate limiting collection
  db.createCollection('rate_limits');
  
  db.rate_limits.createIndex(
    { "key": 1 }, 
    { unique: true, name: "rate_limit_key_idx" }
  );
  
  db.rate_limits.createIndex(
    { "resetTime": 1 }, 
    { expireAfterSeconds: 0, name: "rate_limit_ttl_idx" }
  );
  
  // User profiles collection
  db.createCollection('user_profiles');
  
  db.user_profiles.createIndex(
    { "userId": 1 }, 
    { unique: true, name: "user_profile_unique_idx" }
  );
  
  db.user_profiles.createIndex(
    { "userId": 1, "isPublic": 1 }, 
    { name: "public_profiles_idx" }
  );
  
  // Chat-related collections
  db.createCollection('chats');
  db.createCollection('messages');
  
  db.chats.createIndex(
    { "participants": 1 }, 
    { name: "chat_participants_idx" }
  );
  
  db.chats.createIndex(
    { "createdAt": 1 }, 
    { name: "chat_created_idx" }
  );
  
  db.messages.createIndex(
    { "chatId": 1, "timestamp": 1 }, 
    { name: "chat_messages_idx" }
  );
  
  db.messages.createIndex(
    { "senderId": 1, "timestamp": 1 }, 
    { name: "user_messages_idx" }
  );
  
  // Notifications collection
  db.createCollection('notifications');
  
  db.notifications.createIndex(
    { "userId": 1, "createdAt": 1 }, 
    { name: "user_notifications_idx" }
  );
  
  db.notifications.createIndex(
    { "isRead": 1, "userId": 1 }, 
    { name: "unread_notifications_idx" }
  );
  
  db.notifications.createIndex(
    { "expiresAt": 1 }, 
    { expireAfterSeconds: 0, name: "notification_ttl_idx" }
  );
  
  // File uploads collection (for security tracking)
  db.createCollection('file_uploads');
  
  db.file_uploads.createIndex(
    { "userId": 1, "uploadedAt": 1 }, 
    { name: "user_uploads_idx" }
  );
  
  db.file_uploads.createIndex(
    { "fileName": 1, "userId": 1 }, 
    { name: "file_user_idx" }
  );
  
  db.file_uploads.createIndex(
    { "isScanned": 1 }, 
    { name: "file_scan_status_idx" }
  );
  
  // Security configuration collection
  db.createCollection('security_config');
  
  // Insert default security configuration
  db.security_config.insertOne({
    _id: 'default',
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      preventReuse: 12 // Last 12 passwords
    },
    sessionPolicy: {
      maxAge: 60 * 60 * 1000, // 1 hour
      maxConcurrentSessions: 5,
      requireReauthentication: 30 * 60 * 1000 // 30 minutes for sensitive operations
    },
    rateLimiting: {
      loginAttempts: {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        lockoutDuration: 30 * 60 * 1000 // 30 minutes
      },
      apiRequests: {
        maxRequests: 100,
        windowMs: 60 * 1000 // 1 minute
      }
    },
    auditSettings: {
      logAuthEvents: true,
      logDataAccess: true,
      logAdminActions: true,
      retentionPeriod: 365 * 24 * 60 * 60 * 1000 // 1 year
    },
    encryptionSettings: {
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
      fieldLevelEncryption: ['email', 'phone', 'personalInfo']
    }
  });
  
  print('✅ Database initialization completed successfully');
  print('📊 Collections created:');
  db.runCommand('listCollections').cursor.firstBatch.forEach(function(collection) {
    print('  - ' + collection.name);
  });
  
} catch (error) {
  print('❌ Database initialization failed: ' + error.message);
  print('Stack trace: ' + error.stack);
  throw error;
}

print('🎉 MongoDB security-hardened initialization completed!');