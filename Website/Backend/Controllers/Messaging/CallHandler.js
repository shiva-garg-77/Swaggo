import Chat from '../Models/FeedModels/Chat.js';
import CallLog from '../Models/FeedModels/CallLog.js';
import { v4 as uuidv4 } from 'uuid';
import socketRateLimiter from '../Middleware/RateLimiter.js';

// 🔧 PERFORMANCE FIX #32: Import Winston logger
import appLogger from '../utils/logger.js';

/**
 * @class CallHandler
 * @classdesc Handles all call-related socket events and operations
 * 
 * Separated from SocketController to reduce God class complexity and improve maintainability
 */
class CallHandler {
  constructor(socketController) {
    this.socketController = socketController;
    this.io = socketController.io;
    this.onlineUsers = socketController.onlineUsers;
    this.userSockets = socketController.userSockets;
    this.activeCalls = socketController.activeCalls;
  }

  /**
   * Handle initiating a call
   */
  async handleInitiateCall(socket, data, callback) {
    // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
    appLogger.debug('📞 === CALL INITIATION DEBUG ===');
    appLogger.debug('Raw call data received:', { data: JSON.stringify(data, null, 2) });
    appLogger.debug('Socket user:', { user: socket.user });
    
    try {
      const { chatid, callType = 'voice', type = 'voice', receiverId, callId, participants, initiator } = data;
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug('🔍 Parsed call parameters:', {
        chatid,
        callType,
        type,
        receiverId,
        callId,
        participants,
        initiator
      });
      
      // Handle different call initiation formats and determine actual receiverId
      let actualReceiverId = receiverId;
      let actualCallType = callType || type;
      
      // If no direct receiverId but we have chatid, get from chat participants
      if (!actualReceiverId && chatid) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.debug('🔍 Looking up chat for receiverId extraction:', { chatid });
        const chat = await Chat.findOne({ chatid, isActive: true });
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.debug('🔍 Chat lookup result:', {
          found: !!chat,
          chatType: chat?.chatType,
          participantCount: chat?.participants?.length,
          participants: chat?.participants?.map(p => p.profileid)
        });
        
        if (chat && chat.isParticipant(socket.user.profileid)) {
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          appLogger.debug('🔍 User is participant in chat, extracting receiverId...');
          // For direct chats, find the other participant
          if (chat.chatType === 'direct') {
            const otherParticipant = chat.participants.find(p => p.profileid !== socket.user.profileid);
            actualReceiverId = otherParticipant?.profileid;
          } else {
            // For group chats, this is more complex - for now, reject group calls
            const errorMsg = 'Group calls not yet supported';
            socket.emit('call_error', { error: errorMsg, chatid });
            if (callback) callback({ success: false, error: errorMsg });
            return;
          }
        }
      }
      
      // If participants array is provided (legacy frontend format), extract receiverId
      if (!actualReceiverId && participants && Array.isArray(participants)) {
        // Find the participant that's not the caller
        actualReceiverId = participants.find(p => p !== socket.user.profileid && p !== initiator);
      }
      
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.info(`📞 Call initiated by ${socket.user.username} to ${actualReceiverId}, type: ${actualCallType}`);
      
      // Validate required parameters
      if (!chatid) {
        const errorMsg = 'Missing required parameter: chatid';
        socket.emit('call_error', { error: errorMsg });
        if (callback) callback({ success: false, error: errorMsg });
        return;
      }
      
      if (!actualReceiverId) {
        const errorMsg = 'Could not determine receiver for the call';
        socket.emit('call_error', { error: errorMsg, chatid });
        if (callback) callback({ success: false, error: errorMsg });
        return;
      }
      
      // Verify user has access to this chat (fix participants query for object-based schema)
      const chat = await Chat.findOne({ 
        chatid, 
        'participants.profileid': { $all: [socket.user.profileid, actualReceiverId] },
        isActive: true 
      });
      
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug('🔍 Call verification debug:', {
        caller: socket.user.profileid,
        receiver: actualReceiverId,
        chatFound: !!chat,
        chatParticipants: chat ? chat.participants.map(p => p.profileid) : []
      });
      
      if (!chat) {
        const errorMsg = 'Unauthorized or invalid chat';
        socket.emit('call_error', { error: errorMsg });
        if (callback) callback({ success: false, error: errorMsg });
        return;
      }
      
      // Debug: List all active calls before cleanup
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug('🔍 Active calls before cleanup:');
      for (const [callId, callData] of this.activeCalls) {
        const age = Date.now() - new Date(callData.startTime).getTime();
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.debug('Active call details:', {
          callId,
          caller: callData.callerId,
          receiver: callData.receiverId,
          status: callData.status,
          ageMinutes: Math.round(age / 60000),
          callerSocket: callData.callerSocket
        });
      }
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug(`Total active calls: ${this.activeCalls.size}`);
      
      // Clean up any stale calls for this user before checking
      await this.socketController.cleanupStaleCallsForUser(socket.user.profileid);
      
      // Debug: List active calls after cleanup
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug('🔍 Active calls after cleanup:');
      // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
      appLogger.debug(`Total active calls: ${this.activeCalls.size}`);
      for (const [callId, callData] of this.activeCalls) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.debug('Active call:', {
          callId,
          caller: callData.callerId,
          receiver: callData.receiverId
        });
      }
      
