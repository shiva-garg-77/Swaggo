import mongoose from 'mongoose';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import AsyncCrypto from '../utils/AsyncCrypto.js'; // 🔧 CRYPTO #84: Import async crypto utilities

/**
 * 🛡️ 10/10 SECURITY REFRESH TOKEN MODEL
 * 
 * Features:
 * - Token rotation and chaining
 * - Theft detection and family revocation
 * - Device binding and trust levels
 * - Geographic and temporal tracking
 * - Comprehensive audit logging
 */

const RefreshTokenSchema = new mongoose.Schema({
  // === TOKEN IDENTITY ===
  tokenId: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true,
    index: true
  },
  
  // Token hash for security (never store actual token)
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // === TOKEN HIERARCHY ===
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Token family tracking for rotation
  familyId: {
    type: String,
    required: true,
    index: true
  },
  
  // Parent-child relationship for token chains
  parentTokenId: {
    type: String,
    default: null,
    index: true
  },
  
  // Generation number for the token chain
  generation: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 1000 // Prevent infinite chains
  },
  
  // === TOKEN STATUS ===
  status: {
    type: String,
    enum: ['active', 'used', 'revoked', 'expired', 'compromised'],
    default: 'active',
    required: true,
    index: true
  },
  
  // Revocation details
  revocation: {
    reason: {
      type: String,
      enum: ['logout', 'theft_detected', 'manual_revoke', 'policy_violation', 'expired', 'family_revoked', 'max_generations', 'rotated']
    },
    revokedAt: Date,
    revokedBy: String, // User ID or system
    revokedFromIP: String,
    revokedFromDevice: String
  },
  
  // === DEVICE AND SESSION BINDING ===
  device: {
    // Device fingerprint hash
    deviceHash: {
      type: String,
      required: true,
      index: true
    },
    
    // Device metadata
    userAgent: String,
    platform: String,
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    deviceName: String,
    
    // Device trust level (1-5 scale)
    trustLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    
    // Device binding strictness
    strictBinding: {
      type: Boolean,
      default: true
    }
  },
  
  // === GEOGRAPHIC AND NETWORK INFO ===
  location: {
    ipAddress: {
      type: String,
      required: true,
      index: true
    },
    
    // IP geolocation
    country: String,
    region: String,
    city: String,
    coordinates: {
      lat: Number,
      lon: Number
    },
    timezone: String,
    
    // Network information
    isp: String,
    organization: String,
    asn: String,
    
    // Risk assessment
    vpnDetected: {
      type: Boolean,
      default: false
    },
    torDetected: {
      type: Boolean,
      default: false
    },
    proxyDetected: {
      type: Boolean,
      default: false
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // === TEMPORAL CONTROLS ===
  timestamps: {
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    
    lastUsedAt: Date,
    
    expiresAt: {
      type: Date,
      required: true
    },
    
    // Grace period for clock drift
    gracePeriodEnds: Date
  },
  
  // === USAGE TRACKING ===
  usage: {
    // How many times this token was used
    useCount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Maximum allowed uses (for single-use tokens)
    maxUses: {
      type: Number,
      default: 1
    },
    
    // Track all usage attempts
    usageHistory: [{
      timestamp: Date,
      ipAddress: String,
      userAgent: String,
      success: Boolean,
      reason: String
    }]
  },
  
  // === SECURITY METADATA ===
  security: {
    // Entropy and randomness metrics
    entropy: Number,
    
    // Token strength score
    strength: {
      type: Number,
      min: 1,
      max: 10
    },
    
    // Cryptographic algorithm used
    algorithm: {
      type: String,
      default: 'sha256'
    },
    
    // Salt used in hashing
    salt: String,
    
    // Security flags
    flags: [{
      type: String,
      enum: ['high_risk', 'suspicious_location', 'device_mismatch', 'rapid_refresh', 'bot_detected']
    }],
    
    // Theft detection metrics
    theftDetection: {
      suspicionScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      
      indicators: [String],
      
      lastThreatAssessment: Date
    }
  },
  
  // === ASSOCIATED TOKENS ===
  associatedTokens: {
    // Access token that was issued with this refresh token
    accessTokenId: String,
    
    // CSRF token for additional security
    csrfTokenHash: String,
    
    // Session ID if using session-based auth as fallback
    sessionId: String
  },
  
  // === AUDIT AND COMPLIANCE ===
  audit: {
    // Compliance metadata
    gdprConsent: {
      type: Boolean,
      default: false
    },
    
    dataRetentionExpiry: Date,
    
    // Audit trail
    events: [{
      type: {
        type: String,
        enum: ['created', 'used', 'refreshed', 'revoked', 'expired', 'flagged', 'verified']
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      details: String,
      ipAddress: String,
      userAgent: String
    }],
    
    // External audit references
    externalAuditId: String,
    complianceFlags: [String]
  }

}, {
  timestamps: false, // We handle timestamps manually
  versionKey: '__v'
});

// === COMPOUND INDEXES FOR PERFORMANCE ===
RefreshTokenSchema.index({ userId: 1, familyId: 1 });
RefreshTokenSchema.index({ tokenHash: 1, status: 1 });
RefreshTokenSchema.index({ familyId: 1, status: 1, generation: 1 });
RefreshTokenSchema.index({ 'device.deviceHash': 1, userId: 1 });
RefreshTokenSchema.index({ 'location.ipAddress': 1, 'timestamps.createdAt': -1 });
RefreshTokenSchema.index({ 'timestamps.expiresAt': 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ status: 1, 'timestamps.createdAt': -1 });

// === INSTANCE METHODS ===

/**
 * Generate secure token hash from token value using async crypto
 */
RefreshTokenSchema.methods.hashToken = async function(tokenValue) {
  try {
    const { salt, hash, algorithm } = await AsyncCrypto.hashToken(tokenValue);
    this.security.salt = salt;
    this.tokenHash = hash;
    this.security.algorithm = algorithm;
    return this.tokenHash;
  } catch (error) {
    console.error('Token hashing error:', error);
    throw error;
  }
};

/**
 * Verify token against stored hash using async crypto
 */
RefreshTokenSchema.methods.verifyToken = async function(tokenValue) {
  if (!this.security.salt) return false;
  
  try {
    return await AsyncCrypto.verifyToken(tokenValue, this.security.salt, this.tokenHash);
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};

/**
 * Check if token is valid and usable
 */
RefreshTokenSchema.methods.isValid = function() {
  // Check status
  if (this.status !== 'active') {
    return { valid: false, reason: 'token_inactive', details: `Token status: ${this.status}` };
  }
  
  // Check expiration
  if (this.timestamps.expiresAt < new Date()) {
    return { valid: false, reason: 'token_expired', details: 'Token has expired' };
  }
  
  // Check usage limits
  if (this.usage.useCount >= this.usage.maxUses) {
    return { valid: false, reason: 'max_uses_exceeded', details: 'Token has been used maximum times' };
  }
  
  // Check generation limits
  if (this.generation > 1000) {
    return { valid: false, reason: 'max_generations_exceeded', details: 'Token chain too long' };
  }
  
  return { valid: true, reason: 'valid', details: 'Token is valid and usable' };
};

/**
 * Check if device matches the bound device
 */
RefreshTokenSchema.methods.verifyDevice = function(deviceHash, userAgent) {
  if (!this.device.strictBinding) {
    return { valid: true, reason: 'device_binding_disabled' };
  }
  
  if (this.device.deviceHash !== deviceHash) {
    // Add theft detection flag
    this.security.flags.push('device_mismatch');
    this.security.theftDetection.suspicionScore += 30;
    this.security.theftDetection.indicators.push('device_hash_mismatch');
    
    return { valid: false, reason: 'device_mismatch', details: 'Device fingerprint does not match' };
  }
  
  return { valid: true, reason: 'device_verified' };
};

/**
 * Mark token as used and track usage
 */
RefreshTokenSchema.methods.markAsUsed = function(ipAddress, userAgent, success = true, reason = '') {
  this.usage.useCount += 1;
  this.timestamps.lastUsedAt = new Date();
  
  // Add to usage history
  this.usage.usageHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    success,
    reason
  });
  
  // Add audit event
  this.audit.events.push({
    type: 'used',
    timestamp: new Date(),
    details: reason || 'Token used for refresh',
    ipAddress,
    userAgent
  });
  
  // Mark as used if single-use token
  if (this.usage.maxUses === 1) {
    this.status = 'used';
  }
};

