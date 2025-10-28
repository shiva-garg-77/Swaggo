/**
 * @fileoverview GraphQL Constants - Shared constants for GraphQL operations
 * @module GraphQLConstants
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Defines shared constants used throughout GraphQL operations:
 * - Default limits and constraints
 * - Error codes and messages
 * - Operation types
 * - Field names
 */

// Query complexity limits
export const QUERY_COMPLEXITY = {
  MAX_DEPTH: 15,
  MAX_COMPLEXITY: 1000,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100
};

// Common field names
export const FIELD_NAMES = {
  ID: 'id',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  PROFILE_ID: 'profileid',
  CHAT_ID: 'chatid',
  MESSAGE_ID: 'messageid',
  SENDER_ID: 'senderid'
};

// Operation types
export const OPERATION_TYPES = {
  QUERY: 'query',
  MUTATION: 'mutation',
  SUBSCRIPTION: 'subscription'
};

// Error codes
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// Common GraphQL types
export const GRAPHQL_TYPES = {
  STRING: 'String',
  INT: 'Int',
  BOOLEAN: 'Boolean',
  ID: 'ID',
  DATE: 'Date',
  DATETIME: 'DateTime',
  JSON: 'JSON',
  URL: 'URL'
};

// Subscription triggers
export const SUBSCRIPTION_TRIGGERS = {
  MESSAGE_CREATED: 'MESSAGE_CREATED',
  MESSAGE_UPDATED: 'MESSAGE_UPDATED',
  MESSAGE_DELETED: 'MESSAGE_DELETED',
  CHAT_CREATED: 'CHAT_CREATED',
  CHAT_UPDATED: 'CHAT_UPDATED',
  CHAT_DELETED: 'CHAT_DELETED',
  TYPING_INDICATOR: 'TYPING_INDICATOR',
  USER_PRESENCE: 'USER_PRESENCE',
  CHAT_TYPING: 'CHAT_TYPING'
};

// Default pagination values
export const PAGINATION_DEFAULTS = {
  LIMIT: 50,
  OFFSET: 0,
  MAX_LIMIT: 100
};

// Security settings
export const SECURITY_SETTINGS = {
  MAX_QUERY_DEPTH: 15,
  MAX_COMPLEXITY: 1000,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX: 1000 // requests per window
};

export default {
  QUERY_COMPLEXITY,
  FIELD_NAMES,
  OPERATION_TYPES,
  ERROR_CODES,
  GRAPHQL_TYPES,
  SUBSCRIPTION_TRIGGERS,
  PAGINATION_DEFAULTS,
  SECURITY_SETTINGS
};