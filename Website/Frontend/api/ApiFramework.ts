/**
 * Comprehensive API Design Framework
 * Standardizes API responses, implements versioning, documentation, rate limiting, and error handling
 */

import { RateLimiter, InputSanitizer } from '../security/SecurityConfig';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
  links?: ApiLinks;
  timestamp: string;
  version: string;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  statusCode: number;
}

export interface ApiMeta {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
  filtering?: Record<string, any>;
  timing?: {
    duration: number;
    cached: boolean;
  };
}

export interface ApiLinks {
  self?: string;
  next?: string;
  prev?: string;
  first?: string;
  last?: string;
}

// API Validation Schema
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    items?: ValidationSchema;
    properties?: ValidationSchema;
  };
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  version: string;
  description: string;
  tags: string[];
  parameters?: {
    path?: ValidationSchema;
    query?: ValidationSchema;
    body?: ValidationSchema;
    headers?: ValidationSchema;
  };
  responses: {
    [statusCode: number]: {
      description: string;
      schema?: any;
    };
  };
  rateLimiting?: {
    maxRequests: number;
    windowMs: number;
  };
  authentication?: boolean;
  permissions?: string[];
}

// Error Codes
export const API_ERROR_CODES = {
  // Client Errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  
  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

// API Response Builder
export class ApiResponseBuilder {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private static getCurrentVersion(): string {
    return process.env.API_VERSION || 'v1';
  }

  /**
   * Build success response
   */
  static success<T>(
    data: T, 
    meta?: ApiMeta, 
    links?: ApiLinks,
    statusCode: number = 200
  ): { response: ApiResponse<T>; statusCode: number } {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      version: this.getCurrentVersion(),
      requestId: this.generateRequestId()
    };
    
    if (meta) {
      response.meta = meta;
    }
    
    if (links) {
      response.links = links;
    }
    
    return {
      response,
      statusCode
    };
  }

  /**
   * Build error response
   */
  static error(
    code: string,
    message: string,
    details?: any,
    field?: string,
    statusCode: number = 400
  ): { response: ApiResponse; statusCode: number } {
    const error: ApiError = {
      code,
      message,
      details,
      statusCode
    };
    
    if (field) {
      error.field = field;
    }
    
    return {
      response: {
        success: false,
        error,
        timestamp: new Date().toISOString(),
        version: this.getCurrentVersion(),
        requestId: this.generateRequestId()
      },
      statusCode
    };
  }

  /**
   * Build paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    baseUrl: string
  ): { response: ApiResponse<T[]>; statusCode: number } {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const links: ApiLinks = {
      self: `${baseUrl}?page=${page}&limit=${limit}`,
      first: `${baseUrl}?page=1&limit=${limit}`,
      last: `${baseUrl}?page=${totalPages}&limit=${limit}`
    };

    if (hasNext) {
      links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
    }

    if (hasPrev) {
      links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
    }

    const meta: ApiMeta = {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    };

    return this.success(data, meta, links);
  }
}

// API Validator
export class ApiValidator {
  /**
   * Validate request data against schema
   */
  static validate(data: any, schema: ValidationSchema): { isValid: boolean; errors: ApiError[] } {
    const errors: ApiError[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this.validateField(field, value, rules);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static validateField(field: string, value: any, rules: any): ApiError[] {
    const errors: ApiError[] = [];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: `Field '${field}' is required`,
        field,
        statusCode: 400
      });
      return errors; // Skip other validations if required field is missing
    }

    // Skip validation if field is not required and empty
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type validation
    if (rules.type && !this.validateType(value, rules.type)) {
      errors.push({
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: `Field '${field}' must be of type ${rules.type}`,
        field,
        statusCode: 400
      });
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: `Field '${field}' must be at least ${rules.minLength} characters`,
          field,
          statusCode: 400
        });
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: `Field '${field}' must be no more than ${rules.maxLength} characters`,
          field,
          statusCode: 400
        });
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push({
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: `Field '${field}' format is invalid`,
          field,
          statusCode: 400
        });
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: `Field '${field}' must be at least ${rules.min}`,
          field,
          statusCode: 400
        });
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: `Field '${field}' must be no more than ${rules.max}`,
          field,
          statusCode: 400
        });
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: `Field '${field}' must be one of: ${rules.enum.join(', ')}`,
        field,
        statusCode: 400
      });
    }

    // Email validation
    if (rules.type === 'email') {
      try {
        InputSanitizer.sanitizeEmail(value);
      } catch {
        errors.push({
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: `Field '${field}' must be a valid email address`,
          field,
          statusCode: 400
        });
      }
    }

    return errors;
  }

  private static validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value) && value !== null;
      case 'email':
        return typeof value === 'string';
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  }
}