/**
 * Revoke token with detailed reason
 */
RefreshTokenSchema.methods.revoke = function(reason, revokedBy, ipAddress, deviceInfo) {
  this.status = 'revoked';
  this.revocation = {
    reason,
    revokedAt: new Date(),
    revokedBy,
    revokedFromIP: ipAddress,
    revokedFromDevice: deviceInfo
  };
  
  // Add audit event
  this.audit.events.push({
    type: 'revoked',
    timestamp: new Date(),
    details: `Token revoked: ${reason}`,
    ipAddress,
    userAgent: deviceInfo
  });
};

/**
 * Detect potential token theft
 */
RefreshTokenSchema.methods.detectTheft = function(currentIP, currentDevice) {
  let suspicionScore = 0;
  const indicators = [];
  
  // Check for rapid token usage
  const recentUsage = this.usage.usageHistory.filter(u => 
    u.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
  ).length;
  
  if (recentUsage > 5) {
    suspicionScore += 25;
    indicators.push('rapid_token_usage');
  }
  
  // Check for geographic impossibility
  if (this.location.country && this.location.ipAddress !== currentIP) {
    // This would require a geolocation service to properly implement
    suspicionScore += 20;
    indicators.push('location_change');
  }
  
  // Check for device changes
  if (this.device.deviceHash !== currentDevice) {
    suspicionScore += 30;
    indicators.push('device_change');
  }
  
  // Update theft detection metrics
  this.security.theftDetection.suspicionScore = suspicionScore;
  this.security.theftDetection.indicators = indicators;
  this.security.theftDetection.lastThreatAssessment = new Date();
  
  return {
    suspicious: suspicionScore > 50,
    score: suspicionScore,
    indicators
  };
};

