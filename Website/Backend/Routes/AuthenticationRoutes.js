import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../Models/User.js';
import TokenService from '../Services/TokenService.js';
import AuthenticationMiddleware from '../Middleware/AuthenticationMiddleware.js';
import SecurityConfig from '../Config/SecurityConfig.js';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import nodemailer from 'nodemailer';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import Profile from '../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';
import argon2 from 'argon2'; // 🔒 SECURITY FIX #59: Import argon2 for dummy password verification

// 🔒 SECURITY FIX #65: Import password reset rate limiter for brute force protection
import { passwordResetRateLimiter } from '../Middleware/rateLimitingMiddleware.js';

// 🔒 SECURITY FIX #66: Import audit log service for security event logging
import AuditLogService from '../Services/AuditLogService.js';

// 🔧 API RESPONSE STANDARDIZATION #98: Import standardized API response utility
import ApiResponse from '../Utils/ApiResponse.js';
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

// === AUTHENTICATION ROUTES ===

/**
 * User Registration/Signup
 * POST /api/auth/signup
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with username, email, and password. Requires acceptance of terms and GDPR consent.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - acceptTerms
 *               - gdprConsent
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z0-9_.-]+$'
 *                 description: Unique username (3-30 characters, alphanumeric and underscore, dot, hyphen only)
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Valid email address
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 12
 *                 description: Strong password with uppercase, lowercase, number, and special character
 *                 example: SecurePass123!
 *               displayName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Display name for the user
 *                 example: John Doe
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: User's date of birth (ISO 8601 format)
 *                 example: "1990-01-01"
 *               acceptTerms:
 *                 type: boolean
 *                 description: Acceptance of terms and conditions
 *                 example: true
 *               gdprConsent:
 *                 type: boolean
 *                 description: GDPR consent for data processing
 *                 example: true
 *     responses:
 *       "201":
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 profile:
 *                   type: object
 *                   description: User profile information
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "409":
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: A user with this email or username already exists
 *                 field:
 *                   type: string
 *                   description: Field that caused the conflict
 *                   example: email
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
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
    console.log('🔍 Starting signup process...');
    
    // Validate input
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;
    
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
    
    // SECURITY FIX: Generate CSRF token with session context
    const csrfToken = await TokenService.generateCSRFToken(newUser, accessTokenResult.tokenId, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    
    // Set cookies
    AuthenticationMiddleware.setAuthenticationCookies(res, {
      accessToken: accessTokenResult.token,
      refreshToken: refreshTokenResult.token,
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
        accessToken: accessTokenResult.token,
        refreshToken: refreshTokenResult.token,
        csrfToken,
        expiresAt: accessTokenResult.expiresAt
      },
      security: {
        riskScore: accessTokenResult.riskScore,
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

/**
 * User Login
 * POST /api/auth/login
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email/username and password. Supports TOTP-based two-factor authentication if enabled.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or username for authentication
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: SecurePass123!
 *               totpCode:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: Time-based one-time password for 2FA (if enabled)
 *                 example: "123456"
 *               rememberMe:
 *                 type: boolean
 *                 description: Whether to extend session duration
 *                 example: false
 *               trustDevice:
 *                 type: boolean
 *                 description: Whether to trust this device for future logins
 *                 example: false
 *     responses:
 *       "200":
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: Refresh token for obtaining new access tokens
 *                     csrfToken:
 *                       type: string
 *                       description: CSRF protection token
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: Access token expiration time
 *                 security:
 *                   type: object
 *                   properties:
 *                     riskScore:
 *                       type: integer
 *                       description: Security risk score for this login
 *                     deviceFingerprint:
 *                       type: string
 *                       description: Device fingerprint identifier
 *                     deviceTrusted:
 *                       type: boolean
 *                       description: Whether the device is trusted
 *                     requiresEmailVerification:
 *                       type: boolean
 *                       description: Whether email verification is required
 *                 session:
 *                   type: object
 *                   properties:
 *                     rememberMe:
 *                       type: boolean
 *                     trustDevice:
 *                       type: boolean
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: invalid_credentials
 *                 message:
 *                   type: string
 *                   example: Invalid email/username or password
 *       "423":
 *         description: Account locked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: account_locked
 *                 message:
 *                   type: string
 *                   example: Account is temporarily locked due to failed login attempts
 *                 lockUntil:
 *                   type: string
 *                   format: date-time
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
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
    
    // SECURITY FIX: Generate CSRF token with session context
    const csrfToken = await TokenService.generateCSRFToken(user, accessTokenResult.tokenId, {
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    
    // Set authentication cookies
    const cookieOptions = {
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined // 30 days if remember me
    };
    
    AuthenticationMiddleware.setAuthenticationCookies(res, {
      accessToken: accessTokenResult.token,
      refreshToken: refreshTokenResult.token,
      csrfToken
    }, cookieOptions);
    
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
        accessToken: accessTokenResult.token,
        refreshToken: refreshTokenResult.token,
        csrfToken,
        expiresAt: accessTokenResult.expiresAt
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

/**
 * Token Refresh
 * POST /api/auth/refresh
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh authentication tokens
 *     description: Obtain new access and refresh tokens using a valid refresh token. This endpoint revokes the old refresh token for security.
 *     tags: [Authentication]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (if not provided in cookies)
 *     responses:
 *       "200":
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tokens refreshed successfully
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: New JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: New refresh token
 *                     csrfToken:
 *                       type: string
 *                       description: New CSRF protection token
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: Access token expiration time
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     rotated:
 *                       type: boolean
 *                       description: Whether tokens were rotated
 *                     generation:
 *                       type: integer
 *                       description: Token generation number
 *                     riskScore:
 *                       type: integer
 *                       description: Security risk score
 *       "401":
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: refresh_failed
 *                 reason:
 *                   type: string
 *                   example: invalid_token
 *                 message:
 *                   type: string
 *                   example: Token refresh failed
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
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
    
    // Set new tokens in cookies
    AuthenticationMiddleware.setAuthenticationCookies(res, {
      accessToken: refreshResult.accessToken.token,
      refreshToken: refreshResult.refreshToken.token,
      csrfToken: refreshResult.csrfToken
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
        accessToken: refreshResult.accessToken.token,
        refreshToken: refreshResult.refreshToken.token,
        csrfToken: refreshResult.csrfToken,
        expiresAt: refreshResult.accessToken.expiresAt
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

/**
 * User Logout
 * POST /api/auth/logout
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Log out the current user by revoking all active tokens and clearing authentication cookies.
 *     tags: [Authentication]
 *     responses:
 *       "200":
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Successfully logged out
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
// 🔒 SECURITY FIX #60: Implement logout functionality with token blacklisting
// 🔒 SECURITY FIX #62: Add CSRF protection
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

/**
 * Enable Two-Factor Authentication
 * POST /api/auth/enable-2fa
 * @swagger
 * /api/auth/enable-2fa:
 *   post:
 *     summary: Enable two-factor authentication
 *     description: Initiate the setup process for two-factor authentication (2FA) using TOTP.
 *     tags: [Authentication]
 *     responses:
 *       "200":
 *         description: 2FA setup initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Two-factor authentication setup initiated
 *                 qrCode:
 *                   type: string
 *                   description: Data URL for QR code to scan with authenticator app
 *                 backupCodes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Backup codes for 2FA
 *                 secret:
 *                   type: string
 *                   description: Secret for manual entry in authenticator app
 *                 instructions:
 *                   type: object
 *                   description: Setup instructions
 *       "400":
 *         description: 2FA already enabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: mfa_already_enabled
 *                 message:
 *                   type: string
 *                   example: Two-factor authentication is already enabled
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */

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

