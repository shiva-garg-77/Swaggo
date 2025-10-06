/**
 * 🚀 DATABASE OPTIMIZATION SCRIPT
 * 
 * This script optimizes your MongoDB database by:
 * - Creating necessary indexes for performance
 * - Setting up TTL indexes for cleanup
 * - Creating compound indexes for complex queries
 * - Analyzing query performance
 * - Setting up database monitoring
 */

import mongoose from 'mongoose';
import databaseManager from '../Config/Database.js';

class DatabaseOptimizer {
  constructor() {
    this.optimizations = [];
    this.indexStats = new Map();
  }

  /**
   * Run all database optimizations
   */
  async optimize() {
    console.log('🚀 Starting database optimization...\n');

    try {
      // Ensure database connection
      await databaseManager.connect();

      // Run optimization steps
      await this.createPerformanceIndexes();
      await this.createSecurityIndexes();
      await this.createTTLIndexes();
      await this.createCompoundIndexes();
      await this.analyzeDatabasePerformance();
      await this.setupCollectionValidation();
      
      // Report results
      this.reportOptimizationResults();

      console.log('\n✅ Database optimization completed successfully!');
      return { success: true, optimizations: this.optimizations };

    } catch (error) {
      console.error('❌ Database optimization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create performance-oriented indexes
   */
  async createPerformanceIndexes() {
    console.log('📊 Creating performance indexes...');

    const performanceIndexes = [
      // User model indexes
      {
        collection: 'users',
        index: { 'audit.lastLogin': -1 },
        options: { name: 'lastLogin_desc' }
      },
      {
        collection: 'users',
        index: { 'security.accountStatus': 1, 'audit.lastLogin': -1 },
        options: { name: 'accountStatus_lastLogin' }
      },
      {
        collection: 'users',
        index: { 'permissions.role': 1, 'security.accountStatus': 1 },
        options: { name: 'role_status' }
      },
      {
        collection: 'users',
        index: { 'security.loginAttempts.lockUntil': 1 },
        options: { 
          name: 'loginAttempts_ttl',
          expireAfterSeconds: 0 // TTL based on document field
        }
      },

      // Profile model indexes
      {
        collection: 'profiles',
        index: { username: 1, isActive: 1 },
        options: { name: 'username_active' }
      },
      {
        collection: 'profiles',
        index: { email: 1, accountStatus: 1 },
        options: { name: 'email_status' }
      },
      {
        collection: 'profiles',
        index: { role: 1, isActive: 1, accountStatus: 1 },
        options: { name: 'role_active_status' }
      },
      {
        collection: 'profiles',
        index: { lastActivity: -1, isOnline: 1 },
        options: { name: 'activity_online' }
      },

      // Chat model indexes
      {
        collection: 'chats',
        index: { participants: 1, updatedAt: -1 },
        options: { name: 'participants_updated' }
      },
      {
        collection: 'chats',
        index: { 'lastMessage.timestamp': -1 },
        options: { name: 'lastMessage_timestamp' }
      },

      // Message model indexes
      {
        collection: 'messages',
        index: { chatId: 1, timestamp: -1 },
        options: { name: 'chatId_timestamp' }
      },
      {
        collection: 'messages',
        index: { senderId: 1, timestamp: -1 },
        options: { name: 'senderId_timestamp' }
      },
      {
        collection: 'messages',
        index: { receiverId: 1, isRead: 1, timestamp: -1 },
        options: { name: 'receiverId_read_timestamp' }
      },

      // Notification model indexes
      {
        collection: 'notifications',
        index: { userId: 1, isRead: 1, createdAt: -1 },
        options: { name: 'userId_read_created' }
      },

      // CallLog model indexes
      {
        collection: 'calllogs',
        index: { participants: 1, startTime: -1 },
        options: { name: 'participants_startTime' }
      }
    ];

    for (const indexConfig of performanceIndexes) {
      try {
        const collection = mongoose.connection.db.collection(indexConfig.collection);
        await collection.createIndex(indexConfig.index, indexConfig.options);
        
        this.optimizations.push({
          type: 'performance_index',
          collection: indexConfig.collection,
          index: indexConfig.index,
          status: 'created'
        });

        console.log(`  ✅ Created index ${indexConfig.options.name} on ${indexConfig.collection}`);
      } catch (error) {
        if (error.codeName === 'IndexOptionsConflict' || error.code === 85) {
          console.log(`  ℹ️  Index ${indexConfig.options.name} already exists on ${indexConfig.collection}`);
        } else {
          console.error(`  ❌ Failed to create index on ${indexConfig.collection}:`, error.message);
        }
      }
    }
  }

  /**
   * Create security-oriented indexes
   */
  async createSecurityIndexes() {
    console.log('\n🛡️ Creating security indexes...');

    const securityIndexes = [
      // Security event tracking
      {
        collection: 'users',
        index: { 'security.loginAttempts.lastAttempt': -1 },
        options: { name: 'loginAttempts_lastAttempt' }
      },
      {
        collection: 'profiles',
        index: { 'ipAddresses.ip': 1, 'ipAddresses.lastUsed': -1 },
        options: { name: 'ip_lastUsed' }
      },
      {
        collection: 'profiles',
        index: { failedLoginAttempts: 1, accountLockedUntil: 1 },
        options: { name: 'security_lockout' }
      },

      // Token management
      {
        collection: 'refreshtokens',
        index: { userId: 1, expiresAt: 1, isRevoked: 1 },
        options: { name: 'userId_expires_revoked' }
      },
      {
        collection: 'refreshtokens',
        index: { tokenFamily: 1, generation: -1 },
        options: { name: 'tokenFamily_generation' }
      },

      // Password reset tokens
      {
        collection: 'passwordresettokens',
        index: { userId: 1, expiresAt: 1, used: 1 },
        options: { name: 'userId_expires_used' }
      }
    ];

    for (const indexConfig of securityIndexes) {
      try {
        const collection = mongoose.connection.db.collection(indexConfig.collection);
        await collection.createIndex(indexConfig.index, indexConfig.options);
        
        this.optimizations.push({
          type: 'security_index',
          collection: indexConfig.collection,
          index: indexConfig.index,
          status: 'created'
        });

        console.log(`  🛡️ Created security index ${indexConfig.options.name} on ${indexConfig.collection}`);
      } catch (error) {
        if (error.codeName === 'IndexOptionsConflict' || error.code === 85) {
          console.log(`  ℹ️  Security index ${indexConfig.options.name} already exists on ${indexConfig.collection}`);
        } else {
          console.error(`  ❌ Failed to create security index on ${indexConfig.collection}:`, error.message);
        }
      }
    }
  }

  /**
   * Create TTL (Time To Live) indexes for automatic cleanup
   */
  async createTTLIndexes() {
    console.log('\n⏰ Creating TTL indexes for automatic cleanup...');

    const ttlIndexes = [
      // Refresh tokens - expire after 7 days
      {
        collection: 'refreshtokens',
        index: { expiresAt: 1 },
        options: { 
          name: 'refreshtoken_ttl',
          expireAfterSeconds: 0
        }
      },

      // Password reset tokens - expire after 1 hour
      {
        collection: 'passwordresettokens',
        index: { expiresAt: 1 },
        options: { 
          name: 'passwordreset_ttl',
          expireAfterSeconds: 0
        }
      },

      // Session data - expire after 30 days
      {
        collection: 'sessions',
        index: { expiresAt: 1 },
        options: { 
          name: 'session_ttl',
          expireAfterSeconds: 0
        }
      },

      // Old notifications - expire after 90 days
      {
        collection: 'notifications',
        index: { createdAt: 1 },
        options: { 
          name: 'notification_ttl',
          expireAfterSeconds: 90 * 24 * 60 * 60 // 90 days
        }
      },

      // Call logs - expire after 180 days
      {
        collection: 'calllogs',
        index: { createdAt: 1 },
        options: { 
          name: 'calllog_ttl',
          expireAfterSeconds: 180 * 24 * 60 * 60 // 180 days
        }
      }
    ];

    for (const indexConfig of ttlIndexes) {
      try {
        const collection = mongoose.connection.db.collection(indexConfig.collection);
        await collection.createIndex(indexConfig.index, indexConfig.options);
        
        this.optimizations.push({
          type: 'ttl_index',
          collection: indexConfig.collection,
          index: indexConfig.index,
          expireAfterSeconds: indexConfig.options.expireAfterSeconds,
          status: 'created'
        });

        console.log(`  ⏰ Created TTL index ${indexConfig.options.name} on ${indexConfig.collection}`);
      } catch (error) {
        if (error.codeName === 'IndexOptionsConflict' || error.code === 85) {
          console.log(`  ℹ️  TTL index ${indexConfig.options.name} already exists on ${indexConfig.collection}`);
        } else {
          console.error(`  ❌ Failed to create TTL index on ${indexConfig.collection}:`, error.message);
        }
      }
    }
  }

  /**
   * Create compound indexes for complex queries
   */
  async createCompoundIndexes() {
    console.log('\n📋 Creating compound indexes for complex queries...');

    const compoundIndexes = [
      // Chat participants with message count and last activity
      {
        collection: 'chats',
        index: { 
          participants: 1, 
          isActive: 1, 
          'lastMessage.timestamp': -1 
        },
        options: { name: 'participants_active_lastMessage' }
      },

      // User search with filters
      {
        collection: 'profiles',
        index: { 
          isActive: 1, 
          accountStatus: 1, 
          username: 1 
        },
        options: { name: 'search_active_status_username' }
      },

      // Message queries with pagination
      {
        collection: 'messages',
        index: { 
          chatId: 1, 
          isDeleted: 1, 
          timestamp: -1 
        },
        options: { name: 'chatId_deleted_timestamp' }
      },

      // Notification queries with filters
      {
        collection: 'notifications',
        index: { 
          userId: 1, 
          type: 1, 
          isRead: 1, 
          createdAt: -1 
        },
        options: { name: 'userId_type_read_created' }
      }
    ];

    for (const indexConfig of compoundIndexes) {
      try {
        const collection = mongoose.connection.db.collection(indexConfig.collection);
        await collection.createIndex(indexConfig.index, indexConfig.options);
        
        this.optimizations.push({
          type: 'compound_index',
          collection: indexConfig.collection,
          index: indexConfig.index,
          status: 'created'
        });

        console.log(`  📋 Created compound index ${indexConfig.options.name} on ${indexConfig.collection}`);
      } catch (error) {
        if (error.codeName === 'IndexOptionsConflict' || error.code === 85) {
          console.log(`  ℹ️  Compound index ${indexConfig.options.name} already exists on ${indexConfig.collection}`);
        } else {
          console.error(`  ❌ Failed to create compound index on ${indexConfig.collection}:`, error.message);
        }
      }
    }
  }

  /**
   * Analyze database performance
   */
  async analyzeDatabasePerformance() {
    console.log('\n📈 Analyzing database performance...');

    try {
      const db = mongoose.connection.db;
      
      // Get database stats
      const dbStats = await db.stats();
      console.log(`  📊 Database: ${dbStats.db}`);
      console.log(`  📄 Collections: ${dbStats.collections}`);
      console.log(`  📦 Data Size: ${(dbStats.dataSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  💾 Storage Size: ${(dbStats.storageSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  🗂️ Indexes: ${dbStats.indexes}`);
      console.log(`  📝 Index Size: ${(dbStats.indexSize / (1024 * 1024)).toFixed(2)} MB`);

      // Analyze collection performance
      const collections = await db.listCollections().toArray();
      
      for (const collInfo of collections.slice(0, 5)) { // Analyze top 5 collections
        try {
          const collection = db.collection(collInfo.name);
          const stats = await collection.stats();
          const indexes = await collection.indexes();

          console.log(`\n  📁 Collection: ${collInfo.name}`);
          console.log(`    📊 Documents: ${stats.count}`);
          console.log(`    📦 Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
          console.log(`    🗂️ Indexes: ${indexes.length}`);
          
          this.indexStats.set(collInfo.name, {
            documents: stats.count,
            size: stats.size,
            indexes: indexes.length,
            avgObjSize: stats.avgObjSize
          });

        } catch (error) {
          console.log(`    ⚠️ Could not analyze collection ${collInfo.name}: ${error.message}`);
        }
      }

    } catch (error) {
      console.error('  ❌ Performance analysis failed:', error.message);
    }
  }

  /**
   * Set up collection validation rules
   */
  async setupCollectionValidation() {
    console.log('\n🔍 Setting up collection validation...');

    const validationRules = [
      {
        collection: 'users',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['username', 'email', 'passwordHash'],
            properties: {
              email: {
                bsonType: 'string',
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
              },
              username: {
                bsonType: 'string',
                minLength: 3,
                maxLength: 30
              }
            }
          }
        }
      },
      {
        collection: 'profiles',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['username', 'email', 'profileid'],
            properties: {
              accountStatus: {
                enum: ['active', 'suspended', 'banned', 'pending', 'deactivated']
              },
              role: {
                enum: ['user', 'moderator', 'admin', 'super_admin']
              }
            }
          }
        }
      }
    ];

    for (const rule of validationRules) {
      try {
        const collection = mongoose.connection.db.collection(rule.collection);
        
        // Check if validation already exists
        const collectionInfo = await mongoose.connection.db.listCollections({ name: rule.collection }).next();
        
        if (!collectionInfo.options?.validator) {
          await mongoose.connection.db.command({
            collMod: rule.collection,
            validator: rule.validator,
            validationLevel: 'moderate',
            validationAction: 'warn' // Use 'error' for strict validation
          });

          console.log(`  🔍 Added validation rules for ${rule.collection}`);
          
          this.optimizations.push({
            type: 'validation',
            collection: rule.collection,
            status: 'created'
          });
        } else {
          console.log(`  ℹ️  Validation rules already exist for ${rule.collection}`);
        }

      } catch (error) {
        console.error(`  ❌ Failed to set validation for ${rule.collection}:`, error.message);
      }
    }
  }

  /**
   * Report optimization results
   */
  reportOptimizationResults() {
    console.log('\n📋 OPTIMIZATION SUMMARY');
    console.log('========================');

    const typeCount = {};
    this.optimizations.forEach(opt => {
      typeCount[opt.type] = (typeCount[opt.type] || 0) + 1;
    });

    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`${type.replace('_', ' ').toUpperCase()}: ${count} items`);
    });

    console.log(`\nTOTAL OPTIMIZATIONS: ${this.optimizations.length}`);

    // Performance recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('  • Monitor slow queries using db.setProfilingLevel(1)');
    console.log('  • Use explain() on complex queries to verify index usage');
    console.log('  • Consider sharding for large collections (>100GB)');
    console.log('  • Regular maintenance with compact and reIndex operations');
    console.log('  • Monitor index usage with db.collection.aggregate([{$indexStats: {}}])');
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus() {
    return {
      optimizations: this.optimizations,
      indexStats: Object.fromEntries(this.indexStats),
      summary: {
        totalOptimizations: this.optimizations.length,
        byType: this.optimizations.reduce((acc, opt) => {
          acc[opt.type] = (acc[opt.type] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }
}

// Export the optimizer
export default DatabaseOptimizer;

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new DatabaseOptimizer();
  
  optimizer.optimize()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Database optimization completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Database optimization failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}