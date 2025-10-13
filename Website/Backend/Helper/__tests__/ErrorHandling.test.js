/**
 * @fileoverview Tests for ErrorHandling helper functions
 * @version 1.0.0
 */

import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  handleGraphQLError,
  asyncHandler,
  requireAuth,
  requireOwnership,
  safeAccess,
  dbOperation,
  ensureExists
} from '../ErrorHandling.js';

import { GraphQLError } from 'graphql';
import { jest } from '@jest/globals';

describe('ErrorHandling', () => {
  describe('Custom Error Classes', () => {
    test('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 'TEST_CODE', 418, true);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(418);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    test('should create AuthenticationError with default values', () => {
      const error = new AuthenticationError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Authentication required');
      expect(error.code).toBe('UNAUTHENTICATED');
      expect(error.statusCode).toBe(401);
    });

    test('should create AuthorizationError with default values', () => {
      const error = new AuthorizationError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Insufficient permissions');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
    });

    test('should create ValidationError with default values', () => {
      const error = new ValidationError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('BAD_USER_INPUT');
      expect(error.statusCode).toBe(400);
    });

    test('should create NotFoundError with default values', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    test('should create ConflictError with default values', () => {
      const error = new ConflictError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource conflict');
      expect(error.code).toBe('CONFLICT');
      expect(error.statusCode).toBe(409);
    });

    test('should create RateLimitError with default values', () => {
      const error = new RateLimitError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMITED');
      expect(error.statusCode).toBe(429);
    });
  });

  describe('handleGraphQLError', () => {
    test('should handle AppError correctly', () => {
      const appError = new AppError('Custom error', 'CUSTOM_CODE', 422);
      const result = handleGraphQLError(appError);
      
      expect(GraphQLError).toHaveBeenCalledWith('Custom error', {
        extensions: {
          code: 'CUSTOM_CODE',
          statusCode: 422
        }
      });
      expect(result.message).toBe('Custom error');
    });

    test('should handle Mongoose ValidationError', () => {
      const validationError = {
        name: 'ValidationError',
        errors: {
          field1: { message: 'Field1 is required' },
          field2: { message: 'Field2 must be unique' }
        }
      };
      
      const result = handleGraphQLError(validationError);
      
      expect(GraphQLError).toHaveBeenCalledWith(
        'Validation failed: Field1 is required, Field2 must be unique',
        {
          extensions: { code: 'BAD_USER_INPUT' }
        }
      );
    });

    test('should handle Mongoose CastError', () => {
      const castError = {
        name: 'CastError'
      };
      
      const result = handleGraphQLError(castError);
      
      expect(GraphQLError).toHaveBeenCalledWith('Invalid ID format', {
        extensions: { code: 'BAD_USER_INPUT' }
      });
    });

    test('should handle MongoDB duplicate key error', () => {
      const duplicateError = {
        code: 11000
      };
      
      const result = handleGraphQLError(duplicateError);
      
      expect(GraphQLError).toHaveBeenCalledWith('Duplicate value not allowed', {
        extensions: { code: 'CONFLICT' }
      });
    });

    test('should handle JWT errors', () => {
      const jwtError = {
        name: 'JsonWebTokenError'
      };
      
      const result = handleGraphQLError(jwtError);
      
      expect(GraphQLError).toHaveBeenCalledWith('Invalid token', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
    });

    test('should handle expired JWT errors', () => {
      const expiredError = {
        name: 'TokenExpiredError'
      };
      
      const result = handleGraphQLError(expiredError);
      
      expect(GraphQLError).toHaveBeenCalledWith('Token expired', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
    });

    test('should return generic error in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const genericError = new Error('Internal error');
      const result = handleGraphQLError(genericError);
      
      expect(GraphQLError).toHaveBeenCalledWith('Internal server error', {
        extensions: { code: 'INTERNAL_ERROR' }
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should expose full error in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const devError = new Error('Development error');
      const result = handleGraphQLError(devError);
      
      expect(GraphQLError).toHaveBeenCalledWith('Development error', {
        extensions: {
          code: 'INTERNAL_ERROR',
          originalError: expect.any(String)
        }
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('asyncHandler', () => {
    test('should execute function successfully', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(mockFn);
      
      const result = await wrappedFn('arg1', 'arg2');
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('success');
    });

    test('should handle errors through handleGraphQLError', async () => {
      const error = new AppError('Test error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(mockFn);
      
      await expect(wrappedFn()).rejects.toThrow(AppError);
    });
  });

  describe('Authentication and Authorization', () => {
    test('should pass when user is authenticated', () => {
      const user = { profileid: 'user123' };
      const result = requireAuth(user);
      
      expect(result).toBe(user);
    });

    test('should throw AuthenticationError when user is missing', () => {
      expect(() => requireAuth(null)).toThrow(AuthenticationError);
      expect(() => requireAuth(undefined)).toThrow(AuthenticationError);
      expect(() => requireAuth(false)).toThrow(AuthenticationError);
    });

    test('should pass when user owns resource', () => {
      const user = { profileid: 'user123' };
      const resourceUserId = 'user123';
      
      expect(() => requireOwnership(user, resourceUserId)).not.toThrow();
    });

    test('should throw AuthorizationError when user does not own resource', () => {
      const user = { profileid: 'user123' };
      const resourceUserId = 'user456';
      
      expect(() => requireOwnership(user, resourceUserId)).toThrow(AuthorizationError);
    });

    test('should throw AuthenticationError when checking ownership without auth', () => {
      expect(() => requireOwnership(null, 'user123')).toThrow(AuthenticationError);
    });
  });

  describe('Utility Functions', () => {
    test('should safely access nested object properties', () => {
      const obj = {
        user: {
          profile: {
            name: 'John Doe'
          }
        }
      };
      
      expect(safeAccess(obj, 'user.profile.name')).toBe('John Doe');
      expect(safeAccess(obj, 'user.profile.age', 25)).toBe(25);
      expect(safeAccess(obj, 'user.nonexistent.field', 'default')).toBe('default');
      expect(safeAccess(null, 'user.profile.name', 'fallback')).toBe('fallback');
    });

    test('should handle database operations successfully', async () => {
      const mockOperation = jest.fn().mockResolvedValue('db result');
      const result = await dbOperation(mockOperation);
      
      expect(mockOperation).toHaveBeenCalled();
      expect(result).toBe('db result');
    });

    test('should handle database validation errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      const mockOperation = jest.fn().mockRejectedValue(validationError);
      
      await expect(dbOperation(mockOperation)).rejects.toThrow(ValidationError);
    });

    test('should handle database cast errors', async () => {
      const castError = new Error('Cast error');
      castError.name = 'CastError';
      
      const mockOperation = jest.fn().mockRejectedValue(castError);
      
      await expect(dbOperation(mockOperation)).rejects.toThrow(ValidationError);
    });

    test('should handle database duplicate errors', async () => {
      const duplicateError = new Error('Duplicate error');
      duplicateError.code = 11000;
      
      const mockOperation = jest.fn().mockRejectedValue(duplicateError);
      
      await expect(dbOperation(mockOperation)).rejects.toThrow(ConflictError);
    });

    test('should ensure resource exists', () => {
      const resource = { id: '123' };
      const result = ensureExists(resource);
      
      expect(result).toBe(resource);
    });

    test('should throw NotFoundError when resource does not exist', () => {
      expect(() => ensureExists(null)).toThrow(NotFoundError);
      expect(() => ensureExists(undefined)).toThrow(NotFoundError);
      expect(() => ensureExists(false)).toThrow(NotFoundError);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete error flow from database to GraphQL', async () => {
      // Simulate a database operation that fails with validation error
      const dbValidationError = new Error('Email is required');
      dbValidationError.name = 'ValidationError';
      
      const mockDbOperation = jest.fn().mockRejectedValue(dbValidationError);
      
      // Wrap in asyncHandler to simulate resolver
      const resolver = asyncHandler(async () => {
        return await dbOperation(mockDbOperation, 'Failed to create user');
      });
      
      await expect(resolver()).rejects.toThrow('Validation failed: Email is required');
    });

    test('should handle authentication flow', async () => {
      // Test authenticated user flow
      const authenticatedUser = { profileid: 'user123', email: 'test@example.com' };
      
      const mockResolver = jest.fn().mockImplementation((_, __, context) => {
        const user = requireAuth(context.user);
        return { message: `Hello ${user.email}` };
      });
      
      const wrappedResolver = asyncHandler(mockResolver);
      
      const result = await wrappedResolver(null, null, { user: authenticatedUser });
      
      expect(result.message).toBe('Hello test@example.com');
    });

    test('should handle authorization flow', async () => {
      // Test authorized user flow
      const user = { profileid: 'user123' };
      const resourceOwnerId = 'user123';
      
      const mockResolver = jest.fn().mockImplementation(() => {
        requireOwnership(user, resourceOwnerId);
        return { message: 'Access granted' };
      });
      
      const wrappedResolver = asyncHandler(mockResolver);
      
      const result = await wrappedResolver();
      
      expect(result.message).toBe('Access granted');
    });

    test('should handle unauthorized access', async () => {
      const user = { profileid: 'user123' };
      const resourceOwnerId = 'user456';
      
      const mockResolver = jest.fn().mockImplementation(() => {
        requireOwnership(user, resourceOwnerId);
        return { message: 'Access granted' };
      });
      
      const wrappedResolver = asyncHandler(mockResolver);
      
      await expect(wrappedResolver()).rejects.toThrow(AuthorizationError);
    });
  });
});