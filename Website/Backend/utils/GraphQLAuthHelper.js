/**
 * 🔒 GRAPHQL AUTHENTICATION HELPER
 * 
 * Provides comprehensive authentication utilities for GraphQL resolvers
 * to ensure consistent security validation across all operations.
 */

import TokenService from '../Services/TokenService.js';

class GraphQLAuthHelper {
  
  /**
   * Require authentication for a GraphQL resolver
   */
  requireAuth(resolver) {
    return async (parent, args, context, info) => {
      if (!context.isAuthenticated || !context.user) {
        throw new Error('Authentication required. Please log in to access this resource.');
      }
      
      // Additional security checks
      this.validateAuthContext(context);
      
      return resolver(parent, args, context, info);
    };
  }
  
  /**
   * Require specific role for a GraphQL resolver
   */
  requireRole(roles, resolver) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return async (parent, args, context, info) => {
      if (!context.isAuthenticated || !context.user) {
        throw new Error('Authentication required. Please log in to access this resource.');
      }
      
      const userRole = context.user.permissions?.role || 'user';
      if (!allowedRoles.includes(userRole)) {
        throw new Error(`Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`);
      }
      
      this.validateAuthContext(context);
      
      return resolver(parent, args, context, info);
    };
  }
  
  /**
   * Optional authentication (doesn't throw if not authenticated)
   */
  optionalAuth(resolver) {
    return async (parent, args, context, info) => {
      if (context.isAuthenticated && context.user) {
        this.validateAuthContext(context);
      }
      
      return resolver(parent, args, context, info);
    };
  }
  
  /**
   * Require CSRF token for mutations
   */
  requireCSRF(resolver) {
    return async (parent, args, context, info) => {
      if (!context.isAuthenticated || !context.user) {
        throw new Error('Authentication required');
      }
      
      const csrfToken = context.security?.csrfToken;
      if (!csrfToken) {
        throw new Error('CSRF token required for this operation');
      }
      
      // Validate CSRF token with TokenService
      try {
        console.log('🛡️ CSRF Validation Debug:', {
          hasCSRF: !!csrfToken,
          csrfLength: csrfToken?.length,
          hasUser: !!context.user,
          userId: context.user?.id,
          hasAuthResult: !!context.authResult,
          authResultKeys: Object.keys(context.authResult || {}),
          hasPayload: !!context.authResult?.payload,
          payloadKeys: Object.keys(context.authResult?.payload || {})
        });
        
        // Extract access token ID from auth result or context
        const accessTokenId = context.authResult?.payload?.jti || context.authResult?.tokenId;
        console.log('🔍 Access Token ID extracted:', {
          fromJti: context.authResult?.payload?.jti,
          fromTokenId: context.authResult?.tokenId,
          final: accessTokenId
        });
        
        if (!accessTokenId) {
          throw new Error('Access token ID not available for CSRF validation');
        }
        
        const sessionContext = {
          ipAddress: context.security?.ip,
          userAgent: context.security?.userAgent
        };
        
        // DEVELOPMENT FIX: In development, be more flexible with IP and User-Agent validation
        if (process.env.NODE_ENV === 'development') {
          // Skip IP and User-Agent validation in development to avoid mismatch issues
          delete sessionContext.ipAddress;
          delete sessionContext.userAgent;
          console.log('🔧 DEVELOPMENT MODE: Skipping IP and User-Agent validation for CSRF token');
          console.log('🔒 PRODUCTION MODE: Full security validation will be enforced');
        }
        
        console.log('🔒 CSRF Validation Parameters:', {
          csrfToken: csrfToken.substring(0, 20) + '...',
          accessTokenId: accessTokenId.substring(0, 20) + '...',
          userId: context.user.id,
          sessionContext
        });
        
        // Use correct TokenService method with proper parameters
        const isValidCSRF = await TokenService.verifyCSRFToken(
          csrfToken, 
          accessTokenId, 
          context.user.id,
          sessionContext
        );
        
        console.log('✅ CSRF Token Validation Result:', isValidCSRF);
        
        if (!isValidCSRF) {
          throw new Error('Invalid CSRF token');
        }
      } catch (error) {
        console.error('❌ CSRF validation error:', error.message);
        console.error('❌ CSRF validation stack:', error.stack);
        throw new Error('CSRF token validation failed');
      }
      
      return resolver(parent, args, context, info);
    };
  }
  
  /**
   * Validate authentication context for security
   */
  validateAuthContext(context) {
    const { security, authResult, user } = context;
    
    // Check token expiration
    if (authResult?.metadata?.expiresAt) {
      const expiresAt = new Date(authResult.metadata.expiresAt);
      if (expiresAt <= new Date()) {
        throw new Error('Token expired. Please refresh your session.');
      }
    }
    
    // Check risk score
    if (security?.riskScore && security.riskScore > 70) {
      throw new Error('High-risk authentication detected. Please verify your identity.');
    }
    
    // Check if user account is still active
    if (user && typeof user.isAccountLocked === 'function' && user.isAccountLocked()) {
      throw new Error('Account is locked. Please contact support.');
    }
  }
  
  /**
   * Extract user ID safely from context
   */
  getUserId(context) {
    if (!context.isAuthenticated || !context.user) {
      throw new Error('User not authenticated');
    }
    
    return context.user.id || context.user.profileid;
  }
  
  /**
   * Check if user owns resource
   */
  requireOwnership(getResourceUserId) {
    return (resolver) => {
      return async (parent, args, context, info) => {
        if (!context.isAuthenticated || !context.user) {
          throw new Error('Authentication required');
        }
        
        const userId = this.getUserId(context);
        const resourceUserId = await getResourceUserId(parent, args, context, info);
        
        if (userId !== resourceUserId) {
          throw new Error('Access denied. You can only access your own resources.');
        }
        
        return resolver(parent, args, context, info);
      };
    };
  }
  
  /**
   * Rate limiting for GraphQL resolvers
   */
  rateLimit(maxRequests = 100, windowMs = 60000) {
    const requests = new Map();
    
    return (resolver) => {
      return async (parent, args, context, info) => {
        const key = context.security?.ip || 'unknown';
        const now = Date.now();
        
        // Clean old entries
        const windowStart = now - windowMs;
        if (requests.has(key)) {
          const userRequests = requests.get(key).filter(time => time > windowStart);
          requests.set(key, userRequests);
        } else {
          requests.set(key, []);
        }
        
        const userRequests = requests.get(key);
        if (userRequests.length >= maxRequests) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        userRequests.push(now);
        
        return resolver(parent, args, context, info);
      };
    };
  }
  
  /**
   * Log GraphQL operations for security auditing
   */
  logOperation(operationType = 'query') {
    return (resolver) => {
      return async (parent, args, context, info) => {
        const startTime = Date.now();
        const operationName = info.fieldName;
        
        try {
          console.log(`🔍 GraphQL ${operationType}: ${operationName}`, {
            user: context.user ? `${context.user.username} (${context.user.id})` : 'Anonymous',
            ip: context.security?.ip,
            userAgent: context.security?.userAgent,
            timestamp: new Date().toISOString()
          });
          
          const result = await resolver(parent, args, context, info);
          
          const duration = Date.now() - startTime;
          console.log(`✅ GraphQL ${operationType} completed: ${operationName} (${duration}ms)`);
          
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`❌ GraphQL ${operationType} failed: ${operationName} (${duration}ms)`, {
            error: error.message,
            user: context.user ? `${context.user.username} (${context.user.id})` : 'Anonymous',
            ip: context.security?.ip
          });
          
          throw error;
        }
      };
    };
  }
  
  /**
   * Validate specific arguments
   */
  validateArgs(validationRules) {
    return (resolver) => {
      return async (parent, args, context, info) => {
        for (const [argName, rules] of Object.entries(validationRules)) {
          const value = args[argName];
          
          if (rules.required && (value === undefined || value === null)) {
            throw new Error(`Missing required argument: ${argName}`);
          }
          
          if (value !== undefined && rules.type && typeof value !== rules.type) {
            throw new Error(`Invalid type for argument ${argName}. Expected ${rules.type}.`);
          }
          
          if (rules.minLength && value && value.length < rules.minLength) {
            throw new Error(`Argument ${argName} must be at least ${rules.minLength} characters long.`);
          }
          
          if (rules.maxLength && value && value.length > rules.maxLength) {
            throw new Error(`Argument ${argName} must be no more than ${rules.maxLength} characters long.`);
          }
          
          if (rules.pattern && value && !rules.pattern.test(value)) {
            throw new Error(`Invalid format for argument ${argName}.`);
          }
        }
        
        return resolver(parent, args, context, info);
      };
    };
  }
}

export default new GraphQLAuthHelper();