      // Check if caller is already in a call
      const existingCall = Array.from(this.activeCalls.values())
        .find(call => call.callerId === socket.user.profileid || call.receiverId === socket.user.profileid);
      
      if (existingCall) {
        // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
        appLogger.debug('🔍 Found existing call for user:', {
          callId: existingCall.callId,
          status: existingCall.status,
          startTime: existingCall.startTime,
          age: Date.now() - new Date(existingCall.startTime).getTime()
        });
        
        // If the call is old (more than 30 seconds for unanswered, 2 minutes for answered), consider it stale
        // IMPROVED: Make cleanup more aggressive with reduced thresholds
        const callAge = Date.now() - new Date(existingCall.startTime).getTime();
        const isAnsweredCall = existingCall.status === 'answered';
        // REDUCED THRESHOLDS: 30 seconds → 10 seconds for unanswered, 2 minutes → 30 seconds for answered
        const staleThreshold = isAnsweredCall ? 30 * 1000 : 10 * 1000; // 30s for answered, 10s for unanswered
        
        if (callAge > staleThreshold) {
          // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.log
          appLogger.debug('🧹 Removing stale call:', {
            callId: existingCall.callId,
            status: existingCall.status,
            ageSeconds: Math.round(callAge / 1000),
            threshold: isAnsweredCall ? '30 seconds' : '10 seconds'
          });
          this.activeCalls.delete(existingCall.callId);
          
          // Update call log to reflect the cleanup
          try {
            const callLog = await CallLog.findOne({ callId: existingCall.callId });
            if (callLog && ['initiated', 'ringing'].includes(callLog.status)) {
              await callLog.updateStatus('missed', {
                endReason: 'stale_cleanup',
                endedBy: 'system'
              });
            }
          } catch (error) {
            // 🔧 PERFORMANCE FIX #32: Use Winston logger instead of console.error
            appLogger.error('❌ Error updating stale call log:', { error: error.message });
          }
        } else {
          const errorMsg = 'You are already in a call';
          socket.emit('call_error', { error: errorMsg });
          if (callback) callback({ success: false, error: errorMsg });
          return;
        }
      }
      
      // Create call log entry
      const newCall = new CallLog({
        callId: callId || uuidv4(),
        chatid,
        callerId: socket.user.profileid,
        receiverId: actualReceiverId,
        callType: actualCallType,
        status: 'initiated',
        participants: [socket.user.profileid, actualReceiverId]
      });
      
      await newCall.save();
      
