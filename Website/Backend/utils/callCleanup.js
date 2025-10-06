/**
 * Manual Call Cleanup Utility
 * 
 * This utility can be used to manually clean up stale calls for debugging purposes
 */

import CallLog from '../Models/FeedModels/CallLog.js';

class CallCleanupUtility {
  constructor(socketController) {
    this.socketController = socketController;
  }

  /**
   * Get all active calls information
   */
  getAllActiveCalls() {
    const activeCalls = [];
    const now = Date.now();
    
    for (const [callId, callData] of this.socketController.activeCalls) {
      const age = now - new Date(callData.startTime).getTime();
      activeCalls.push({
        callId,
        caller: callData.callerId,
        receiver: callData.receiverId,
        status: callData.status,
        startTime: callData.startTime,
        ageMinutes: Math.round(age / 60000),
        isStale: age > 5 * 60 * 1000
      });
    }
    
    return activeCalls.sort((a, b) => b.ageMinutes - a.ageMinutes);
  }

  /**
   * Force cleanup of all active calls
   */
  async forceCleanupAllCalls() {
    try {
      const activeCalls = this.getAllActiveCalls();
      console.log(`🧹 Force cleaning up ${activeCalls.length} active calls...`);
      
      for (const callInfo of activeCalls) {
        try {
          // Update call log
          const callLog = await CallLog.findOne({ callId: callInfo.callId });
          if (callLog && ['initiated', 'ringing', 'answered'].includes(callLog.status)) {
            await callLog.updateStatus('missed', {
              endReason: 'force_cleanup',
              endedBy: 'admin'
            });
          }
          
          console.log(`✅ Cleaned up call ${callInfo.callId} (${callInfo.ageMinutes} minutes old)`);
        } catch (error) {
          console.error(`❌ Error cleaning up call ${callInfo.callId}:`, error);
        }
      }
      
      // Clear all active calls
      this.socketController.activeCalls.clear();
      
      console.log(`✨ Force cleanup completed. Removed ${activeCalls.length} calls.`);
      return { success: true, cleanedCount: activeCalls.length };
      
    } catch (error) {
      console.error('❌ Error in force cleanup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up calls for a specific user
   */
  async cleanupCallsForUser(profileId) {
    try {
      console.log(`🧹 Cleaning up calls for user: ${profileId}`);
      await this.socketController.cleanupStaleCallsForUser(profileId);
      
      const remainingCalls = this.getAllActiveCalls()
        .filter(call => call.caller === profileId || call.receiver === profileId);
        
      console.log(`✅ Cleanup completed. User has ${remainingCalls.length} remaining calls.`);
      return { success: true, remainingCalls };
      
    } catch (error) {
      console.error(`❌ Error cleaning up calls for user ${profileId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get call statistics
   */
  getCallStatistics() {
    const activeCalls = this.getAllActiveCalls();
    const now = Date.now();
    
    const stats = {
      totalActive: activeCalls.length,
      byStatus: {
        initiated: 0,
        ringing: 0,
        answered: 0,
        other: 0
      },
      byAge: {
        fresh: 0,      // < 1 minute
        recent: 0,     // 1-5 minutes
        stale: 0,      // 5-10 minutes
        veryStale: 0   // > 10 minutes
      }
    };
    
    for (const call of activeCalls) {
      // Count by status
      if (call.status in stats.byStatus) {
        stats.byStatus[call.status]++;
      } else {
        stats.byStatus.other++;
      }
      
      // Count by age
      if (call.ageMinutes < 1) {
        stats.byAge.fresh++;
      } else if (call.ageMinutes < 5) {
        stats.byAge.recent++;
      } else if (call.ageMinutes < 10) {
        stats.byAge.stale++;
      } else {
        stats.byAge.veryStale++;
      }
    }
    
    return stats;
  }
}

export default CallCleanupUtility;