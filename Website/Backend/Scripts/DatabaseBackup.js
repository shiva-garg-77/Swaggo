/**
 * 🔄 DATABASE BACKUP STRATEGY
 * 
 * Automated backup system for MongoDB with:
 * - Scheduled daily backups
 * - Incremental backup support
 * - Compression and encryption
 * - Backup rotation and cleanup
 * - Recovery procedures
 * - Health monitoring
 */

import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import databaseManager from '../Config/Database.js';

const execAsync = promisify(exec);

class DatabaseBackup {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.maxBackups = parseInt(process.env.MAX_BACKUPS) || 7; // Keep 7 days
    this.compressionEnabled = process.env.BACKUP_COMPRESSION !== 'false';
    this.encryptionEnabled = process.env.BACKUP_ENCRYPTION === 'true';
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    
    // Ensure backup directory exists
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Get MongoDB URI for backup
   */
  getMongoUri() {
    const possibleUris = [
      process.env.MONGODB_URI,
      process.env.MONGOURI,
      process.env.MONGO_URI
    ];
    
    return possibleUris.find(uri => uri && uri.trim());
  }

  /**
   * Generate backup filename
   */
  generateBackupFilename(type = 'full') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hostname = process.env.HOSTNAME || 'localhost';
    return `swaggo-${type}-${hostname}-${timestamp}`;
  }

  /**
   * Create full database backup using mongodump
   */
  async createFullBackup() {
    console.log('🔄 Starting full database backup...');
    
    const mongoUri = this.getMongoUri();
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured for backup');
    }

    const backupName = this.generateBackupFilename('full');
    const backupPath = path.join(this.backupDir, backupName);
    
    try {
      // Get database stats before backup
      await databaseManager.connect();
      const stats = await databaseManager.getDatabaseStats();
      console.log(`📊 Database size: ${(stats.database?.dataSize / (1024 * 1024)).toFixed(2)} MB`);

      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

      // Build mongodump command
      let dumpCommand = `mongodump --uri="${mongoUri}" --out="${backupPath}"`;
      
      // Add additional options
      dumpCommand += ' --verbose';
      
      console.log('🚀 Executing backup command...');
      const startTime = Date.now();
      
      // Execute backup
      const { stdout, stderr } = await execAsync(dumpCommand);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✅ Backup completed in ${duration} seconds`);
      
      // Compress backup if enabled
      if (this.compressionEnabled) {
        await this.compressBackup(backupPath);
      }
      
      // Encrypt backup if enabled
      if (this.encryptionEnabled && this.encryptionKey) {
        await this.encryptBackup(backupPath);
      }
      
      // Get backup size
      const backupSize = await this.getBackupSize(backupPath);
      
      const backupInfo = {
        name: backupName,
        type: 'full',
        path: backupPath,
        timestamp: new Date(),
        duration,
        size: backupSize,
        compressed: this.compressionEnabled,
        encrypted: this.encryptionEnabled,
        databaseStats: stats
      };
      
      // Save backup metadata
      await this.saveBackupMetadata(backupInfo);
      
      console.log(`📦 Backup saved: ${backupName} (${(backupSize / (1024 * 1024)).toFixed(2)} MB)`);
      
      return backupInfo;
      
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      
      // Cleanup failed backup
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      
      throw error;
    }
  }

  /**
   * Create incremental backup (changes since last backup)
   */
  async createIncrementalBackup() {
    console.log('🔄 Starting incremental backup...');
    
    const lastBackup = await this.getLastBackupInfo();
    if (!lastBackup) {
      console.log('ℹ️  No previous backup found, creating full backup instead');
      return await this.createFullBackup();
    }
    
    const mongoUri = this.getMongoUri();
    const backupName = this.generateBackupFilename('incremental');
    const backupPath = path.join(this.backupDir, backupName);
    
    try {
      fs.mkdirSync(backupPath, { recursive: true });
      
      // Query for changes since last backup
      const lastBackupTime = new Date(lastBackup.timestamp);
      
      // Build query for changed documents
      const query = JSON.stringify({
        $or: [
          { updatedAt: { $gt: lastBackupTime } },
          { createdAt: { $gt: lastBackupTime } }
        ]
      });
      
      // Backup changed collections
      const collections = ['users', 'profiles', 'chats', 'messages', 'notifications'];
      
      for (const collection of collections) {
        try {
          const collectionPath = path.join(backupPath, collection);
          fs.mkdirSync(collectionPath, { recursive: true });
          
          const dumpCommand = `mongodump --uri="${mongoUri}" --collection="${collection}" --query='${query}' --out="${backupPath}"`;
          
          await execAsync(dumpCommand);
          console.log(`  ✅ Backed up changes in ${collection}`);
        } catch (error) {
          console.warn(`  ⚠️  Failed to backup ${collection}:`, error.message);
        }
      }
      
      const backupSize = await this.getBackupSize(backupPath);
      
      const backupInfo = {
        name: backupName,
        type: 'incremental',
        path: backupPath,
        timestamp: new Date(),
        size: backupSize,
        basedOn: lastBackup.name,
        compressed: this.compressionEnabled,
        encrypted: this.encryptionEnabled
      };
      
      await this.saveBackupMetadata(backupInfo);
      
      console.log(`📦 Incremental backup saved: ${backupName} (${(backupSize / (1024 * 1024)).toFixed(2)} MB)`);
      
      return backupInfo;
      
    } catch (error) {
      console.error('❌ Incremental backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Compress backup directory
   */
  async compressBackup(backupPath) {
    console.log('🗜️  Compressing backup...');
    
    try {
      const tarFile = `${backupPath}.tar.gz`;
      const command = `tar -czf "${tarFile}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`;
      
      await execAsync(command);
      
      // Remove uncompressed directory
      fs.rmSync(backupPath, { recursive: true, force: true });
      
      console.log(`✅ Backup compressed: ${path.basename(tarFile)}`);
      
      return tarFile;
    } catch (error) {
      console.error('❌ Compression failed:', error.message);
      throw error;
    }
  }

  /**
   * Encrypt backup file
   */
  async encryptBackup(backupPath) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not provided');
    }
    
    console.log('🔐 Encrypting backup...');
    
    try {
      const inputFile = fs.existsSync(`${backupPath}.tar.gz`) ? `${backupPath}.tar.gz` : backupPath;
      const outputFile = `${inputFile}.enc`;
      
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', key);
      
      const inputStream = fs.createReadStream(inputFile);
      const outputStream = fs.createWriteStream(outputFile);
      
      // Write IV to beginning of encrypted file
      outputStream.write(iv);
      
      return new Promise((resolve, reject) => {
        inputStream
          .pipe(cipher)
          .pipe(outputStream)
          .on('finish', () => {
            // Remove unencrypted file
            fs.unlinkSync(inputFile);
            console.log(`✅ Backup encrypted: ${path.basename(outputFile)}`);
            resolve(outputFile);
          })
          .on('error', reject);
      });
      
    } catch (error) {
      console.error('❌ Encryption failed:', error.message);
      throw error;
    }
  }

  /**
   * Get backup directory size
   */
  async getBackupSize(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) return 0;
      
      const stats = fs.statSync(backupPath);
      if (stats.isFile()) {
        return stats.size;
      }
      
      // Calculate directory size recursively
      let totalSize = 0;
      const files = fs.readdirSync(backupPath);
      
      for (const file of files) {
        const filePath = path.join(backupPath, file);
        const fileStats = fs.statSync(filePath);
        
        if (fileStats.isDirectory()) {
          totalSize += await this.getBackupSize(filePath);
        } else {
          totalSize += fileStats.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating backup size:', error);
      return 0;
    }
  }

  /**
   * Save backup metadata
   */
  async saveBackupMetadata(backupInfo) {
    const metadataPath = path.join(this.backupDir, 'backup-metadata.json');
    
    let metadata = [];
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    
    metadata.push(backupInfo);
    
    // Keep only recent metadata
    metadata = metadata
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, this.maxBackups * 2); // Keep more metadata than backups
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Get last backup info
   */
  async getLastBackupInfo() {
    const metadataPath = path.join(this.backupDir, 'backup-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return null;
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    return metadata.length > 0 ? metadata[0] : null;
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups() {
    console.log('🧹 Cleaning up old backups...');
    
    const metadataPath = path.join(this.backupDir, 'backup-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return;
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const sortedBackups = metadata.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const backupsToDelete = sortedBackups.slice(this.maxBackups);
    let deletedCount = 0;
    let freedSpace = 0;
    
    for (const backup of backupsToDelete) {
      try {
        if (fs.existsSync(backup.path)) {
          const backupSize = await this.getBackupSize(backup.path);
          
          if (fs.statSync(backup.path).isDirectory()) {
            fs.rmSync(backup.path, { recursive: true, force: true });
          } else {
            fs.unlinkSync(backup.path);
          }
          
          freedSpace += backupSize;
          deletedCount++;
          
          console.log(`  🗑️  Deleted old backup: ${backup.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to delete backup ${backup.name}:`, error.message);
      }
    }
    
    // Update metadata
    const remainingMetadata = sortedBackups.slice(0, this.maxBackups);
    fs.writeFileSync(metadataPath, JSON.stringify(remainingMetadata, null, 2));
    
    console.log(`✅ Cleanup completed: ${deletedCount} backups deleted, ${(freedSpace / (1024 * 1024)).toFixed(2)} MB freed`);
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupName, targetDatabase = null) {
    console.log(`🔄 Restoring database from backup: ${backupName}`);
    
    const backupPath = path.join(this.backupDir, backupName);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupName}`);
    }
    
    const mongoUri = this.getMongoUri();
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured for restore');
    }
    
    try {
      // Build mongorestore command
      let restoreCommand = `mongorestore --uri="${mongoUri}"`;
      
      if (targetDatabase) {
        restoreCommand += ` --db="${targetDatabase}"`;
      }
      
      restoreCommand += ` --drop "${backupPath}"`;
      
      console.log('🚀 Executing restore command...');
      const startTime = Date.now();
      
      const { stdout, stderr } = await execAsync(restoreCommand);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✅ Database restored in ${duration} seconds`);
      
      return {
        success: true,
        backup: backupName,
        duration,
        targetDatabase
      };
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw error;
    }
  }

  /**
   * List all available backups
   */
  async listBackups() {
    const metadataPath = path.join(this.backupDir, 'backup-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return [];
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    return metadata.map(backup => ({
      name: backup.name,
      type: backup.type,
      timestamp: backup.timestamp,
      size: backup.size,
      sizeMB: (backup.size / (1024 * 1024)).toFixed(2),
      compressed: backup.compressed,
      encrypted: backup.encrypted,
      duration: backup.duration
    }));
  }

  /**
   * Get backup health status
   */
  async getBackupHealth() {
    const backups = await this.listBackups();
    const lastBackup = backups[0];
    
    const health = {
      status: 'unknown',
      lastBackup: lastBackup ? lastBackup.timestamp : null,
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + (b.size || 0), 0),
      oldestBackup: backups[backups.length - 1]?.timestamp || null,
      warnings: []
    };
    
    // Check backup recency
    if (!lastBackup) {
      health.status = 'critical';
      health.warnings.push('No backups found');
    } else {
      const lastBackupAge = Date.now() - new Date(lastBackup.timestamp).getTime();
      const hoursOld = lastBackupAge / (1000 * 60 * 60);
      
      if (hoursOld > 48) {
        health.status = 'critical';
        health.warnings.push(`Last backup is ${hoursOld.toFixed(1)} hours old`);
      } else if (hoursOld > 24) {
        health.status = 'warning';
        health.warnings.push(`Last backup is ${hoursOld.toFixed(1)} hours old`);
      } else {
        health.status = 'healthy';
      }
    }
    
    return health;
  }

  /**
   * Schedule automatic backups
   */
  scheduleBackups() {
    // Daily full backup at 2 AM
    const dailyBackup = () => {
      this.createFullBackup()
        .then(() => this.cleanupOldBackups())
        .catch(error => console.error('Scheduled backup failed:', error));
    };
    
    // Calculate time until next 2 AM
    const now = new Date();
    const nextBackup = new Date();
    nextBackup.setHours(2, 0, 0, 0);
    
    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }
    
    const timeUntilBackup = nextBackup.getTime() - now.getTime();
    
    console.log(`⏰ Next scheduled backup: ${nextBackup.toISOString()}`);
    
    // Set initial timeout
    setTimeout(() => {
      dailyBackup();
      
      // Then run daily
      setInterval(dailyBackup, 24 * 60 * 60 * 1000);
    }, timeUntilBackup);
  }
}