      // Store active call
      this.activeCalls.set(newCall.callId, {
        ...newCall.toObject(),
        callerSocket: socket.id,
        startTime: new Date()
      });
      
      // Check if receiver is online
      const receiverSocketId = this.onlineUsers.get(actualReceiverId);
      
      if (receiverSocketId) {
        // Check if receiver is already in a call
        const receiverInCall = Array.from(this.activeCalls.values())
          .find(call => (call.callerId === actualReceiverId || call.receiverId === actualReceiverId) && call.callId !== newCall.callId);
        
        if (receiverInCall) {
          // Receiver is busy
          await newCall.updateStatus('declined', {
            endReason: 'busy'
          });
          
          socket.emit('call_failed', {
            callId: newCall.callId,
            reason: 'busy',
            message: 'User is currently busy'
          });
          
          this.activeCalls.delete(newCall.callId);
          
          if (callback) {
            callback({ 
              success: false, 
              error: 'User is currently busy',
              reason: 'busy'
            });
          }
          return;
        }
        
        // Send call invitation using UNIFIED CONTRACT
        console.log('📤 Sending call invitation to recipient');
        console.log('  - Recipient Socket ID:', receiverSocketId);
        console.log('  - Call ID:', newCall.callId);
        console.log('  - Call Type:', actualCallType);
        console.log('  - Caller:', socket.user.username);
        
        const callInvitation = {
          callId: newCall.callId,
          callType: actualCallType,
          caller: {
            profileid: socket.user.profileid,
            username: socket.user.username,
            profilePic: socket.user.profilePic || null
          },
          chatid
        };
        
        this.io.to(receiverSocketId).emit('incoming_call', callInvitation);
        console.log('✅ Call invitation sent successfully');
        
        // Also emit LEGACY EVENTS for backward compatibility
        this.io.to(receiverSocketId).emit('call_offer', {
          callId: newCall.callId,
          type: actualCallType,
          participants: [actualReceiverId],
          initiator: socket.user.profileid,
          mediaConstraints: {
            audio: true,
            video: actualCallType === 'video',
            screenShare: false
          },
          caller: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          chatid
        });
        
        // Update call status to ringing
        await newCall.updateStatus('ringing');
        
        // Notify caller that call is ringing using the correct event name
        socket.emit('call_ringing', {
          callId: newCall.callId,
          receiverId: actualReceiverId
        });
        
        // Send success acknowledgment
        if (callback) {
          callback({ 
            success: true, 
            callId: newCall.callId,
            status: 'ringing',
            message: 'Call initiated successfully'
          });
        }
        
        // Set timeout for no answer
        setTimeout(async () => {
          const activeCall = this.activeCalls.get(newCall.callId);
          if (activeCall && activeCall.status !== 'answered') {
            await this.handleCallTimeout(newCall.callId, 'no_answer');
          }
        }, 30000); // 30 seconds timeout
        
      } else {
        // Receiver is offline
        await newCall.updateStatus('missed', {
          endReason: 'user_offline',
          isOfflineAttempt: true
        });
        
        socket.emit('call_failed', {
          callId: newCall.callId,
          reason: 'receiver_offline',
          message: 'User is currently offline'
        });
        
        this.activeCalls.delete(newCall.callId);
        
        // Send failure acknowledgment
        if (callback) {
          callback({ 
            success: false, 
            error: 'User is currently offline',
            reason: 'receiver_offline'
          });
        }
        
        // Send push notification if available
        await this.socketController.sendPushNotification(actualReceiverId, {
          title: `Missed call from ${socket.user.username}`,
          body: `${actualCallType === 'video' ? 'Video' : 'Voice'} call`,
          data: {
            type: 'missed_call',
            callId: newCall.callId,
            callerId: socket.user.profileid,
            chatid
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Error initiating call:', {
        error: error.message,
        stack: error.stack,
        data: data,
        user: socket.user?.profileid,
        username: socket.user?.username
      });
      
      const errorMsg = `Failed to initiate call: ${error.message}`;
      const errorDetails = {
        originalError: error.message,
        errorType: error.name || 'Unknown',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
      
      socket.emit('call_error', {
        error: errorMsg,
        details: errorDetails
      });
      
      if (callback) {
        callback({ 
          success: false, 
          error: errorMsg,
          details: errorDetails
        });
      }
    }
  }

  /**
   * Handle answering a call
   */
  async handleAnswerCall(socket, data) {
    try {
      const { callId } = data;
      console.log(`📞 Call answered by ${socket.user.username}, callId: ${callId}`);
      
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) {
        socket.emit('call_error', { error: 'Call not found' });
        return;
      }
      
      // Update call log
      const callLog = await CallLog.findOne({ callId });
      if (callLog) {
        await callLog.updateStatus('answered');
      }
      
      // Update active call
      activeCall.status = 'answered';
      activeCall.answeredAt = new Date();
      activeCall.receiverSocket = socket.id;
      this.activeCalls.set(callId, activeCall);
      
      // Notify caller using UNIFIED CONTRACT
      if (activeCall.callerSocket) {
        this.io.to(activeCall.callerSocket).emit('call_answer', {
          callId,
          accepted: true,
          answerer: {
            profileid: socket.user.profileid,
            username: socket.user.username
          }
        });
        
        // Also emit LEGACY EVENT for backward compatibility
        this.io.to(activeCall.callerSocket).emit('call_answered', {
          callId,
          answeredBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          }
        });
      }
      
      // Confirm to receiver
      socket.emit('call_connected', {
        callId,
        caller: activeCall.caller
      });
      
    } catch (error) {
      console.error('❌ Error answering call:', error);
      socket.emit('call_error', {
        error: 'Failed to answer call',
        details: error.message
      });
    }
  }

  /**
   * Handle ending a call
   */
  async handleEndCall(socket, data) {
    try {
      const { callId, reason = 'normal' } = data;
      console.log(`📞 Call ended by ${socket.user.username}, callId: ${callId}, reason: ${reason}`);
      
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) {
        socket.emit('call_error', { error: 'Call not found' });
        return;
      }
      
      // Calculate duration if call was answered
      let duration = 0;
      if (activeCall.answeredAt) {
        duration = Math.floor((Date.now() - new Date(activeCall.answeredAt).getTime()) / 1000);
      }
      
      // Update call log
      const callLog = await CallLog.findOne({ callId });
      if (callLog) {
        let status;
        if (reason === 'cancelled') {
          status = 'cancelled';
        } else if (activeCall.answeredAt) {
          status = 'completed';
        } else {
          status = 'missed';
        }
        
        await callLog.updateStatus(status, {
          endedBy: socket.user.profileid,
          endReason: reason,
          duration
        });
        
        console.log(`📋 Call log updated: ${callId} -> ${status} (reason: ${reason})`);
      }
      
      // Notify other participant using UNIFIED CONTRACT
      const otherSocket = socket.id === activeCall.callerSocket 
        ? activeCall.receiverSocket 
        : activeCall.callerSocket;
        
      if (otherSocket) {
        this.io.to(otherSocket).emit('end_call', {
          callId,
          reason
        });
        
        // Also emit LEGACY EVENTS for backward compatibility
        this.io.to(otherSocket).emit('call_end', {
          callId,
          endedBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason,
          duration
        });
        
        this.io.to(otherSocket).emit('call_ended', {
          callId,
          endedBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason,
          duration
        });
      }
      
      // Confirm to caller
      socket.emit('call_end', {
        callId,
        duration,
        reason
      });
      
      // Also emit legacy event
      socket.emit('call_ended', {
        callId,
        duration,
        reason
      });
      
      // Remove from active calls
      this.activeCalls.delete(callId);
      
      console.log(`✅ Call ${callId} ended successfully, duration: ${duration}s`);
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
      socket.emit('call_error', {
        error: 'Failed to end call',
        details: error.message
      });
    }
  }

  /**
   * Handle declining a call
   */
  async handleDeclineCall(socket, data) {
    try {
      const { callId } = data;
      console.log(`📞 Call declined by ${socket.user.username}, callId: ${callId}`);
      
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) {
        socket.emit('call_error', { error: 'Call not found' });
        return;
      }
      
      // Update call log
      const callLog = await CallLog.findOne({ callId });
      if (callLog) {
        await callLog.updateStatus('declined', {
          endReason: 'declined'
        });
      }
      
      // CRITICAL: Notify caller that call was declined with multiple events
      if (activeCall.callerSocket) {
        // Primary decline event
        this.io.to(activeCall.callerSocket).emit('call_declined', {
          callId,
          declinedBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason: 'declined'
        });
        
        // Reject event for compatibility
        this.io.to(activeCall.callerSocket).emit('call_reject', {
          callId,
          accepted: false,
          reason: 'declined'
        });
        
        // CRITICAL: Emit call_ended to properly cancel User A's call
        this.io.to(activeCall.callerSocket).emit('call_ended', {
          callId,
          endedBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason: 'declined',
          duration: 0
        });
      }
      
      // Confirm to receiver
      socket.emit('call_declined_confirmed', {
        callId
      });
      
      // Remove from active calls
      this.activeCalls.delete(callId);
      
      console.log(`❌ Call ${callId} declined successfully`);
      
    } catch (error) {
      console.error('❌ Error declining call:', error);
      socket.emit('call_error', {
        error: 'Failed to decline call',
        details: error.message
      });
    }
  }

  /**
   * Handle call timeout
   */
  async handleCallTimeout(callId, reason) {
    try {
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) {
        return;
      }
      
      // Update call log
      const callLog = await CallLog.findOne({ callId });
      if (callLog) {
        await callLog.updateStatus('missed', {
          endReason: reason
        });
      }
      
      // Notify participants
      if (activeCall.callerSocket) {
        this.io.to(activeCall.callerSocket).emit('call_timeout', {
          callId,
          reason
        });
      }
      
      if (activeCall.receiverSocket) {
        this.io.to(activeCall.receiverSocket).emit('call_timeout', {
          callId,
          reason
        });
      }
      
      // Remove from active calls
      this.activeCalls.delete(callId);
      
      console.log(`⏰ Call ${callId} timed out: ${reason}`);
    } catch (error) {
      console.error('❌ Error handling call timeout:', error);
    }
  }

  /**
   * Handle call cancellation
   */
  async handleCallCancelled(socket, data) {
    try {
      const { callId, reason = 'cancelled_by_caller', chatid } = data;
      console.log(`📞 Call cancelled by ${socket.user.username}, callId: ${callId}, reason: ${reason}`);
      
      const activeCall = this.activeCalls.get(callId);
      if (!activeCall) {
        socket.emit('call_error', { error: 'Call not found' });
        return;
      }
      
      // Update call log
      const callLog = await CallLog.findOne({ callId });
      if (callLog) {
        await callLog.updateStatus('cancelled', {
          endReason: reason,
          endedBy: socket.user.profileid
        });
      }
      
      // Notify other participant
      const otherSocket = socket.id === activeCall.callerSocket 
        ? activeCall.receiverSocket 
        : activeCall.callerSocket;
        
      if (otherSocket) {
        this.io.to(otherSocket).emit('call_cancelled', {
          callId,
          cancelledBy: {
            profileid: socket.user.profileid,
            username: socket.user.username
          },
          reason
        });
      }
      
      // Confirm to caller
      socket.emit('call_cancelled_confirmed', {
        callId,
        reason
      });
      
      // Remove from active calls
      this.activeCalls.delete(callId);
      
      console.log(`❌ Call ${callId} cancelled successfully`);
      
    } catch (error) {
      console.error('❌ Error cancelling call:', error);
      socket.emit('call_error', {
        error: 'Failed to cancel call',
        details: error.message
      });
    }
  }
}

export default CallHandler;