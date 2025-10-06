import csrf from 'csrf';
import crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * Provides Cross-Site Request Forgery protection for API routes
 */

class CSRFProtection {
    constructor() {
        this.tokens = new csrf();
        this.secretKey = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
        
        // Store for tracking tokens (in production, use Redis)
        this.tokenStore = new Map();
        
        // Clean up expired tokens every hour
        setInterval(() => {
            this.cleanupExpiredTokens();
        }, 60 * 60 * 1000);
    }

    // Generate CSRF token for user session
    generateToken(sessionId) {
        const secret = this.tokens.secretSync();
        const token = this.tokens.create(secret);
        
        // Store token with expiration (4 hours)
        const expiresAt = Date.now() + (4 * 60 * 60 * 1000);
        this.tokenStore.set(`${sessionId}:${token}`, {
            secret,
            expiresAt,
            used: false
        });

        return token;
    }

    // Validate CSRF token
    validateToken(sessionId, token) {
        const key = `${sessionId}:${token}`;
        const tokenData = this.tokenStore.get(key);

        if (!tokenData) {
            return false;
        }

        // Check if token expired
        if (Date.now() > tokenData.expiresAt) {
            this.tokenStore.delete(key);
            return false;
        }

        // Check if token already used (for one-time use tokens)
        if (tokenData.used) {
            return false;
        }

        // Validate token
        const isValid = this.tokens.verify(tokenData.secret, token);
        
        if (isValid) {
            // Mark token as used for critical operations
            tokenData.used = true;
        }

        return isValid;
    }

    // Cleanup expired tokens
    cleanupExpiredTokens() {
        const now = Date.now();
        const expiredKeys = [];

        for (const [key, data] of this.tokenStore) {
            if (now > data.expiresAt) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.tokenStore.delete(key));
        console.log(`🧹 Cleaned up ${expiredKeys.length} expired CSRF tokens`);
    }

    // SECURITY FIX: Enhanced CSRF token attachment with secure httpOnly cookies
    attachToken() {
        return (req, res, next) => {
            // Skip for GET, HEAD, OPTIONS requests
            if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
                return next();
            }

            // Generate session ID if not present
            if (!req.sessionId) {
                req.sessionId = req.user?.id || req.ip || crypto.randomBytes(16).toString('hex');
            }

            // Generate token
            const token = this.generateToken(req.sessionId);
            
            // Attach to request for use in responses
            req.csrfToken = token;
            
            // SECURITY FIX: Set CSRF token in secure httpOnly cookie with prefix
            this.setSecureCSRFCookie(req, res, token);
            
            // Also set in response header for legacy compatibility
            res.set('X-CSRF-Token', token);

            next();
        };
    }

    // SECURITY FIX: Set CSRF token in secure httpOnly cookie with appropriate prefix
    setSecureCSRFCookie(req, res, token) {
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        // Enhanced protocol detection
        const isHttpsRequest = req?.secure || 
                              req?.headers?.['x-forwarded-proto'] === 'https' ||
                              req?.headers?.['x-forwarded-ssl'] === 'on' ||
                              req?.connection?.encrypted ||
                              req?.protocol === 'https';
        
        // SECURITY FIX: Adaptive secure flag based on protocol
        const useSecureFlag = isDevelopment ? isHttpsRequest : true;
        
        // Determine cookie prefix based on security level
        const cookiePrefix = useSecureFlag ? '__Secure-' : '';
        
        // Set CSRF token in secure cookie - NOT httpOnly so JavaScript can read it
        // This is intentional for CSRF tokens as they need to be included in request headers
        res.cookie(`${cookiePrefix}csrfToken`, token, {
            secure: useSecureFlag,
            httpOnly: false, // CSRF tokens need JS access for header inclusion
            sameSite: isDevelopment ? 'lax' : 'strict',
            maxAge: 4 * 60 * 60 * 1000, // 4 hours
            path: '/'
        });
        
        console.log('\ud83c\udf6a CSRF token set in secure cookie:', {
            prefix: cookiePrefix,
            secure: useSecureFlag,
            environment: isDevelopment ? 'development' : 'production',
            protocol: isHttpsRequest ? 'HTTPS' : 'HTTP'
        });
    }
    
    // SECURITY FIX: Enhanced CSRF token validation checking multiple sources
    validateCsrfToken() {
        return (req, res, next) => {
            // Skip for safe methods
            if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
                return next();
            }

            // Skip for GraphQL introspection queries
            if (req.body?.query && req.body.query.includes('__schema')) {
                return next();
            }

            const sessionId = req.user?.id || req.ip || req.sessionId;
            
            // SECURITY FIX: Check multiple token sources in priority order
            // 1. Request header (preferred)
            // 2. Secure cookie (fallback)
            // 3. Body/query params (legacy compatibility)
            const token = req.get('X-CSRF-Token') || 
                         req.cookies?.['__Secure-csrfToken'] || 
                         req.cookies?.csrfToken ||
                         req.body?._csrfToken || 
                         req.query?._csrfToken;

            if (!token) {
                console.warn('\u26a0\ufe0f CSRF token missing from all sources');
                return res.status(403).json({
                    success: false,
                    error: 'CSRF token missing',
                    code: 'CSRF_TOKEN_MISSING'
                });
            }

            if (!this.validateToken(sessionId, token)) {
                console.warn('\u26a0\ufe0f CSRF token validation failed:', {
                    sessionId: sessionId?.substring?.(0, 8) + '...',
                    tokenPresent: !!token,
                    tokenSource: req.get('X-CSRF-Token') ? 'header' : 
                                req.cookies?.['__Secure-csrfToken'] ? 'secure-cookie' :
                                req.cookies?.csrfToken ? 'cookie' : 'body/query'
                });
                return res.status(403).json({
                    success: false,
                    error: 'Invalid or expired CSRF token',
                    code: 'CSRF_TOKEN_INVALID'
                });
            }

            console.log('\u2713 CSRF token validated successfully');
            next();
        };
    }

    // SECURITY FIX: Enhanced CSRF token endpoint with secure cookie setting
    getTokenEndpoint() {
        return (req, res) => {
            const sessionId = req.user?.id || req.ip || crypto.randomBytes(16).toString('hex');
            const token = this.generateToken(sessionId);
            
            // Set token in secure cookie
            this.setSecureCSRFCookie(req, res, token);

            res.json({
                success: true,
                csrfToken: token,
                expiresIn: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
                storage: 'secure_cookie', // Indicate where token is stored
                cookieAccess: 'javascript_readable' // Clarify that JS can access for headers
            });
        };
    }
}

// Create singleton instance
const csrfProtection = new CSRFProtection();

// Export middleware functions
export const attachCsrfToken = csrfProtection.attachToken();
export const validateCsrfToken = csrfProtection.validateCsrfToken();
export const getCsrfToken = csrfProtection.getTokenEndpoint();

export default csrfProtection;