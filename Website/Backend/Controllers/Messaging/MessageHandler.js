import Chat from '../Models/FeedModels/Chat.js';
import Message from '../Models/FeedModels/Message.js';
import Profile from '../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';
import socketRateLimiter from '../Middleware/RateLimiter.js';
import XSSSanitizer from '../Utils/XSSSanitizer.js';
import { logger } from '../utils/SanitizedLogger.js';
import webpush from 'web-push';
import dayjs from 'dayjs';

/**
 * @class MessageHandler
 * @classdesc Handles all message-related socket events and operations
 * 
 * Separated from SocketController to reduce God class complexity and improve maintainability
 */
class MessageHandler {
  constructor(socketController) {
    this.socketController = socketController;
    this.io = socketController.io;
    this.onlineUsers = socketController.onlineUsers;
    this.userSockets = socketController.userSockets;
    this.offlineMessageQueue = socketController.offlineMessageQueue;
    this.joinedRooms = socketController.joinedRooms;
    this.recentMessageIds = socketController.recentMessageIds;
    this.recentMessageIdsMaxSize = socketController.recentMessageIdsMaxSize;
    this.recentMessageIdsWindowMs = socketController.recentMessageIdsWindowMs;
    this.typingTimeouts = socketController.typingTimeouts;
  }

