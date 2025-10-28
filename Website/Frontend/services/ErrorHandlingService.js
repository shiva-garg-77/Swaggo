/**
 * Unified Error Handling Service
 * Standardizes error handling with consistent error types, recovery logic, and reporting
 */

import { EventEmitter } from 'events';
import notificationService from './NotificationService';
import standardizedErrorHandlingService, { 
  AppError as StandardizedAppError, 
  ERROR_TYPES as STANDARDIZED_ERROR_TYPES, 
  ERROR_SEVERITY as STANDARDIZED_ERROR_SEVERITY, 
  RECOVERY_ACTIONS as STANDARDIZED_RECOVERY_ACTIONS 
} from './StandardizedErrorHandlingService.js';

/**
 * Unified Error Handling Service
 * Standardizes error handling with consistent error types, recovery logic, and reporting
 * 
 * This service now wraps the StandardizedErrorHandlingService to maintain backward compatibility
 * while using the new unified error handling system across frontend and backend.
 */

// Export constants from standardized system for backward compatibility
export const ERROR_TYPES = STANDARDIZED_ERROR_TYPES;
export const ERROR_SEVERITY = STANDARDIZED_ERROR_SEVERITY;
export const RECOVERY_ACTIONS = STANDARDIZED_RECOVERY_ACTIONS;

// Export AppError class from standardized system
export const AppError = StandardizedAppError;

// Export the standardized service as the default
export default standardizedErrorHandlingService;
