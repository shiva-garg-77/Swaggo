import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the current file directory and resolve the backend .env.local path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendEnvPath = join(__dirname, '..', '.env.local');

// Load backend-specific environment variables
dotenv.config({ path: backendEnvPath });
console.log('✅ SecurityConfig loaded from Backend/.env.local');

// Note: Using console logging for now to avoid module complexity

/**
 * Comprehensive Security Configuration
 * Centralized security settings for the entire application
 */

const SecurityConfig = {
    // JWT Configuration (for backward compatibility)
    jwt: {
        secret: process.env.ACCESS_TOKEN_SECRET,
        refreshSecret: process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
        algorithm: 'HS256',
        issuer: process.env.JWT_ISSUER || 'swaggo-backend',
        audience: process.env.JWT_AUDIENCE || 'swaggo-frontend'
    },

    // Environment Configuration
    environment: {
        isProduction: process.env.NODE_ENV === 'production',
        isDevelopment: process.env.NODE_ENV === 'development',
        isTest: process.env.NODE_ENV === 'test'
    },

    // Authentication & JWT Configuration
    auth: {
        // JWT Settings
        jwt: {
            accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
            refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
            accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
            refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
            issuer: process.env.JWT_ISSUER || 'swaggo-backend',
            audience: process.env.JWT_AUDIENCE || 'swaggo-frontend',
            algorithm: 'HS256'
        },

        // Login Attempt Limits
        loginAttempts: {
            maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
            lockTime: parseInt(process.env.ACCOUNT_LOCK_TIME) || 30, // minutes
            progressiveLockout: true, // Increase lock time with repeated failures
            maxLockTime: 24 * 60, // 24 hours maximum lock time
            resetAfter: 60 // Reset failed attempts after 60 minutes of no activity
        },

        // Password Policy
        password: {
            minLength: parseInt(process.env.MIN_PASSWORD_LENGTH) || 8,
            maxLength: parseInt(process.env.MAX_PASSWORD_LENGTH) || 128,
            requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
            requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
            requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
            requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
            maxAge: parseInt(process.env.MAX_PASSWORD_AGE) || 90, // days
            preventReuse: parseInt(process.env.PASSWORD_HISTORY_SIZE) || 5,
            commonPasswordCheck: true
        },

        // Session Management
        session: {
            maxConcurrentSessions: parseInt(process.env.MAX_SESSIONS) || 5,
            sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 30, // minutes
            extendOnActivity: true,
            requireReauthForSensitive: true
        },

        // Two-Factor Authentication
        twoFactor: {
            enabled: process.env.ENABLE_2FA === 'true',
            issuerName: process.env.APP_NAME || 'Swaggo',
            window: 2, // Allow 2 time windows before/after for clock drift
            backupCodesCount: 10
        }
    },

    // Rate Limiting Configuration
    rateLimiting: {
        // Global API rate limits
        global: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: process.env.NODE_ENV === 'production' ? 1000 : 10000, // requests per window
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: false
        },

        // Authentication endpoints
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: process.env.NODE_ENV === 'production' ? 10 : 100,
            skipSuccessfulRequests: true,
            skipFailedRequests: false
        },

        // File upload limits
        upload: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 50,
            standardHeaders: true
        },

        // Message/Chat limits
        messaging: {
            windowMs: 60 * 1000, // 1 minute
            max: 100,
            standardHeaders: true
        },

        // Socket.IO rate limits
        socket: {
            sendMessage: {
                maxPerMinute: 30,
                maxPerHour: 1000,
                windowMs: 60 * 1000
            },
            joinChat: {
                maxPerMinute: 20,
                maxPerHour: 200,
                windowMs: 60 * 1000
            },
            initiateCall: {
                maxPerMinute: 5,
                maxPerHour: 50,
                windowMs: 60 * 1000
            },
            general: {
                maxPerMinute: 100,
                maxPerHour: 5000,
                windowMs: 60 * 1000
            }
        }
    },

    // Cookie Configuration - Enhanced for cross-port development support
    cookies: {
        httpOnly: true,
        // Secure cookies only in production unless forced
        secure: process.env.NODE_ENV === 'production' || process.env.FORCE_SECURE_COOKIES === 'true',
        // Enhanced sameSite handling for cross-port development
        sameSite: (() => {
            if (process.env.NODE_ENV === 'production') return 'strict';
            // Use 'none' for cross-port in development, fallback to 'lax'
            return process.env.COOKIE_SAME_SITE || 'none';
        })(),
        // Domain handling: undefined for localhost development to allow cross-port
        domain: (() => {
            if (process.env.NODE_ENV === 'production') {
                return process.env.COOKIE_DOMAIN;
            }
            // For development: only set domain if explicitly configured and not 'localhost'
            const devDomain = process.env.COOKIE_DOMAIN;
            return (devDomain && devDomain !== 'localhost') ? devDomain : undefined;
        })(),
        path: '/',
        // Enhanced maxAge calculation for remember-me functionality
        maxAge: parseInt(process.env.COOKIE_MAX_AGE) || (7 * 24 * 60 * 60 * 1000), // 7 days default
        
        // CSRF Protection - Enhanced configuration
        csrf: {
            enabled: process.env.ENABLE_CSRF_PROTECTION === 'true',
            cookieName: 'csrfToken', // Match frontend expectation
            headerName: 'X-CSRF-Token', // Capitalize for consistency
            secret: process.env.CSRF_SECRET,
            // CSRF cookie should be readable by JavaScript for header inclusion
            httpOnly: false,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 60 * 60 * 1000 // 1 hour for CSRF tokens
        }
    },

    // File Upload Security
    fileUpload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 5,
        allowedMimeTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/quicktime',
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'application/pdf', 'text/plain'
        ],
        allowedExtensions: [
            '.jpg', '.jpeg', '.png', '.gif', '.webp',
            '.mp4', '.webm', '.mov',
            '.mp3', '.wav', '.ogg',
            '.pdf', '.txt'
        ],
        scanForMalware: process.env.SCAN_UPLOADS === 'true',
        quarantineDirectory: process.env.QUARANTINE_DIR || './quarantine',
        virusCheckTimeout: 30000 // 30 seconds
    },

    // Content Security Policy
    contentSecurityPolicy: {
        enabled: process.env.NODE_ENV === 'production',
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        },
        reportUri: process.env.CSP_REPORT_URI || null
    },

    // Security Headers
    securityHeaders: {
        hsts: {
            enabled: process.env.NODE_ENV === 'production',
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        xXSSProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin',
        
        // Feature Policy / Permissions Policy
        permissionsPolicy: {
            camera: ["'self'"],
            microphone: ["'self'"],
            geolocation: ["'self'"],
            notifications: ["'self'"],
            payment: ["'none'"],
            usb: ["'none'"]
        }
    },

    // Token Rotation Configuration
    tokenRotation: {
        enabled: true,
        rotateOnEachUse: true, // Rotate refresh token on each use
        maxTokenAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        gracePeriod: 5 * 60 * 1000, // 5 minutes grace period for old tokens
        maxGenerations: 1000, // Prevent infinite token chains
        revokeOnTheft: true, // Revoke entire token family on theft detection
        
        // Cleanup settings
        cleanup: {
            interval: 24 * 60 * 60 * 1000, // 24 hours
            retainDays: 30, // Keep revoked tokens for 30 days for audit
            maxInactiveTokens: 10000 // Clean up if too many inactive tokens
        }
    },

    // Audit Logging Configuration
    audit: {
        enabled: true,
        logLevel: process.env.AUDIT_LOG_LEVEL || 'info',
        
        // What to log
        events: {
            authentication: true,
            authorization: true,
            dataAccess: true,
            dataModification: true,
            systemAdmin: true,
            security: true,
            errors: true
        },
        
        // Storage options
        storage: {
            database: true,
            file: true,
            external: false, // Set to true for external logging services
            retention: {
                database: 90, // days
                file: 365, // days
                critical: 7 * 365 // Keep critical events for 7 years
            }
        },
        
        // Batch processing
        batch: {
            size: 10,
            flushInterval: 5000, // 5 seconds
            maxQueueSize: 1000
        }
    },

    // Monitoring and Alerting
    monitoring: {
        // Performance thresholds
        performance: {
            maxResponseTime: 5000, // 5 seconds
            maxDbQueryTime: 1000, // 1 second
            maxMemoryUsage: 80, // 80%
            maxCpuUsage: 80 // 80%
        },
        
        // Security alerting thresholds
        security: {
            maxFailedLogins: 10,
            maxTokenThefts: 3,
            maxSuspiciousIPs: 50,
            maxErrorRate: 5 // 5% error rate
        },
        
        // Alert channels
        alerts: {
            email: process.env.ALERT_EMAIL || null,
            slack: process.env.SLACK_WEBHOOK || null,
            sms: process.env.SMS_API_KEY || null
        }
    },

    // Database Security
    database: {
        // Connection security
        ssl: process.env.NODE_ENV === 'production',
        encryption: {
            enabled: process.env.DB_ENCRYPTION === 'true',
            algorithm: 'aes-256-gcm',
            keyRotation: 90 // days
        },
        
        // Query security
        parameterized: true,
        sqlInjectionPrevention: true,
        queryTimeout: 30000, // 30 seconds
        
        // Backup and recovery
        backup: {
            enabled: process.env.NODE_ENV === 'production',
            interval: 6 * 60 * 60 * 1000, // 6 hours
            retention: 30, // days
            encryption: true
        }
    },

    // API Security
    api: {
        // Version management
        versioning: true,
        deprecationNotice: 90, // days before deprecation
        
        // Input validation
        validation: {
            strict: true,
            sanitization: true,
            maxRequestSize: '10mb',
            maxJsonDepth: 10
        },
        
        // Output filtering
        responseFiltering: {
            removeNulls: true,
            removeEmpty: false,
            hideInternalFields: true
        }
    },

    // Development and Testing
    development: {
        // Disable certain security features in development
        bypassRateLimit: process.env.BYPASS_RATE_LIMIT === 'true',
        allowTestUsers: process.env.ALLOW_TEST_USERS === 'true',
        mockExternalServices: process.env.MOCK_EXTERNAL === 'true',
        
        // Enhanced logging in development
        verboseLogging: process.env.NODE_ENV === 'development',
        debugSecurity: process.env.DEBUG_SECURITY === 'true'
    }
};

