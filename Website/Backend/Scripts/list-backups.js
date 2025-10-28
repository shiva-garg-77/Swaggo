/**
 * List Backups Script
 * 
 * Command-line script to list backups
 */

import backupService from '../Services/Backup/BackupService.js';

async function listBackups() {
  try {
    console.log('🔄 Listing backups...');
    
    const backups = await backupService.listBackups();
    
    if (backups.length === 0) {
      console.log('No backups found');
      process.exit(0);
    }
    
    console.log(`Found ${backups.length} backups:`);
    console.log('----------------------------------------');
    
    for (const backup of backups) {
      console.log(`ID: ${backup.metadata.id}`);
      console.log(`Type: ${backup.metadata.type}`);
      console.log(`Timestamp: ${backup.metadata.timestamp}`);
      console.log(`Size: ${backup.metadata.size} bytes`);
      console.log(`Duration: ${backup.metadata.duration} ms`);
      console.log('----------------------------------------');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to list backups:', error.message);
    process.exit(1);
  }
}

// Run backup listing
listBackups();