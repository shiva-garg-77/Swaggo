/**
 * Create Backup Script
 * 
 * Command-line script to create backups
 */

import backupService from '../Services/Backup/BackupService.js';

async function createBackup() {
  try {
    console.log('🔄 Creating backup...');
    
    const result = await backupService.createFullBackup({
      scheduled: false,
      initiatedBy: 'cli'
    });
    
    console.log('✅ Backup created successfully!');
    console.log('Backup ID:', result.backupId);
    console.log('Backup Path:', result.path);
    console.log('Duration:', result.metadata.duration, 'ms');
    console.log('Size:', result.metadata.size, 'bytes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup creation failed:', error.message);
    process.exit(1);
  }
}

// Run backup creation
createBackup();