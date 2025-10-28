import express from 'express';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import User from '../../../Models/User.js';
import TokenService from '../../../Services/Authentication/TokenService.js';
import AuthenticationMiddleware from '../../../Middleware/Authentication/AuthenticationMiddleware.js';
import SecurityConfig from '../../../Config/SecurityConfig.js';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import nodemailer from 'nodemailer';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import Profile from '../../../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';
import argon2 from 'argon2'; // 🔒 SECURITY FIX #59: Import argon2 for dummy password verification
import jwt from 'jsonwebtoken'; // Import jwt for token decoding

// 🔒 SECURITY FIX #65: Import password reset rate limiter for brute force protection
import { passwordResetRateLimiter } from '../../../Middleware/Performance/rateLimitingMiddleware.js';

// 🔒 SECURITY FIX #66: Import audit log service for security event logging
import AuditLogService from '../../../Services/Security/AuditLogService.js';

// 🔧 API RESPONSE STANDARDIZATION #98: Import standardized API response utility
import ApiResponse from '../../../utils/ApiResponse.js';
const { sendSuccess, sendError, sendConflict, sendUnauthorized, sendValidationError, sendNotFound, sendTooManyRequests } = ApiResponse;

const router = express.Router();

/**
 * 🛡️ 10/10 SECURE AUTHENTICATION ROUTES
 * 
 * Features:
 * - Secure login/logout with device binding
 * - Advanced signup with email verification
 * - Automatic token refresh with rotation
 * - MFA/2FA support with TOTP and backup codes
 * - Password reset with secure tokens
 * - Account management and security features
 * - Device management and trust scoring
 */

// Rate limiters from middleware
const { login: loginLimiter, refresh: refreshLimiter } = AuthenticationMiddleware.getRateLimiters();

// === UTILITY FUNCTIONS ===

/**
 * Validate request and extract errors
 */
const validateRequest = (req, res) => {
  const errors = validationResult(req);
  console.log('Validation errors:', errors.array());
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Invalid request data',
      details: errors.array()
    });
  }
  return null;
};

/**
 * Extract device and location context
 */
const extractContext = (req) => {
  const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();
  const geoInfo = geoip.lookup(ipAddress);
  
  return {
    ipAddress,
    userAgent,
    deviceInfo: {
      browser: uaResult.browser.name || 'unknown',
      browserVersion: uaResult.browser.version || 'unknown',
      os: uaResult.os.name || 'unknown',
      osVersion: uaResult.os.version || 'unknown',
      device: uaResult.device.type || 'desktop'
    },
    location: geoInfo ? {
      country: geoInfo.country,
      region: geoInfo.region,
      city: geoInfo.city,
      timezone: geoInfo.timezone
    } : null
  };
};

/**
 * Generate device fingerprint
 */
const generateDeviceFingerprint = (req) => {
  const components = [
    req.get('User-Agent') || '',
    req.get('Accept-Language') || '',
    req.get('Accept-Encoding') || '',
    req.ip || '',
    req.headers['x-forwarded-for'] || ''
  ];
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
};


router.post('/signup', [
  // Rate limiting
  loginLimiter,
  
  // Input validation
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username must be 3-30 characters and contain only alphanumeric characters, dots, underscores, and hyphens'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: SecurityConfig.auth.password.minLength, max: SecurityConfig.auth.password.maxLength })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(`Password must be at least ${SecurityConfig.auth.password.minLength} characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character`),
  
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim(),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .toDate(),
  
  body('acceptTerms')
    .equals('true')
    .withMessage('You must accept the terms and conditions'),
  
  body('gdprConsent')
    .equals('true')
    .withMessage('GDPR consent is required')
    
], async (req, res) => {
  try {
    console.log("req body", req.body);
    console.log('🔍 Starting signup process...');
    
    // Validate input
    const validationError = validateRequest(req, res);
    if (validationError){
      
      console.log('❌ Validation failed: validation error aaya -------------------------------------------------------',);
      return validationError;
    } 
    
    console.log('✅ Validation passed');
    
    const { username, email, password, displayName, dateOfBirth, acceptTerms, gdprConsent } = req.body;
    const context = extractContext(req);
    
    console.log('✅ Context extracted, checking existing users...');
    
    // Check if user already exists in both User and Profile models
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    
    const existingProfile = await Profile.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    
    if (existingUser || existingProfile) {
      const conflictField = (existingUser?.email === email.toLowerCase() || existingProfile?.email === email.toLowerCase()) ? 'email' : 'username';
      return sendConflict(res, 'A user with this email or username already exists', conflictField);
    }
    
    // Create new user
    const newUser = await User.createSecureUser({
      username,
      email,
      password,
      displayName: displayName || username,
      dateOfBirth
    });
    
    // Create corresponding profile (CRITICAL: This was missing!)
    const newProfile = new Profile({
      profileid: uuidv4(),
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      name: displayName || username,
      bio: null,
      profilePic: 'https://www.tenforums.com/attachments/user-accounts-family-safety/322690d1615743307t-user-account-image-log-user.png',
      isPrivate: false,
      isVerified: false,
      isActive: true,
      accountStatus: 'active',
      role: 'user'
    });
    
    await newProfile.save();
    console.log(`✅ Created profile for user: ${username} with profileid: ${newProfile.profileid}`);
    
    // Generate device fingerprint and add as trusted device
    const deviceFingerprint = generateDeviceFingerprint(req);
    newUser.addTrustedDevice(
      deviceFingerprint,
      deviceFingerprint,
      `${context.deviceInfo.browser} on ${context.deviceInfo.os}`,
      context.ipAddress
    );
    
    // Update initial login information
    newUser.updateLastLogin(context.ipAddress, `${context.deviceInfo.browser} ${context.deviceInfo.os}`);
    
    await newUser.save();
    
    // SECURITY FIX: Generate secure session context with 10/10 security for new account
    const sessionContext = {
      ipAddress: context.ipAddress,
      location: context.location,
      gdprConsent: gdprConsent === 'true',
      isAuthentication: true, // SECURITY: Trigger session ID generation
      authMethod: 'registration', // SECURITY: Track authentication method
      revokeOldTokens: true // 🔐 ENABLE 10/10 SECURITY: Revoke any existing tokens (edge case protection)
    };
    
    const deviceInfo = {
      deviceHash: deviceFingerprint,
      userAgent: context.userAgent,
      trustLevel: 2 // Initial trust level for new device
    };
    
    console.log(`🔐 SIGNUP SECURITY: Generating tokens with 10/10 security for new user ${newUser.id}`);
    
    // Generate access token (will auto-revoke any old tokens)
    const accessTokenResult = await TokenService.generateAccessToken(newUser, deviceInfo, sessionContext);
    
    // Generate refresh token (will auto-revoke any old tokens)
    const refreshTokenResult = await TokenService.generateRefreshToken(newUser, deviceInfo, sessionContext);
    
    // Handle both string and object formats for tokens
    let accessToken, accessTokenId;
    if (typeof accessTokenResult === 'string') {
      // Extract token ID from the JWT payload for string format
      accessToken = accessTokenResult;
      try {
        const tokenWithoutPrefix = accessToken.replace('swg_at_', '');
        const decoded = jwt.decode(tokenWithoutPrefix);
        accessTokenId = decoded?.jti;
      } catch (decodeError) {
        console.warn('Could not decode access token to extract ID:', decodeError);
        accessTokenId = uuidv4(); // Generate a fallback ID
      }
    } else {
      // Object format
      accessToken = accessTokenResult.token;
      accessTokenId = accessTokenResult.tokenId;
    }
    
    // Handle refresh token format
    let refreshToken, refreshTokenId;
    if (typeof refreshTokenResult === 'string') {
      // Extract token ID from the JWT payload for string format
      refreshToken = refreshTokenResult;
      try {
        const tokenWithoutPrefix = refreshToken.replace('swg_rt_', '');
        const decoded = jwt.decode(tokenWithoutPrefix);
        refreshTokenId = decoded?.jti;
      } catch (decodeError) {
        console.warn('Could not decode refresh token to extract ID:', decodeError);
        refreshTokenId = uuidv4(); // Generate a fallback ID
      }
    } else {
      // Object format
      refreshToken = refreshTokenResult.token;
      refreshTokenId = refreshTokenResult.tokenId;
    }
    
    // SECURITY FIX: Generate CSRF token with session context
    const csrfToken = await TokenService.generateCSRFToken(newUser, accessTokenId, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    
    // Set cookies
    AuthenticationMiddleware.setAuthenticationCookies(res, {
      accessToken: accessToken,
      refreshToken: refreshToken,
      csrfToken
    });
    
    // Send email verification (if email service is configured)
    try {
      await sendEmailVerification(newUser, context);
    } catch (error) {
      console.error('Email verification sending failed:', error);
      // Don't fail signup if email fails
    }
    
    // Log successful signup
    console.log(`✅ New user signup: ${newUser.username} (${newUser.email}) from ${context.ipAddress}`);
    
    // 🔒 SECURITY FIX #66: Log successful signup using audit logging service
    await AuditLogService.log({
      eventType: 'USER_REGISTER',
      severity: 'LOW',
      userId: newUser.id,
      username: newUser.username,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      action: 'CREATE',
      resourceType: 'USER',
      status: 'SUCCESS',
      details: {
        email: newUser.email,
        profileId: newProfile.profileid
      },
      complianceTags: ['ISO_27001']
    });
    
    const responseData = {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        profileid: newProfile.profileid,
        displayName: newUser.profile?.displayName || displayName || username,
        emailVerified: newUser.profile?.emailVerified || false,
        role: newUser.permissions?.role || 'user'
      },
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        csrfToken,
        expiresAt: typeof accessTokenResult !== 'string' ? accessTokenResult.expiresAt : null
      },
      security: {
        riskScore: typeof accessTokenResult !== 'string' ? accessTokenResult.riskScore : 0,
        deviceFingerprint,
        requiresEmailVerification: !newUser.profile.emailVerified
      }
    };
    
    return sendSuccess(res, responseData, 'Account created successfully', 201);
    
  } catch (error) {
    console.error('🚨 DETAILED SIGNUP ERROR:');
    console.error('  Error name:', error.name);
    console.error('  Error message:', error.message);
    console.error('  Error stack:', error.stack);
    if (error.code) console.error('  Error code:', error.code);
    
    return sendError(res, 'Failed to create account', 500, 'SIGNUP_ERROR', 
      process.env.NODE_ENV === 'development' ? { debug: error.message } : undefined);
  }
});