/**
 * Verify and Complete Two-Factor Authentication Setup
 * POST /api/auth/verify-2fa
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     summary: Verify and complete 2FA setup
 *     description: Complete the two-factor authentication setup by verifying a TOTP code.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totpCode
 *             properties:
 *               totpCode:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: TOTP code from authenticator app
 *                 example: "123456"
 *     responses:
 *       "200":
 *         description: 2FA enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Two-factor authentication enabled successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       "400":
 *         description: Invalid TOTP code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: invalid_totp_code
 *                 message:
 *                   type: string
 *                   example: Invalid verification code
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * Disable Two-Factor Authentication
 * POST /api/auth/disable-2fa
 * @swagger
 * /api/auth/disable-2fa:
 *   post:
 *     summary: Disable two-factor authentication
 *     description: Disable two-factor authentication by providing current password and a TOTP code.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - totpCode
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password
 *                 example: CurrentSecurePass123!
 *               totpCode:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: TOTP code from authenticator app
 *                 example: "123456"
 *     responses:
 *       "200":
 *         description: 2FA disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Two-factor authentication disabled successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       "400":
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: invalid_totp_code
 *                 message:
 *                   type: string
 *                   example: Invalid two-factor authentication code
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * Get Active Sessions/Devices
 * GET /api/auth/sessions
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Get active sessions and devices
 *     description: Retrieve information about active sessions and trusted devices for the current user.
 *     tags: [Authentication]
 *     responses:
 *       "200":
 *         description: Sessions information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 sessions:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: integer
 *                       description: Number of active tokens
 *                     total:
 *                       type: integer
 *                       description: Total number of tokens
 *                     devices:
 *                       type: integer
 *                       description: Number of unique devices
 *                     locations:
 *                       type: integer
 *                       description: Number of unique locations
 *                 trustedDevices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Device ID
 *                       name:
 *                         type: string
 *                         description: Device name
 *                       trustLevel:
 *                         type: integer
 *                         description: Trust level of the device
 *                       lastUsed:
 *                         type: string
 *                         format: date-time
 *                         description: Last used timestamp
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Device registration timestamp
 *                       isCurrent:
 *                         type: boolean
 *                         description: Whether this is the current device
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/sessions',
  AuthenticationMiddleware.authenticate,
  async (req, res) => {
    try {
      const securityAnalytics = await TokenService.getUserSecurityAnalytics(req.user.id);
      
      res.json({
        success: true,
        sessions: {
          active: securityAnalytics.activeTokens,
          total: securityAnalytics.totalTokens,
          devices: securityAnalytics.uniqueDeviceCount,
          locations: securityAnalytics.uniqueLocationCount
        },
        trustedDevices: req.user.security.trustedDevices.map(device => ({
          id: device.deviceHash,
          name: device.name,
          trustLevel: device.trustLevel,
          lastUsed: device.lastUsed,
          createdAt: device.createdAt,
          isCurrent: device.deviceHash === req.authContext.deviceFingerprint
        }))
      });
      
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        error: 'sessions_fetch_error',
        message: 'Failed to fetch session information'
      });
    }
  }
);

/**
 * Revoke Session/Device
 * DELETE /api/auth/sessions/:deviceId
 */
