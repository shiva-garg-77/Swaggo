/**
 * @fileoverview GraphQL Schema Stitching Configuration
 * @module SchemaStitching
 * @version 1.0.0
 * @author Swaggo Development Team
 * @since 1.0.0
 * 
 * @description
 * Implements GraphQL schema stitching to organize and modularize the GraphQL schema:
 * - Separates schemas into logical domains
 * - Enables better maintainability and scalability
 * - Provides centralized schema stitching configuration
 * - Supports future microservice GraphQL federation
 */

import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { loadFiles } from '@graphql-tools/load-files';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { gql } from 'graphql-tag';

// Helpers for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load all schema files from the schemas directory
 * @returns {Array} Array of loaded schema definitions
 */
const loadSchemaFiles = async () => {
  try {
    const schemasDir = path.join(__dirname, 'schemas');
    console.log('Looking for schema files in:', schemasDir);
    
    // Check if directory exists
    if (!fs.existsSync(schemasDir)) {
      console.error('Schemas directory does not exist:', schemasDir);
      return [];
    }
    
    // Read all .graphql files directly
    const files = fs.readdirSync(schemasDir)
      .filter(file => path.extname(file) === '.graphql')
      .map(file => fs.readFileSync(path.join(schemasDir, file), 'utf8'));
    
    console.log('Found schema files:', files.length);
    
    if (files.length === 0) {
      console.error('No .graphql files found in schemas directory');
      return [];
    }
    
    console.log(`✅ Loaded ${files.length} GraphQL schema files`);
    return files;
  } catch (error) {
    console.error('❌ Error loading schema files:', error);
    return [];
  }
};

/**
 * Load all resolver files from the resolvers directory
 * @returns {Array} Array of loaded resolver definitions
 */
const loadResolverFiles = async () => {
  try {
    const resolversDir = path.join(__dirname, 'resolvers');
    console.log('Looking for resolver files in:', resolversDir);
    
    // Check if directory exists
    if (!fs.existsSync(resolversDir)) {
      console.error('Resolvers directory does not exist:', resolversDir);
      return [];
    }
    
    // Import all .js files directly
    const files = fs.readdirSync(resolversDir)
      .filter(file => path.extname(file) === '.js')
      .map(file => {
        try {
          const modulePath = pathToFileURL(path.join(resolversDir, file)).href;
          console.log('Importing resolver module:', modulePath);
          return import(modulePath);
        } catch (error) {
          console.error(`Error importing ${file}:`, error);
          return null;
        }
      });
    
    // Wait for all imports to complete
    const importedModules = await Promise.all(files);
    
    // Extract default exports
    const resolvers = importedModules
      .filter(module => module && module.default)
      .map(module => module.default);
    
    console.log('Found resolver files:', resolvers.length);
    
    if (resolvers.length === 0) {
      console.error('No valid resolver modules found in resolvers directory');
      return [];
    }
    
    console.log(`✅ Loaded ${resolvers.length} GraphQL resolver files`);
    return resolvers;
  } catch (error) {
    console.error('❌ Error loading resolver files:', error);
    return [];
  }
};

/**
 * Merge all schema definitions into a single schema
 * @param {Array} schemaFiles - Array of schema definitions
 * @returns {string} Merged schema definition
 */
const mergeSchemas = (schemaFiles) => {
  try {
    const mergedSchema = mergeTypeDefs(schemaFiles, {
      useSchemaDefinition: true,
      forceSchemaDefinition: true,
      throwOnConflict: true,
      commentDescriptions: true,
      reverseDirectives: true
    });
    
    console.log('✅ Schemas merged successfully');
    return mergedSchema;
  } catch (error) {
    console.error('❌ Error merging schemas:', error);
    throw error;
  }
};

/**
 * Merge all resolver definitions into a single resolver map
 * @param {Array} resolverFiles - Array of resolver definitions
 * @returns {object} Merged resolver map
 */
const mergeResolversMap = (resolverFiles) => {
  try {
    const mergedResolvers = mergeResolvers(resolverFiles);
    
    console.log('✅ Resolvers merged successfully');
    return mergedResolvers;
  } catch (error) {
    console.error('❌ Error merging resolvers:', error);
    throw error;
  }
};

/**
 * Create stitched schema from modular components
 * @returns {object} Object containing merged schema and resolvers
 */
export const createStitchedSchema = async () => {
  try {
    console.log('🔄 Starting GraphQL schema stitching process...');
    
    // Load schema files
    const schemaFiles = await loadSchemaFiles();
    if (schemaFiles.length === 0) {
      throw new Error('No schema files found for stitching');
    }
    
    // Load resolver files
    const resolverFiles = await loadResolverFiles();
    if (resolverFiles.length === 0) {
      throw new Error('No resolver files found for stitching');
    }
    
    // Merge schemas
    const mergedSchema = mergeSchemas(schemaFiles);
    
    // Merge resolvers
    const mergedResolvers = mergeResolversMap(resolverFiles);
    
    console.log('✅ GraphQL schema stitching completed successfully');
    
    return {
      typeDefs: mergedSchema,
      resolvers: mergedResolvers
    };
  } catch (error) {
    console.error('❌ GraphQL schema stitching failed:', error);
    throw error;
  }
};

/**
 * Get schema stitching statistics
 * @returns {object} Statistics about the schema stitching process
 */
export const getStitchingStats = async () => {
  try {
    const schemasDir = path.join(__dirname, 'schemas');
    const resolversDir = path.join(__dirname, 'resolvers');
    
    const schemaFiles = fs.existsSync(schemasDir) ? 
      fs.readdirSync(schemasDir)
        .filter(file => path.extname(file) === '.graphql') : [];
    
    const resolverFiles = fs.existsSync(resolversDir) ? 
      fs.readdirSync(resolversDir)
        .filter(file => path.extname(file) === '.js') : [];
    
    return {
      schemaFiles: schemaFiles.length,
      resolverFiles: resolverFiles.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting stitching stats:', error);
    return {
      schemaFiles: 0,
      resolverFiles: 0,
      error: error.message
    };
  }
};

export default {
  createStitchedSchema,
  getStitchingStats
};