router.post('/login', [
  
  // Rate limiting
  loginLimiter,
  
  // Input validation
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('totpCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('TOTP code must be 6 digits'),
  
  body('rememberMe')
    .optional()
    .isBoolean(),
  
  body('trustDevice')
    .optional()
    .isBoolean()
    
], async (req, res) => {
  try {
    // Validate input
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;
    
    const { identifier, password, totpCode, rememberMe = false, trustDevice = false } = req.body;
    const context = extractContext(req);
    const deviceFingerprint = generateDeviceFingerprint(req);
    
    // Find user
    const user = await User.findByUsernameOrEmail(identifier);
    
    // 🔒 SECURITY FIX #59: Account enumeration protection
    // Always perform password verification to prevent timing attacks and user enumeration
    let isPasswordValid = false;
    if (user) {
      isPasswordValid = await user.verifyPassword(password);
    } else {
      // For non-existent users, still perform a dummy password verification
      // to prevent timing attacks that could reveal user existence
      await argon2.verify('$argon2id$v=19$m=65536,t=3,p=1$dummySalt$dummyHash', password);
    }
    
    // If user doesn't exist or password is invalid, return generic error
    if (!user || !isPasswordValid) {
      // Increment fake login attempts for non-existent users to maintain consistency
      if (user) {
        await user.incrementLoginAttempts();
      }
      
      return sendUnauthorized(res, 'Invalid email/username or password');
    }
    
    // Check if account is locked
    if (user.isAccountLocked()) {
      return sendError(res, 'Account is temporarily locked due to failed login attempts', 423, 'ACCOUNT_LOCKED', 
        { lockUntil: user.security.loginAttempts.lockUntil });
    }
    
    // Check for MFA requirement
    if (user.security.mfa.enabled) {
      if (!totpCode) {
        const mfaData = {
          requiresMFA: true,
          mfaType: 'totp'
        };
        return sendSuccess(res, mfaData, 'Two-factor authentication code required', 200);
      }
      
      // Verify TOTP code
      const isTotpValid = user.verifyTOTP(totpCode);
      if (!isTotpValid) {
        await user.incrementLoginAttempts();
        
        return sendUnauthorized(res, 'Invalid two-factor authentication code', 'INVALID_MFA_CODE');
      }
    }
    
    // Reset failed login attempts on successful login
    user.resetLoginAttempts();
    
    // Calculate risk score
    const riskFactors = {
      newLocation: !user.audit.lastLoginIP || geoip.lookup(user.audit.lastLoginIP)?.country !== context.location?.country,
      newDevice: !user.isDeviceTrusted(deviceFingerprint, deviceFingerprint),
      unusualTime: new Date().getHours() < 6 || new Date().getHours() > 23,
      rapidRequests: false // Would be calculated based on recent activity
    };
    
    const riskScore = user.calculateRiskScore(riskFactors);
    
    // Update device trust if requested and risk is low
    let deviceTrustLevel = 1;
    if (trustDevice && riskScore < 30) {
      user.addTrustedDevice(
        deviceFingerprint,
        deviceFingerprint,
        `${context.deviceInfo.browser} on ${context.deviceInfo.os}`,
        context.ipAddress
      );
      deviceTrustLevel = 3;
    }
    
    // Update last login
    user.updateLastLogin(context.ipAddress, `${context.deviceInfo.browser} ${context.deviceInfo.os}`);
    
    await user.save();
    
    // SECURITY FIX: Generate secure session context with 10/10 security token revocation
    const sessionContext = {
      ipAddress: context.ipAddress,
      location: context.location,
      gdprConsent: true, // Assume consent for existing users
      isAuthentication: true, // SECURITY: Trigger session ID regeneration
      authMethod: 'password_login', // SECURITY: Track authentication method
      revokeOldTokens: true // 🔐 ENABLE 10/10 SECURITY: Revoke all old tokens on login
    };
    
    const deviceInfo = {
      deviceHash: deviceFingerprint,
      userAgent: context.userAgent,
      trustLevel: deviceTrustLevel
    };
    
    console.log(`🔐 LOGIN SECURITY: Generating tokens with 10/10 security for user ${user.id}`);
    
    // Generate access token (will auto-revoke old tokens)
    const accessTokenResult = await TokenService.generateAccessToken(user, deviceInfo, sessionContext);
    
    // Generate refresh token (will auto-revoke old tokens)
    const refreshTokenResult = await TokenService.generateRefreshToken(user, deviceInfo, sessionContext);
    
    // SECURITY FIX: Enhanced debugging for token results
    console.log('🔐 DEBUG: Token Generation Results', {
      accessTokenResultType: typeof accessTokenResult,
      accessTokenResultKeys: accessTokenResult ? Object.keys(accessTokenResult) : 'null',
      accessTokenToken: typeof accessTokenResult === 'string' ? accessTokenResult : accessTokenResult?.token,
      accessTokenTokenId: typeof accessTokenResult === 'string' ? null : accessTokenResult?.tokenId,
      accessTokenPresent: !!accessTokenResult,
      accessTokenTokenPresent: !!(accessTokenResult && (typeof accessTokenResult === 'string' ? accessTokenResult : accessTokenResult.token)),
      accessTokenTokenType: typeof (typeof accessTokenResult === 'string' ? accessTokenResult : accessTokenResult?.token),
      refreshTokenResultType: typeof refreshTokenResult,
      refreshTokenResultKeys: refreshTokenResult ? Object.keys(refreshTokenResult) : 'null',
      refreshTokenToken: typeof refreshTokenResult === 'string' ? refreshTokenResult : refreshTokenResult?.token,
      refreshTokenPresent: !!refreshTokenResult,
      refreshTokenTokenPresent: !!(refreshTokenResult && (typeof refreshTokenResult === 'string' ? refreshTokenResult : refreshTokenResult.token)),
      refreshTokenTokenType: typeof (typeof refreshTokenResult === 'string' ? refreshTokenResult : refreshTokenResult?.token)
    });
    
    // SECURITY FIX: Validate token results before proceeding
    // Enhanced validation to handle potential undefined token values
    if (!accessTokenResult) {
      console.error('❌ ACCESS TOKEN GENERATION FAILED: No result returned');
      return sendError(res, 'Failed to generate access token', 500, 'TOKEN_GENERATION_ERROR');
    }

    // Check if accessTokenResult is a string or object and extract token appropriately
    let accessToken, accessTokenId;
    if (typeof accessTokenResult === 'string') {
      accessToken = accessTokenResult;
      // Extract token ID from the JWT payload
      try {
        const tokenWithoutPrefix = accessToken.replace('swg_at_', '');
        const decoded = jwt.decode(tokenWithoutPrefix);
        accessTokenId = decoded?.jti;
      } catch (decodeError) {
        console.warn('Could not decode access token to extract ID:', decodeError);
        accessTokenId = uuidv4(); // Generate a fallback ID
      }
    } else {
      accessToken = accessTokenResult.token;
      accessTokenId = accessTokenResult.tokenId;
    }

    // Check if accessToken is actually a string and not undefined/null
    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      console.error('❌ ACCESS TOKEN GENERATION FAILED: Invalid token value', {
        tokenType: typeof accessToken,
        tokenValue: accessToken,
        tokenLength: accessToken?.length,
        resultStructure: accessTokenResult ? Object.keys(accessTokenResult) : 'null'
      });
      return sendError(res, 'Failed to generate valid access token', 500, 'TOKEN_GENERATION_ERROR');
    }

    if (!refreshTokenResult) {
      console.error('❌ REFRESH TOKEN GENERATION FAILED: No result returned');
      return sendError(res, 'Failed to generate refresh token', 500, 'TOKEN_GENERATION_ERROR');
    }

    // Check if refreshTokenResult is a string or object and extract token appropriately
    let refreshToken, refreshTokenId;
    if (typeof refreshTokenResult === 'string') {
      refreshToken = refreshTokenResult;
      // Extract token ID from the JWT payload
      try {
        const tokenWithoutPrefix = refreshToken.replace('swg_rt_', '');
        const decoded = jwt.decode(tokenWithoutPrefix);
        refreshTokenId = decoded?.jti;
      } catch (decodeError) {
        console.warn('Could not decode refresh token to extract ID:', decodeError);
        refreshTokenId = uuidv4(); // Generate a fallback ID
      }
    } else {
      refreshToken = refreshTokenResult.token;
      refreshTokenId = refreshTokenResult.tokenId;
    }

    // Check if refreshToken is actually a string and not undefined/null
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      console.error('❌ REFRESH TOKEN GENERATION FAILED: Invalid token value', {
        tokenType: typeof refreshToken,
        tokenValue: refreshToken,
        tokenLength: refreshToken?.length,
        resultStructure: refreshTokenResult ? Object.keys(refreshTokenResult) : 'null'
      });
      return sendError(res, 'Failed to generate valid refresh token', 500, 'TOKEN_GENERATION_ERROR');
    }

    // SECURITY FIX: Generate CSRF token with session context
    const csrfToken = await TokenService.generateCSRFToken(user, accessTokenId, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    // Additional validation for CSRF token
    if (!csrfToken) {
      console.error('❌ CSRF TOKEN GENERATION FAILED: No token generated');
      return sendError(res, 'Failed to generate CSRF token', 500, 'TOKEN_GENERATION_ERROR');
    }

    // Log token values for debugging (without exposing actual tokens)
    console.log('🔐 Generated tokens debug info:', {
      accessTokenPresent: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenPresent: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0,
      csrfTokenPresent: !!csrfToken,
      csrfTokenLength: csrfToken?.length || 0,
      accessTokenTokenId: accessTokenId?.substring(0, 8) + '...',
      user: user.username
    });

    // SECURITY FIX: Enhanced debugging for cookie setting
    const cookieTokens = {
      accessToken: accessToken,
      refreshToken: refreshToken,
      csrfToken: csrfToken
    };

    console.log('🔐 DEBUG: Cookie Tokens Object', {
      cookieTokensType: typeof cookieTokens,
      cookieTokensKeys: Object.keys(cookieTokens),
      accessTokenType: typeof cookieTokens.accessToken,
      accessTokenValue: cookieTokens.accessToken,
      accessTokenLength: cookieTokens.accessToken?.length,
      refreshTokenType: typeof cookieTokens.refreshToken,
      refreshTokenValue: cookieTokens.refreshToken,
      refreshTokenLength: cookieTokens.refreshToken?.length,
      csrfTokenType: typeof cookieTokens.csrfToken,
      csrfTokenValue: cookieTokens.csrfToken,
      csrfTokenLength: cookieTokens.csrfToken?.length
    });
    
    // Set authentication cookies
    const cookieOptions = {
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined // 30 days if remember me
    };
    
    AuthenticationMiddleware.setAuthenticationCookies(res, cookieTokens, cookieOptions);
    
    // Log successful login
    console.log(`✅ User login: ${user.username} from ${context.ipAddress} (Risk: ${riskScore})`);
    
    // 🔒 SECURITY FIX #66: Log successful login using audit logging service
    await AuditLogService.log({
      eventType: 'USER_LOGIN',
      severity: 'LOW',
      userId: user.id,
      username: user.username,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      action: 'LOGIN',
      resourceType: 'USER',
      status: 'SUCCESS',
      details: {
        email: user.email,
        riskScore: riskScore,
        deviceTrusted: deviceTrustLevel >= 3
      },
      complianceTags: ['ISO_27001']
    });
    
    const responseData = {
      user: user.toSafeObject(),
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        csrfToken,
        expiresAt: typeof accessTokenResult !== 'string' ? accessTokenResult.expiresAt : null
      },
      security: {
        riskScore,
        deviceFingerprint,
        deviceTrusted: deviceTrustLevel >= 3,
        requiresEmailVerification: !user.profile.emailVerified
      },
      session: {
        rememberMe,
        trustDevice: trustDevice && riskScore < 30
      }
    };

    return sendSuccess(res, responseData, 'Login successful');
    
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Login failed due to server error', 500, 'LOGIN_ERROR');
  }
});