// Export the backup system
export default DatabaseBackup;

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const backup = new DatabaseBackup();
  const command = process.argv[2];
  
  switch (command) {
    case 'full':
      backup.createFullBackup()
        .then(info => {
          console.log(`\n🎉 Full backup completed: ${info.name}`);
          process.exit(0);
        })
        .catch(error => {
          console.error('\n💥 Backup failed:', error);
          process.exit(1);
        });
      break;
      
    case 'incremental':
      backup.createIncrementalBackup()
        .then(info => {
          console.log(`\n🎉 Incremental backup completed: ${info.name}`);
          process.exit(0);
        })
        .catch(error => {
          console.error('\n💥 Backup failed:', error);
          process.exit(1);
        });
      break;
      
    case 'cleanup':
      backup.cleanupOldBackups()
        .then(() => {
          console.log('\n🎉 Cleanup completed');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n💥 Cleanup failed:', error);
          process.exit(1);
        });
      break;
      
    case 'list':
      backup.listBackups()
        .then(backups => {
          console.log('\n📋 Available backups:');
          backups.forEach(b => {
            console.log(`  ${b.name} (${b.type}, ${b.sizeMB} MB) - ${b.timestamp}`);
          });
          process.exit(0);
        })
        .catch(error => {
          console.error('\n💥 Failed to list backups:', error);
          process.exit(1);
        });
      break;
      
    case 'health':
      backup.getBackupHealth()
        .then(health => {
          console.log('\n🏥 Backup health:', health);
          process.exit(0);
        })
        .catch(error => {
          console.error('\n💥 Health check failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
🔄 Database Backup Tool

Usage: node DatabaseBackup.js <command>

Commands:
  full        - Create full database backup
  incremental - Create incremental backup
  cleanup     - Clean up old backups
  list        - List available backups
  health      - Check backup health

Environment Variables:
  BACKUP_DIR              - Backup directory (default: ./backups)
  MAX_BACKUPS            - Maximum backups to keep (default: 7)
  BACKUP_COMPRESSION     - Enable compression (default: true)
  BACKUP_ENCRYPTION      - Enable encryption (default: false)
  BACKUP_ENCRYPTION_KEY  - Encryption key (required if encryption enabled)
      `);
      process.exit(0);
  }
}