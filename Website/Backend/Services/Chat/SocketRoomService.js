import BaseService from '../System/BaseService.js';
import ChatService from './ChatService.js';
import Chat from '../../Models/FeedModels/Chat.js';
import Message from '../../Models/FeedModels/Message.js';
import LRUCache from '../../utils/LRUCache.js';
import { logger } from '../../utils/SanitizedLogger.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../../Helper/UnifiedErrorHandling.js';
import EventBus from '../CQRS/EventBus.js';

/**
 * @fileoverview Socket room service handling chat room management, joining, leaving, and tracking
 * @module SocketRoomService
 * @version 1.0.0
 * @author Swaggo Development Team
 */

class SocketRoomService extends BaseService {
  /**
   * @constructor
   * @description Initialize socket room service with memory-optimized data structures
   */
  constructor() {
    super();
    
    // 🔧 FIX: Initialize services directly (not using DI container)
    // ChatService is exported as a singleton instance, not a class
    this.chatService = ChatService; // Use the singleton instance
    this.eventBus = EventBus;
    
    // Memory-optimized maps with size limits
    this.mapSizeLimits = {
      joinedRooms: 15000
    };
    
    // Room tracking - maps socket.id to Set of chatids
    this.joinedRooms = new LRUCache(this.mapSizeLimits.joinedRooms); 
    
    // Resource limits for memory management
    this.resourceLimits = {
      maxRoomsPerUser: 50, // Limit rooms per user to prevent abuse
      cleanupInterval: {
        rooms: 2 * 60 * 1000 // 2 minutes
      }
    };
    
    // Initialize cleanup systems
    this.cleanupIntervals = {
      rooms: null
    };
    
    // Initialize cleanup systems (will be called after injection)
    // this.initializeCleanupSystems();
  }

  /**
   * Initialize cleanup systems for room management
   */
  initializeCleanupSystems() {
    this.logger.info('🧹 Initializing room cleanup systems...');
    
    // Room membership cleanup
    this.cleanupIntervals.rooms = setInterval(() => {
      this.cleanupJoinedRooms();
    }, this.resourceLimits.cleanupInterval.rooms);
    
    this.logger.info('✅ Room cleanup systems initialized');
  }

  /**
   * Handle user joining a chat room
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {string} chatid - Chat ID to join
   * @returns {Promise<void>}
   */
  async handleJoinChat(socket, io, chatid) {
    return this.handleOperation(async () => {
      const profileId = socket.user.profileid;
      const username = socket.user.username;

      // Validate required fields
      this.validateRequiredParams({ chatid, profileId }, ['chatid', 'profileId']);

      // Validate chat access using ChatService
      const chat = await this.chatService.getChatById(chatid, profileId);
      if (!chat) {
        throw new NotFoundError('Chat not found or access denied');
      }

      // Check room limits
      const currentRooms = this.joinedRooms.get(socket.id) || new Set();
      if (currentRooms.size >= this.resourceLimits.maxRoomsPerUser) {
        throw new ValidationError(`Cannot join more than ${this.resourceLimits.maxRoomsPerUser} rooms`);
      }

      // Join the Socket.IO room
      socket.join(chatid);
      
      // Track room membership
      currentRooms.add(chatid);
      this.joinedRooms.set(socket.id, currentRooms);

      // Notify other participants that user joined
      socket.to(chatid).emit('user_joined_chat', {
        chatid,
        profileid: profileId,
        username,
        timestamp: new Date().toISOString()
      });

      // Send confirmation to user
      socket.emit('chat_joined', {
        chatid,
        chat: {
          chatid: chat.chatid,
          chatName: chat.chatName,
          chatType: chat.chatType,
          participants: chat.participants?.length || 0
        },
        timestamp: new Date().toISOString()
      });

      this.logger.info(`🏠 User joined chat: ${username} joined ${chatid}`, {
        socketId: socket.id,
        totalRooms: currentRooms.size
      });
      
      // Emit chat joined event
      this.eventBus.emit('chat.joined', {
        chatId: chatid,
        userId: profileId,
        username,
        timestamp: new Date().toISOString()
      });

      // Load and send recent messages if needed
      await this.sendRecentMessages(socket, chatid, chat);

    }, 'handleJoinChat', { profileId: socket.user?.profileid, chatid });
  }