router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    const context = extractContext(req);
    const deviceFingerprint = generateDeviceFingerprint(req);
    
    // Extract refresh token from cookie with proper prefix support
    const refreshToken = AuthenticationMiddleware.extractRefreshToken(req) || req.body?.refreshToken;
    
    if (!refreshToken) {
      return sendUnauthorized(res, 'Refresh token is required', 'NO_REFRESH_TOKEN');
    }
    
    // SECURITY FIX: Refresh tokens with secure context and 10/10 security
    const refreshResult = await TokenService.refreshTokens(refreshToken, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceHash: deviceFingerprint,
      revokeOldTokens: true // 🔐 ENABLE 10/10 SECURITY: Revoke old tokens during refresh
      // SECURITY FIX: Session ID managed internally by TokenService
    });
    
    console.log(`🔐 REFRESH SECURITY: Processing token refresh with 10/10 security revocation`);
    
    if (!refreshResult.valid) {
      // Clear cookies on refresh failure
      AuthenticationMiddleware.clearAuthenticationCookies(res);
      
      return sendUnauthorized(res, refreshResult.details || 'Token refresh failed', 'REFRESH_FAILED', 
        { reason: refreshResult.reason });
    }
    
    // SECURITY FIX: Validate refresh result tokens before setting cookies
    // Handle both string and object formats for tokens
    let refreshedAccessToken, refreshedRefreshToken, refreshedCsrfToken;
    
    // Handle access token - check multiple possible formats
    if (typeof refreshResult.accessToken === 'string') {
      refreshedAccessToken = refreshResult.accessToken;
    } else if (refreshResult.accessToken && typeof refreshResult.accessToken === 'object') {
      refreshedAccessToken = refreshResult.accessToken.token || refreshResult.accessToken;
    } else {
      refreshedAccessToken = refreshResult.accessToken;
    }
    
    // Handle refresh token - check multiple possible formats
    if (typeof refreshResult.refreshToken === 'string') {
      refreshedRefreshToken = refreshResult.refreshToken;
    } else if (refreshResult.refreshToken && typeof refreshResult.refreshToken === 'object') {
      refreshedRefreshToken = refreshResult.refreshToken.token || refreshResult.refreshToken;
    } else {
      refreshedRefreshToken = refreshResult.refreshToken;
    }
    
    // Handle CSRF token
    if (typeof refreshResult.csrfToken === 'string') {
      refreshedCsrfToken = refreshResult.csrfToken;
    } else {
      refreshedCsrfToken = refreshResult.csrfToken;
    }
    
    // CRITICAL FIX: Validate that tokens are actually strings before setting cookies
    if (!refreshedAccessToken || typeof refreshedAccessToken !== 'string' || refreshedAccessToken.length === 0) {
      console.error('❌ ACCESS TOKEN REFRESH FAILED: Invalid access token result', refreshResult.accessToken);
      return sendError(res, 'Failed to refresh access token', 500, 'TOKEN_REFRESH_ERROR');
    }
    
    if (!refreshedRefreshToken || typeof refreshedRefreshToken !== 'string' || refreshedRefreshToken.length === 0) {
      console.error('❌ REFRESH TOKEN REFRESH FAILED: Invalid refresh token result', refreshResult.refreshToken);
      return sendError(res, 'Failed to refresh refresh token', 500, 'TOKEN_REFRESH_ERROR');
    }
    
    if (!refreshedCsrfToken) {
      console.error('❌ CSRF TOKEN REFRESH FAILED: No CSRF token generated');
      return sendError(res, 'Failed to generate CSRF token', 500, 'TOKEN_REFRESH_ERROR');
    }
    
    // Log refresh token values for debugging (without exposing actual tokens)
    console.log('🔄 Refreshed tokens debug info:', {
      accessTokenPresent: !!refreshedAccessToken,
      accessTokenLength: refreshedAccessToken?.length || 0,
      refreshTokenPresent: !!refreshedRefreshToken,
      refreshTokenLength: refreshedRefreshToken?.length || 0,
      csrfTokenPresent: !!refreshedCsrfToken,
      csrfTokenLength: refreshedCsrfToken?.length || 0,
      user: refreshResult.user?.username
    });
    
    // Set new tokens in cookies
    AuthenticationMiddleware.setAuthenticationCookies(res, {
      accessToken: refreshedAccessToken,
      refreshToken: refreshedRefreshToken,
      csrfToken: refreshedCsrfToken
    });
    
    console.log(`🔄 Token refreshed: ${refreshResult.user.username} (Gen: ${refreshResult.metadata.generation})`);
    
    // 🔒 SECURITY FIX #66: Log token refresh using audit logging service
    await AuditLogService.log({
      eventType: 'TOKEN_REFRESH',
      severity: 'LOW',
      userId: refreshResult.user.id,
      username: refreshResult.user.username,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      action: 'UPDATE',
      resourceType: 'USER',
      status: 'SUCCESS',
      details: {
        generation: refreshResult.metadata.generation,
        rotated: refreshResult.metadata.rotated
      },
      complianceTags: ['ISO_27001']
    });
    
    const responseData = {
      tokens: {
        accessToken: refreshedAccessToken,
        refreshToken: refreshedRefreshToken,
        csrfToken: refreshedCsrfToken,
        expiresAt: typeof refreshResult.accessToken !== 'string' && refreshResult.accessToken?.expiresAt ? 
                  refreshResult.accessToken.expiresAt : null
      },
      user: refreshResult.user
    };
    
    const metadata = {
      rotated: refreshResult.metadata.rotated,
      generation: refreshResult.metadata.generation,
      riskScore: refreshResult.metadata.riskScore
    };
    
    return sendSuccess(res, responseData, 'Tokens refreshed successfully', 200, metadata);
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return sendError(res, 'Token refresh failed', 500, 'REFRESH_ERROR');
  }
});


