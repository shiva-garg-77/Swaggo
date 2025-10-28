import { GraphQLError } from './GraphQLInstance.js';
import { logger } from '../utils/SanitizedLogger.js';
import StandardizedErrorHandling from './StandardizedErrorHandling.js';

/**
 * Unified Error Handling System
 * Standardizes error handling across GraphQL, REST APIs, and Socket.IO
 */

// Export all standardized error handling components
export const {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ERROR_TYPES,
  ERROR_SEVERITY,
  RECOVERY_ACTIONS,
  HTTP_STATUS_CODES,
  APIResponse,
  handleUnifiedError,
  asyncHandler,
  logError,
  sendSuccess,
  sendError
} = StandardizedErrorHandling;

export default StandardizedErrorHandling;
