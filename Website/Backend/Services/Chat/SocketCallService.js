import BaseService from '../System/BaseService.js';
import CallLog from '../../Models/FeedModels/CallLog.js';
import Profile from '../../Models/FeedModels/Profile.js';
import LRUCache from '../../utils/LRUCache.js';
import webrtcValidator from '../../utils/WebRTCValidator.js';
import { logger } from '../../utils/SanitizedLogger.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../../Helper/UnifiedErrorHandling.js';
import { v4 as uuidv4 } from 'uuid';
import EventBus from '../CQRS/EventBus.js';

/**
 * @fileoverview Socket call service handling WebRTC call management and call state tracking
 * @module SocketCallService
 * @version 1.0.0
 * @author Swaggo Development Team
 */

class SocketCallService extends BaseService {
  /**
   * @constructor
   * @description Initialize socket call service with memory-optimized data structures
   */
  constructor() {
    super();
    // 🔧 FIX: Initialize EventBus directly (not using DI container)
    this.eventBus = EventBus;
    
    // Memory-optimized maps with size limits
    this.mapSizeLimits = {
      activeCalls: 1000
    };
    
    // Active WebRTC calls with quality metrics
    this.activeCalls = new LRUCache(this.mapSizeLimits.activeCalls); // callId -> call data
    
    // Resource limits for memory management
    this.resourceLimits = {
      maxActiveCalls: 500, // Reduced for better memory management
      callTimeoutMs: 3 * 60 * 1000, // 3 minutes for faster cleanup
      cleanupInterval: {
        calls: 30 * 1000 // 30 seconds
      }
    };
    
    // Initialize cleanup systems
    this.cleanupIntervals = {
      calls: null,
      staleCallsProactive: null
    };
    
    // Initialize cleanup systems (will be called after injection)
    // this.initializeCleanupSystems();
  }

  /**
   * Initialize cleanup systems for call management
   */
  initializeCleanupSystems() {
    this.logger.info('🧹 Initializing call cleanup systems...');
    
    // Regular call cleanup
    this.cleanupIntervals.calls = setInterval(() => {
      this.periodicCleanupStaleCalls();
    }, this.resourceLimits.cleanupInterval.calls);
    
    // Proactive stale call cleanup
    this.cleanupIntervals.staleCallsProactive = setInterval(() => {
      this.cleanupStaleCallsProactive();
    }, 30000); // Every 30 seconds
    
    this.logger.info('✅ Call cleanup systems initialized');
  }

  /**
   * Initiate a new call
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {Object} connectionService - Socket connection service instance
   * @param {Object} data - Call initiation data
   * @returns {Promise<void>}
   */
  async initiateCall(socket, io, connectionService, data) {
    return this.handleOperation(async () => {
      const { targetUserId, callType = 'audio', offer } = data;
      const callerId = socket.user.profileid;
      const callerUsername = socket.user.username;

      // Validate required fields
      this.validateRequiredParams({ targetUserId, callerId }, ['targetUserId', 'callerId']);

      // Validate call type
      if (!['audio', 'video'].includes(callType)) {
        throw new ValidationError('Invalid call type. Must be "audio" or "video"');
      }

      // Validate WebRTC offer if provided
      if (offer && !webrtcValidator.validateOffer(offer)) {
        throw new ValidationError('Invalid WebRTC offer');
      }

      // Check if target user exists and is online
      const targetProfile = await Profile.findOne({ profileid: targetUserId });
      if (!targetProfile) {
        throw new NotFoundError('Target user not found');
      }

      const targetSocketId = connectionService.getUserSocketId(targetUserId);
      if (!targetSocketId) {
        throw new ValidationError('Target user is not online');
      }

      // Check if caller or target is already in a call
      const existingCall = this.findUserActiveCall(callerId) || this.findUserActiveCall(targetUserId);
      if (existingCall) {
        throw new ValidationError('User is already in an active call');
      }

      // Create new call
      const callId = uuidv4();
      const callData = {
        callId,
        callerId,
        callerUsername,
        receiverId: targetUserId,
        receiverUsername: targetProfile.username,
        callType,
        status: 'initiated',
        startTime: new Date(),
        participants: new Set([socket.id]),
        offer,
        answer: null,
        iceCandidates: []
      };

      // Store call
      this.activeCalls.set(callId, callData);

      // Get target socket
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (!targetSocket) {
        this.activeCalls.delete(callId);
        throw new ValidationError('Target user connection not found');
      }

      // Send call invitation to target user
      targetSocket.emit('call_incoming', {
        callId,
        callerId,
        callerUsername,
        callType,
        offer,
        timestamp: new Date().toISOString()
      });

      // Send confirmation to caller
      socket.emit('call_initiated', {
        callId,
        targetUserId,
        targetUsername: targetProfile.username,
        callType,
        status: 'ringing',
        timestamp: new Date().toISOString()
      });

      this.logger.info(`📞 Call initiated: ${callerUsername} -> ${targetProfile.username}`, {
        callId,
        callType
      });
      
      // Emit call initiated event
      this.eventBus.emit('call.initiated', {
        callId,
        callerId,
        callerUsername,
        receiverId: targetUserId,
        receiverUsername: targetProfile.username,
        callType,
        timestamp: new Date().toISOString()
      });

      // Set call timeout
      setTimeout(() => {
        const call = this.activeCalls.get(callId);
        if (call && call.status === 'initiated') {
          this.endCall(callId, io, connectionService, 'timeout');
        }
      }, 30000); // 30 seconds timeout for call acceptance

    }, 'initiateCall', { callerId: socket.user?.profileid, targetUserId });
  }

