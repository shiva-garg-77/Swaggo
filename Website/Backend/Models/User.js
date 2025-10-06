import mongoose from 'mongoose';
import argon2 from 'argon2';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🛡️ 10/10 SECURITY USER MODEL
 * 
 * Features:
 * - Secure password hashing with Argon2
 * - Device metadata tracking
 * - Role-based permissions
 * - Session management references
 * - Account security status
 */

const UserSchema = new mongoose.Schema({
  // === IDENTITY ===
  id: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true,
    index: true
  },
  
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_.-]+$/,
    index: true
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // === AUTHENTICATION ===
  passwordHash: {
    type: String,
    required: true,
    select: false // Never include in queries by default
  },
  
  // === PROFILE ===
  profile: {
    displayName: String,
    avatar: String,
    bio: String,
    dateOfBirth: Date,
    emailVerified: {
      type: Boolean,
      default: false
    },
    phoneVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // === PERMISSIONS ===
  permissions: {
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin', 'super_admin'],
      default: 'user'
    },
    scopes: [{
      type: String
    }],
    customPermissions: [{
      resource: String,
      actions: [String]
    }]
  },
  
  // === SECURITY ===
  security: {
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'locked', 'deleted'],
      default: 'active'
    },
    
    loginAttempts: {
      count: { type: Number, default: 0 },
      lastAttempt: Date,
      lockUntil: Date,
      maxAttempts: { type: Number, default: 5 }
    },
    
    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: false },
      backupCodes: [{ type: String, select: false }],
      lastUsed: Date
    },
    
    // WebAuthn credentials for future enhancement
    webauthn: {
      credentials: [{
        id: String,
        publicKey: Buffer,
        counter: Number,
        deviceName: String,
        createdAt: { type: Date, default: Date.now }
      }]
    },
    
    // Device trust levels
    trustedDevices: [{
      deviceId: String,
      deviceHash: String,
      name: String,
      trustLevel: { type: Number, default: 1 }, // 1-5 scale
      lastUsed: Date,
      createdAt: { type: Date, default: Date.now }
    }],
    
    // Risk assessment
    riskScore: {
      current: { type: Number, default: 0 },
      lastCalculated: Date,
      factors: [String]
    }
  },
  
  // === AUDIT TRAIL ===
  audit: {
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date,
    lastLoginIP: String,
    lastLoginDevice: String,
    lastActivity: Date,
    passwordChangedAt: Date,
    emailChangedAt: Date,
    deletedAt: Date
  },
  
  // === SESSION REFERENCES ===
  activeSessions: [{
    sessionId: String,
    deviceId: String,
    createdAt: Date,
    lastUsed: Date,
    ipAddress: String
  }]

}, {
  timestamps: true,
  versionKey: '__v'
});

// === INDEXES FOR PERFORMANCE ===
UserSchema.index({ email: 1, username: 1 });
UserSchema.index({ 'security.accountStatus': 1 });
UserSchema.index({ 'audit.lastLogin': -1 });
UserSchema.index({ 'permissions.role': 1 });

// === INSTANCE METHODS ===

/**
 * Hash password using Argon2
 */