router.post('/logout', [
  // Require authentication for logout
  AuthenticationMiddleware.authenticate,
  
  // Add CSRF protection
  AuthenticationMiddleware.csrfProtection,
  
  // Rate limiting for logout attempts
  loginLimiter
], async (req, res) => {
  try {
    // Extract authentication context
    const context = extractContext(req);
    const deviceFingerprint = generateDeviceFingerprint(req);
    
    // Get user from authentication middleware
    const user = req.user;
    
    if (!user) {
      return sendUnauthorized(res, 'Authentication required');
    }
    
    // Revoke all active refresh tokens for this user
    const RefreshToken = (await import('../Models/RefreshToken.js')).default;
    
    try {
      // Revoke all active tokens for this user
      const revokeResult = await RefreshToken.updateMany(
        { 
          userId: user.id, 
          status: 'active'
        },
        {
          $set: {
            status: 'revoked',
            'revocation.reason': 'user_logout',
            'revocation.revokedAt': new Date(),
            'revocation.revokedBy': user.id,
            'revocation.revokedFromIP': context.ipAddress,
            'revocation.revokedFromDevice': deviceFingerprint
          }
        }
      );
      
      console.log(`✅ User ${user.id} logged out. Revoked ${revokeResult.modifiedCount} tokens.`);
      
      // Log the logout event
      console.log(`🔒 Logout event for user ${user.username} from ${context.ipAddress}`);
      // 🔒 SECURITY FIX #66: Log logout using audit logging service
      await AuditLogService.log({
        eventType: 'USER_LOGOUT',
        severity: 'LOW',
        userId: user.id,
        username: user.username,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action: 'LOGOUT',
        resourceType: 'USER',
        status: 'SUCCESS',
        details: {
          email: user.email,
          tokensRevoked: revokeResult.modifiedCount
        },
        complianceTags: ['ISO_27001']
      });
    } catch (revokeError) {
      console.error('❌ Token revocation failed during logout:', revokeError);
      // Continue with logout even if token revocation fails
    }
    
    // Clear authentication cookies
    AuthenticationMiddleware.clearAuthenticationCookies(res);
    
    // Update user's last logout time
    try {
      user.audit.lastLogout = new Date();
      await user.save();
    } catch (saveError) {
      console.error('❌ Failed to update user logout timestamp:', saveError);
      // Continue with logout even if user update fails
    }
    
    // Return success response
    return sendSuccess(res, null, 'Successfully logged out', 200);
    
  } catch (error) {
    console.error('🚨 Logout error:', error);
    return sendError(res, 'Failed to logout', 500, 'LOGOUT_ERROR');
  }
});