/**
 * Calculate token strength score
 */
RefreshTokenSchema.methods.calculateStrength = function() {
  let strength = 5; // Base strength
  
  // Device binding adds strength
  if (this.device.strictBinding) strength += 1;
  
  // High trust device adds strength
  if (this.device.trustLevel >= 4) strength += 1;
  
  // Low risk location adds strength
  if (this.location.riskScore < 20) strength += 1;
  
  // High entropy adds strength
  if (this.security.entropy > 128) strength += 1;
  
  // Reduce strength for security flags
  strength -= Math.min(this.security.flags.length, 3);
  
  this.security.strength = Math.max(1, Math.min(10, strength));
  return this.security.strength;
};

/**
 * Generate child token for rotation
 */
RefreshTokenSchema.methods.generateChildToken = function() {
  return {
    familyId: this.familyId,
    parentTokenId: this.tokenId,
    generation: this.generation + 1,
    userId: this.userId,
    device: { ...this.device },
    // Inherit some security settings
    security: {
      algorithm: this.security.algorithm,
      flags: [],
      theftDetection: {
        suspicionScore: Math.max(0, this.security.theftDetection.suspicionScore - 10),
        indicators: [],
        lastThreatAssessment: new Date()
      }
    }
  };
};

// === STATIC METHODS ===

/**
 * Find active token by hash
 */
RefreshTokenSchema.statics.findActiveToken = function(tokenHash) {
  const now = new Date();
  return this.findOne()
    .where('tokenHash').equals(tokenHash)
    .where('status').equals('active')
    .where('timestamps.expiresAt').gt(now)
    .exec();
};

/**
 * Find all tokens in a family
 */
