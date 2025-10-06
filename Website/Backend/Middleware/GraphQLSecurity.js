import { GraphQLError } from 'graphql';
import { rateLimiter } from './Security.js';
import { 
    AuthenticationError, 
    AuthorizationError, 
    ValidationError,
    requireAuth,
    requireOwnership 
} from '../Helper/ErrorHandling.js';

/**
 * GraphQL Security Middleware and Utilities
 */

// Authentication wrapper for resolvers
export const withAuth = (resolver) => {
    return async (parent, args, context, info) => {
        if (!context.user) {
            throw new AuthenticationError('Authentication required');
        }
        return resolver(parent, args, context, info);
    };
};

// Authorization wrapper for resolvers (checks if user owns the resource)
export const withOwnership = (resolver, getResourceUserId) => {
    return async (parent, args, context, info) => {
        requireAuth(context.user);
        
        const resourceUserId = getResourceUserId ? getResourceUserId(parent, args) : args.profileid;
        if (context.user.profileid !== resourceUserId) {
            throw new AuthorizationError('You can only access your own resources');
        }
        
        return resolver(parent, args, context, info);
    };
};

// Rate limiting wrapper for resolvers
export const withRateLimit = (resolver, rateLimitType = 'query') => {
    return async (parent, args, context, info) => {
        const userId = context.user?.profileid || context.req?.ip || 'anonymous';
        const isMutation = info.operation.operation === 'mutation';
        
        try {
            await rateLimiter.checkGraphQLRate(userId, isMutation);
            return resolver(parent, args, context, info);
        } catch (error) {
            throw new GraphQLError('Rate limit exceeded', {
                extensions: {
                    code: 'RATE_LIMITED',
                    retryAfter: error.retryAfter || 60
                }
            });
        }
    };
};

// Pagination helper for GraphQL
export const withPagination = (resolver, defaultLimit = 20, maxLimit = 100) => {
    return async (parent, args, context, info) => {
        // Standardize pagination arguments
        const limit = Math.min(Math.max(parseInt(args.limit) || defaultLimit, 1), maxLimit);
        const offset = Math.max(parseInt(args.offset) || 0, 0);
        const page = Math.max(parseInt(args.page) || 1, 1);
        
        // Calculate offset from page if not provided directly
        const finalOffset = args.offset !== undefined ? offset : (page - 1) * limit;
        
        // Add pagination info to args
        const paginatedArgs = {
            ...args,
            limit,
            offset: finalOffset,
            page
        };
        
        const result = await resolver(parent, paginatedArgs, context, info);
        
        // If resolver returns array, add pagination metadata
        if (Array.isArray(result)) {
            return {
                data: result,
                pagination: {
                    page,
                    limit,
                    offset: finalOffset,
                    hasMore: result.length === limit,
                    total: result.length // This would need to be calculated properly in real scenarios
                }
            };
        }
        
        return result;
    };
};

// Input validation wrapper
export const withValidation = (resolver, validationSchema) => {
    return async (parent, args, context, info) => {
        if (validationSchema) {
            const errors = [];
            
            for (const [field, rules] of Object.entries(validationSchema)) {
                const value = args[field];
                
                if (rules.required && (value === undefined || value === null || value === '')) {
                    errors.push(`${field} is required`);
                }
                
                if (value !== undefined && value !== null) {
                    if (rules.type && typeof value !== rules.type) {
                        errors.push(`${field} must be of type ${rules.type}`);
                    }
                    
                    if (rules.minLength && value.length < rules.minLength) {
                        errors.push(`${field} must be at least ${rules.minLength} characters`);
                    }
                    
                    if (rules.maxLength && value.length > rules.maxLength) {
                        errors.push(`${field} must not exceed ${rules.maxLength} characters`);
                    }
                    
                    if (rules.pattern && !rules.pattern.test(value)) {
                        errors.push(`${field} format is invalid`);
                    }
                    
                    if (rules.enum && !rules.enum.includes(value)) {
                        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
                    }
                }
            }
            
            if (errors.length > 0) {
                throw new ValidationError(errors.join(', '));
            }
        }
        
        return resolver(parent, args, context, info);
    };
};

// Combined security wrapper
export const withSecurity = (resolver, options = {}) => {
    const {
        requireAuth: needsAuth = false,
        requireOwnership: needsOwnership = false,
        validation = null,
        pagination = false,
        rateLimit = true,
        getResourceUserId = null,
        maxLimit = 100,
        defaultLimit = 20
    } = options;
    
    let securedResolver = resolver;
    
    // Apply security layers in reverse order (innermost first)
    if (pagination) {
        securedResolver = withPagination(securedResolver, defaultLimit, maxLimit);
    }
    
    if (validation) {
        securedResolver = withValidation(securedResolver, validation);
    }
    
    if (needsOwnership) {
        securedResolver = withOwnership(securedResolver, getResourceUserId);
    }
    
    if (needsAuth) {
        securedResolver = withAuth(securedResolver);
    }
    
    if (rateLimit) {
        securedResolver = withRateLimit(securedResolver);
    }
    
    return securedResolver;
};