// API Rate Limiter
export class ApiRateLimiter {
  /**
   * Check rate limit for endpoint
   */
  static checkRateLimit(
    key: string,
    endpoint: ApiEndpoint,
    defaultMaxRequests: number = 100,
    defaultWindowMs: number = 15 * 60 * 1000
  ): { allowed: boolean; remainingRequests: number; resetTime: number } {
    const maxRequests = endpoint.rateLimiting?.maxRequests || defaultMaxRequests;
    const windowMs = endpoint.rateLimiting?.windowMs || defaultWindowMs;
    
    const isLimited = RateLimiter.isRateLimited(key, maxRequests, windowMs);
    const remainingRequests = RateLimiter.getRemainingRequests(key, maxRequests);
    
    return {
      allowed: !isLimited,
      remainingRequests,
      resetTime: Date.now() + windowMs
    };
  }
}

// API Documentation Generator
export class ApiDocumentationGenerator {
  private static endpoints: ApiEndpoint[] = [];

  /**
   * Register API endpoint
   */
  static registerEndpoint(endpoint: ApiEndpoint): void {
    this.endpoints.push(endpoint);
  }

  /**
   * Generate OpenAPI specification
   */
  static generateOpenAPISpec(): any {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Swaggo API',
        version: process.env.API_VERSION || '1.0.0',
        description: 'API documentation for Swaggo application'
      },
      servers: [
        {
          url: process.env.API_BASE_URL || 'http://localhost:3000/api',
          description: 'Development server'
        }
      ],
      paths: {} as any,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          ApiResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              error: { $ref: '#/components/schemas/ApiError' },
              meta: { $ref: '#/components/schemas/ApiMeta' },
              timestamp: { type: 'string', format: 'date-time' },
              version: { type: 'string' },
              requestId: { type: 'string' }
            }
          },
          ApiError: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
              field: { type: 'string' },
              statusCode: { type: 'number' }
            }
          },
          ApiMeta: {
            type: 'object',
            properties: {
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  totalPages: { type: 'number' },
                  hasNext: { type: 'boolean' },
                  hasPrev: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    };

    // Generate paths from endpoints
    for (const endpoint of this.endpoints) {
      const pathKey = endpoint.path.replace(/:\w+/g, (match) => `{${match.slice(1)}}`);
      
      if (!spec.paths[pathKey]) {
        spec.paths[pathKey] = {};
      }

      spec.paths[pathKey][endpoint.method.toLowerCase()] = {
        tags: endpoint.tags,
        summary: endpoint.description,
        parameters: this.generateParameters(endpoint),
        requestBody: this.generateRequestBody(endpoint),
        responses: this.generateResponses(endpoint),
        security: endpoint.authentication ? [{ bearerAuth: [] }] : []
      };
    }

    return spec;
  }

  private static generateParameters(endpoint: ApiEndpoint): any[] {
    const parameters = [];

    if (endpoint.parameters?.path) {
      for (const [name, schema] of Object.entries(endpoint.parameters.path)) {
        parameters.push({
          name,
          in: 'path',
          required: true,
          schema: this.schemaToOpenAPI(schema)
        });
      }
    }

    if (endpoint.parameters?.query) {
      for (const [name, schema] of Object.entries(endpoint.parameters.query)) {
        parameters.push({
          name,
          in: 'query',
          required: schema.required || false,
          schema: this.schemaToOpenAPI(schema)
        });
      }
    }

    return parameters;
  }

  private static generateRequestBody(endpoint: ApiEndpoint): any {
    if (endpoint.parameters?.body) {
      return {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: this.generateProperties(endpoint.parameters.body)
            }
          }
        }
      };
    }
    return undefined;
  }

  private static generateResponses(endpoint: ApiEndpoint): any {
    const responses: any = {};
    
    for (const [statusCode, response] of Object.entries(endpoint.responses)) {
      responses[statusCode] = {
        description: response.description,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiResponse' }
          }
        }
      };
    }

    return responses;
  }

  private static generateProperties(schema: ValidationSchema): any {
    const properties: any = {};
    
    for (const [field, rules] of Object.entries(schema)) {
      properties[field] = this.schemaToOpenAPI(rules);
    }
    
    return properties;
  }

  private static schemaToOpenAPI(schema: any): any {
    const openApiSchema: any = {
      type: schema.type === 'email' ? 'string' : schema.type
    };

    if (schema.minLength) openApiSchema.minLength = schema.minLength;
    if (schema.maxLength) openApiSchema.maxLength = schema.maxLength;
    if (schema.min) openApiSchema.minimum = schema.min;
    if (schema.max) openApiSchema.maximum = schema.max;
    if (schema.enum) openApiSchema.enum = schema.enum;
    if (schema.type === 'email') openApiSchema.format = 'email';

    return openApiSchema;
  }
}

