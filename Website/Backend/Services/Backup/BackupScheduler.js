/**
 * 📅 BACKUP SCHEDULER
 * 
 * Automated backup scheduling service
 */

import cron from 'node-cron';
import backupService from './BackupService.js';

class BackupScheduler {
  constructor() {
    this.scheduledTasks = new Map();
    this.isEnabled = process.env.BACKUP_SCHEDULER_ENABLED !== 'false';
    
    if (this.isEnabled) {
      this.initializeScheduler();
    }
  }
  
  /**
   * Initialize backup scheduler
   */
  initializeScheduler() {
    try {
      console.log('📅 Initializing backup scheduler');
      
      // Schedule daily backup
      if (process.env.BACKUP_SCHEDULE_DAILY) {
        const dailyTask = cron.schedule(process.env.BACKUP_SCHEDULE_DAILY, async () => {
          console.log('🔄 Running scheduled daily backup');
          try {
            await backupService.createFullBackup({ scheduled: true });
          } catch (error) {
            console.error('❌ Scheduled daily backup failed:', error);
          }
        });
        
        this.scheduledTasks.set('daily', dailyTask);
        console.log('✅ Daily backup scheduled');
      }
      
      // Schedule weekly backup
      if (process.env.BACKUP_SCHEDULE_WEEKLY) {
        const weeklyTask = cron.schedule(process.env.BACKUP_SCHEDULE_WEEKLY, async () => {
          console.log('🔄 Running scheduled weekly backup');
          try {
            await backupService.createFullBackup({ scheduled: true });
          } catch (error) {
            console.error('❌ Scheduled weekly backup failed:', error);
          }
        });
        
        this.scheduledTasks.set('weekly', weeklyTask);
        console.log('✅ Weekly backup scheduled');
      }
      
      // Schedule monthly backup
      if (process.env.BACKUP_SCHEDULE_MONTHLY) {
        const monthlyTask = cron.schedule(process.env.BACKUP_SCHEDULE_MONTHLY, async () => {
          console.log('🔄 Running scheduled monthly backup');
          try {
            await backupService.createFullBackup({ scheduled: true });
          } catch (error) {
            console.error('❌ Scheduled monthly backup failed:', error);
          }
        });
        
        this.scheduledTasks.set('monthly', monthlyTask);
        console.log('✅ Monthly backup scheduled');
      }
      
      console.log('📅 Backup scheduler initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize backup scheduler:', error);
    }
  }
  
  /**
   * Start scheduler
   */
  start() {
    if (!this.isEnabled) {
      console.log('📅 Backup scheduler is disabled');
      return;
    }
    
    for (const [name, task] of this.scheduledTasks) {
      task.start();
      console.log(`✅ ${name} backup task started`);
    }
  }
  
  /**
   * Stop scheduler
   */
  stop() {
    for (const [name, task] of this.scheduledTasks) {
      task.stop();
      console.log(`⏹️ ${name} backup task stopped`);
    }
  }
  
  /**
   * Get scheduler status
   */
  getStatus() {
    const tasks = {};
    
    for (const [name, task] of this.scheduledTasks) {
      tasks[name] = {
        running: task.running,
        scheduled: process.env[`BACKUP_SCHEDULE_${name.toUpperCase()}`]
      };
    }
    
    return {
      enabled: this.isEnabled,
      tasks
    };
  }
}

// Create singleton instance
const backupScheduler = new BackupScheduler();

export default backupScheduler;