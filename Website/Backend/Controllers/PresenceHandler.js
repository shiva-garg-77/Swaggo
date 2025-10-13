import Profile from '../Models/FeedModels/Profile.js';
import Chat from '../Models/FeedModels/Chat.js';

/**
 * @class PresenceHandler
 * @classdesc Handles user presence, online status, and related socket events
 * 
 * Separated from SocketController to reduce God class complexity and improve maintainability
 */
class PresenceHandler {
  constructor(socketController) {
    this.socketController = socketController;
    this.io = socketController.io;
    this.onlineUsers = socketController.onlineUsers;
    this.userSockets = socketController.userSockets;
    this.joinedRooms = socketController.joinedRooms;
    this.connectionHealth = socketController.connectionHealth;
  }

  /**
   * Update user's online status in the database
   */
  async updateUserOnlineStatus(profileId, isOnline, lastSeen = new Date()) {
    try {
      await Profile.findOneAndUpdate(
        { profileid: profileId },
        {
          isOnline: isOnline,
          lastSeen: lastSeen
        }
      );
      
      // Broadcast status to all user's chat participants
      const userChats = await Chat.find({ 'participants.profileid': profileId, isActive: true });
      for (const chat of userChats) {
        this.io.to(chat.chatid).emit('user_status_changed', {
          profileid: profileId,
          isOnline: isOnline,
          lastSeen: lastSeen
        });
      }
    } catch (error) {
      console.error('❌ Error updating user online status:', error);
    }
  }

  /**
   * Deliver offline messages to a user when they connect
   */
  async deliverOfflineMessages(profileId, socket) {
    try {
      const queuedMessages = this.socketController.offlineMessageQueue.get(profileId);
      if (queuedMessages && queuedMessages.length > 0) {
        console.log(`📬 Delivering ${queuedMessages.length} offline messages to ${profileId}`);
        
        const deliveryResults = [];
        
        for (const messageData of queuedMessages) {
          try {
            // Validate message data before delivery
            if (!messageData.message || !messageData.message.messageid) {
              console.warn('⚠️ Invalid message data in queue:', messageData);
              deliveryResults.push({ success: false, messageid: 'unknown', error: 'Invalid message data' });
              continue;
            }
            
            // Update message status to delivered in database
            const updateResult = await Message.findOneAndUpdate(
              { messageid: messageData.message.messageid },
              {
                messageStatus: 'delivered',
                $push: {
                  deliveredTo: {
                    profileid: profileId,
                    deliveredAt: new Date()
                  }
                }
              }
            );
            
            if (updateResult) {
              // Emit message to client
              socket.emit('message_received', messageData.message);
              deliveryResults.push({ success: true, messageid: messageData.message.messageid });
            } else {
              console.warn('⚠️ Message not found in database:', messageData.message.messageid);
              deliveryResults.push({ success: false, messageid: messageData.message.messageid, error: 'Message not found' });
            }
          } catch (error) {
            console.error('❌ Error delivering message:', error);
            deliveryResults.push({ success: false, messageid: messageData.message.messageid, error: error.message });
          }
        }
        
        // Clear delivered messages from queue
        this.socketController.offlineMessageQueue.delete(profileId);
        
        // Emit delivery results to client
        socket.emit('offline_messages_delivered', deliveryResults);
      }
    } catch (error) {
      console.error('❌ Error delivering offline messages:', error);
    }
  }

