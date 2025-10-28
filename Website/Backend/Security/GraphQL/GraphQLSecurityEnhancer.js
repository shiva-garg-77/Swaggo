/**
 * 🛡️ GRAPHQL SECURITY ENHANCER
 * 
 * Adds advanced security layers to your existing GraphQL setup:
 * - Query complexity analysis and limiting
 * - Query depth limiting
 * - Rate limiting per operation
 * - Query whitelisting for production
 * - Introspection control
 * - Query timeout enforcement
 * - Resource usage monitoring
 */

import { DepthLimitingRule } from 'graphql-depth-limit';
import { costAnalysis } from 'graphql-query-complexity';
import crypto from 'crypto';

class GraphQLSecurityEnhancer {
  constructor() {
    // Configuration
    this.config = {
      maxDepth: parseInt(process.env.GRAPHQL_MAX_DEPTH) || 10,
      maxComplexity: parseInt(process.env.GRAPHQL_MAX_COMPLEXITY) || 1000,
      maxQueryTimeout: parseInt(process.env.GRAPHQL_TIMEOUT) || 30000, // 30 seconds
      introspectionEnabled: process.env.NODE_ENV === 'development',
      whitelistEnabled: process.env.NODE_ENV === 'production',
      maxAliases: parseInt(process.env.GRAPHQL_MAX_ALIASES) || 15,
      maxDirectives: parseInt(process.env.GRAPHQL_MAX_DIRECTIVES) || 10
    };

    // Query tracking
    this.queryStats = new Map();
    this.suspiciousQueries = new Map();
    this.whitelistedQueries = new Set();
    this.blockedQueries = new Set();

    // Rate limiting per operation
    this.operationLimits = new Map();

    // Initialize whitelisted queries
    this.initializeQueryWhitelist();

    console.log('🛡️ GraphQL Security Enhancer initialized');
  }

  /**
   * Initialize whitelisted queries for production
   */
  initializeQueryWhitelist() {
    // Common safe queries that should always be allowed
    const safeQueries = [
      'query GetProfile { profile { username email } }',
      'query GetPosts { posts { id title content } }',
      'query GetMessages { messages { id content sender } }',
      'mutation Login { login(email: $email, password: $password) { token user } }'
    ];

    safeQueries.forEach(query => {
      const hash = this.hashQuery(query);
      this.whitelistedQueries.add(hash);
    });
  }

  /**
   * Create GraphQL validation rules for security
   */
  createValidationRules() {
    const rules = [];

    // Depth limiting rule
    rules.push(DepthLimitingRule(this.config.maxDepth));

    // Custom complexity analysis rule
    rules.push(this.createComplexityRule());

    // Custom query analysis rule
    rules.push(this.createQueryAnalysisRule());

    // Introspection blocking rule (production only)
    if (!this.config.introspectionEnabled) {
      rules.push(this.createIntrospectionBlockingRule());
    }

    // Alias limiting rule
    rules.push(this.createAliasLimitingRule());

    // Directive limiting rule
    rules.push(this.createDirectiveLimitingRule());

    return rules;
  }

  /**
   * Create complexity analysis rule
   */
  createComplexityRule() {
    return (context) => {
      const maxComplexity = this.config.maxComplexity;
      let complexity = 0;

      return {
        Document: {
          leave(node) {
            complexity = costAnalysis({
              maximumCost: maxComplexity,
              defaultCost: 1,
              variables: context.variableValues || {},
              createError: (max, actual) => {
                this.logSecurityEvent('complexity_exceeded', {
                  maxComplexity: max,
                  actualComplexity: actual,
                  query: context.source?.body,
                  variables: context.variableValues
                });

                return new Error(
                  `Query complexity limit exceeded. Maximum: ${max}, Actual: ${actual}`
                );
              },
              fieldExtensions: {
                // Define complexity costs for different fields
                posts: { complexity: 2 },
                messages: { complexity: 3 },
                users: { complexity: 5 },
                comments: { complexity: 1 },
                notifications: { complexity: 2 }
              }
            })(node, context);

            if (complexity > maxComplexity) {
              throw new Error(`Query too complex: ${complexity} > ${maxComplexity}`);
            }
          }
        }
      };
    };
  }