  /**
   * Accept an incoming call
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {Object} connectionService - Socket connection service instance
   * @param {Object} data - Call acceptance data
   * @returns {Promise<void>}
   */
  async acceptCall(socket, io, connectionService, data) {
    return this.handleOperation(async () => {
      const { callId, answer } = data;
      const receiverId = socket.user.profileid;
      const receiverUsername = socket.user.username;

      // Validate required fields
      this.validateRequiredParams({ callId, receiverId }, ['callId', 'receiverId']);

      // Find the call
      const callData = this.activeCalls.get(callId);
      if (!callData) {
        throw new NotFoundError('Call not found');
      }

      // Verify user is the intended receiver
      if (callData.receiverId !== receiverId) {
        throw new AuthorizationError('You are not the intended recipient of this call');
      }

      // Validate WebRTC answer if provided
      if (answer && !webrtcValidator.validateAnswer(answer)) {
        throw new ValidationError('Invalid WebRTC answer');
      }

      // Update call status
      callData.status = 'accepted';
      callData.acceptedAt = new Date();
      callData.answer = answer;
      callData.participants.add(socket.id);

      this.activeCalls.set(callId, callData);

      // Get caller socket
      const callerSocketId = connectionService.getUserSocketId(callData.callerId);
      const callerSocket = callerSocketId ? io.sockets.sockets.get(callerSocketId) : null;

      if (callerSocket) {
        // Notify caller that call was accepted
        callerSocket.emit('call_accepted', {
          callId,
          receiverId,
          receiverUsername,
          answer,
          timestamp: new Date().toISOString()
        });
      }

      // Confirm acceptance to receiver
      socket.emit('call_accepted_confirmation', {
        callId,
        status: 'connected',
        timestamp: new Date().toISOString()
      });

      this.logger.info(`✅ Call accepted: ${receiverUsername} accepted call from ${callData.callerUsername}`, {
        callId
      });

      // Create call log entry
      await this.createCallLogEntry(callData, 'accepted');

    }, 'acceptCall', { callId, receiverId: socket.user?.profileid });
  }

  /**
   * Reject an incoming call
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {Object} connectionService - Socket connection service instance
   * @param {Object} data - Call rejection data
   * @returns {Promise<void>}
   */
  async rejectCall(socket, io, connectionService, data) {
    return this.handleOperation(async () => {
      const { callId } = data;
      const receiverId = socket.user.profileid;
      const receiverUsername = socket.user.username;

      // Validate required fields
      this.validateRequiredParams({ callId, receiverId }, ['callId', 'receiverId']);

      // Find the call
      const callData = this.activeCalls.get(callId);
      if (!callData) {
        throw new NotFoundError('Call not found');
      }

      // Verify user is the intended receiver
      if (callData.receiverId !== receiverId) {
        throw new AuthorizationError('You are not the intended recipient of this call');
      }

      // Update call status
      callData.status = 'rejected';
      callData.endedAt = new Date();
      callData.endReason = 'rejected';

      // Get caller socket
      const callerSocketId = connectionService.getUserSocketId(callData.callerId);
      const callerSocket = callerSocketId ? io.sockets.sockets.get(callerSocketId) : null;

      if (callerSocket) {
        // Notify caller that call was rejected
        callerSocket.emit('call_rejected', {
          callId,
          receiverId,
          receiverUsername,
          timestamp: new Date().toISOString()
        });
      }

      // Confirm rejection to receiver
      socket.emit('call_rejected_confirmation', {
        callId,
        timestamp: new Date().toISOString()
      });

      this.logger.info(`❌ Call rejected: ${receiverUsername} rejected call from ${callData.callerUsername}`, {
        callId
      });

      // Create call log entry
      await this.createCallLogEntry(callData, 'rejected');

      // Remove call from active calls
      this.activeCalls.delete(callId);

    }, 'rejectCall', { callId, receiverId: socket.user?.profileid });
  }