  /**
   * Handle user leaving a chat room
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @param {string} chatid - Chat ID to leave
   * @returns {Promise<void>}
   */
  async handleLeaveChat(socket, io, chatid) {
    return this.handleOperation(async () => {
      const profileId = socket.user.profileid;
      const username = socket.user.username;

      // Validate required fields
      this.validateRequiredParams({ chatid, profileId }, ['chatid', 'profileId']);

      // Leave the Socket.IO room
      socket.leave(chatid);

      // Update room tracking
      const currentRooms = this.joinedRooms.get(socket.id);
      if (currentRooms) {
        currentRooms.delete(chatid);
        
        if (currentRooms.size === 0) {
          this.joinedRooms.delete(socket.id);
        } else {
          this.joinedRooms.set(socket.id, currentRooms);
        }
      }

      // Notify other participants that user left
      socket.to(chatid).emit('user_left_chat', {
        chatid,
        profileid: profileId,
        username,
        timestamp: new Date().toISOString()
      });

      // Send confirmation to user
      socket.emit('chat_left', {
        chatid,
        timestamp: new Date().toISOString()
      });

      this.logger.info(`🚪 User left chat: ${username} left ${chatid}`, {
        socketId: socket.id,
        remainingRooms: currentRooms?.size || 0
      });
      
      // Emit chat left event
      this.eventBus.emit('chat.left', {
        chatId: chatid,
        userId: profileId,
        username,
        timestamp: new Date().toISOString()
      });

    }, 'handleLeaveChat', { profileId: socket.user?.profileid, chatid });
  }

  /**
   * Get all rooms a socket has joined
   * @param {string} socketId - Socket ID
   * @returns {Set<string>} Set of chat IDs
   */
  getSocketRooms(socketId) {
    return this.joinedRooms.get(socketId) || new Set();
  }

  /**
   * Get count of rooms a socket has joined
   * @param {string} socketId - Socket ID
   * @returns {number} Number of joined rooms
   */
  getSocketRoomCount(socketId) {
    const rooms = this.joinedRooms.get(socketId);
    return rooms ? rooms.size : 0;
  }

  /**
   * Check if socket is in a specific room
   * @param {string} socketId - Socket ID
   * @param {string} chatid - Chat ID
   * @returns {boolean} Whether socket is in the room
   */
  isSocketInRoom(socketId, chatid) {
    const rooms = this.joinedRooms.get(socketId);
    return rooms ? rooms.has(chatid) : false;
  }

  /**
   * Clean up room memberships on disconnect
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @returns {Promise<void>}
   */
  async cleanupOnDisconnect(socket, io) {
    return this.handleOperation(async () => {
      const socketId = socket.id;
      const profileId = socket.user?.profileid;
      const username = socket.user?.username;

      // Get rooms the socket was in
      const rooms = this.joinedRooms.get(socketId);
      
      if (rooms && rooms.size > 0) {
        this.logger.info(`🧹 Cleaning up room memberships for ${username}`, {
          socketId,
          roomCount: rooms.size
        });

        // Leave all rooms and notify other participants
        for (const chatid of rooms) {
          try {
            // Leave the Socket.IO room
            socket.leave(chatid);

            // Notify other participants
            socket.to(chatid).emit('user_left_chat', {
              chatid,
              profileid: profileId,
              username,
              reason: 'disconnected',
              timestamp: new Date().toISOString()
            });

            this.logger.debug(`🚪 Socket ${socketId} left room ${chatid} due to disconnect`);
          } catch (error) {
            this.logger.error(`Error leaving room ${chatid} on disconnect:`, {
              error: error.message,
              socketId,
              chatid
            });
          }
        }

        // Remove from tracking
        this.joinedRooms.delete(socketId);
        
        this.logger.info(`✅ Room cleanup completed for ${username}`, {
          socketId,
          roomsLeft: rooms.size
        });
      }
    }, 'cleanupOnDisconnect', { socketId: socket.id, profileId: socket.user?.profileid });
  }