// Configuration validation
const validateConfig = () => {
    const errors = [];
    const warnings = [];
    
    // Enhanced secret validation with additional security checks
    const validateSecret = (secret, name, minLength = 32) => {
        if (!secret) {
            errors.push(`${name} environment variable is required`);
            return false;
        }
        
        if (secret.length < minLength) {
            errors.push(`${name} should be at least ${minLength} characters long`);
            return false;
        }
        
        // Check for placeholder values - enhanced patterns
        const placeholderPatterns = [
            /your[_-].*[_-]secret/i,
            /change[_-]this/i,
            /replace[_-]me/i,
            /example/i,
            /test[_-].*secret/i,
            /placeholder/i,
            /demo/i,
            /sample/i,
            /^secret$/i,
            /^password$/i,
            /^key$/i,
            /development[_-]only/i
        ];
        
        const hasPlaceholder = placeholderPatterns.some(pattern => pattern.test(secret));
        if (hasPlaceholder) {
            warnings.push(`${name} appears to contain placeholder text. Please generate a secure secret using Scripts/generateSecrets.js`);
            return false;
        }
        
        // Check entropy (improved for hex strings)
        const uniqueChars = new Set(secret).size;
        const entropyRatio = uniqueChars / secret.length;
        
        // For hex strings, low uniqueChar/length ratio is normal
        // Check if it's likely a hex string
        const isHexLike = /^[a-f0-9]+$/i.test(secret);
        const minEntropyThreshold = isHexLike ? 0.1 : 0.3; // Lower threshold for hex strings
        
        if (entropyRatio < minEntropyThreshold) {
            warnings.push(`${name} has low entropy (${Math.round(entropyRatio * 100)}%) - consider regenerating`);
        }
        
        // Check for common weak patterns
        const weakPatterns = [
            /^(.)\1{10,}$/, // repeated characters
            /^123456/,
            /^password/i,
            /^qwerty/i,
            /^admin/i
        ];
        
        if (weakPatterns.some(pattern => pattern.test(secret))) {
            errors.push(`${name} contains weak patterns - use a cryptographically secure secret`);
            return false;
        }
        
        return true;
    };
    
    // Check required secrets with enhanced validation - use existing environment variables
    const requiredSecrets = [
        { key: 'ACCESS_TOKEN_SECRET', name: 'ACCESS_TOKEN_SECRET', minLength: 64 },
        { key: 'REFRESH_TOKEN_SECRET', name: 'REFRESH_TOKEN_SECRET', minLength: 64 },
        { key: 'CSRF_SECRET', name: 'CSRF_SECRET', minLength: 32 },
        { key: 'COOKIE_SECRET', name: 'COOKIE_SECRET', minLength: 32 },
        { key: 'PASSWORD_PEPPER', name: 'PASSWORD_PEPPER', minLength: 32 }
    ];
    
    requiredSecrets.forEach(({ key, name, minLength }) => {
        const secret = process.env[key];
        if (secret) {
            validateSecret(secret, name, minLength);
        } else {
            errors.push(`${name} is required but not found in environment variables`);
        }
    });
    
    // Database connection validation
    const mongoUri = process.env.MONGODB_URI || process.env.MONGOURI || process.env.MONGO_URI;
    if (!mongoUri) {
        errors.push('Database connection string is required (MONGODB_URI, MONGOURI, or MONGO_URI)');
    } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
        errors.push('Database connection string must be a valid MongoDB URI');
    }
    
    // Port validation
    const port = process.env.PORT;
    if (port && (isNaN(port) || parseInt(port) < 1 || parseInt(port) > 65535)) {
        errors.push('PORT must be a valid port number (1-65535)');
    }
    
    // CORS validation
    const corsOrigins = process.env.FRONTEND_URLS || process.env.CORS_ORIGINS;
    if (corsOrigins) {
        const origins = corsOrigins.split(',');
        origins.forEach(origin => {
            if (origin && !origin.match(/^https?:\/\/.+/)) {
                warnings.push(`CORS origin '${origin}' should include protocol (http:// or https://)`);
            }
        });
    }
    
    // Check production-specific requirements
    if (SecurityConfig.environment.isProduction) {
        if (!SecurityConfig.cookies.secure) {
            errors.push('Secure cookies must be enabled in production');
        }
        
        if (!SecurityConfig.contentSecurityPolicy.enabled) {
            errors.push('CSP should be enabled in production');
        }
        
        if (!SecurityConfig.securityHeaders.hsts.enabled) {
            errors.push('HSTS should be enabled in production');
        }
        
        // Production security requirements
        if (process.env.DEBUG_SECURITY === 'true') {
            warnings.push('DEBUG_SECURITY should be disabled in production');
        }
        
        if (process.env.BYPASS_RATE_LIMIT === 'true') {
            errors.push('BYPASS_RATE_LIMIT must be disabled in production');
        }
        
        if (process.env.VERBOSE_LOGGING === 'true') {
            warnings.push('VERBOSE_LOGGING should be disabled in production for security');
        }
    }
    
    // Validate rate limiting configuration
    Object.keys(SecurityConfig.rateLimiting).forEach(key => {
        const config = SecurityConfig.rateLimiting[key];
        if (config.max && config.max <= 0) {
            errors.push(`Invalid rate limit configuration for ${key}: max must be positive`);
        }
    });
    
    // Log warnings
    if (warnings.length > 0) {
        console.warn('⚠️ Security Configuration Warnings:');
        warnings.forEach(warning => console.warn(`   • ${warning}`));
    }
    
    if (errors.length > 0) {
        console.error('❌ Security Configuration Errors:');
        errors.forEach(error => console.error(`   • ${error}`));
        throw new Error(`Security configuration validation failed:\n${errors.join('\n')}`);
    }
    
    return true;
};

// Helper functions
const getConfigForEnvironment = () => {
    if (SecurityConfig.environment.isProduction) {
        return {
            ...SecurityConfig,
            // Production overrides
            rateLimiting: {
                ...SecurityConfig.rateLimiting,
                global: {
                    ...SecurityConfig.rateLimiting.global,
                    max: 1000
                }
            }
        };
    } else if (SecurityConfig.environment.isDevelopment) {
        return {
            ...SecurityConfig,
            // Development overrides
            rateLimiting: {
                ...SecurityConfig.rateLimiting,
                global: {
                    ...SecurityConfig.rateLimiting.global,
                    max: 10000
                }
            }
        };
    }
    
    return SecurityConfig;
};

// Export configuration with validation
try {
    validateConfig();
    console.log('✅ Security configuration validated successfully');
} catch (error) {
    console.error('❌ Security configuration validation failed:', error.message);
    if (SecurityConfig.environment.isProduction) {
        process.exit(1); // Exit in production if config is invalid
    }
}

export default getConfigForEnvironment();
export { SecurityConfig, validateConfig };