  /**
   * End an active call
   * @param {string} callId - Call ID
   * @param {Object} io - Socket.IO server instance
   * @param {Object} connectionService - Socket connection service instance
   * @param {string} reason - End reason
   * @param {string} endedBy - User ID who ended the call
   * @returns {Promise<void>}
   */
  async endCall(callId, io, connectionService, reason = 'ended', endedBy = null) {
    return this.handleOperation(async () => {
      const callData = this.activeCalls.get(callId);
      if (!callData) {
        this.logger.warn(`Attempted to end non-existent call: ${callId}`);
        return;
      }

      // Update call status
      callData.status = 'ended';
      callData.endedAt = new Date();
      callData.endReason = reason;
      callData.endedBy = endedBy;

      // Calculate call duration
      const duration = callData.acceptedAt ? 
        new Date(callData.endedAt) - new Date(callData.acceptedAt) : 0;
      callData.duration = duration;

      // Notify all participants
      const participants = [callData.callerId, callData.receiverId];
      
      for (const participantId of participants) {
        const participantSocketId = connectionService.getUserSocketId(participantId);
        if (participantSocketId) {
          const participantSocket = io.sockets.sockets.get(participantSocketId);
          if (participantSocket) {
            participantSocket.emit('call_ended', {
              callId,
              reason,
              endedBy,
              duration,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      this.logger.info(`📞 Call ended: ${callData.callerUsername} <-> ${callData.receiverUsername}`, {
        callId,
        reason,
        duration: `${Math.round(duration / 1000)}s`
      });

      // Create call log entry
      await this.createCallLogEntry(callData, 'ended');

      // Remove call from active calls
      this.activeCalls.delete(callId);

    }, 'endCall', { callId, reason, endedBy });
  }

  /**
   * Handle ICE candidate exchange
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {Object} connectionService - Socket connection service instance
   * @param {Object} data - ICE candidate data
   * @returns {Promise<void>}
   */
  async handleIceCandidate(socket, io, connectionService, data) {
    return this.handleOperation(async () => {
      const { callId, candidate } = data;
      const userId = socket.user.profileid;

      // Validate required fields
      this.validateRequiredParams({ callId, candidate }, ['callId', 'candidate']);

      // Find the call
      const callData = this.activeCalls.get(callId);
      if (!callData) {
        throw new NotFoundError('Call not found');
      }

      // Verify user is a participant
      if (callData.callerId !== userId && callData.receiverId !== userId) {
        throw new AuthorizationError('You are not a participant in this call');
      }

      // Store ICE candidate
      callData.iceCandidates.push({
        fromUserId: userId,
        candidate,
        timestamp: new Date()
      });

      // Forward ICE candidate to the other participant
      const otherUserId = callData.callerId === userId ? callData.receiverId : callData.callerId;
      const otherSocketId = connectionService.getUserSocketId(otherUserId);
      
      if (otherSocketId) {
        const otherSocket = io.sockets.sockets.get(otherSocketId);
        if (otherSocket) {
          otherSocket.emit('ice_candidate', {
            callId,
            candidate,
            fromUserId: userId,
            timestamp: new Date().toISOString()
          });
        }
      }

    }, 'handleIceCandidate', { callId, userId: socket.user?.profileid });
  }

  /**
   * Find active call for a user
   * @param {string} userId - User profile ID
   * @returns {Object|null} Call data or null if no active call
   */
  findUserActiveCall(userId) {
    for (const [callId, callData] of this.activeCalls) {
      if ((callData.callerId === userId || callData.receiverId === userId) && 
          ['initiated', 'accepted'].includes(callData.status)) {
        return { callId, ...callData };
      }
    }
    return null;
  }

  /**
   * Clean up user calls on disconnect
   * @param {string} userId - User profile ID
   * @param {Object} io - Socket.IO server instance
   * @param {Object} connectionService - Socket connection service instance
   * @returns {Promise<void>}
   */
  async cleanupUserCallsByUserId(userId, io, connectionService) {
    return this.handleOperation(async () => {
      if (!userId) return;

      const callsToEnd = [];
      for (const [callId, callData] of this.activeCalls.entries()) {
        if (callData.callerId === userId || callData.receiverId === userId) {
          callsToEnd.push(callId);
        }
      }

      for (const callId of callsToEnd) {
        await this.endCall(callId, io, connectionService, 'participant_disconnected', userId);
      }

      if (callsToEnd.length > 0) {
        this.logger.info(`🧹 Cleaned up ${callsToEnd.length} calls for disconnected user ${userId}`);
      }
    }, 'cleanupUserCallsByUserId', { userId });
  }

  /**
   * Periodic cleanup of stale calls
   */
  periodicCleanupStaleCalls() {
    return this.handleOperation(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [callId, callData] of this.activeCalls) {
        const age = now - new Date(callData.startTime).getTime();
        
        if (age > this.resourceLimits.callTimeoutMs) {
          this.logger.info(`🧹 Cleaning stale call: ${callId}`, {
            age: Math.round(age / 1000),
            status: callData.status
          });
          
          this.activeCalls.delete(callId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.info(`🧹 Cleaned ${cleanedCount} stale calls`, {
          remaining: this.activeCalls.size
        });
      }
    }, 'periodicCleanupStaleCalls');
  }

  /**
   * Proactive stale call cleanup - more aggressive
   */
  cleanupStaleCallsProactive() {
    return this.handleOperation(() => {
      const now = Date.now();
      let cleanedCount = 0;
      const cleanedCalls = [];
      
      for (const [callId, callData] of this.activeCalls) {
        const age = now - new Date(callData.startTime).getTime();
        
        // Aggressive timeouts to prevent stale call buildup
        // Unanswered calls: 15 seconds, Answered calls: 60 seconds
        const timeout = callData.status === 'accepted' ? 60000 : 15000;
        
        if (age > timeout) {
          this.logger.info(`🧹 Proactive cleanup - removing stale call: ${callId}`, {
            age: Math.round(age / 1000),
            status: callData.status,
            timeout: timeout / 1000
          });
          
          this.activeCalls.delete(callId);
          cleanedCalls.push({ callId, age: Math.round(age / 1000), status: callData.status });
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        this.logger.info(`✅ Proactive cleanup: Removed ${cleanedCount} stale calls`, {
          remaining: this.activeCalls.size,
          cleaned: cleanedCalls
        });
      }
    }, 'cleanupStaleCallsProactive');
  }

  /**
   * Create call log entry
   * @param {Object} callData - Call data
   * @param {string} status - Call status
   * @returns {Promise<void>}
   */
  async createCallLogEntry(callData, status) {
    return this.handleOperation(async () => {
      try {
        const callLog = new CallLog({
          callId: callData.callId,
          callerId: callData.callerId,
          receiverId: callData.receiverId,
          callType: callData.callType,
          status,
          startTime: callData.startTime,
          acceptedAt: callData.acceptedAt,
          endedAt: callData.endedAt,
          duration: callData.duration || 0,
          endReason: callData.endReason
        });

        await callLog.save();
      } catch (error) {
        this.logger.error('Failed to create call log entry:', {
          error: error.message,
          callId: callData.callId
        });
      }
    }, 'createCallLogEntry', { callId: callData.callId });
  }

  /**
   * Get call statistics
   * @returns {Object} Call statistics
   */
  getCallStats() {
    let initiatedCalls = 0;
    let acceptedCalls = 0;
    let audioCalls = 0;
    let videoCalls = 0;

    for (const callData of this.activeCalls.values()) {
      if (callData.status === 'initiated') initiatedCalls++;
      if (callData.status === 'accepted') acceptedCalls++;
      if (callData.callType === 'audio') audioCalls++;
      if (callData.callType === 'video') videoCalls++;
    }

    return {
      totalActiveCalls: this.activeCalls.size,
      initiatedCalls,
      acceptedCalls,
      audioCalls,
      videoCalls
    };
  }

  /**
   * Graceful shutdown - clean up all resources
   * @returns {Promise<void>}
   */
  async gracefulShutdown() {
    return this.handleOperation(async () => {
      this.logger.info('🛑 SocketCallService graceful shutdown initiated...');
      
      // Clear cleanup intervals
      Object.values(this.cleanupIntervals).forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
      
      // Clear all active calls
      this.activeCalls.clear();
      
      this.logger.info('✅ SocketCallService shutdown completed');
    }, 'gracefulShutdown');
  }
}

export default SocketCallService;