  /**
   * Send recent messages when user joins a chat
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} chatid - Chat ID
   * @param {Object} chat - Chat document
   * @returns {Promise<void>}
   */
  async sendRecentMessages(socket, chatid, chat) {
    return this.handleOperation(async () => {
      try {
        // Get recent messages (last 50)
        const messages = await Message.find({ 
          chatid, 
          isDeleted: false 
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('senderid', 'username profilePic')
        .lean();

        if (messages.length > 0) {
          // Reverse to show chronologically
          const recentMessages = messages.reverse();

          socket.emit('recent_messages', {
            chatid,
            messages: recentMessages,
            total: recentMessages.length,
            timestamp: new Date().toISOString()
          });

          this.logger.debug(`📬 Sent ${recentMessages.length} recent messages to user in chat ${chatid}`, {
            socketId: socket.id
          });
        }
      } catch (error) {
        this.logger.error('Error sending recent messages:', {
          error: error.message,
          chatid,
          socketId: socket.id
        });
        // Don't throw error - recent messages are not critical
      }
    }, 'sendRecentMessages', { chatid, socketId: socket.id });
  }

  /**
   * Cleanup joined rooms tracking - validate room memberships
   */
  cleanupJoinedRooms() {
    return this.handleOperation(() => {
      let cleanedCount = 0;
      
      for (const [socketId, rooms] of this.joinedRooms) {
        // Check if socket still exists would require io instance
        // For now, just validate the rooms set
        if (!rooms || rooms.size === 0) {
          this.joinedRooms.delete(socketId);
          cleanedCount++;
          continue;
        }
        
        // Validate each room membership against actual Socket.IO rooms
        // This would require access to io.sockets.adapter.rooms
        // For now, we'll rely on the disconnect cleanup
      }
      
      if (cleanedCount > 0) {
        this.logger.debug(`🧹 Cleaned up ${cleanedCount} empty room tracking entries`);
      }
    }, 'cleanupJoinedRooms');
  }

  /**
   * Advanced room cleanup with Socket.IO validation
   * @param {Object} io - Socket.IO server instance
   */
  cleanupJoinedRoomsAdvanced(io) {
    return this.handleOperation(() => {
      let cleanedCount = 0;
      
      for (const [socketId, rooms] of this.joinedRooms) {
        // Check if socket still exists
        const socket = io.sockets.sockets.get(socketId);
        if (!socket) {
          // Socket no longer exists, clean up room tracking
          this.joinedRooms.delete(socketId);
          cleanedCount++;
          continue;
        }
        
        // Validate each room membership
        for (const chatid of rooms) {
          try {
            // Check if socket is actually in the room
            const socketRooms = io.sockets.adapter.rooms.get(chatid);
            const isInRoom = socketRooms && socketRooms.has(socketId);
            
            if (!isInRoom) {
              // Socket thinks it's in the room but isn't actually there
              rooms.delete(chatid);
              cleanedCount++;
              
              this.logger.debug(`🧹 Cleaned up stale room membership: socket ${socketId} in chat ${chatid}`);
            }
          } catch (error) {
            this.logger.error(`Error validating room membership for socket ${socketId} in chat ${chatid}:`, {
              error: error.message
            });
            // Remove problematic room entry
            rooms.delete(chatid);
            cleanedCount++;
          }
        }
        
        // Clean up empty room sets
        if (rooms.size === 0) {
          this.joinedRooms.delete(socketId);
        }
      }
      
      if (cleanedCount > 0) {
        this.logger.info(`🧹 Advanced cleanup: Fixed ${cleanedCount} stale room memberships`);
      }
    }, 'cleanupJoinedRoomsAdvanced');
  }

  /**
   * Get room statistics
   * @returns {Object} Room statistics
   */
  getRoomStats() {
    let totalRoomMemberships = 0;
    let maxRoomsPerSocket = 0;
    
    for (const rooms of this.joinedRooms.values()) {
      totalRoomMemberships += rooms.size;
      if (rooms.size > maxRoomsPerSocket) {
        maxRoomsPerSocket = rooms.size;
      }
    }

    return {
      connectedSockets: this.joinedRooms.size,
      totalRoomMemberships,
      averageRoomsPerSocket: this.joinedRooms.size > 0 ? 
        Math.round(totalRoomMemberships / this.joinedRooms.size * 100) / 100 : 0,
      maxRoomsPerSocket,
      roomMembershipLimit: this.resourceLimits.maxRoomsPerUser
    };
  }

  /**
   * Get detailed room information
   * @param {Object} io - Socket.IO server instance
   * @returns {Array} Array of room information
   */
  getDetailedRoomInfo(io) {
    const roomInfo = [];
    
    // Get all Socket.IO rooms
    for (const [roomName, sockets] of io.sockets.adapter.rooms) {
      // Skip socket ID rooms (they start with socket IDs)
      if (sockets.size > 1 || !roomName.startsWith('user_')) {
        roomInfo.push({
          roomName,
          participantCount: sockets.size,
          participants: Array.from(sockets),
          isChat: !roomName.startsWith('user_') // user_ rooms are personal notification rooms
        });
      }
    }

    return roomInfo.sort((a, b) => b.participantCount - a.participantCount);
  }

  /**
   * Force leave all rooms for a socket
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} io - Socket.IO server instance
   * @returns {Promise<void>}
   */
  async forceLeaveAllRooms(socket, io) {
    return this.handleOperation(async () => {
      const socketId = socket.id;
      const rooms = this.joinedRooms.get(socketId);
      
      if (rooms && rooms.size > 0) {
        const roomList = Array.from(rooms);
        
        for (const chatid of roomList) {
          await this.handleLeaveChat(socket, io, chatid);
        }
        
        this.logger.info(`🚪 Force left all rooms for socket ${socketId}`, {
          roomsLeft: roomList.length
        });
      }
    }, 'forceLeaveAllRooms', { socketId: socket.id });
  }

  /**
   * Graceful shutdown - clean up all resources
   * @returns {Promise<void>}
   */
  async gracefulShutdown() {
    return this.handleOperation(async () => {
      this.logger.info('🛑 SocketRoomService graceful shutdown initiated...');
      
      // Clear cleanup intervals
      Object.values(this.cleanupIntervals).forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
      
      // Clear all room tracking
      this.joinedRooms.clear();
      
      this.logger.info('✅ SocketRoomService shutdown completed');
    }, 'gracefulShutdown');
  }
}

export default SocketRoomService;

