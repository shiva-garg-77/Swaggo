/**
 * Restore Backup Script
 * 
 * Command-line script to restore backups
 */

import backupService from '../Services/Backup/BackupService.js';

async function restoreBackup() {
  const backupId = process.argv[2];
  
  if (!backupId) {
    console.error('❌ Please provide a backup ID to restore');
    console.log('Usage: node scripts/restore-backup.js <backup-id>');
    process.exit(1);
  }
  
  try {
    console.log(`🔄 Restoring backup ${backupId}...`);
    
    const result = await backupService.restoreBackup(backupId);
    
    console.log('✅ Backup restored successfully!');
    console.log('Backup ID:', result.backupId);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup restoration failed:', error.message);
    process.exit(1);
  }
}

// Run backup restoration
restoreBackup();