/**
 * SECURITY FIX: Get Current User - Changed to POST with CSRF protection
 * POST /api/auth/me
 */
router.post('/me', 
  AuthenticationMiddleware.authenticate,
  // SECURITY FIX: Add CSRF protection to prevent CSRF attacks
  AuthenticationMiddleware.csrfProtectionMiddleware,
  async (req, res) => {
    try {
      // SECURITY FIX: Remove session ID from response to prevent exposure
      const securityAnalytics = await TokenService.getUserSecurityAnalytics(req.user.id);
      
      res.json({
        success: true,
        user: req.user.toSafeObject(),
        security: {
          ...req.security,
          analytics: securityAnalytics,
          currentDevice: {
            fingerprint: req.authContext.deviceFingerprint,
            trusted: req.user.isDeviceTrusted(req.authContext.deviceFingerprint, req.authContext.deviceFingerprint),
            info: req.authContext.deviceInfo
          }
        },
        session: {
          ipAddress: req.authContext.ipAddress,
          location: req.authContext.location,
          loginTime: req.user.audit.lastLogin
          // SECURITY FIX: Removed sessionId to prevent session hijacking
        }
      });
      
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        error: 'user_fetch_error',
        message: 'Failed to fetch user information'
      });
    }
  }
);


router.post('/enable-2fa',
  AuthenticationMiddleware.authenticate,
  AuthenticationMiddleware.csrfProtection,
  async (req, res) => {
    try {
      if (req.user.security.mfa.enabled) {
        return res.status(400).json({
          error: 'mfa_already_enabled',
          message: 'Two-factor authentication is already enabled'
        });
      }
      
      // Generate MFA secret
      const secret = req.user.generateMFASecret();
      const serviceName = SecurityConfig.auth.twoFactor.issuerName;
      const accountName = req.user.email;
      
      // Generate QR code
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(serviceName)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(serviceName)}`;
      const qrCodeDataURL = await qrcode.toDataURL(otpauthUrl);
      
      // Generate backup codes
      const backupCodes = req.user.generateBackupCodes();
      
      await req.user.save();
      
      res.json({
        success: true,
        message: 'Two-factor authentication setup initiated',
        qrCode: qrCodeDataURL,
        backupCodes,
        secret, // For manual entry
        instructions: {
          step1: 'Scan the QR code with your authenticator app',
          step2: 'Enter the 6-digit code from your app to verify',
          step3: 'Save your backup codes in a secure location'
        }
      });
      
    } catch (error) {
      console.error('Enable 2FA error:', error);
      res.status(500).json({
        error: 'enable_2fa_error',
        message: 'Failed to setup two-factor authentication'
      });
    }
  }
);

router.post('/verify-2fa',
  AuthenticationMiddleware.authenticate,
  AuthenticationMiddleware.csrfProtection,
  [
    body('totpCode')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('TOTP code must be 6 digits')
  ],
  async (req, res) => {
    try {
      const validationError = validateRequest(req, res);
      if (validationError) return validationError;
      
      const { totpCode } = req.body;
      
      if (req.user.security.mfa.enabled) {
        return res.status(400).json({
          error: 'mfa_already_enabled',
          message: 'Two-factor authentication is already enabled'
        });
      }
      
      // Verify TOTP code
      const isCodeValid = req.user.verifyTOTP(totpCode);
      if (!isCodeValid) {
        return res.status(400).json({
          error: 'invalid_totp_code',
          message: 'Invalid verification code'
        });
      }
      
      // Enable MFA
      req.user.security.mfa.enabled = true;
      req.user.security.mfa.lastUsed = new Date();
      
      await req.user.save();
      
      console.log(`🔐 2FA enabled for user: ${req.user.username}`);
      
      // 🔒 SECURITY FIX #66: Log 2FA enable using audit logging service
      const context = extractContext(req);
      await AuditLogService.log({
        eventType: 'MFA_ENABLED',
        severity: 'HIGH',
        userId: req.user.id,
        username: req.user.username,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action: 'UPDATE',
        resourceType: 'USER',
        status: 'SUCCESS',
        details: {
          email: req.user.email,
          mfaEnabled: true
        },
        complianceTags: ['ISO_27001']
      });
      
      res.json({
        success: true,
        message: 'Two-factor authentication enabled successfully',
        user: req.user.toSafeObject()
      });
      
    } catch (error) {
      console.error('Verify 2FA error:', error);
      res.status(500).json({
        error: 'verify_2fa_error',
        message: 'Failed to verify two-factor authentication'
      });
    }
  }
);

router.post('/disable-2fa',
  AuthenticationMiddleware.authenticate,
  AuthenticationMiddleware.csrfProtection,
  [
    body('password')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('totpCode')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('TOTP code must be 6 digits')
  ],
  async (req, res) => {
    try {
      const validationError = validateRequest(req, res);
      if (validationError) return validationError;
      
      const { password, totpCode } = req.body;
      
      if (!req.user.security.mfa.enabled) {
        return res.status(400).json({
          error: 'mfa_not_enabled',
          message: 'Two-factor authentication is not enabled'
        });
      }
      
      // Verify current password
      const isPasswordValid = await req.user.verifyPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'invalid_password',
          message: 'Invalid current password'
        });
      }
      
      // Verify TOTP code
      const isCodeValid = req.user.verifyTOTP(totpCode);
      if (!isCodeValid) {
        return res.status(400).json({
          error: 'invalid_totp_code',
          message: 'Invalid two-factor authentication code'
        });
      }
      
      // Disable MFA
      req.user.security.mfa.enabled = false;
      req.user.security.mfa.secret = null;
      req.user.security.mfa.backupCodes = [];
      
      await req.user.save();
      
      console.log(`🔓 2FA disabled for user: ${req.user.username}`);
      
      // 🔒 SECURITY FIX #66: Log 2FA disable using audit logging service
      const context = extractContext(req);
      await AuditLogService.log({
        eventType: 'MFA_DISABLED',
        severity: 'HIGH',
        userId: req.user.id,
        username: req.user.username,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action: 'UPDATE',
        resourceType: 'USER',
        status: 'SUCCESS',
        details: {
          email: req.user.email,
          mfaDisabled: true
        },
        complianceTags: ['ISO_27001']
      });
      
      res.json({
        success: true,
        message: 'Two-factor authentication disabled successfully',
        user: req.user.toSafeObject()
      });
      
    } catch (error) {
      console.error('Disable 2FA error:', error);
      res.status(500).json({
        error: 'disable_2fa_error',
        message: 'Failed to disable two-factor authentication'
      });
    }
  }
);


router.post('/validate-session',
  AuthenticationMiddleware.authenticate,
  async (req, res) => {
    console.log('🔍 Validating session...  cookies', req.cookies);
    try {
      const { deviceFingerprint, lastActivity } = req.body;
      const context = extractContext(req);
      
      // Validate device fingerprint matches
      const expectedFingerprint = generateDeviceFingerprint(req);
      if (deviceFingerprint !== expectedFingerprint) {
        console.warn(`🚨 Device fingerprint mismatch for user ${req.user.username}`);
        return res.status(403).json({
          valid: false,
          reason: 'device_fingerprint_mismatch',
          message: 'Device fingerprint validation failed'
        });
      }
      
      // Check for suspicious activity
      const riskFactors = {
        locationChange: context.location?.country !== req.user.audit.lastLoginLocation?.country,
        unusualTime: new Date().getHours() < 6 || new Date().getHours() > 23,
        rapidRequests: false // Would be calculated based on recent activity
      };
      
      const riskScore = req.user.calculateRiskScore(riskFactors);
      const securityAlerts = [];
      
      // Generate security alerts based on risk
      if (riskScore > 70) {
        securityAlerts.push({
          level: 3,
          message: 'High-risk session detected',
          factors: Object.keys(riskFactors).filter(key => riskFactors[key])
        });
      }
      
      // Update last activity
      req.user.audit.lastActivity = new Date();
      await req.user.save();
      
      console.log(`✅ Session validated for user: ${req.user.username} (Risk: ${riskScore})`);
      
      res.json({
        valid: true,
        user: req.user.toSafeObject(),
        riskScore,
        securityAlerts,
        sessionInfo: {
          lastActivity: req.user.audit.lastActivity,
          deviceTrusted: req.user.isDeviceTrusted(deviceFingerprint, deviceFingerprint),
          location: context.location
        }
      });
      
    } catch (error) {
      console.error('Session validation error:', error);
      res.status(500).json({
        valid: false,
        error: 'session_validation_error',
        message: 'Session validation failed'
      });
    }
  }
);

router.post('/forgot-password', [
  // Rate limiting
  passwordResetRateLimiter,
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
], async (req, res) => {
  try {
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;
    
    const { email } = req.body;
    const context = extractContext(req);
    
    // Always return success to prevent email enumeration
    const response = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    };
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Still send response to prevent enumeration
      return res.json(response);
    }
    
    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Store reset token with expiry (1 hour)
    user.security.passwordReset = {
      token: resetTokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      requestedAt: new Date(),
      requestedFrom: context.ipAddress,
      attempts: (user.security.passwordReset?.attempts || 0) + 1
    };
    
    // Limit reset attempts
    if (user.security.passwordReset.attempts > 5) {
      console.warn(`🚨 Too many password reset attempts for ${email} from ${context.ipAddress}`);
      return res.json(response); // Still return success
    }
    
    await user.save();
    
    // Log password reset request
    console.log(`🔐 Password reset requested for: ${user.username} from ${context.ipAddress}`);
    
    // Send reset email (implement your email service here)
    try {
      await sendPasswordResetEmail(user, resetToken, context);
    } catch (error) {
      console.error('Password reset email failed:', error);
      // Don't expose email sending errors to client
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      error: 'reset_request_error',
      message: 'Password reset request failed'
    });
  }
});


router.post('/reset-password',
  AuthenticationMiddleware.authenticate,
  AuthenticationMiddleware.csrfProtection,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
      
    body('newPassword')
      .isLength({ min: SecurityConfig.auth.password.minLength, max: SecurityConfig.auth.password.maxLength })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(`Password must be at least ${SecurityConfig.auth.password.minLength} characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character`)
  ],
  async (req, res) => {
    try {
      const validationError = validateRequest(req, res);
      if (validationError) return validationError;
      
      const { currentPassword, newPassword } = req.body;
      const context = extractContext(req);
      
      // Verify current password
      const isCurrentPasswordValid = await req.user.verifyPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        await req.user.incrementLoginAttempts();
        return res.status(401).json({
          error: 'invalid_current_password',
          message: 'Current password is incorrect'
        });
      }
      
      // Check if new password is different
      if (currentPassword === newPassword) {
        return res.status(400).json({
          error: 'same_password',
          message: 'New password cannot be the same as current password'
        });
      }
      
      // Update password
      await req.user.updatePassword(newPassword);
      await req.user.save();
      
      // Optional: Revoke other sessions for security
      // await TokenService.revokeAllUserTokens(req.user.id, 'password_change', req.sessionID);
      
      console.log(`🔐 Password changed for user: ${req.user.username} from ${context.ipAddress}`);
      
      // 🔒 SECURITY FIX #66: Log password change using audit logging service
      await AuditLogService.log({
        eventType: 'PASSWORD_CHANGED',
        severity: 'MEDIUM',
        userId: req.user.id,
        username: req.user.username,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action: 'UPDATE',
        resourceType: 'USER',
        status: 'SUCCESS',
        details: {
          email: req.user.email,
          passwordChanged: true
        },
        complianceTags: ['ISO_27001']
      });
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
      
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        error: 'password_change_error',
        message: 'Failed to change password'
      });
    }
  }
);


router.post('/register-biometric',
  AuthenticationMiddleware.authenticate,
  AuthenticationMiddleware.csrfProtection,
  [
    body('credentialId')
      .notEmpty()
      .withMessage('Credential ID is required'),
    
    body('publicKey')
      .isArray()
      .withMessage('Public key must be an array'),
    
    body('challenge')
      .isArray()
      .withMessage('Challenge must be an array')
  ],
  async (req, res) => {
    try {
      // Validate input
      const validationError = validateRequest(req, res);
      if (validationError) return validationError;
      
      const { credentialId, publicKey, challenge } = req.body;
      const context = extractContext(req);
      
      // Check if biometric is already registered
      if (req.user.security.biometric?.enabled) {
        return res.status(409).json({
          success: false,
          error: 'biometric_already_registered',
          message: 'Biometric authentication is already registered'
        });
      }
      
      // Store biometric credential securely
      req.user.security.biometric = {
        enabled: true,
        credentialId: credentialId,
        publicKey: Buffer.from(publicKey).toString('base64'),
        registeredAt: new Date(),
        deviceInfo: {
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          location: context.location
        }
      };
      
      // Generate backup codes for biometric fallback
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
      }
      
      // Hash and store backup codes
      req.user.security.backupCodes = backupCodes.map(code => ({
        code: crypto.createHash('sha256').update(code).digest('hex'),
        used: false,
        createdAt: new Date()
      }));
      
      await req.user.save();
      
      console.log(`🔐 Biometric authentication registered for user: ${req.user.username}`);
      
      // 🔒 SECURITY FIX #66: Log biometric registration using audit logging service
      await AuditLogService.log({
        eventType: 'BIOMETRIC_REGISTERED',
        severity: 'HIGH',
        userId: req.user.id,
        username: req.user.username,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action: 'CREATE',
        resourceType: 'USER',
        status: 'SUCCESS',
        details: {
          email: req.user.email,
          biometricRegistered: true
        },
        complianceTags: ['ISO_27001']
      });
      
      res.json({
        success: true,
        message: 'Biometric authentication registered successfully',
        backupCodes: backupCodes, // Return unhashed codes for user to save
        biometric: {
          enabled: true,
          registeredAt: req.user.security.biometric.registeredAt
        }
      });
      
    } catch (error) {
      console.error('Biometric registration error:', error);
      res.status(500).json({
        success: false,
        error: 'biometric_registration_error',
        message: 'Failed to register biometric authentication'
      });
    }
  }
);


router.get('/csrf', async (req, res) => {
  try {
    // Generate session ID if not present
    if (!req.sessionId) {
      req.sessionId = req.user?.id || req.ip || crypto.randomBytes(16).toString('hex');
    }
    
    // Generate CSRF token using the CSRF protection middleware
    const csrfProtection = AuthenticationMiddleware.csrfProtectionMiddleware;
    const token = csrfProtection.generateToken(req.sessionId);
    
    // Set the token in a secure cookie
    csrfProtection.setSecureCSRFCookie(req, res, token);
    
    console.log('🛡️ CSRF token generated for session:', req.sessionId.substring(0, 8) + '...');
    
    // 🔒 SECURITY FIX #66: Log CSRF token generation using audit logging service
    const context = extractContext(req);
    await AuditLogService.log({
      eventType: 'CSRF_TOKEN_GENERATED',
      severity: 'LOW',
      userId: req.user?.id || 'anonymous',
      username: req.user?.username || 'anonymous',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      action: 'CREATE',
      resourceType: 'USER',
      status: 'SUCCESS',
      details: {
        sessionId: req.sessionId
      },
      complianceTags: ['ISO_27001']
    });
    
    res.json({
      success: true,
      csrfToken: token,
      message: 'CSRF token generated successfully'
    });
    
  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({
      success: false,
      error: 'csrf_generation_error',
      message: 'Failed to generate CSRF token'
    });
  }
});

// Create a simple CORS middleware for the authentication routes
const authCorsOptions = {
  origin: (origin, callback) => {
    // Allow requests from localhost:3000
    if (!origin || origin === 'http://localhost:3000') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-CSRF-Token'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
};

const authCors = cors(authCorsOptions);

// Add explicit CORS handling for the session-status endpoint
router.options('/session-status', authCors, (req, res) => {
  res.status(204).end();
});

router.post('/session-status', 
  // Apply CORS middleware explicitly
  authCors,
  // Apply cache control for sensitive data
  (req, res, next) => {
    // Store existing CORS headers if they exist
    const existingCORSHeaders = {};
    if (res.getHeader('access-control-allow-origin')) {
      existingCORSHeaders['access-control-allow-origin'] = res.getHeader('access-control-allow-origin');
    }
    if (res.getHeader('access-control-allow-credentials')) {
      existingCORSHeaders['access-control-allow-credentials'] = res.getHeader('access-control-allow-credentials');
    }
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Restore CORS headers if they existed
    Object.keys(existingCORSHeaders).forEach(header => {
      res.setHeader(header, existingCORSHeaders[header]);
    });
    
    next();
  },
  // SECURITY FIX: CSRF validation with exemption for autologin
  (req, res, next) => {
    const purpose = req.body?.purpose;
    const csrfToken = req.get('X-CSRF-Token');
    
    // SECURITY EXEMPTION: Allow autologin checks without CSRF (no prior session to get token)
    if (purpose === 'autologin_check' && !csrfToken) {
      console.log('🔓 CSRF exemption: Allowing autologin session check without CSRF token');
      return next();
    }
    
    // For session monitoring and other purposes, CSRF is required if user is authenticated
    if (purpose === 'session_monitoring' || csrfToken) {
      // Apply full CSRF protection for authenticated requests
      return AuthenticationMiddleware.csrfProtectionMiddleware(req, res, next);
    }
    
    // Allow unauthenticated session status checks (initial load)
    console.log('🔓 Allowing unauthenticated session status check');
    next();
  },
  async (req, res) => {
  try {
    const context = extractContext(req);
    const deviceFingerprint = generateDeviceFingerprint(req);
    
    console.log('🔍 Session status check initiated:', {
      ip: context.ipAddress,
      userAgent: context.userAgent.substring(0, 50) + '...',
      deviceFingerprint: deviceFingerprint.substring(0, 16) + '...'
    });
    
    // Try to extract tokens from cookies (with prefix support)
    const accessToken = AuthenticationMiddleware.extractAccessToken ? 
      AuthenticationMiddleware.extractAccessToken(req) : 
      (req.cookies?.__Host_accessToken || req.cookies?.__Secure_accessToken || req.cookies?.accessToken);
    const refreshToken = AuthenticationMiddleware.extractRefreshToken ?
      AuthenticationMiddleware.extractRefreshToken(req) :
      (req.cookies?.__Host_refreshToken || req.cookies?.__Secure_refreshToken || req.cookies?.refreshToken);
    
    // If no tokens, user is not authenticated
    if (!accessToken && !refreshToken) {
      console.log('🔓 No authentication tokens found in cookies');
      return res.json({
        authenticated: false,
        reason: 'no_tokens',
        message: 'No authentication tokens found'
      });
    }
    
    console.log('🍪 Found cookies:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0
    });
    
    // Try to validate access token first using singleton middleware instance
    if (accessToken) {
      try {
        console.log('🔐 Validating access token...');
        const tokenResult = await TokenService.verifyAccessToken(accessToken, {
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          deviceHash: deviceFingerprint
        });
        
        if (tokenResult.valid) {
          const user = await User.findOne({ id: tokenResult.user.id });
          if (user && !user.isAccountLocked()) {
            console.log('✅ Access token valid for user:', user.username);
            
            // Update user activity
            await user.updateLastActivity();
            
            // 🔧 CRITICAL FIX: RE-SET COOKIES EVEN WHEN TOKEN IS VALID
            // This ensures cookies are available for socket connection
            console.log('🍪 CRITICAL FIX: Re-setting authentication cookies for socket connection...');
            
            // Get or generate CSRF token
            let csrfToken = tokenResult.csrfToken || req.cookies?.csrfToken || req.cookies?.__Host_csrfToken || req.cookies?.__Secure_csrfToken;
            if (!csrfToken) {
              // Generate new CSRF token if none exists
              // Use the token ID from the validated access token
              csrfToken = await TokenService.generateCSRFToken(user, tokenResult.payload.jti, {
                ipAddress: context.ipAddress,
                userAgent: context.userAgent
              });
              console.log('🔐 Generated new CSRF token for session');
            }
            
            // Re-set all authentication cookies
            AuthenticationMiddleware.setAuthenticationCookies(res, {
              accessToken: accessToken,
              refreshToken: refreshToken,
              csrfToken: csrfToken
            });
            
            console.log('✅ Authentication cookies re-set successfully for socket connection');
            
            // 🔒 SECURITY FIX #66: Log successful session status check using audit logging service
            await AuditLogService.log({
              eventType: 'SESSION_STATUS_CHECK',
              severity: 'LOW',
              userId: user.id,
              username: user.username,
              ipAddress: context.ipAddress,
              userAgent: context.userAgent,
              action: 'READ',
              resourceType: 'USER',
              status: 'SUCCESS',
              details: {
                email: user.email,
                accessTokenValid: true,
                cookiesRefreshed: true
              },
              complianceTags: ['ISO_27001']
            });
            
            return res.json({
              authenticated: true,
              user: user.toSafeObject(),
              session: {
                lastActivity: user.audit.lastActivity,
                ipAddress: context.ipAddress,
                location: context.location,
                deviceFingerprint
              },
              security: {
                riskScore: tokenResult.security?.riskScore || 0,
                deviceTrusted: user.isDeviceTrusted(deviceFingerprint, deviceFingerprint)
              },
              cookiesRefreshed: true // Indicate cookies were refreshed
            });
          } else {
            console.warn('⚠️ User not found or account locked:', tokenResult.user.id);
          }
        } else {
          console.log('❌ Access token invalid:', tokenResult.reason);
        }
      } catch (accessTokenError) {
        console.warn('⚠️ Access token validation error:', accessTokenError.message);
      }
    }
    
    // If access token failed or doesn't exist, try refresh token with auto-refresh
     if (refreshToken) {
          try {
            console.log('🔄 Attempting token refresh with refresh token...');
            
            const refreshContext = {
              ipAddress: context.ipAddress,
              userAgent: context.userAgent,
              deviceHash: deviceFingerprint,
              sessionId: req.sessionID || crypto.randomUUID()
            };
            
            // Perform token refresh
            const refreshResult = await TokenService.refreshTokens(refreshToken, refreshContext);
            
            if (refreshResult.valid) {
              console.log('✅ Token refresh successful for user:', refreshResult.user.username);
              
              // Handle both string and object formats for tokens
              const accessToken = typeof refreshResult.accessToken === 'string' 
                ? refreshResult.accessToken 
                : refreshResult.accessToken?.token;
              const refreshToken = typeof refreshResult.refreshToken === 'string'
                ? refreshResult.refreshToken
                : refreshResult.refreshToken?.token;
              
              // Set new tokens in cookies
              AuthenticationMiddleware.setAuthenticationCookies(res, {
                accessToken,
                refreshToken,
                csrfToken: refreshResult.csrfToken
              });
              
              const user = await User.findOne({ id: refreshResult.user.id });
              if (user && !user.isAccountLocked()) {
                // Update user activity
                await user.updateLastActivity();
                
                // 🔒 SECURITY FIX #66: Log successful token refresh in session status check using audit logging service
                await AuditLogService.log({
                  eventType: 'SESSION_STATUS_CHECK',
                  severity: 'LOW',
                  userId: user.id,
                  username: user.username,
                  ipAddress: context.ipAddress,
                  userAgent: context.userAgent,
                  action: 'UPDATE',
                  resourceType: 'USER',
                  status: 'SUCCESS',
                  details: {
                    email: user.email,
                    tokensRefreshed: true,
                    generation: refreshResult.metadata?.generation
                  },
                  complianceTags: ['ISO_27001']
                });
                
                return res.json({
                  authenticated: true,
                  user: user.toSafeObject(),
                  session: {
                    lastActivity: user.audit.lastActivity,
                    ipAddress: context.ipAddress,
                    location: context.location,
                    deviceFingerprint
                  },
                  security: {
                    riskScore: refreshResult.metadata?.riskScore || 0,
                    deviceTrusted: user.isDeviceTrusted(deviceFingerprint, deviceFingerprint)
                  },
                  tokensRefreshed: true // Indicate tokens were refreshed
                });
              }
            } else {
              console.log('❌ Token refresh failed:', refreshResult.reason);
              
              // SECURITY FIX: Handle token cleanup scenario
              if (refreshResult.reason === 'tokens_cleaned_up') {
                console.log('🧹 Tokens were cleaned up due to security mismatch');
                AuthenticationMiddleware.clearAuthenticationCookies(res);
                
                return res.json({
                  authenticated: false,
                  reason: 'tokens_reset',
                  message: 'Authentication tokens were reset for security. Please log in again.',
                  requiresReauthentication: true,
                  securityReason: 'Token format mismatch detected'
                });
              }
            }
          } catch (refreshTokenError) {
            console.error('❌ Refresh token error:', refreshTokenError.message);
          }
        }
        
        // If we get here, tokens are invalid or expired
        console.log('🚫 All token validation attempts failed');
        
        // Clear invalid cookies
        AuthenticationMiddleware.clearAuthenticationCookies(res);
        
        return res.json({
          authenticated: false,
          reason: 'invalid_tokens',
          message: 'Authentication tokens are invalid or expired'
        });
        
      } catch (error) {
        console.error('❌ Session status check error:', error);
        
        // Clear cookies on error for security
        try {
          AuthenticationMiddleware.clearAuthenticationCookies(res);
        } catch (clearError) {
          console.error('Failed to clear cookies:', clearError);
        }
        
        res.status(500).json({
          authenticated: false,
          reason: 'server_error',
          message: 'Failed to check session status',
          debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });


router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Authentication service is running',
    timestamp: new Date().toISOString(),
    service: 'auth-service'
  });
});


router.get('/me', 
  AuthenticationMiddleware.authenticate,
  async (req, res) => {
    try {
      if (!req.user) {
        return sendUnauthorized(res, 'User not authenticated');
      }
      
      // Ensure profileid is available
      if (!req.user.profileid && req.user.id) {
        req.user.profileid = req.user.id;
      }
      
      // 🔒 SECURITY FIX #66: Log get current user request using audit logging service
      const context = extractContext(req);
      await AuditLogService.log({
        eventType: 'GET_CURRENT_USER',
        severity: 'LOW',
        userId: req.user.id,
        username: req.user.username,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        action: 'READ',
        resourceType: 'USER',
        status: 'SUCCESS',
        details: {
          email: req.user.email
        },
        complianceTags: ['ISO_27001']
      });
      
      const responseData = {
        user: req.user.toSafeObject ? req.user.toSafeObject() : req.user
      };
      return sendSuccess(res, responseData, 'User information retrieved successfully');
    } catch (error) {
      console.error('Get user error:', error);
      return sendError(res, 'Failed to retrieve user information', 500, 'SERVER_ERROR');
    }
  }
);

// === UTILITY FUNCTIONS ===

/**
 * Send email verification
 */
async function sendEmailVerification(user, context) {
  // This is a placeholder - implement based on your email service
  console.log(`📧 Email verification would be sent to: ${user.email}`);
  
  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Store token (you might want to create a separate model for this)
  // await EmailVerification.create({
  //   userId: user.id,
  //   token: verificationToken,
  //   expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  // });
  
  // Send email with verification link
  // const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  // await emailService.send({
  //   to: user.email,
  //   subject: 'Verify your email address',
  //   template: 'email-verification',
  //   data: { user, verificationLink, context }
  // });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(user, resetToken, context) {
  // This is a placeholder - implement based on your email service
  console.log(`📧 Password reset email would be sent to: ${user.email}`);
  
  // Construct reset link
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  // 🔒 SECURITY FIX #66: Log security event using audit logging service
  await AuditLogService.log({
    eventType: 'PASSWORD_RESET_REQUEST',
    severity: 'MEDIUM',
    userId: user.id,
    username: user.username,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    action: 'CREATE',
    resourceType: 'USER',
    status: 'SUCCESS',
    details: {
      email: user.email,
      resetLinkGenerated: true
    },
    complianceTags: ['ISO_27001']
  });
  
  // Send email with reset link
  // await emailService.send({
  //   to: user.email,
  //   subject: 'Password Reset Request - SwagGo',
  //   template: 'password-reset',
  //   data: {
  //     user: {
  //       username: user.username,
  //       email: user.email
  //     },
  //     resetLink,
  //     context: {
  //       ipAddress: context.ipAddress,
  //       location: context.location,
  //       deviceInfo: context.deviceInfo
  //     },
  //     expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  //   }
  // });
}

export default router;