  /**
   * Create query analysis rule for suspicious patterns
   */
  createQueryAnalysisRule() {
    return (context) => {
      return {
        Document: {
          enter(node) {
            const query = context.source?.body || '';
            const queryHash = this.hashQuery(query);

            // Check if query is whitelisted in production
            if (this.config.whitelistEnabled && !this.whitelistedQueries.has(queryHash)) {
              this.logSecurityEvent('non_whitelisted_query', {
                query,
                hash: queryHash
              });

              // In strict mode, block non-whitelisted queries
              if (process.env.GRAPHQL_STRICT_WHITELIST === 'true') {
                throw new Error('Query not in whitelist');
              }
            }

            // Check for suspicious patterns
            this.analyzeQueryPatterns(query, context);

            // Track query usage
            this.trackQueryUsage(queryHash, query, context);
          }
        }
      };
    };
  }

  /**
   * Create introspection blocking rule
   */
  createIntrospectionBlockingRule() {
    return (context) => {
      return {
        Field: {
          enter(node) {
            if (node.name.value === '__schema' || node.name.value === '__type') {
              this.logSecurityEvent('introspection_blocked', {
                field: node.name.value,
                query: context.source?.body
              });

              throw new Error('Introspection is disabled');
            }
          }
        }
      };
    };
  }

  /**
   * Create alias limiting rule
   */
  createAliasLimitingRule() {
    return (context) => {
      let aliasCount = 0;

      return {
        Field: {
          enter(node) {
            if (node.alias) {
              aliasCount++;
              if (aliasCount > this.config.maxAliases) {
                this.logSecurityEvent('alias_limit_exceeded', {
                  maxAliases: this.config.maxAliases,
                  actualAliases: aliasCount,
                  query: context.source?.body
                });

                throw new Error(`Too many aliases in query. Maximum: ${this.config.maxAliases}`);
              }
            }
          }
        }
      };
    };
  }

  /**
   * Create directive limiting rule
   */
  createDirectiveLimitingRule() {
    return (context) => {
      let directiveCount = 0;

      return {
        Directive: {
          enter(node) {
            directiveCount++;
            if (directiveCount > this.config.maxDirectives) {
              this.logSecurityEvent('directive_limit_exceeded', {
                maxDirectives: this.config.maxDirectives,
                actualDirectives: directiveCount,
                query: context.source?.body
              });

              throw new Error(`Too many directives in query. Maximum: ${this.config.maxDirectives}`);
            }
          }
        }
      };
    };
  }