  /**
   * Handle user joining a chat room
   */
  async handleJoinChat(socket, chatid) {
    try {
      console.log(`📥 join_chat event received - chatid: ${chatid}, user: ${socket.user?.username} (${socket.user?.profileid})`);
      
      // LOG: Join attempt
      console.log(`📝 JOIN ATTEMPT LOG:`, {
        timestamp: new Date().toISOString(),
        socketId: socket.id,
        userId: socket.user?.profileid,
        username: socket.user?.username,
        chatid,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      });
      
      // FAILURE REASON 1: Missing chatid
      if (!chatid) {
        const error = 'Missing chatid for join_chat';
        console.error(`❌ ${error}`);
        socket.emit('chat_error', { 
          error, 
          chatid,
          code: 'MISSING_CHAT_ID',
          user: socket.user?.profileid,
          timestamp: new Date().toISOString(),
          failureReason: 'MISSING_CHAT_ID',
          resolution: 'Provide a valid chatid parameter'
        });
        
        // LOG: Failed join attempt
        console.log(`❌ JOIN FAILED LOG:`, {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          userId: socket.user?.profileid,
          username: socket.user?.username,
          chatid,
          failureReason: 'MISSING_CHAT_ID',
          error
        });
        
        throw new Error(error);
      }
      
      // FAILURE REASON 2: Chat not found or inactive
      const chat = await Chat.findOne({ chatid, isActive: true });
      
      if (!chat) {
        const error = 'Chat not found or inactive';
        console.error(`❌ ${error}: ${chatid}`);
        socket.emit('chat_error', { 
          error, 
          chatid,
          code: 'CHAT_NOT_FOUND',
          user: socket.user?.profileid,
          timestamp: new Date().toISOString(),
          failureReason: 'CHAT_NOT_FOUND',
          resolution: 'Verify the chat exists and is active'
        });
        
        // LOG: Failed join attempt
        console.log(`❌ JOIN FAILED LOG:`, {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          userId: socket.user?.profileid,
          username: socket.user?.username,
          chatid,
          failureReason: 'CHAT_NOT_FOUND',
          error
        });
        
        throw new Error(error);
      }
      
      // FAILURE REASON 3: User not participant
      const isParticipant = chat.participants.some(p => p.profileid === socket.user.profileid);
      if (!isParticipant) {
        const error = 'User is not a participant in this chat';
        console.error(`❌ ${error}: ${chatid} for user ${socket.user.profileid}`);
        socket.emit('chat_error', { 
          error, 
          chatid,
          code: 'NOT_PARTICIPANT',
          user: socket.user?.profileid,
          timestamp: new Date().toISOString(),
          failureReason: 'NOT_PARTICIPANT',
          resolution: 'Only chat participants can join the chat room'
        });
        
        // LOG: Failed join attempt
        console.log(`❌ JOIN FAILED LOG:`, {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          userId: socket.user?.profileid,
          username: socket.user?.username,
          chatid,
          failureReason: 'NOT_PARTICIPANT',
          error,
          chatParticipants: chat.participants.map(p => p.profileid)
        });
        
        throw new Error(error);
      }
      
      // Join the socket room
      socket.join(chatid);
      console.log(`✅ Socket joined room: ${chatid}`);
      
      // Track joined rooms for this socket
      if (!this.joinedRooms.has(socket.id)) {
        this.joinedRooms.set(socket.id, new Set());
      }
      this.joinedRooms.get(socket.id).add(chatid);
      
      // FAILURE REASON 4: Room membership verification failed
      const socketRooms = this.io.sockets.adapter.rooms.get(chatid);
      const isInRoom = socketRooms && socketRooms.has(socket.id);
      
      if (!isInRoom) {
        console.error(`❌ Failed to verify socket room membership: ${chatid}`);
        socket.leave(chatid); // Ensure socket leaves if join failed
        
        const error = 'Failed to join chat room - verification failed';
        socket.emit('chat_error', { 
          error, 
          chatid,
          failureReason: 'ROOM_VERIFICATION_FAILED',
          resolution: 'Server room membership verification failed'
        });
        
        // LOG: Failed join attempt
        console.log(`❌ JOIN FAILED LOG:`, {
          timestamp: new Date().toISOString(),
          socketId: socket.id,
          userId: socket.user?.profileid,
          username: socket.user?.username,
          chatid,
          failureReason: 'ROOM_VERIFICATION_FAILED',
          error
        });
        
        throw new Error(error);
      }
      
      console.log(`📨 ${socket.user.username} successfully joined chat: ${chatid}`);
      
      // Get user's role and permissions
      const participant = chat.getParticipant(socket.user.profileid);
      console.log(`🔍 Participant info:`, { role: participant?.role, permissions: Object.keys(participant?.permissions || {}) });
      
      // Notify other participants
      socket.to(chatid).emit('user_joined_chat', {
        profileid: socket.user.profileid,
        username: socket.user.username,
        role: participant?.role || 'member',
        isOnline: true,
        joinedAt: new Date().toISOString()
      });
      
      // Send confirmation to user with their permissions
      socket.emit('chat_joined', {
        chatid,
        role: participant?.role || 'member',
        permissions: participant?.permissions || {},
        chatInfo: {
          chatName: chat.chatName,
          chatType: chat.chatType,
          participantCount: chat.participants.length,
          settings: chat.chatSettings
        },
        // Include verification that join was successful
        verified: true,
        timestamp: new Date().toISOString()
      });
      
      // LOG: Successful join
      console.log(`✅ JOIN SUCCESS LOG:`, {
        timestamp: new Date().toISOString(),
        socketId: socket.id,
        userId: socket.user?.profileid,
        username: socket.user?.username,
        chatid,
        participantCount: chat.participants.length
      });
      
      console.log(`✅ Join chat completed successfully for ${socket.user.username} in ${chatid}`);
      
    } catch (error) {
      console.error(`❌ Error joining chat ${chatid}:`, {
        error: error.message,
        stack: error.stack,
        user: socket.user.profileid,
        username: socket.user.username
      });
      socket.emit('chat_error', { 
        error: 'Failed to join chat: ' + error.message, 
        chatid,
        debug: 'Check server logs for details',
        failureReason: 'GENERAL_ERROR',
        resolution: 'Contact support with error details'
      });
      
      // LOG: Exception during join
      console.log(`💥 JOIN EXCEPTION LOG:`, {
        timestamp: new Date().toISOString(),
        socketId: socket.id,
        userId: socket.user?.profileid,
        username: socket.user?.username,
        chatid,
        error: error.message,
        stack: error.stack
      });
      
      throw error; // Re-throw for auto-join error handling
    }
  }

