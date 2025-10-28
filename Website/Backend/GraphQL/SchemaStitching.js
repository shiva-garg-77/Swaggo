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

console.log("🔍 [TRACKING] SchemaStitching: Loading @graphql-tools/merge...");
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
console.log("🔍 [TRACKING] SchemaStitching: Loading @graphql-tools/schema...");
import { makeExecutableSchema } from "@graphql-tools/schema";
console.log(
  "🔍 [TRACKING] SchemaStitching: Loading @graphql-tools/load-files...",
);
import { loadFiles } from "@graphql-tools/load-files";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { pathToFileURL } from "url";
console.log("🔍 [TRACKING] SchemaStitching: Loading graphql-tag...");
import { gql } from "graphql-tag";
console.log("✅ [TRACKING] SchemaStitching: All imports loaded");
import winston from "winston";
import GraphQLService from "./services/GraphQLService.js";

// Create a logger instance
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "schema-stitching" },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Helpers for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load all schema files from the schemas directory
 * @returns {Array} Array of loaded schema definitions
 */
const loadSchemaFiles = async () => {
  try {
    const schemasDir = path.join(__dirname, "schemas");
    logger.info("Looking for schema files in:", { schemasDir });

    // Check if directory exists
    if (!fs.existsSync(schemasDir)) {
      logger.error("Schemas directory does not exist", { schemasDir });
      return [];
    }

    // Read all .graphql files directly
    const files = fs
      .readdirSync(schemasDir)
      .filter((file) => path.extname(file) === ".graphql")
      .map((file) => {
        try {
          const filePath = path.join(schemasDir, file);
          logger.debug("Reading schema file:", { file, filePath });

          // Add file size check to prevent reading extremely large files
          const stats = fs.statSync(filePath);
          if (stats.size > 10 * 1024 * 1024) {
            // 10MB limit
            logger.error("Schema file too large - skipping", {
              file,
              size: stats.size,
              maxSize: 10 * 1024 * 1024,
            });
            return null;
          }

          return fs.readFileSync(filePath, "utf8");
        } catch (fileError) {
          logger.error("Error reading schema file", {
            file,
            error: fileError.message,
            stack: fileError.stack,
            code: fileError.code,
          });

          // Provide more specific error messages based on error type
          if (fileError.code === "ENOENT") {
            logger.error("Schema file not found - check if file exists", {
              file,
            });
          } else if (fileError.code === "EACCES") {
            logger.error("Permission denied when reading schema file", {
              file,
            });
          } else if (fileError.message.includes("too large")) {
            logger.error(
              "Schema file too large - consider splitting into smaller files",
              { file },
            );
          }

          return null;
        }
      })
      .filter(Boolean); // Remove null entries

    logger.info("Found schema files:", { count: files.length });

    if (files.length === 0) {
      logger.warn("No .graphql files found in schemas directory", {
        schemasDir,
      });
      return [];
    }

    logger.info(`✅ Loaded ${files.length} GraphQL schema files`);
    return files;
  } catch (error) {
    logger.error("❌ Error loading schema files", {
      error: error.message,
      stack: error.stack,
    });
    return [];
  }
};

/**
 * Load all resolver files from the resolvers directory
 * @returns {Array} Array of loaded resolver definitions
 */