// Field-level authorization for nested resolvers
export const fieldAuth = (resolver, requiredRole = null) => {
    return async (parent, args, context, info) => {
        // Allow access if no specific role required and user is authenticated
        if (!requiredRole && context.user) {
            return resolver(parent, args, context, info);
        }
        
        // Check specific role requirements
        if (requiredRole) {
            if (!context.user) {
                throw new AuthenticationError('Authentication required');
            }
            
            // Example role checking - adapt based on your role system
            if (context.user.role !== requiredRole && context.user.role !== 'admin') {
                throw new AuthorizationError(`${requiredRole} role required`);
            }
        }
        
        return resolver(parent, args, context, info);
    };
};

// Privacy-aware field resolver
export const privacyAwareField = (resolver, isPrivateField = false) => {
    return async (parent, args, context, info) => {
        // If it's a private field and no user context, return null
        if (isPrivateField && !context.user) {
            return null;
        }
        
        // If viewing another user's private profile and not friends, hide private fields
        if (isPrivateField && parent.isPrivate && parent.profileid !== context.user?.profileid) {
            // Here you could check if users are friends
            // For now, just hide private fields from other users
            return null;
        }
        
        return resolver(parent, args, context, info);
    };
};

// Query complexity analysis
export const analyzeQueryComplexity = (info) => {
    let complexity = 0;
    
    const calculateComplexity = (selectionSet, multiplier = 1) => {
        if (!selectionSet || !selectionSet.selections) return;
        
        selectionSet.selections.forEach(selection => {
            complexity += multiplier;
            
            // Arrays and relations increase complexity
            if (selection.name?.value?.endsWith('s') || selection.name?.value?.includes('list')) {
                multiplier *= 5;
            }
            
            if (selection.selectionSet) {
                calculateComplexity(selection.selectionSet, multiplier);
            }
        });
    };
    
    info.fieldNodes.forEach(node => {
        calculateComplexity(node.selectionSet);
    });
    
    return complexity;
};

// Query depth analysis
export const analyzeQueryDepth = (info) => {
    let maxDepth = 0;
    
    const calculateDepth = (selectionSet, currentDepth = 0) => {
        if (!selectionSet || !selectionSet.selections) return;
        
        const depth = currentDepth + 1;
        maxDepth = Math.max(maxDepth, depth);
        
        selectionSet.selections.forEach(selection => {
            if (selection.selectionSet) {
                calculateDepth(selection.selectionSet, depth);
            }
        });
    };
    
    info.fieldNodes.forEach(node => {
        calculateDepth(node.selectionSet);
    });
    
    return maxDepth;
};

// Main GraphQL security middleware
export const graphqlSecurityMiddleware = async (resolve, source, args, context, info) => {
    // Rate limiting
    const userId = context.user?.profileid || context.req?.ip || 'anonymous';
    const isMutation = info.operation.operation === 'mutation';
    
    try {
        await rateLimiter.checkGraphQLRate(userId, isMutation);
    } catch (error) {
        throw new GraphQLError('Rate limit exceeded', {
            extensions: {
                code: 'RATE_LIMITED',
                retryAfter: error.retryAfter || 60
            }
        });
    }
    
    // Query complexity analysis
    const complexity = analyzeQueryComplexity(info);
    if (complexity > 1000) {
        throw new GraphQLError(`Query too complex (complexity: ${complexity})`, {
            extensions: { code: 'QUERY_TOO_COMPLEX' }
        });
    }
    
    // Query depth analysis
    const depth = analyzeQueryDepth(info);
    if (depth > 10) {
        throw new GraphQLError(`Query too deep (depth: ${depth})`, {
            extensions: { code: 'QUERY_TOO_DEEP' }
        });
    }
    
    // Log potentially suspicious queries
    if (complexity > 500 || depth > 7) {
        console.warn(`🚨 Complex GraphQL query detected`, {
            operation: info.operation.operation,
            fieldName: info.fieldName,
            complexity,
            depth,
            user: context.user?.username || 'anonymous',
            ip: context.req?.ip
        });
    }
    
    return resolve(source, args, context, info);
};

export default {
    withAuth,
    withOwnership,
    withRateLimit,
    withPagination,
    withValidation,
    withSecurity,
    fieldAuth,
    privacyAwareField,
    graphqlSecurityMiddleware
};