UserSchema.methods.hashPassword = async function(password) {
  try {
    this.passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
    this.audit.passwordChangedAt = new Date();
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

/**
 * Verify password using Argon2
 */
UserSchema.methods.verifyPassword = async function(password) {
  try {
    return await argon2.verify(this.passwordHash, password);
  } catch (error) {
    return false;
  }
};

/**
 * Generate device fingerprint hash
 */
UserSchema.methods.generateDeviceHash = function(userAgent, ipAddress) {
  const deviceString = `${userAgent}|${ipAddress}|${this.id}`;
  return crypto.createHash('sha256').update(deviceString).digest('hex');
};

/**
 * Add or update trusted device
 */
UserSchema.methods.addTrustedDevice = function(deviceId, deviceHash, name, ipAddress) {
  const existingDevice = this.security.trustedDevices.find(d => d.deviceId === deviceId);
  
  if (existingDevice) {
    existingDevice.lastUsed = new Date();
    existingDevice.deviceHash = deviceHash;
  } else {
    this.security.trustedDevices.push({
      deviceId,
      deviceHash,
      name: name || 'Unknown Device',
      lastUsed: new Date(),
      createdAt: new Date()
    });
  }
};

/**
 * Check if device is trusted
 */
UserSchema.methods.isDeviceTrusted = function(deviceId, deviceHash) {
  const device = this.security.trustedDevices.find(d => 
    d.deviceId === deviceId && d.deviceHash === deviceHash
  );
  
  return device && device.trustLevel >= 3;
};

/**
 * Check if account is locked
 */
UserSchema.methods.isAccountLocked = function() {
  if (this.security.accountStatus !== 'active') {
    return true;
  }
  
  const { loginAttempts } = this.security;
  return loginAttempts.lockUntil && loginAttempts.lockUntil > Date.now();
};

/**
 * Lock account after failed login attempts
 */
UserSchema.methods.lockAccount = async function(reason = 'max_login_attempts') {
  this.security.loginAttempts.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  this.security.accountStatus = 'locked';
  
  // Log security event
  console.warn(`🔒 Account locked: ${this.username} - Reason: ${reason}`);
  
  await this.save();
};

/**
 * Reset failed login attempts
 */
UserSchema.methods.resetLoginAttempts = function() {
  this.security.loginAttempts.count = 0;
  this.security.loginAttempts.lastAttempt = null;
  this.security.loginAttempts.lockUntil = null;
};

/**
 * Increment failed login attempts
 */
UserSchema.methods.incrementLoginAttempts = async function() {
  this.security.loginAttempts.count += 1;
  this.security.loginAttempts.lastAttempt = new Date();
  
  if (this.security.loginAttempts.count >= this.security.loginAttempts.maxAttempts) {
    await this.lockAccount();
  } else {
    await this.save();
  }
};

/**
 * Update last login information
 */
UserSchema.methods.updateLastLogin = function(ipAddress, deviceInfo) {
  this.audit.lastLogin = new Date();
  this.audit.lastLoginIP = ipAddress;
  this.audit.lastLoginDevice = deviceInfo;
};

/**
 * Update last activity timestamp
 */
UserSchema.methods.updateLastActivity = async function() {
  this.audit.lastActivity = new Date();
  await this.save();
};

/**
 * Calculate and update risk score
 */
UserSchema.methods.calculateRiskScore = function(factors) {
  let score = 0;
  const riskFactors = [];
  
  // Location-based risk
  if (factors.newLocation) {
    score += 20;
    riskFactors.push('new_location');
  }
  
  // Device-based risk
  if (factors.newDevice) {
    score += 25;
    riskFactors.push('new_device');
  }
  
  // Time-based risk
  if (factors.unusualTime) {
    score += 10;
    riskFactors.push('unusual_time');
  }
  
  // Behavioral risk
  if (factors.rapidRequests) {
    score += 15;
    riskFactors.push('rapid_requests');
  }
  
  this.security.riskScore.current = Math.min(100, score);
  this.security.riskScore.lastCalculated = new Date();
  this.security.riskScore.factors = riskFactors;
  
  return this.security.riskScore.current;
};

/**
 * Generate MFA secret
 */
UserSchema.methods.generateMFASecret = function() {
  const secret = crypto.randomBytes(32).toString('base32');
  this.security.mfa.secret = secret;
  return secret;
};

/**
 * Verify TOTP code
 */
UserSchema.methods.verifyTOTP = function(token) {
  if (!this.security.mfa.enabled || !this.security.mfa.secret) {
    return false;
  }
  
  const speakeasy = require('speakeasy');
  
  const verified = speakeasy.totp.verify({
    secret: this.security.mfa.secret,
    encoding: 'base32',
    token: token,
    window: 2
  });
  
  if (verified) {
    this.security.mfa.lastUsed = new Date();
  }
  
  return verified;
};

/**
 * Generate backup codes for MFA
 */
UserSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  
  this.security.mfa.backupCodes = codes.map(code => 
    crypto.createHash('sha256').update(code).digest('hex')
  );
  
  return codes; // Return unhashed codes to user
};

/**
 * Verify backup code
 */
UserSchema.methods.verifyBackupCode = function(code) {
  if (!this.security.mfa.enabled || !this.security.mfa.backupCodes.length) {
    return false;
  }
  
  const hashedCode = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
  const index = this.security.mfa.backupCodes.indexOf(hashedCode);
  
  if (index !== -1) {
    // Remove used backup code
    this.security.mfa.backupCodes.splice(index, 1);
    this.security.mfa.lastUsed = new Date();
    return true;
  }
  
  return false;
};

/**
 * Return safe user object (without sensitive data)
 */
UserSchema.methods.toSafeObject = function() {
  return {
    id: this.id,
    username: this.username,
    email: this.email,
    profile: this.profile,
    permissions: this.permissions,
    security: {
      accountStatus: this.security.accountStatus,
      mfa: {
        enabled: this.security.mfa.enabled
      },
      riskScore: {
        current: this.security.riskScore.current
      }
    },
    audit: {
      createdAt: this.audit.createdAt,
      lastLogin: this.audit.lastLogin
    }
  };
};

// === STATIC METHODS ===

/**
 * Find user by username or email
 */
UserSchema.statics.findByUsernameOrEmail = function(identifier) {
  return this.findOne({
    $or: [
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() }
    ],
    'security.accountStatus': 'active'
  }).select('+passwordHash');
};

/**
 * Create user with secure defaults
 */
UserSchema.statics.createSecureUser = async function(userData) {
  const user = new this({
    username: userData.username.toLowerCase(),
    email: userData.email.toLowerCase(),
    profile: {
      displayName: userData.displayName || userData.username,
      dateOfBirth: userData.dateOfBirth,
      emailVerified: false
    },
    security: {
      accountStatus: 'active',
      loginAttempts: {
        count: 0,
        maxAttempts: 5
      },
      mfa: {
        enabled: false
      },
      riskScore: {
        current: 0
      }
    },
    permissions: {
      role: 'user',
      scopes: []
    }
  });
  
  await user.hashPassword(userData.password);
  return user;
};

// === PRE-SAVE MIDDLEWARE ===
UserSchema.pre('save', function(next) {
  // Update timestamps
  if (this.isNew) {
    this.audit.createdAt = new Date();
  }
  
  // Validate email format
  if (this.isModified('email')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      return next(new Error('Invalid email format'));
    }
    this.audit.emailChangedAt = new Date();
  }
  
  // Validate username
  if (this.isModified('username')) {
    if (this.username.length < 3 || this.username.length > 30) {
      return next(new Error('Username must be between 3 and 30 characters'));
    }
  }
  
  next();
});

export default mongoose.model('User', UserSchema);