  /**
   * Handle sending a message through socket
   */
  async handleSendMessage(socket, data, callback) {
    try {
      console.log('📨 send_message event received:', data);
      const { chatid, messageType, content, clientMessageId, attachments, replyTo, mentions } = data;
      
      console.log(`📤 Processing send_message:`, { chatid, messageType, clientMessageId, hasContent: !!content, hasAttachments: attachments?.length > 0 });
      
      // Remove redundant in-memory idempotency check
      // Database unique index is the single source of truth for duplicate detection
      
      // SECURITY: Rate limiting check
      const rateLimitCheck = socketRateLimiter.isRateLimited(
        socket.user?.profileid,
        socket.handshake.address,
        'sendMessage'
      );
      
      if (rateLimitCheck.limited) {
        console.warn(`🚨 Rate limited message from ${socket.user?.username}: ${rateLimitCheck.type}`);
        const ackResponse = {
          success: false,
          clientMessageId,
          error: `Rate limit exceeded. Please wait ${rateLimitCheck.retryAfter} seconds.`,
          code: 'RATE_LIMITED',
          retryAfter: rateLimitCheck.retryAfter,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      // Validate required fields per UNIFIED CONTRACT
      if (!chatid || !clientMessageId) {
        const error = 'Missing required fields: chatid and clientMessageId';
        const ackResponse = {
          success: false,
          clientMessageId: clientMessageId || null,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      // SIMPLIFIED: Check if socket has joined chat room, reject if not
      if (!this.joinedRooms.has(socket.id) || !this.joinedRooms.get(socket.id).has(chatid)) {
        const error = 'User must join chat room before sending messages';
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          code: 'NOT_IN_CHAT_ROOM',
          timestamp: new Date().toISOString()
        };
        console.error(`❌ Message rejected - user not in chat room: ${chatid}, user: ${socket.user.profileid}`);
        // Emit detailed error event to client
        socket.emit('message_send_error', {
          clientMessageId,
          error,
          code: 'NOT_IN_CHAT_ROOM',
          chatid,
          timestamp: new Date().toISOString(),
          details: {
            requiredAction: 'join_chat',
            resolution: 'User must join the chat room before sending messages',
            userId: socket.user.profileid,
            username: socket.user.username
          }
        });
        if (callback) callback(ackResponse);
        return;
      }
      
      // Validate message content per message type
      if (messageType === 'text' || messageType === 'system') {
        if (!content) {
          const error = 'Missing required field: content for text/system message';
          const ackResponse = {
            success: false,
            clientMessageId,
            error,
            timestamp: new Date().toISOString()
          };
          if (callback) callback(ackResponse);
          return;
        }
      }
      
      // Validate media message types
      if (messageType === 'sticker' && !data.stickerData) {
        const error = 'Missing required field: stickerData for sticker message';
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      if (messageType === 'gif' && !data.gifData) {
        const error = 'Missing required field: gifData for gif message';
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      if (messageType === 'voice' && !data.voiceData) {
        const error = 'Missing required field: voiceData for voice message';
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      if ((messageType === 'image' || messageType === 'video' || messageType === 'audio' || messageType === 'document') && !data.fileData) {
        const error = `Missing required field: fileData for ${messageType} message`;
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      // Validate that message has content or media data
      const hasTextContent = content && content.trim();
      const hasMediaData = data.stickerData || data.gifData || data.voiceData || data.fileData;
      const hasAttachments = attachments && attachments.length > 0;
      
      if (!hasTextContent && !hasMediaData && !hasAttachments) {
        const error = 'Message must have content, media data, or attachments';
        const ackResponse = {
          success: false,
          clientMessageId,
          error,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      // Verify user has access to this chat and can send messages
      const chat = await Chat.findOne({ chatid, isActive: true });
      
      if (!chat || !chat.isParticipant(socket.user.profileid)) {
        const errorMsg = 'Chat not found or user is not a participant';
        const ackResponse = {
          success: false,
          clientMessageId,
          error: errorMsg,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      if (!chat.canSendMessage(socket.user.profileid)) {
        const errorMsg = 'Insufficient permissions to send messages in this chat';
        const ackResponse = {
          success: false,
          clientMessageId,
          error: errorMsg,
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      console.log('🔧 Creating message with validated parameters:', {
        chatid: typeof chatid,
        senderid: typeof socket.user.profileid,
        messageType,
        hasContent: !!content,
        attachmentsCount: Array.isArray(attachments) ? attachments.length : 0
      });
      
      console.log('🔧 [BACKEND] Creating message with media data:', {
        messageType,
        hasStickerData: !!data.stickerData,
        hasGifData: !!data.gifData,
        hasVoiceData: !!data.voiceData,
        hasFileData: !!data.fileData,
        hasContent: !!content,
        hasAttachments: !!(attachments && attachments.length > 0)
      });
      
      // Prepare message data for atomic creation
      const messageData = {
        messageid: uuidv4(),
        clientMessageId: String(clientMessageId), // Ensure string
        chatid: String(chatid), // Ensure string, not object
        senderid: String(socket.user.profileid), // Ensure string
        // receiverId field removed as it's not used - delivery is handled through chat participants
        messageType: String(messageType || 'text'),
        // 🔒 SECURITY FIX: XSS sanitization for all text content
        content: content ? XSSSanitizer.sanitizeMessageContent(String(content)) : '',
        attachments: Array.isArray(attachments) ? attachments : [],
        replyTo: replyTo ? String(replyTo) : null,
        mentions: Array.isArray(mentions) ? mentions : [],
        messageStatus: 'sent',
        deliveredTo: [], // Track delivery status
        readBy: [],
        reactions: [],
        isEdited: false,
        isPinned: false,
        // Add support for all message types with enhanced media data handling
        // 🔒 SECURITY FIX: XSS sanitization for media metadata
        ...(messageType === 'sticker' && data.stickerData && { 
          stickerData: {
            id: data.stickerData.id,
            name: XSSSanitizer.sanitizeMediaMetadata(data.stickerData.name || ''),
            preview: data.stickerData.preview,
            url: XSSSanitizer.sanitizeURL(data.stickerData.url),
            category: XSSSanitizer.sanitizeMediaMetadata(data.stickerData.category || '')
          }
        }),
        ...(messageType === 'gif' && data.gifData && { 
          gifData: {
            id: data.gifData.id,
            title: XSSSanitizer.sanitizeMediaMetadata(data.gifData.title || ''),
            url: XSSSanitizer.sanitizeURL(data.gifData.url),
            thumbnail: XSSSanitizer.sanitizeURL(data.gifData.thumbnail),
            category: XSSSanitizer.sanitizeMediaMetadata(data.gifData.category || ''),
            dimensions: data.gifData.dimensions
          }
        }),
        ...(messageType === 'voice' && data.voiceData && { 
          voiceData: {
            duration: data.voiceData.duration,
            size: data.voiceData.size,
            mimeType: data.voiceData.mimeType,
            // Store reference to file instead of base64 data
            fileId: data.voiceData.fileId || null,
            url: data.voiceData.url || null
          }
        }),
        ...(data.fileData && ['image', 'video', 'audio', 'document'].includes(messageType) && { 
          fileData: {
            fileId: data.fileData.fileId || null,
            name: XSSSanitizer.sanitizeMediaMetadata(data.fileData.name),
            size: data.fileData.size,
            mimeType: data.fileData.mimeType,
            url: data.fileData.url || null
          }
        }),
        // Legacy support
        ...(messageType === 'poll' && data.pollData && { pollData: data.pollData }),
        ...(messageType === 'location' && data.locationData && { locationData: data.locationData }),
        ...(messageType === 'contact' && data.contactData && { contactData: data.contactData })
      };
      
      // 🔄 ENHANCED: Improved lightweight burst duplicate check (30-second window)
      // DB unique index is the actual source of truth for duplicates
      const burstKey = `${clientMessageId}_${chatid}`;
      const now = Date.now();
      const recentTimestamp = this.recentMessageIds.get(burstKey);
      
      // 🔧 FIX Issue #11: Extended duplicate detection window to 30 seconds
      if (recentTimestamp && (now - recentTimestamp) < this.recentMessageIdsWindowMs) {
        console.warn(`⚠️ Burst duplicate detected: ${burstKey} within ${now - recentTimestamp}ms (30s window)`);
        const ackResponse = {
          success: false,
          clientMessageId,
          error: 'Duplicate message - burst detected within 30-second window',
          code: 'BURST_DUPLICATE',
          timestamp: new Date().toISOString()
        };
        if (callback) callback(ackResponse);
        return;
      }
      
      // Mark as processing with extended window
      this.recentMessageIds.set(burstKey, now);
      
      // Auto-cleanup if exceeds size
      if (this.recentMessageIds.size > this.recentMessageIdsMaxSize) {
        const oldestKeys = Array.from(this.recentMessageIds.entries())
          .sort(([, a], [, b]) => a - b)
          .slice(0, 1000)
          .map(([key]) => key);
        oldestKeys.forEach(key => this.recentMessageIds.delete(key));
      }
      
      // Use atomic upsert to prevent race conditions and duplicate messages
      // DB handles actual deduplication via unique index on (clientMessageId, chatid)
      let newMessage;
      try {
        if (clientMessageId) {
          // Atomic upsert with clientMessageId to prevent duplicates
          newMessage = await Message.findOneAndUpdate(
            { 
              clientMessageId: String(clientMessageId),
              chatid: String(chatid)
            },
            { $setOnInsert: messageData },
            { 
              upsert: true, 
              new: true, 
              runValidators: true,
              setDefaultsOnInsert: true
            }
          );
          
          // Check if this was an existing message (not newly created)
          const wasNew = newMessage.createdAt && (Date.now() - new Date(newMessage.createdAt).getTime() < 1000);
          if (!wasNew) {
            console.log(`ℹ️ Duplicate message detected by DB: ${clientMessageId}`);
            const ackResponse = {
              success: true, // Success because message was already delivered
              clientMessageId,
              messageid: newMessage.messageid,
              isDuplicate: true,
              timestamp: newMessage.createdAt.toISOString()
            };
            if (callback) callback(ackResponse);
            return;
          }
        } else {
          // If no clientMessageId, create directly (less safe but backward compatible)
          newMessage = new Message(messageData);
          await newMessage.save();
        }
      } catch (error) {
        // Handle duplicate key error gracefully
        if (error.code === 11000) {
          console.log(`⚠️ Duplicate message prevented by database constraint: ${clientMessageId}`);
          // Try to find the existing message
          const existingMessage = await Message.findOne({
            clientMessageId: String(clientMessageId),
            chatid: String(chatid)
          });
          
          if (existingMessage) {
            const ackResponse = {
              success: true, 
              clientMessageId,
              messageid: existingMessage.messageid,
              isDuplicate: true,
              timestamp: existingMessage.createdAt.toISOString()
            };
            if (callback) callback(ackResponse);
            return;
          }
        }
        throw error; // Re-throw if not a duplicate key error
      }
      
      // 🔧 FIX: Update chat's last message and increment per-participant unread count
      chat.lastMessage = newMessage.messageid;
      chat.lastMessageAt = new Date();
      
      // ✅ INCREMENT UNREAD COUNT: For each participant except sender (Issue #16)
      // Update per-participant unreadCount instead of global count
      chat.participants.forEach(participant => {
        if (participant.profileid !== socket.user.profileid) {
          participant.unreadCount = (participant.unreadCount || 0) + 1;
        }
      });
      
      await chat.save();
      
      console.log(`📊 Chat updated: lastMessage=${newMessage.messageid}, unreadCount=${chat.unreadCount}`);
      
      const messagePayload = {
        message: newMessage,
        chat: {
          chatid: chat.chatid,
          lastMessageAt: chat.lastMessageAt
        },
        timestamp: dayjs().toISOString()
      };
      
      // Track delivery status for each participant
      const deliveryPromises = [];
      const offlineUsers = [];
      
      // CRITICAL FIX: Get all chat participants except sender (handle object participants)
      console.log('🔍 Message delivery debug:');
      console.log('  - Chat ID:', chatid);
      console.log('  - Sender:', socket.user.profileid);
      console.log('  - Chat participants:', chat.participants);
      console.log('  - Online users map:', Array.from(this.onlineUsers.entries()));
      
      const recipients = chat.participants
        .filter(p => p.profileid !== socket.user.profileid)
        .map(p => p.profileid);
      
      console.log('  - Filtered recipients:', recipients);
      
      for (const recipientId of recipients) {
        console.log('🔍 Looking up socket for recipient:', recipientId);
        const recipientSocket = this.onlineUsers.get(recipientId);
        console.log('🔍 Found socket:', recipientSocket);
        
        if (recipientSocket) {
          // User is online - send message and track delivery
          console.log('📤 Sending message to socket:', recipientSocket);
          this.io.to(recipientSocket).emit('new_message', messagePayload);
          console.log('✅ Message sent to recipient:', recipientId);
          
          // Also emit using the frontend expected event name for backward compatibility
          this.io.to(recipientSocket).emit('message', messagePayload);
          
          // Mark as delivered
          deliveryPromises.push(
            Message.findOneAndUpdate(
              { messageid: newMessage.messageid },
              {
                messageStatus: 'delivered',
                $push: {
                  deliveredTo: {
                    profileid: recipientId,
                    deliveredAt: new Date()
                  }
                }
              }
            )
          );
          
          // Send delivery confirmation to sender using UNIFIED CONTRACT
          socket.emit('message_delivered', {
            messageid: newMessage.messageid,
            deliveredTo: recipientId,
            deliveredAt: new Date().toISOString()
          });
          
          // Also emit the event using the frontend expected name for backward compatibility
          socket.emit('message_status_update', {
            messageid: newMessage.messageid,
            status: 'delivered',
            deliveredTo: recipientId,
            deliveredAt: new Date().toISOString()
          });
          
        } else {
          // User is offline - queue message
          console.log(`📱 User offline, queuing message for: ${recipientId}`);
          offlineUsers.push(recipientId);
          
          if (!this.offlineMessageQueue.has(recipientId)) {
            this.offlineMessageQueue.set(recipientId, []);
          }
          
          this.offlineMessageQueue.get(recipientId).push({
            messageid: newMessage.messageid,
            message: newMessage,
            chat: {
              chatid: chat.chatid,
              lastMessageAt: chat.lastMessageAt
            },
            timestamp: dayjs().toISOString(),
            queuedAt: new Date()
          });
          
          // Send push notification for offline users
          await this.sendPushNotification(recipientId, {
            title: `New message from ${socket.user.username}`,
            body: content.length > 50 ? content.substring(0, 47) + '...' : content,
            data: {
              type: 'message',
              chatid: chatid,
              messageid: newMessage.messageid,
              senderId: socket.user.profileid
            }
          });
        }
      }
      
      // Wait for all delivery updates to complete
      await Promise.all(deliveryPromises);
      
      console.log(`💬 Message sent in ${chatid} by ${socket.user.username} - Delivered: ${recipients.length - offlineUsers.length}, Queued: ${offlineUsers.length}`);
      
      // Send acknowledgment with UNIFIED CONTRACT format (message_ack)
      if (callback) {
        const ackResponse = {
          success: true,
          clientMessageId: clientMessageId,
          messageid: newMessage.messageid,
          timestamp: newMessage.createdAt.toISOString(),
          duplicate: false
        };
        callback(ackResponse);
      }
      
      // No need to clean up idempotency key as we're using database unique index
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (callback) {
        const ackResponse = {
          success: false,
          clientMessageId: data.clientMessageId || null,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        callback(ackResponse);
      }
    }
  }

  /**
   * Handle typing start event
   */
  handleTypingStart(socket, chatid) {
    // Store typing timeout to ensure reliable stop
    if (!this.typingTimeouts) {
      this.typingTimeouts = new Map();
    }
    
    // Clear any existing timeout for this user in this chat
    const timeoutKey = `${socket.user.profileid}-${chatid}`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey));
    }
    
    // Set new timeout to auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      this.handleTypingStop(socket, chatid);
      this.typingTimeouts.delete(timeoutKey);
    }, 3000);
    
    this.typingTimeouts.set(timeoutKey, timeout);
    
    socket.to(chatid).emit('user_typing', {
      profileid: socket.user.profileid,
      username: socket.user.username,
      isTyping: true
    });
    
    // Also emit using the frontend expected event name for backward compatibility
    socket.to(chatid).emit('typing_start', {
      profileid: socket.user.profileid,
      username: socket.user.username,
      isTyping: true
    });
  }

  /**
   * Handle typing stop event
   */
  handleTypingStop(socket, chatid) {
    // Clear typing timeout if it exists
    if (this.typingTimeouts) {
      const timeoutKey = `${socket.user.profileid}-${chatid}`;
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey));
        this.typingTimeouts.delete(timeoutKey);
      }
    }
    
    socket.to(chatid).emit('user_typing', {
      profileid: socket.user.profileid,
      username: socket.user.username,
      isTyping: false
    });
    
    // Also emit using the frontend expected event name for backward compatibility
    socket.to(chatid).emit('typing_stop', {
      profileid: socket.user.profileid,
      username: socket.user.username,
      isTyping: false
    });
  }

  /**
   * Handle marking a message as read
   */
  async handleMarkMessageRead(socket, data) {
    try {
      const { messageid, chatid } = data;
      
      const message = await Message.findOne({ messageid, isDeleted: false });
      if (!message) {
        socket.emit('error', 'Message not found');
        return;
      }
      
      // Check if already marked as read
      const existingRead = message.readBy.find(
        read => read.profileid === socket.user.profileid
      );
      
      if (!existingRead) {
        message.readBy.push({
          profileid: socket.user.profileid,
          readAt: new Date()
        });
        await message.save();
        
        // Broadcast read status to other participants using UNIFIED CONTRACT
        socket.to(chatid).emit('message_read', {
          messageid,
          readBy: {
            profileid: socket.user.profileid,
            username: socket.user.username,
            readAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('error', 'Failed to mark message as read');
    }
  }

  /**
   * Handle reacting to a message
   */
  async handleReactToMessage(socket, data) {
    try {
      console.log('🎭 [BACKEND] Processing message reaction:', {
        socketUser: socket.user?.profileid,
        data,
        timestamp: new Date().toISOString()
      });
      
      const { messageid, emoji, chatid } = data;
      
      // Validate required fields
      if (!messageid || !emoji || !chatid) {
        const error = 'Missing required fields: messageid, emoji, or chatid';
        console.error('❌ [BACKEND] Reaction validation failed:', { messageid, emoji, chatid });
        socket.emit('error', error);
        return;
      }
      
      // Verify user is authenticated
      if (!socket.user?.profileid) {
        const error = 'User not authenticated';
        console.error('❌ [BACKEND] Reaction failed - user not authenticated');
        socket.emit('error', error);
        return;
      }
      
      const message = await Message.findOne({ messageid, isDeleted: false });
      if (!message) {
        const error = 'Message not found or deleted';
        console.error('❌ [BACKEND] Message not found for reaction:', messageid);
        socket.emit('error', error);
        return;
      }
      
      console.log('📝 [BACKEND] Found message for reaction:', {
        messageId: message.messageid,
        currentReactions: message.reactions?.length || 0,
        chatId: message.chatid
      });
      
      // Verify the message belongs to the specified chat
      if (message.chatid !== chatid) {
        const error = 'Message does not belong to specified chat';
        console.error('❌ [BACKEND] Chat ID mismatch:', {
          messageChat: message.chatid,
          providedChat: chatid
        });
        socket.emit('error', error);
        return;
      }
      
      // Check if user already reacted with this emoji
      const existingReactionIndex = message.reactions.findIndex(
        reaction => reaction.profileid === socket.user.profileid && reaction.emoji === emoji
      );
      
      let actionType = '';
      if (existingReactionIndex > -1) {
        // Remove existing reaction (toggle off)
        message.reactions.splice(existingReactionIndex, 1);
        actionType = 'removed';
        console.log('🔄 [BACKEND] Removing existing reaction:', { emoji, userId: socket.user.profileid });
      } else {
        // Add new reaction (allow multiple reactions per user)
        message.reactions.push({
          profileid: socket.user.profileid,
          emoji,
          createdAt: new Date()
        });
        actionType = 'added';
        console.log('➕ [BACKEND] Adding new reaction:', { emoji, userId: socket.user.profileid });
      }
      
      // Save the updated message
      await message.save();
      console.log('💾 [BACKEND] Message reactions updated and saved:', {
        messageId: messageid,
        totalReactions: message.reactions.length,
        actionType
      });
      
      // Prepare reaction data for broadcast
      const reactionData = {
        messageid,
        chatid,
        action: actionType, // 'added' or 'removed'
        reaction: {
          profileid: socket.user.profileid,
          username: socket.user.username || 'Unknown User',
          emoji,
          createdAt: new Date().toISOString()
        },
        allReactions: message.reactions // Include all current reactions for sync
      };
      
      // Broadcast reaction to all participants in the chat (including sender for confirmation)
      console.log('📡 [BACKEND] Broadcasting message reaction to chat:', chatid);
      this.io.to(chatid).emit('message_reaction', reactionData);
      
      // Also send confirmation back to the sender
      socket.emit('reaction_confirmation', {
        success: true,
        messageid,
        emoji,
        action: actionType,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ [BACKEND] Message reaction processed successfully:', {
        messageId: messageid,
        userId: socket.user.profileid,
        emoji,
        action: actionType,
        broadcastedTo: chatid
      });
      
    } catch (error) {
      console.error('❌ [BACKEND] Error processing message reaction:', {
        error: error.message,
        stack: error.stack,
        data,
        userId: socket.user?.profileid
      });
      socket.emit('error', 'Failed to react to message: ' + error.message);
    }
  }

  /**
   * Handle editing a message
   */
  async handleEditMessage(socket, data, callback) {
    try {
      console.log('✏️ [BACKEND] Processing message edit:', {
        socketUser: socket.user?.profileid,
        data,
        timestamp: new Date().toISOString()
      });
      
      const { messageid, content, chatid } = data;
      
      // Validate required fields
      if (!messageid || !content || !chatid) {
        const error = 'Missing required fields: messageid, content, or chatid';
        console.error('❌ [BACKEND] Edit validation failed:', { messageid, content, chatid });
        socket.emit('error', error);
        return;
      }
      
      // Verify user is authenticated
      if (!socket.user?.profileid) {
        const error = 'User not authenticated';
        console.error('❌ [BACKEND] Edit failed - user not authenticated');
        socket.emit('error', error);
        return;
      }
      
      const message = await Message.findOne({ messageid, isDeleted: false });
      if (!message) {
        const error = 'Message not found or deleted';
        console.error('❌ [BACKEND] Message not found for edit:', messageid);
        socket.emit('error', error);
        return;
      }
      
      console.log('📝 [BACKEND] Found message for edit:', {
        messageId: message.messageid,
        currentContent: message.content,
        chatId: message.chatid
      });
      
      // Verify the message belongs to the specified chat
      if (message.chatid !== chatid) {
        const error = 'Message does not belong to specified chat';
        console.error('❌ [BACKEND] Chat ID mismatch:', {
          messageChat: message.chatid,
          providedChat: chatid
        });
        socket.emit('error', error);
        return;
      }
      
      // Verify user is the sender of the message
      if (message.senderid !== socket.user.profileid) {
        const error = 'Unauthorized: Can only edit your own messages';
        console.error('❌ [BACKEND] Edit unauthorized:', {
          messageSender: message.senderid,
          requestingUser: socket.user.profileid
        });
        socket.emit('error', error);
        return;
      }
      
      // Store edit history
      message.editHistory.push({
        content: message.content,
        editedAt: new Date()
      });
      
      // Update message content
      message.content = content;
      message.isEdited = true;
      message.updatedAt = new Date();
      
      // Save the updated message
      await message.save();
      console.log('💾 [BACKEND] Message updated and saved:', {
        messageId: messageid,
        newContent: message.content,
        editHistoryCount: message.editHistory.length
      });
      
      // Prepare edit data for broadcast
      const editData = {
        messageid,
        chatid,
        content: message.content,
        isEdited: message.isEdited,
        editHistory: message.editHistory,
        updatedAt: message.updatedAt.toISOString()
      };
      
      // Broadcast edit to all participants in the chat
      console.log('📡 [BACKEND] Broadcasting message edit to chat:', chatid);
      this.io.to(chatid).emit('message_edited', editData);
      
      // ✅ Send acknowledgment callback if provided
      if (callback) {
        callback({
          success: true,
          messageid,
          content: message.content,
          timestamp: new Date().toISOString()
        });
      }
      
      // Also send confirmation event back to the sender
      socket.emit('edit_confirmation', {
        success: true,
        messageid,
        content: message.content,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ [BACKEND] Message edit processed successfully:', {
        messageId: messageid,
        userId: socket.user.profileid,
        broadcastedTo: chatid
      });
      
    } catch (error) {
      console.error('❌ [BACKEND] Error processing message edit:', {
        error: error.message,
        stack: error.stack,
        data,
        userId: socket.user?.profileid
      });
      
      // ❌ Send error acknowledgment callback if provided
      if (callback) {
        callback({
          success: false,
          error: error.message
        });
      }
      
      socket.emit('error', 'Failed to edit message: ' + error.message);
    }
  }

  /**
   * Handle deleting a message
   */
  async handleDeleteMessage(socket, data) {
    try {
      console.log('🗑️ [BACKEND] Processing message delete:', {
        socketUser: socket.user?.profileid,
        data,
        timestamp: new Date().toISOString()
      });
      
      const { messageid, chatid, deleteForEveryone } = data;
      
      // Validate required fields
      if (!messageid || !chatid) {
        const error = 'Missing required fields: messageid or chatid';
        console.error('❌ [BACKEND] Delete validation failed:', { messageid, chatid });
        socket.emit('error', error);
        return;
      }
      
      // Verify user is authenticated
      if (!socket.user?.profileid) {
        const error = 'User not authenticated';
        console.error('❌ [BACKEND] Delete failed - user not authenticated');
        socket.emit('error', error);
        return;
      }
      
      const message = await Message.findOne({ messageid });
      if (!message) {
        const error = 'Message not found';
        console.error('❌ [BACKEND] Message not found for delete:', messageid);
        socket.emit('error', error);
        return;
      }
      
      console.log('📝 [BACKEND] Found message for delete:', {
        messageId: message.messageid,
        currentDeletedStatus: message.isDeleted,
        chatId: message.chatid
      });
      
      // Verify the message belongs to the specified chat
      if (message.chatid !== chatid) {
        const error = 'Message does not belong to specified chat';
        console.error('❌ [BACKEND] Chat ID mismatch:', {
          messageChat: message.chatid,
          providedChat: chatid
        });
        socket.emit('error', error);
        return;
      }
      
      // Handle "Delete for me" vs "Delete for everyone"
      if (deleteForEveryone) {
        // Delete for everyone - only the sender can do this
        if (message.senderid !== socket.user.profileid) {
          const error = 'Unauthorized: Can only delete messages for everyone if you sent them';
          console.error('❌ [BACKEND] Delete for everyone unauthorized:', {
            messageSender: message.senderid,
            requestingUser: socket.user.profileid
          });


          socket.emit('error', error);
          return;
        }
        
        // Soft delete - set isDeleted flag
        message.isDeleted = true;
        message.deletedBy = socket.user.profileid;
        message.deletedAt = new Date();
        
        await message.save();
        console.log('💾 [BACKEND] Message soft deleted for everyone:', {
          messageId: messageid,
          deletedBy: socket.user.profileid
        });
        
        // Prepare delete data for broadcast
        const deleteData = {
          messageid,
          chatid,
          isDeleted: message.isDeleted,
          deletedBy: message.deletedBy,
          deletedAt: message.deletedAt.toISOString(),
          deleteForEveryone: true
        };
        
        // Broadcast delete to all participants in the chat
        console.log('📡 [BACKEND] Broadcasting message delete to chat:', chatid);
        this.io.to(chatid).emit('message_deleted', deleteData);
        
        // Also send confirmation back to the sender
        socket.emit('delete_confirmation', {
          success: true,
          messageid,
          deleteForEveryone: true,
          timestamp: new Date().toISOString()
        });
      } else {
        // Delete for me only - mark as deleted for this user only
        // We'll handle this by adding the user to a list of users who have deleted this message
        // For now, we'll just emit to the user that the message is deleted for them
        console.log('💾 [BACKEND] Message marked as deleted for user:', {
          messageId: messageid,
          deletedForUser: socket.user.profileid
        });
        
        // Send confirmation back to the requesting user only
        socket.emit('delete_confirmation', {
          success: true,
          messageid,
          deleteForEveryone: false,
          deletedForUser: socket.user.profileid,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('✅ [BACKEND] Message delete processed successfully:', {
        messageId: messageid,
        userId: socket.user.profileid,
        deleteForEveryone,
        broadcastedTo: deleteForEveryone ? chatid : 'self only'
      });
      
    } catch (error) {
      console.error('❌ [BACKEND] Error processing message delete:', {
        error: error.message,
        stack: error.stack,
        data,
        userId: socket.user?.profileid
      });
      socket.emit('error', 'Failed to delete message: ' + error.message);
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(profileId, notification) {
    try {
      // Check if webpush is configured before attempting to send
      if (!webpushConfigured) {
        // Silently skip push notifications if not configured
        return;
      }
      
      const subscription = this.socketController.pushSubscriptions.get(profileId);
      if (subscription && process.env.VAPID_PUBLIC_KEY) {
        await webpush.sendNotification(subscription, JSON.stringify(notification));
        console.log(`📤 Push notification sent to user ${profileId}`);
      }
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
    }
  }

  /**
   * Handle sending batched messages through socket
   */
  async handleSendBatchedMessages(socket, messages, callback) {
    try {
      console.log('📨 send_message_batch event received:', { messageCount: messages.length });
      
      if (!Array.isArray(messages) || messages.length === 0) {
        const error = 'Invalid batch: messages must be a non-empty array';
        console.warn(`❌ Invalid batch message request: ${error}`);
        if (callback) callback({ success: false, error });
        return;
      }
      
      // Process all messages in the batch
      const acknowledgments = [];
      
      // Process messages sequentially to maintain order and prevent overwhelming the system
      for (const messageData of messages) {
        try {
          // Process each message individually and collect acknowledgments
          const ack = await new Promise((resolve) => {
            this.handleSendMessage(socket, messageData, (response) => {
              resolve(response);
            });
          });
          
          acknowledgments.push(ack);
        } catch (error) {
          console.error('Error processing batch message:', error);
          acknowledgments.push({
            success: false,
            clientMessageId: messageData.clientMessageId || null,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Send batch acknowledgment
      if (callback) {
        callback(acknowledgments);
      }
      
    } catch (error) {
      console.error('Error sending batched messages:', error);
      
      if (callback) {
        callback({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
}

export default MessageHandler;