  /**
   * Analyze query for suspicious patterns
   */
  analyzeQueryPatterns(query, context) {
    const suspiciousPatterns = [
      // Deep nesting attempts
      /\{[^}]*\{[^}]*\{[^}]*\{[^}]*\{[^}]*\{/,
      
      // Excessive field requests
      /(\w+\s*){50,}/,
      
      // Potential DoS patterns
      /(__schema|__type).*(__schema|__type)/,
      
      // Large number requests
      /first:\s*\d{4,}|limit:\s*\d{4,}|take:\s*\d{4,}/,
      
      // Recursive patterns
      /(\w+)\s*\{[^}]*\1\s*\{/,
      
      // Multiple mutations
      /(mutation\s+\w*\s*\{[^}]*\}){3,}/
    ];

    suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(query)) {
        const suspicionType = [
          'deep_nesting',
          'excessive_fields',
          'introspection_abuse',
          'large_requests',
          'recursive_query',
          'multiple_mutations'
        ][index];

        this.logSecurityEvent('suspicious_query_pattern', {
          type: suspicionType,
          pattern: pattern.toString(),
          query: query.substring(0, 200), // First 200 chars
          ip: context.request?.ip,
          userAgent: context.request?.headers?.['user-agent']
        });

        // Track suspicious queries
        const queryHash = this.hashQuery(query);
        const suspiciousData = this.suspiciousQueries.get(queryHash) || {
          count: 0,
          firstSeen: new Date(),
          types: new Set()
        };

        suspiciousData.count++;
        suspiciousData.lastSeen = new Date();
        suspiciousData.types.add(suspicionType);
        this.suspiciousQueries.set(queryHash, suspiciousData);

        // Auto-block after multiple suspicious attempts
        if (suspiciousData.count >= 5) {
          this.blockedQueries.add(queryHash);
          throw new Error('Query blocked due to repeated suspicious patterns');
        }
      }
    });
  }

  /**
   * Track query usage for analytics
   */
  trackQueryUsage(queryHash, query, context) {
    const stats = this.queryStats.get(queryHash) || {
      query: query.substring(0, 100), // Store first 100 chars
      count: 0,
      firstSeen: new Date(),
      avgExecutionTime: 0,
      errors: 0,
      users: new Set()
    };

    stats.count++;
    stats.lastSeen = new Date();

    // Track user if authenticated
    if (context.user?.id) {
      stats.users.add(context.user.id);
    }

    this.queryStats.set(queryHash, stats);

    // Clean up old stats periodically
    if (this.queryStats.size > 10000) {
      this.cleanupQueryStats();
    }
  }

  /**
   * Create query timeout middleware
   */
  createTimeoutMiddleware() {
    return (resolve, source, args, context, info) => {
      return new Promise((resolvePromise, rejectPromise) => {
        const timeout = setTimeout(() => {
          this.logSecurityEvent('query_timeout', {
            operation: info.operation?.operation,
            fieldName: info.fieldName,
            timeout: this.config.maxQueryTimeout,
            user: context.user?.id
          });

          rejectPromise(new Error(`Query timeout: ${this.config.maxQueryTimeout}ms exceeded`));
        }, this.config.maxQueryTimeout);

        Promise.resolve(resolve(source, args, context, info))
          .then((result) => {
            clearTimeout(timeout);
            resolvePromise(result);
          })
          .catch((error) => {
            clearTimeout(timeout);
            rejectPromise(error);
          });
      });
    };
  }

  /**
   * Create rate limiting middleware for specific operations
   */
  createOperationRateLimit(operation, limits) {
    const { maxRequests = 100, windowMs = 60000 } = limits;
    
    return (resolve, source, args, context, info) => {
      const userId = context.user?.id || context.security?.ipAddress || 'anonymous';
      const key = `${operation}:${userId}`;
      
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Get or create rate limit data
      let limitData = this.operationLimits.get(key) || {
        requests: [],
        blocked: false,
        blockUntil: 0
      };
      
      // Clean old requests
      limitData.requests = limitData.requests.filter(time => time > windowStart);
      
      // Check if currently blocked
      if (limitData.blocked && now < limitData.blockUntil) {
        throw new Error(`Rate limit exceeded for ${operation}. Try again later.`);
      } else if (limitData.blocked && now >= limitData.blockUntil) {
        limitData.blocked = false;
        limitData.blockUntil = 0;
      }
      
      // Check rate limit
      if (limitData.requests.length >= maxRequests) {
        limitData.blocked = true;
        limitData.blockUntil = now + windowMs;
        
        this.logSecurityEvent('operation_rate_limited', {
          operation,
          user: userId,
          requests: limitData.requests.length,
          maxRequests,
          windowMs
        });
        
        this.operationLimits.set(key, limitData);
        throw new Error(`Rate limit exceeded for ${operation}. Try again later.`);
      }
      
      // Add current request
      limitData.requests.push(now);
      this.operationLimits.set(key, limitData);
      
      return resolve(source, args, context, info);
    };
  }

  /**
   * Hash query for tracking and whitelisting
   */
  hashQuery(query) {
    // Normalize query by removing whitespace and formatting
    const normalized = query
      .replace(/\s+/g, ' ')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*\(\s*/g, '(')
      .replace(/\s*\)\s*/g, ')')
      .trim();

    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Log security events
   */
  logSecurityEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: new Date(),
      data,
      severity: this.getEventSeverity(eventType)
    };

    console.warn(`🚨 GraphQL Security Event [${eventType}]:`, data);

    // You can integrate this with your existing security monitoring
    // securityIntegrationEnhancer.emit('security_event', event);
  }

  /**
   * Get event severity level
   */
  getEventSeverity(eventType) {
    const severityMap = {
      'complexity_exceeded': 'high',
      'depth_exceeded': 'high', 
      'introspection_blocked': 'medium',
      'suspicious_query_pattern': 'high',
      'query_timeout': 'medium',
      'operation_rate_limited': 'medium',
      'non_whitelisted_query': 'low',
      'alias_limit_exceeded': 'medium',
      'directive_limit_exceeded': 'medium'
    };

    return severityMap[eventType] || 'low';
  }

  /**
   * Clean up old query statistics
   */
  cleanupQueryStats() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [hash, stats] of this.queryStats) {
      if (stats.lastSeen && stats.lastSeen.getTime() < cutoffTime) {
        this.queryStats.delete(hash);
      }
    }
    
    console.log(`🧹 Cleaned up old GraphQL query statistics`);
  }

  /**
   * Get security analytics
   */
  getSecurityAnalytics() {
    return {
      queryStats: {
        total: this.queryStats.size,
        suspicious: this.suspiciousQueries.size,
        blocked: this.blockedQueries.size,
        whitelisted: this.whitelistedQueries.size
      },
      topQueries: Array.from(this.queryStats.entries())
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 10)
        .map(([hash, stats]) => ({
          hash: hash.substring(0, 8),
          query: stats.query,
          count: stats.count,
          avgExecutionTime: stats.avgExecutionTime,
          uniqueUsers: stats.users.size,
          errors: stats.errors
        })),
      suspiciousQueries: Array.from(this.suspiciousQueries.entries())
        .map(([hash, data]) => ({
          hash: hash.substring(0, 8),
          count: data.count,
          types: Array.from(data.types),
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen
        })),
      rateLimits: {
        activeOperations: this.operationLimits.size,
        blockedOperations: Array.from(this.operationLimits.entries())
          .filter(([, data]) => data.blocked)
          .length
      },
      config: this.config
    };
  }

  /**
   * Add query to whitelist
   */
  addToWhitelist(query) {
    const hash = this.hashQuery(query);
    this.whitelistedQueries.add(hash);
    console.log(`✅ Added query to whitelist: ${hash.substring(0, 8)}`);
    return hash;
  }

  /**
   * Remove query from whitelist
   */
  removeFromWhitelist(queryHash) {
    this.whitelistedQueries.delete(queryHash);
    console.log(`❌ Removed query from whitelist: ${queryHash.substring(0, 8)}`);
  }

  /**
   * Block specific query
   */
  blockQuery(query) {
    const hash = this.hashQuery(query);
    this.blockedQueries.add(hash);
    console.log(`🚫 Blocked query: ${hash.substring(0, 8)}`);
    return hash;
  }

  /**
   * Unblock query
   */
  unblockQuery(queryHash) {
    this.blockedQueries.delete(queryHash);
    console.log(`✅ Unblocked query: ${queryHash.substring(0, 8)}`);
  }

  /**
   * Health check for GraphQL security
   */
  healthCheck() {
    const analytics = this.getSecurityAnalytics();
    
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      issues: []
    };

    // Check for high suspicious query count
    if (analytics.queryStats.suspicious > 100) {
      health.status = 'warning';
      health.issues.push(`High number of suspicious queries: ${analytics.queryStats.suspicious}`);
    }

    // Check for blocked operations
    if (analytics.rateLimits.blockedOperations > 10) {
      health.status = 'warning';
      health.issues.push(`Many blocked operations: ${analytics.rateLimits.blockedOperations}`);
    }

    // Check configuration
    if (this.config.maxComplexity > 2000) {
      health.issues.push('High complexity limit may allow DoS attacks');
    }

    if (this.config.introspectionEnabled && process.env.NODE_ENV === 'production') {
      health.status = 'critical';
      health.issues.push('Introspection enabled in production');
    }

    return health;
  }
}

// Export singleton instance
const graphqlSecurityEnhancer = new GraphQLSecurityEnhancer();

export default graphqlSecurityEnhancer;