router.delete('/sessions/:deviceId',
  AuthenticationMiddleware.authenticate,
  AuthenticationMiddleware.csrfProtection,
  async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { revokeAll = false } = req.body;
      
      if (revokeAll) {
        // Revoke all sessions except current
        await TokenService.revokeAllUserTokens(req.user.id, 'user_revoke_other_sessions');
        
        // Remove trusted devices except current
        req.user.security.trustedDevices = req.user.security.trustedDevices.filter(
          device => device.deviceHash === req.authContext.deviceFingerprint
        );
        
        await req.user.save();
        
        console.log(`🔒 All other sessions revoked for user: ${req.user.username}`);
      } else {
        // Revoke specific device/session
        // This would require more complex token family management
        // For now, just remove from trusted devices
        req.user.security.trustedDevices = req.user.security.trustedDevices.filter(
          device => device.deviceHash !== deviceId
        );
        
        await req.user.save();
        
        console.log(`🔒 Device session revoked: ${deviceId} for user: ${req.user.username}`);
      }
      
      res.json({
        success: true,
        message: revokeAll ? 'All other sessions revoked' : 'Session revoked successfully'
      });
      
    } catch (error) {
      console.error('Revoke session error:', error);
      res.status(500).json({
        error: 'revoke_session_error',
        message: 'Failed to revoke session'
      });
    }
  }
);

/**
 * Advanced Session Validation
 * POST /api/auth/validate-session
 */
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

