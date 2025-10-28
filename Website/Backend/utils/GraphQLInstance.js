/**
 * @fileoverview Centralized GraphQL Instance Manager
 * @module GraphQLInstance
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Provides a singleton instance of GraphQL to ensure only one instance is used
 * throughout the application. This prevents the "Cannot use GraphQLScalarType
 * from another module or realm" error by guaranteeing all modules use the same
 * GraphQL instance.
 * 
 * CRITICAL: This module MUST be imported before any other GraphQL-related imports
 * to ensure the singleton pattern is established first.
 */

import * as graphql from 'graphql';
import winston from 'winston';

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'graphql-instance' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Singleton GraphQL instance manager
 * Ensures only one instance of GraphQL is used throughout the application
 * CRITICAL: This must be the ONLY place where 'graphql' module is imported
 */
class GraphQLInstanceManager {
  constructor() {
    if (GraphQLInstanceManager.instance) {
      return GraphQLInstanceManager.instance;
    }

    // Verify that graphql module is loaded correctly
    if (!graphql || !graphql.GraphQLScalarType) {
      throw new Error('GraphQL module failed to load correctly');
    }

    // Store the GraphQL instance
    this.graphql = graphql;
    this.GraphQLScalarType = graphql.GraphQLScalarType;
    this.GraphQLError = graphql.GraphQLError;
    this.GraphQLObjectType = graphql.GraphQLObjectType;
    this.GraphQLInterfaceType = graphql.GraphQLInterfaceType;
    this.GraphQLUnionType = graphql.GraphQLUnionType;
    this.GraphQLEnumType = graphql.GraphQLEnumType;
    this.GraphQLInputObjectType = graphql.GraphQLInputObjectType;
    this.GraphQLList = graphql.GraphQLList;
    this.GraphQLNonNull = graphql.GraphQLNonNull;
    this.GraphQLSchema = graphql.GraphQLSchema;
    this.Kind = graphql.Kind;
    this.validateSchema = graphql.validateSchema;
    this.buildSchema = graphql.buildSchema;
    this.parse = graphql.parse;
    this.print = graphql.print;
    this.execute = graphql.execute;
    this.subscribe = graphql.subscribe;
    this.validate = graphql.validate;
    this.specifiedRules = graphql.specifiedRules;

    // Mark as initialized
    this.initialized = true;
    this.initializationTime = new Date().toISOString();

    logger.info('✅ GraphQL Instance Manager initialized', {
      timestamp: this.initializationTime,
      graphqlVersion: graphql.versionInfo?.major + '.' + graphql.versionInfo?.minor + '.' + graphql.versionInfo?.patch
    });

    GraphQLInstanceManager.instance = this;
  }

  /**
   * Get the singleton GraphQL instance
   * @returns {object} The GraphQL module instance
   */
  getInstance() {
    return this.graphql;
  }

  /**
   * Get a specific GraphQL type or function
   * @param {string} name - Name of the GraphQL export
   * @returns {*} The requested GraphQL export
   */
  get(name) {
    if (!this.graphql[name]) {
      logger.warn('Requested GraphQL export not found', { name });
      return undefined;
    }
    return this.graphql[name];
  }

  /**
   * Verify that the GraphQL instance is valid
   * @returns {boolean} True if instance is valid
   */
  isValid() {
    return (
      this.initialized &&
      this.graphql &&
      this.GraphQLScalarType &&
      this.GraphQLError &&
      this.GraphQLSchema
    );
  }

  /**
   * Get instance statistics
   * @returns {object} Statistics about the instance
   */
  getStats() {
    return {
      initialized: this.initialized,
      initializationTime: this.initializationTime,
      isValid: this.isValid(),
      exports: Object.keys(this.graphql).length
    };
  }
}

// Create and export the singleton instance
const graphqlInstance = new GraphQLInstanceManager();

// Verify instance is valid
if (!graphqlInstance.isValid()) {
  logger.error('❌ GraphQL Instance Manager failed validation');
  throw new Error('GraphQL Instance Manager initialization failed');
}

logger.info('✅ GraphQL Instance Manager ready for use');

export default graphqlInstance;

// Export all GraphQL types and functions from the singleton instance
export const GraphQLScalarType = graphqlInstance.GraphQLScalarType;
export const GraphQLError = graphqlInstance.GraphQLError;
export const GraphQLObjectType = graphqlInstance.GraphQLObjectType;
export const GraphQLInterfaceType = graphqlInstance.GraphQLInterfaceType;
export const GraphQLUnionType = graphqlInstance.GraphQLUnionType;
export const GraphQLEnumType = graphqlInstance.GraphQLEnumType;
export const GraphQLInputObjectType = graphqlInstance.GraphQLInputObjectType;
export const GraphQLList = graphqlInstance.GraphQLList;
export const GraphQLNonNull = graphqlInstance.GraphQLNonNull;
export const GraphQLSchema = graphqlInstance.GraphQLSchema;
export const Kind = graphqlInstance.Kind;
export const validateSchema = graphqlInstance.validateSchema;
export const buildSchema = graphqlInstance.buildSchema;
export const parse = graphqlInstance.parse;
export const print = graphqlInstance.print;
export const execute = graphqlInstance.execute;
export const subscribe = graphqlInstance.subscribe;
export const validate = graphqlInstance.validate;
export const specifiedRules = graphqlInstance.specifiedRules;