RefreshTokenSchema.statics.findTokenFamily = function(familyId) {
  return this.find({ familyId }).sort({ generation: 1 });
};

/**
 * Revoke entire token family (for theft detection)
 */
RefreshTokenSchema.statics.revokeTokenFamily = async function(familyId, reason = 'family_revoked') {
  const result = await this.updateMany(
    { familyId, status: { $in: ['active', 'used'] } },
    {
      $set: {
        status: 'revoked',
        'revocation.reason': reason,
        'revocation.revokedAt': new Date(),
        'revocation.revokedBy': 'system'
      }
    }
  );
  
  console.warn(`🚨 Token family revoked: ${familyId} - ${result.modifiedCount} tokens affected`);
  return result;
};

/**
 * Clean up expired tokens
 */
RefreshTokenSchema.statics.cleanupExpiredTokens = async function() {
  const now = new Date();
  
  // Mark expired tokens
  const expiredResult = await this.updateMany(
    {
      status: 'active',
      'timestamps.expiresAt': { $lt: now }
    },
    {
      $set: {
        status: 'expired',
        'revocation.reason': 'expired',
        'revocation.revokedAt': now,
        'revocation.revokedBy': 'system'
      }
    }
  );
  
  // Clean up old revoked tokens (older than retention period)
  const retentionDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
  const cleanupResult = await this.deleteMany({
    status: { $in: ['revoked', 'expired'] },
    'timestamps.createdAt': { $lt: retentionDate }
  });
  
  console.log(`🧹 Token cleanup: ${expiredResult.modifiedCount} expired, ${cleanupResult.deletedCount} cleaned`);
  
  return {
    expired: expiredResult.modifiedCount,
    cleaned: cleanupResult.deletedCount
  };
};

/**
 * Get user's active tokens count
 */
RefreshTokenSchema.statics.getActiveTokenCount = function(userId) {
  const now = new Date();
  return this.countDocuments()
    .where('userId').equals(userId)
    .where('status').equals('active')
    .where('timestamps.expiresAt').gt(now)
    .exec();
};

/**
 * Get security analytics for user
 */
RefreshTokenSchema.statics.getUserSecurityAnalytics = async function(userId) {
  const pipeline = [
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: 1 },
        activeTokens: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
          }
        },
        revokedTokens: {
          $sum: {
            $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0]
          }
        },
        suspiciousTokens: {
          $sum: {
            $cond: [{ $gt: ['$security.theftDetection.suspicionScore', 50] }, 1, 0]
          }
        },
        uniqueDevices: { $addToSet: '$device.deviceHash' },
        uniqueLocations: { $addToSet: '$location.country' }
      }
    },
    {
      $project: {
        _id: 0,
        totalTokens: 1,
        activeTokens: 1,
        revokedTokens: 1,
        suspiciousTokens: 1,
        uniqueDeviceCount: { $size: '$uniqueDevices' },
        uniqueLocationCount: { $size: '$uniqueLocations' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalTokens: 0,
    activeTokens: 0,
    revokedTokens: 0,
    suspiciousTokens: 0,
    uniqueDeviceCount: 0,
    uniqueLocationCount: 0
  };
};

// === PRE-SAVE MIDDLEWARE ===
RefreshTokenSchema.pre('save', function(next) {
  // Calculate token strength
  this.calculateStrength();
  
  // Set grace period
  if (this.isNew && !this.timestamps.gracePeriodEnds) {
    this.timestamps.gracePeriodEnds = new Date(this.timestamps.expiresAt.getTime() + 5 * 60 * 1000);
  }
  
  // Validate generation limits
  if (this.generation > 1000) {
    return next(new Error('Token generation limit exceeded'));
  }
  
  next();
});

// === POST-SAVE MIDDLEWARE ===
RefreshTokenSchema.post('save', function() {
  // Log creation event
  if (this.isNew) {
    console.log(`🔑 New refresh token created: ${this.tokenId} (Gen: ${this.generation})`);
  }
});

export default mongoose.model('RefreshToken', RefreshTokenSchema);