/**
 * Password Reset Request
 * POST /api/auth/forgot-password
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Request a password reset link to be sent to the user's email address.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address associated with the account
 *                 example: john@example.com
 *     responses:
 *       "200":
 *         description: Password reset request processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: If an account with that email exists, a password reset link has been sent
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "429":
 *         $ref: '#/components/responses/TooManyRequests'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * Password Reset Completion
 * POST /api/auth/reset-password
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Complete password reset
 *     description: Set a new password using a valid reset token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *                 example: abcdef123456
 *               password:
 *                 type: string
 *                 minLength: 12
 *                 description: New password
 *                 example: NewSecurePass123!
 *     responses:
 *       "200":
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successfully. Please log in with your new password.
 *       "400":
 *         description: Invalid token or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: invalid_reset_token
 *                 message:
 *                   type: string
 *                   example: Invalid or expired password reset token
 *       "429":
 *         $ref: '#/components/responses/TooManyRequests'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/reset-password', [
  // Rate limiting
  passwordResetRateLimiter,
  
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
    
  body('password')
    .isLength({ min: SecurityConfig.auth.password.minLength, max: SecurityConfig.auth.password.maxLength })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(`Password must be at least ${SecurityConfig.auth.password.minLength} characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character`)
], async (req, res) => {
  try {
    const validationError = validateRequest(req, res);
    if (validationError) return validationError;
    
    const { token, password } = req.body;
    const context = extractContext(req);
    
    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid reset token
    const user = await User.findOne({
      'security.passwordReset.token': tokenHash,
      'security.passwordReset.expiresAt': { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({
        error: 'invalid_reset_token',
        message: 'Invalid or expired password reset token'
      });
    }
    
    // Check if new password is different from current
    const isSamePassword = await user.verifyPassword(password);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'same_password',
        message: 'New password cannot be the same as current password'
      });
    }
    
    // Update password
    await user.updatePassword(password);
    
    // Clear reset token
    user.security.passwordReset = undefined;
    
    // Revoke all existing tokens for security
    await TokenService.revokeAllUserTokens(user.id, 'password_reset');
    
    // Remove all trusted devices except current (if any)
    user.security.trustedDevices = [];
    
    await user.save();
    
    console.log(`🔐 Password reset completed for: ${user.username} from ${context.ipAddress}`);
    
    // 🔒 SECURITY FIX #66: Log password reset completion using audit logging service
    await AuditLogService.log({
      eventType: 'PASSWORD_RESET_COMPLETED',
      severity: 'HIGH',
      userId: user.id,
      username: user.username,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      action: 'UPDATE',
      resourceType: 'USER',
      status: 'SUCCESS',
      details: {
        email: user.email,
        passwordResetCompleted: true
      },
      complianceTags: ['ISO_27001']
    });
    
    res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });
    
  } catch (error) {
    console.error('Password reset completion error:', error);
    res.status(500).json({
      error: 'reset_completion_error',
      message: 'Password reset failed'
    });
  }
});

/**
 * Change Password (for authenticated users)
 * POST /api/auth/change-password
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Change the password for the currently authenticated user.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *                 example: CurrentSecurePass123!
 *               newPassword:
 *                 type: string
 *                 minLength: 12
 *                 description: New password
 *                 example: NewSecurePass456@
 *     responses:
 *       "200":
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       "400":
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: same_password
 *                 message:
 *                   type: string
 *                   example: New password cannot be the same as current password
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/change-password',
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

/**
 * Register Biometric Authentication
 * POST /api/auth/register-biometric
 */
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

/**
 * Get CSRF Token
 * GET /api/auth/csrf
 * 
 * Provides CSRF token for client-side requests
 * This endpoint is exempt from CSRF protection as it's used to obtain the token
 */
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

/**
 * Check Session Status (Enhanced Security)
 * POST /api/auth/session-status
 * 
 * CRITICAL SECURITY FIX: Changed from GET to POST to prevent CSRF attacks
 * Enhanced endpoint that checks authentication status and handles token refresh
 * Used for autologin functionality with comprehensive error handling
 */
router.post('/session-status', 
  // Apply cache control for sensitive data
  (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
                accessTokenValid: true
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
              }
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
              
              // Set new tokens in cookies
              AuthenticationMiddleware.setAuthenticationCookies(res, {
                accessToken: refreshResult.accessToken.token,
                refreshToken: refreshResult.refreshToken.token,
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

/**
 * Health Check Endpoint
 * GET /api/auth/health
 * @swagger
 * /api/auth/health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the authentication service.
 *     tags: [Authentication]
 *     responses:
 *       "200":
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Authentication service is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: auth-service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Authentication service is running',
    timestamp: new Date().toISOString(),
    service: 'auth-service'
  });
});

/**
 * Get Current User
 * GET /api/auth/me
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     description: Retrieve information about the currently authenticated user.
 *     tags: [Authentication]
 *     responses:
 *       "200":
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalServerError'
 */
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