const loadResolverFiles = async () => {
  try {
    const resolversDir = path.join(__dirname, "resolvers");
    logger.info("Looking for resolver files in:", { resolversDir });

    // Check if directory exists
    if (!fs.existsSync(resolversDir)) {
      logger.error("Resolvers directory does not exist", { resolversDir });
      return [];
    }

    // Get all .js files and filter out duplicates to prevent schema conflicts
    const jsFiles = fs
      .readdirSync(resolversDir)
      .filter((file) => path.extname(file) === ".js")
      .filter((file) => {
        // ⚠️ CRITICAL FIX: Disable duplicate resolver files that cause schema conflicts
        const disabledFiles = [
          "complete-remaining.resolvers.js", // Has schema mismatches - temporarily disabled
          "enhanced.resolvers.js", // Has schema mismatches - temporarily disabled
        ];

        if (disabledFiles.includes(file)) {
          logger.warn(`⚠️  Skipping duplicate resolver file: ${file}`);
          console.log(`⚠️  [SCHEMA CONFLICT PREVENTION] Skipping: ${file}`);
          return false;
        }

        return true;
      });

    logger.info("✅ Enabled resolver files (duplicates filtered):", {
      count: jsFiles.length,
      files: jsFiles,
    });
    console.log("✅ [SCHEMA STITCHING] Loading resolver files:", jsFiles);

    // Import all .js files directly with enhanced error handling
    const importPromises = jsFiles.map(async (file) => {
      try {
        const modulePath = pathToFileURL(path.join(resolversDir, file)).href;
        console.log(`🔍 [TRACKING] Importing resolver: ${file}`);
        logger.debug("Importing resolver module:", { file, modulePath });

        // Add timeout for import operation
        const importPromise = import(modulePath);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Import timeout for ${file}`)),
            10000,
          ),
        );

        const module = await Promise.race([importPromise, timeoutPromise]);
        logger.debug("Successfully imported resolver module:", { file });
        return module;
      } catch (importError) {
        logger.error("Error importing resolver file", {
          file,
          error: importError.message,
          stack: importError.stack,
          code: importError.code,
          name: importError.name,
        });

        // Provide more specific error messages based on error type
        if (importError.code === "ERR_MODULE_NOT_FOUND") {
          logger.error(
            "Module not found - check if file exists and exports correctly",
            { file },
          );
        } else if (importError.name === "SyntaxError") {
          logger.error(
            "Syntax error in resolver file - check for valid JavaScript",
            { file },
          );
        } else if (importError.message.includes("timeout")) {
          logger.error(
            "Import operation timed out - file may be too large or have circular dependencies",
            { file },
          );
        }

        return null;
      }
    });

    // Wait for all imports to complete
    const importedModules = await Promise.all(importPromises);

    // Filter out failed imports and extract default exports
    const resolvers = importedModules
      .filter((module) => module && module.default)
      .map((module) => module.default);

    logger.info("Successfully loaded resolver files:", {
      count: resolvers.length,
    });

    if (resolvers.length === 0) {
      logger.warn("No valid resolver modules found in resolvers directory", {
        resolversDir,
      });
      return [];
    }

    logger.info(`✅ Loaded ${resolvers.length} GraphQL resolver files`);
    return resolvers;
  } catch (error) {
    logger.error("❌ Error loading resolver files", {
      error: error.message,
      stack: error.stack,
    });
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
    logger.info("Merging schemas", { schemaCount: schemaFiles.length });

    const mergedSchema = mergeTypeDefs(schemaFiles, {
      useSchemaDefinition: true,
      forceSchemaDefinition: true,
      throwOnConflict: true,
      commentDescriptions: true,
      reverseDirectives: true,
    });

    logger.info("✅ Schemas merged successfully");
    return mergedSchema;
  } catch (error) {
    logger.error("❌ Error merging schemas", {
      error: error.message,
      stack: error.stack,
      schemaCount: schemaFiles.length,
    });

    // Provide more context about what might have caused the merge error
    if (error.message.includes("conflict")) {
      logger.error(
        "Schema conflict detected - check for duplicate type definitions",
      );
    } else if (error.message.includes("Syntax Error")) {
      logger.error("Schema syntax error - check GraphQL schema syntax");
    } else if (error.message.includes('Type "')) {
      logger.error(
        "Missing or invalid type definition - check type references",
      );
    }

    // Log individual schema files for debugging
    schemaFiles.forEach((schema, index) => {
      logger.debug(`Schema ${index}:`, {
        length: schema.length,
        preview: schema.substring(0, 100),
      });
    });

    throw new Error(`Schema merging failed: ${error.message}`);
  }
};

/**
 * Merge all resolver definitions into a single resolver map
 * @param {Array} resolverFiles - Array of resolver definitions
 * @returns {object} Merged resolver map
 */
const mergeResolversMap = (resolverFiles) => {
  try {
    logger.info("Merging resolvers", { resolverCount: resolverFiles.length });

    const mergedResolvers = mergeResolvers(resolverFiles);

    logger.info("✅ Resolvers merged successfully");
    return mergedResolvers;
  } catch (error) {
    logger.error("❌ Error merging resolvers", {
      error: error.message,
      stack: error.stack,
      resolverCount: resolverFiles.length,
    });

    // Provide more context about what might have caused the merge error
    if (error.message.includes("conflict")) {
      logger.error(
        "Resolver conflict detected - check for duplicate resolver definitions",
      );
    } else if (
      error.message.includes("Cannot read property") ||
      error.message.includes("undefined")
    ) {
      logger.error(
        "Resolver structure error - check resolver exports and structure",
      );
    }

    // Log individual resolver files for debugging
    resolverFiles.forEach((resolver, index) => {
      logger.debug(`Resolver ${index}:`, {
        type: typeof resolver,
        keys: resolver ? Object.keys(resolver) : "null",
      });
    });

    throw new Error(`Resolver merging failed: ${error.message}`);
  }
};

/**
 * Create stitched schema from modular components
 * @returns {object} Object containing executable GraphQL schema
 */
export const createStitchedSchema = async () => {
  try {
    logger.info("🔄 Starting GraphQL schema stitching process...");
    console.log("🔍 [TRACKING] Creating stitched schema...");

    // Load schema files
    const schemaFiles = await loadSchemaFiles();
    if (schemaFiles.length === 0) {
      const error = new Error("No schema files found for stitching");
      logger.error("Schema stitching failed", { error: error.message });
      throw error;
    }

    // Load resolver files
    const resolverFiles = await loadResolverFiles();
    if (resolverFiles.length === 0) {
      const error = new Error("No resolver files found for stitching");
      logger.error("Schema stitching failed", { error: error.message });
      throw error;
    }

    // Merge schemas
    const mergedSchema = mergeSchemas(schemaFiles);
    console.log("✅ [TRACKING] Schemas merged successfully");

    // Merge resolvers
    const mergedResolvers = mergeResolversMap(resolverFiles);
    console.log("✅ [TRACKING] Resolvers merged successfully");

    // 🔥 CRITICAL FIX: Build executable schema using @graphql-tools/schema
    // This ensures the SAME graphql instance is used throughout the entire schema creation
    console.log(
      "🔍 [TRACKING] Building executable schema with makeExecutableSchema...",
    );
    const executableSchema = makeExecutableSchema({
      typeDefs: mergedSchema,
      resolvers: mergedResolvers,
    });
    console.log(
      "✅ [TRACKING] Executable schema built successfully - Single GraphQL realm enforced!",
    );

    logger.info(
      "✅ GraphQL schema stitching completed successfully with executable schema",
    );

    // Return the executable schema instead of raw typeDefs and resolvers
    return {
      schema: executableSchema,
      typeDefs: mergedSchema, // Keep for backward compatibility
      resolvers: mergedResolvers, // Keep for backward compatibility
    };
  } catch (error) {
    logger.error("❌ GraphQL schema stitching failed", {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    console.error("❌ [TRACKING] Schema creation error:", error.message);

    // Provide more specific error messages based on error type
    if (error.code === "MODULE_NOT_FOUND") {
      logger.error("Missing module dependency - check package.json");
    } else if (error.name === "SyntaxError") {
      logger.error("Syntax error in schema or resolver files");
    } else if (error.message.includes("timeout")) {
      logger.error("Operation timeout - check system resources");
    }

    // Re-throw with more context
    throw new Error(`GraphQL schema stitching failed: ${error.message}`);
  }
};

/**
 * Get schema stitching statistics
 * @returns {object} Statistics about the schema stitching process
 */
export const getStitchingStats = async () => {
  try {
    const schemasDir = path.join(__dirname, "schemas");
    const resolversDir = path.join(__dirname, "resolvers");

    const schemaFiles = fs.existsSync(schemasDir)
      ? fs
          .readdirSync(schemasDir)
          .filter((file) => path.extname(file) === ".graphql")
      : [];

    const resolverFiles = fs.existsSync(resolversDir)
      ? fs
          .readdirSync(resolversDir)
          .filter((file) => path.extname(file) === ".js")
      : [];

    logger.info("Stitching stats collected", {
      schemaFiles: schemaFiles.length,
      resolverFiles: resolverFiles.length,
    });

    return {
      schemaFiles: schemaFiles.length,
      resolverFiles: resolverFiles.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("❌ Error getting stitching stats", {
      error: error.message,
      stack: error.stack,
    });
    return {
      schemaFiles: 0,
      resolverFiles: 0,
      error: error.message,
    };
  }
};

export default {
  createStitchedSchema,
  getStitchingStats,
};