// Middleware for API endpoints
export class ApiMiddleware {
  /**
   * Validate request middleware
   */
  static validateRequest(endpoint: ApiEndpoint) {
    return (req: any, res: any, next: any) => {
      const errors: ApiError[] = [];

      // Validate path parameters
      if (endpoint.parameters?.path) {
        const pathValidation = ApiValidator.validate(req.params, endpoint.parameters.path);
        errors.push(...pathValidation.errors);
      }

      // Validate query parameters
      if (endpoint.parameters?.query) {
        const queryValidation = ApiValidator.validate(req.query, endpoint.parameters.query);
        errors.push(...queryValidation.errors);
      }

      // Validate request body
      if (endpoint.parameters?.body) {
        const bodyValidation = ApiValidator.validate(req.body, endpoint.parameters.body);
        errors.push(...bodyValidation.errors);
      }

      if (errors.length > 0) {
        const { response, statusCode } = ApiResponseBuilder.error(
          API_ERROR_CODES.VALIDATION_ERROR,
          'Validation failed',
          errors
        );
        return res.status(statusCode).json(response);
      }

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  static rateLimit(endpoint: ApiEndpoint) {
    return (req: any, res: any, next: any) => {
      const clientId = req.ip || 'unknown';
      const rateLimitResult = ApiRateLimiter.checkRateLimit(
        `${endpoint.method}:${endpoint.path}:${clientId}`,
        endpoint
      );

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': endpoint.rateLimiting?.maxRequests || 100,
        'X-RateLimit-Remaining': rateLimitResult.remainingRequests,
        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
      });

      if (!rateLimitResult.allowed) {
        const { response, statusCode } = ApiResponseBuilder.error(
          API_ERROR_CODES.RATE_LIMITED,
          'Rate limit exceeded',
          { 
            resetTime: new Date(rateLimitResult.resetTime).toISOString(),
            maxRequests: endpoint.rateLimiting?.maxRequests || 100
          }
        );
        return res.status(statusCode).json(response);
      }

      next();
    };
  }

  /**
   * Error handling middleware
   */
  static errorHandler(err: any, _req: any, res: any, _next: any) {
    // API error handled

    let { response, statusCode } = ApiResponseBuilder.error(
      API_ERROR_CODES.INTERNAL_ERROR,
      'Internal server error',
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );

    // Handle specific error types
    if (err.name === 'ValidationError') {
      ({ response, statusCode } = ApiResponseBuilder.error(
        API_ERROR_CODES.VALIDATION_ERROR,
        err.message,
        err.details
      ));
    } else if (err.name === 'UnauthorizedError') {
      ({ response, statusCode } = ApiResponseBuilder.error(
        API_ERROR_CODES.UNAUTHORIZED,
        'Authentication required',
        undefined,
        undefined,
        401
      ));
    } else if (err.name === 'ForbiddenError') {
      ({ response, statusCode } = ApiResponseBuilder.error(
        API_ERROR_CODES.FORBIDDEN,
        'Insufficient permissions',
        undefined,
        undefined,
        403
      ));
    }

    res.status(statusCode).json(response);
  }
}

export default {
  ApiResponseBuilder,
  ApiValidator,
  ApiRateLimiter,
  ApiDocumentationGenerator,
  ApiMiddleware,
  API_ERROR_CODES
};