  /**
   * Handle user leaving a chat room
   */
  handleLeaveChat(socket, chatid) {
    socket.leave(chatid);
    
    // Remove from joined rooms tracking
    if (this.joinedRooms.has(socket.id)) {
      this.joinedRooms.get(socket.id).delete(chatid);
      // Clean up empty room sets
      if (this.joinedRooms.get(socket.id).size === 0) {
        this.joinedRooms.delete(socket.id);
      }
    }
    
    socket.to(chatid).emit('user_left', {
      profileid: socket.user.profileid,
      username: socket.user.username
    });
    console.log(`📤 ${socket.user.username} left chat: ${chatid}`);
  }

  /**
   * Handle marking a chat as read
   */
  async handleMarkChatAsRead(socket, data) {
    try {
      const { chatid } = data;
      console.log(`👁️ User ${socket.user.username} marking chat ${chatid} as read`);
      
      const chat = await Chat.findOne({ chatid });
      if (!chat || !chat.isParticipant(socket.user.profileid)) {
        console.warn(`⚠️ User cannot mark chat ${chatid} as read`);
        return;
      }
      
      // ✅ RESET UNREAD COUNT: For this specific user only (Issue #16)
      const participant = chat.participants.find(p => p.profileid === socket.user.profileid);
      if (participant) {
        participant.unreadCount = 0;
        participant.lastReadAt = new Date();
        await chat.save();
        console.log(`✅ Unread count reset to 0 for user ${socket.user.username} in chat ${chatid}`);
      }
      
      console.log(`✅ Chat ${chatid} marked as read by ${socket.user.username}`);
      
      // ✅ MARK ALL MESSAGES AS READ: For this user
      await Message.updateMany(
        {
          chatid,
          senderid: { $ne: socket.user.profileid },
          'readBy.profileid': { $ne: socket.user.profileid }
        },
        {
          $push: {
            readBy: {
              profileid: socket.user.profileid,
              readAt: new Date()
            }
          }
        }
      );
      
      // ✅ NOTIFY OTHER PARTICIPANTS: That this user has read the chat
      socket.to(chatid).emit('chat_read', {
        chatid,
        profileid: socket.user.profileid,
        username: socket.user.username,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error marking chat as read:', error);
    }
  }

  /**
   * Start heartbeat monitoring for a socket
   */
  startHeartbeatMonitoring(socket) {
    // Validate socket is connected before starting heartbeat
    if (!socket || !socket.connected) {
      console.warn('⚠️ Cannot start heartbeat for disconnected socket');
      return null;
    }
    
    const heartbeat = setInterval(() => {
      // Check if socket is still connected before sending ping
      if (socket.connected) {
        const startTime = Date.now();
        socket.emit('ping', startTime, (responseTime) => {
          if (responseTime) {
            const latency = Date.now() - responseTime;
            this.connectionHealth.set(socket.id, {
              lastPing: new Date(),
              latency,
              status: 'healthy'
            });
          }
        });
      } else {
        // Socket is disconnected, clear the interval
        clearInterval(heartbeat);
        this.connectionHealth.delete(socket.id);
        
        // Remove reference from socket if it exists
        if (socket.heartbeatInterval === heartbeat) {
          socket.heartbeatInterval = null;
        }
      }
    }, this.socketController.heartbeatInterval);
    
    // Store reference to heartbeat on socket
    socket.heartbeatInterval = heartbeat;
    
    console.log(`💓 Heartbeat monitoring started for socket: ${socket.id}`);
    return heartbeat;
  }

  /**
   * Handle disconnect with comprehensive cleanup
   */
  async handleDisconnectEnhanced(socket, reason) {
    try {
      // Get user information with proper fallbacks
      const userId = socket.user?.profileid || socket.userId;
      const username = socket.user?.username || socket.username;
      
      console.log(`🚪 User disconnected: ${username} (${userId}) - Reason: ${reason}`);
      
      // Emit disconnect reason to client for better reconnection strategy
      // Classify disconnect reasons for appropriate reconnection strategy
      let disconnectType = 'network';
      
      if (reason === 'io server disconnect') {
        disconnectType = 'server';
      } else if (reason === 'io client disconnect') {
        disconnectType = 'client';
      } else if (reason.includes('unauthorized') || reason.includes('auth')) {
        disconnectType = 'auth_failed';
      } else if (reason.includes('timeout') || reason.includes('network') || reason.includes('transport')) {
        disconnectType = 'network';
      } else {
        disconnectType = 'unknown';
      }
      
      // Notify client about disconnect reason
      socket.emit('disconnect_reason', {
        reason: disconnectType,
        originalReason: reason,
        timestamp: new Date().toISOString()
      });
      
      // Clean up user tracking
      if (userId) {
        this.onlineUsers.delete(userId);
        
        // Update online status in database
        try {
          await this.updateUserOnlineStatus(userId, false);
        } catch (error) {
          console.warn('Failed to update offline status:', error.message);
        }
      }
      
      // Clean up socket tracking
      this.userSockets.delete(socket.id);
      this.connectionHealth.delete(socket.id);
      // Clean up room tracking
      if (this.joinedRooms.has(socket.id)) {
        const rooms = this.joinedRooms.get(socket.id);
        for (const room of rooms) {
          socket.leave(room);
          console.log(`🚪 Socket ${socket.id} left room: ${room}`);
        }
        this.joinedRooms.delete(socket.id);
      }
      
      // Clear heartbeat interval with enhanced cleanup
      if (socket.heartbeatInterval) {
        clearInterval(socket.heartbeatInterval);
        socket.heartbeatInterval = null; // Clear reference
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }
}

export default PresenceHandler;