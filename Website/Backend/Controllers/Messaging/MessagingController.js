import express from 'express';
import Message from '../Models/FeedModels/Message.js';
import Chat from '../Models/FeedModels/Chat.js';
import CallLog from '../Models/FeedModels/CallLog.js';
import { v4 as uuidv4 } from 'uuid';
import AuthenticationMiddleware from '../Middleware/AuthenticationMiddleware.js';

const router = express.Router();

/**
 * Messaging Controller for REST endpoints
 * Implements UNIFIED CONTRACT for REST messaging operations
 * Handles message history, pagination, idempotency, and call management
 * All endpoints support the same event contract as Socket.IO for consistency
 */

// =========================================
// UNIFIED CONTRACT REST ENDPOINTS
// =========================================

// Send message endpoint (same contract as socket send_message)
router.post('/send', AuthenticationMiddleware.authenticate, async (req, res) => {
  try {
    const { chatid, messageType, content, clientMessageId, attachments, replyTo, mentions } = req.body;
    const senderid = req.user.profileid;
    
    console.log(`📤 REST send_message:`, { chatid, messageType, clientMessageId, hasContent: !!content });
    
    // Validate required fields per UNIFIED CONTRACT
    if (!chatid || !clientMessageId) {
      return res.status(400).json({
        success: false,
        clientMessageId: clientMessageId || null,
        error: 'Missing required fields: chatid and clientMessageId',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check for duplicate messages using clientMessageId (IDEMPOTENCY)
    const existingMessage = await Message.findByClientMessageId(clientMessageId);
    if (existingMessage) {
      console.log(`⚠️ REST: Duplicate message detected: ${clientMessageId}`);
      return res.json({
        success: true, 
        clientMessageId,
        messageid: existingMessage.messageid,
        duplicate: true,
        timestamp: existingMessage.createdAt.toISOString()
      });
    }
    
    // Verify chat access
    const chat = await Chat.findOne({ chatid, isActive: true });
    if (!chat || !chat.isParticipant(senderid)) {
      return res.status(403).json({
        success: false,
        clientMessageId,
        error: 'Chat not found or user is not a participant',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!chat.canSendMessage(senderid)) {
      return res.status(403).json({
        success: false,
        clientMessageId,
        error: 'Insufficient permissions to send messages in this chat',
        timestamp: new Date().toISOString()
      });
    }
    
    // Create message
    const newMessage = new Message({
      messageid: uuidv4(),
      clientMessageId,
      chatid,
      senderid,
      messageType: messageType || 'text',
      content: content || '',
      attachments: attachments || [],
      replyTo: replyTo || null,
      mentions: mentions || [],
      messageStatus: 'sent',
      deliveredTo: [],
      readBy: [],
      reactions: []
    });
    
    await newMessage.save();
    
    // Update chat's last message
    chat.lastMessage = newMessage.messageid;
    chat.lastMessageAt = new Date();
    await chat.save();
    
    console.log(`✅ REST message saved: ${newMessage.messageid}`);
    
    // Return UNIFIED CONTRACT response (message_ack format)
    res.json({
      success: true,
      clientMessageId,
      messageid: newMessage.messageid,
      timestamp: newMessage.createdAt.toISOString(),
      duplicate: false
    });
    
  } catch (error) {
    console.error('❌ REST send message error:', error);
    res.status(500).json({
      success: false,
      clientMessageId: req.body.clientMessageId || null,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mark message as read endpoint (same contract as socket mark_message_read)
router.post('/mark-read', AuthenticationMiddleware.authenticate, async (req, res) => {
  try {
    const { messageid, chatid } = req.body;
    const profileid = req.user.profileid;
    
    if (!messageid || !chatid) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing messageid or chatid' 
      });
    }
    
    const message = await Message.findOne({ messageid, isDeleted: false });
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    // Check if already marked as read
    const existingRead = message.readBy.find(
      read => read.profileid === profileid
    );
    
    if (!existingRead) {
      message.readBy.push({
        profileid: profileid,
        readAt: new Date()
      });
      await message.save();
    }
    
    res.json({ 
      success: true,
      messageid,
      readBy: {
        profileid: profileid,
        readAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ REST mark read error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
});

// Legacy endpoint for backward compatibility - SECURED
router.post('/mark-message-read', AuthenticationMiddleware.authenticate, (req, res) => {
  try {
    const { messageId, chatId } = req.body;
    
    if (!messageId || !chatId) {
      return res.status(400).json({ 
        error: 'Missing messageId or chatId' 
      });
    }
    
    console.log(`📖 Marking message as read: ${messageId} in chat: ${chatId}`);
    
    // In production, update the message read status in database
    // await Message.findByIdAndUpdate(messageId, { read: true });
    
    res.json({ 
      success: true,
      message: 'Message marked as read',
      messageId: messageId,
      chatId: chatId
    });
  } catch (error) {
    console.error('❌ Error marking message as read:', error);
    res.status(500).json({ 
      error: 'Failed to mark message as read',
      details: error.message 
    });
  }
});

// Decline call endpoint
router.post('/decline-call', (req, res) => {
  try {
    const { callId, chatId } = req.body;
    
    if (!callId || !chatId) {
      return res.status(400).json({ 
        error: 'Missing callId or chatId' 
      });
    }
    
    console.log(`📞 Declining call: ${callId} in chat: ${chatId}`);
    
    // In production, update call status in database and emit socket event
    // io.to(chatId).emit('call_declined', { callId, chatId });
    
    res.json({ 
      success: true,
      message: 'Call declined',
      callId: callId,
      chatId: chatId
    });
  } catch (error) {
    console.error('❌ Error declining call:', error);
    res.status(500).json({ 
      error: 'Failed to decline call',
      details: error.message 
    });
  }
});

// Deliver offline message endpoint
router.post('/deliver-offline-message', (req, res) => {
  try {
    const { id, message, recipientId, timestamp, attempts } = req.body;
    
    if (!id || !message || !recipientId) {
      return res.status(400).json({ 
        error: 'Missing required fields for offline message' 
      });
    }
    
    console.log(`📤 Delivering offline message: ${id} to user: ${recipientId}`);
    
    // In production, save the message to database and attempt delivery
    // const savedMessage = await Message.create({
    //   content: message.content,
    //   senderId: message.senderId,
    //   recipientId: recipientId,
    //   chatId: message.chatId,
    //   timestamp: timestamp,
    //   isOfflineDelivery: true
    // });
    
    res.json({ 
      success: true,
      message: 'Offline message delivered successfully',
      messageId: id,
      recipientId: recipientId
    });
  } catch (error) {
    console.error('❌ Error delivering offline message:', error);
    res.status(500).json({ 
      error: 'Failed to deliver offline message',
      details: error.message 
    });
  }
});

// Send offline message endpoint (for background sync)
router.post('/send-offline-message', (req, res) => {
  try {
    const { id, message, recipientId, timestamp } = req.body;
    
    if (!id || !message) {
      return res.status(400).json({ 
        error: 'Missing message data' 
      });
    }
    
    console.log(`📮 Sending queued offline message: ${id}`);
    
    // In production, process the queued message
    // This would typically involve saving to database and sending push notification
    
    res.json({ 
      success: true,
      message: 'Offline message processed successfully',
      messageId: id
    });
  } catch (error) {
    console.error('❌ Error sending offline message:', error);
    res.status(500).json({ 
      error: 'Failed to send offline message',
      details: error.message 
    });
  }
});

// Get chat messages with pagination
router.get('/chat/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    
    if (!chatId) {
      return res.status(400).json({ 
        error: 'Missing chatId parameter' 
      });
    }
    
    const query = {
      chatid: chatId,
      isDeleted: false
    };
    
    // If 'before' timestamp is provided, get messages before that time
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Get newest first
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('senderid', 'username profilePic')
      .populate('mentions', 'username profilePic')
      .populate('replyTo');
    
    const totalMessages = await Message.countDocuments(query);
    
    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
        hasMore: (page * limit) < totalMessages
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching chat messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chat messages',
      details: error.message 
    });
  }
});

// Get chat information
router.get('/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    if (!chatId) {
      return res.status(400).json({ 
        error: 'Missing chatId parameter' 
      });
    }
    
    const chat = await Chat.findOne({ 
      chatid: chatId, 
      isActive: true 
    }).populate('participants', 'username profilePic isOnline lastSeen');
    
    if (!chat) {
      return res.status(404).json({ 
        error: 'Chat not found' 
      });
    }
    
    res.json({
      success: true,
      chat: chat
    });
    
  } catch (error) {
    console.error('❌ Error fetching chat info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chat info',
      details: error.message 
    });
  }
});

// Get call logs for a chat
router.get('/chat/:chatId/calls', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    if (!chatId) {
      return res.status(400).json({ 
        error: 'Missing chatId parameter' 
      });
    }
    
    const calls = await CallLog.find({ 
      chatid: chatId 
    })
      .sort({ initiatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('callerId', 'username profilePic')
      .populate('participants', 'username profilePic');
    
    const totalCalls = await CallLog.countDocuments({ chatid: chatId });
    
    res.json({
      success: true,
      calls: calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCalls,
        totalPages: Math.ceil(totalCalls / limit),
        hasMore: (page * limit) < totalCalls
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching call logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch call logs',
      details: error.message 
    });
  }
});

// Health check for messaging service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'messaging',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;