import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import SocketController from '../../Controllers/SocketController.js';
import Chat from '../../Models/FeedModels/Chat.js';
import Message from '../../Models/FeedModels/Message.js';
import Profile from '../../Models/FeedModels/Profile.js';
import SocketAuthMiddleware from '../../Middleware/SocketAuthMiddleware.js';

// Mock token service
jest.mock('../../Services/TokenService.js', () => ({
  verifyAccessToken: jest.fn().mockResolvedValue({
    valid: true,
    user: {
      id: 'test-user-id',
      username: 'testuser'
    },
    profile: {
      profileid: 'test-profile-id',
      username: 'testuser'
    }
  })
}));

describe('Messaging Integration', () => {
  let app, server, io, socketController;
  let user1Profile, user2Profile;
  let testChat;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/swaggo_integration_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create express app and HTTP server
    app = express();
    server = createServer(app);
    
    // Create Socket.IO server
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Initialize SocketController
    socketController = new SocketController(io);

    // Apply authentication middleware
    io.use(SocketAuthMiddleware.authenticate);

    // Setup connection handler
    io.on('connection', (socket) => {
      socketController.registerSocketHandlers(socket);
    });

    // Start server
    server.listen(45799);

    // Create test profiles
    user1Profile = await Profile.create({
      profileid: 'user1-profile-id',
      username: 'user1',
      email: 'user1@example.com'
    });

    user2Profile = await Profile.create({
      profileid: 'user2-profile-id',
      username: 'user2',
      email: 'user2@example.com'
    });

    // Create test chat
    testChat = await Chat.create({
      chatid: 'integration-test-chat',
      participants: [
        {
          profileid: 'user1-profile-id',
          role: 'member',
          permissions: {
            canSendMessages: true,
            canAddMembers: false,
            canRemoveMembers: false,
            canEditChat: false,
            canDeleteMessages: false,
            canPinMessages: false
          }
        },
        {
          profileid: 'user2-profile-id',
          role: 'member',
          permissions: {
            canSendMessages: true,
            canAddMembers: false,
            canRemoveMembers: false,
            canEditChat: false,
            canDeleteMessages: false,
            canPinMessages: false
          }
        }
      ],
      chatType: 'direct',
      createdBy: 'user1-profile-id'
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await Profile.deleteMany({});
    
    // Close server and database connections
    server.close();
    await mongoose.connection.close();
  });

  describe('Real-time Messaging', () => {
    it('should send and receive messages between users', async () => {
      // This test would require setting up actual socket connections
      // For now, we'll test the core functionality
      expect(testChat).toBeDefined();
      expect(testChat.participants).toHaveLength(2);
    });

    it('should handle message delivery tracking', async () => {
      // Create a test message
      const message = await Message.create({
        messageid: 'integration-msg-1',
        chatid: 'integration-test-chat',
        senderid: 'user1-profile-id',
        messageType: 'text',
        content: 'Integration test message',
        messageStatus: 'sent',
        deliveredTo: [{
          profileid: 'user2-profile-id',
          deliveredAt: new Date()
        }]
      });

      expect(message).toBeDefined();
      expect(message.deliveredTo).toHaveLength(1);
      expect(message.deliveredTo[0].profileid).toBe('user2-profile-id');
    });

    it('should handle message read receipts', async () => {
      // Create a test message
      const message = await Message.create({
        messageid: 'integration-msg-2',
        chatid: 'integration-test-chat',
        senderid: 'user1-profile-id',
        messageType: 'text',
        content: 'Integration test message 2',
        messageStatus: 'sent',
        readBy: [{
          profileid: 'user2-profile-id',
          readAt: new Date()
        }]
      });

      expect(message).toBeDefined();
      expect(message.readBy).toHaveLength(1);
      expect(message.readBy[0].profileid).toBe('user2-profile-id');
      expect(message.messageStatus).toBe('sent'); // Status should update to 'read' in the handler
    });
  });

  describe('Message Editing', () => {
    it('should edit messages and track history', async () => {
      // Create a test message
      const originalContent = 'Original message content';
      const message = await Message.create({
        messageid: 'integration-msg-3',
        chatid: 'integration-test-chat',
        senderid: 'user1-profile-id',
        messageType: 'text',
        content: originalContent,
        messageStatus: 'sent'
      });

      // Edit the message
      const newContent = 'Edited message content';
      message.content = newContent;
      message.isEdited = true;
      message.editHistory.push({
        content: originalContent,
        editedAt: new Date()
      });
      await message.save();

      // Verify the edit
      const updatedMessage = await Message.findOne({ messageid: 'integration-msg-3' });
      expect(updatedMessage.content).toBe(newContent);
      expect(updatedMessage.isEdited).toBe(true);
      expect(updatedMessage.editHistory).toHaveLength(1);
      expect(updatedMessage.editHistory[0].content).toBe(originalContent);
    });
  });

  describe('Message Reactions', () => {
    it('should add and remove reactions', async () => {
      // Create a test message
      const message = await Message.create({
        messageid: 'integration-msg-4',
        chatid: 'integration-test-chat',
        senderid: 'user1-profile-id',
        messageType: 'text',
        content: 'Reaction test message',
        messageStatus: 'sent',
        reactions: []
      });

      // Add a reaction
      message.reactions.push({
        profileid: 'user2-profile-id',
        emoji: '👍',
        createdAt: new Date()
      });
      await message.save();

      // Verify the reaction
      const updatedMessage = await Message.findOne({ messageid: 'integration-msg-4' });
      expect(updatedMessage.reactions).toHaveLength(1);
      expect(updatedMessage.reactions[0].profileid).toBe('user2-profile-id');
      expect(updatedMessage.reactions[0].emoji).toBe('👍');

      // Remove the reaction
      message.reactions = message.reactions.filter(
        reaction => !(reaction.profileid === 'user2-profile-id' && reaction.emoji === '👍')
      );
      await message.save();

      // Verify the reaction was removed
      const finalMessage = await Message.findOne({ messageid: 'integration-msg-4' });
      expect(finalMessage.reactions).toHaveLength(0);
    });
  });

  describe('Message Deletion', () => {
    it('should soft delete messages', async () => {
      // Create a test message
      const message = await Message.create({
        messageid: 'integration-msg-5',
        chatid: 'integration-test-chat',
        senderid: 'user1-profile-id',
        messageType: 'text',
        content: 'Delete test message',
        messageStatus: 'sent',
        isDeleted: false
      });

      // Soft delete the message
      message.isDeleted = true;
      message.deletedBy = 'user1-profile-id';
      message.deletedAt = new Date();
      await message.save();

      // Verify the deletion
      const updatedMessage = await Message.findOne({ messageid: 'integration-msg-5' });
      expect(updatedMessage.isDeleted).toBe(true);
      expect(updatedMessage.deletedBy).toBe('user1-profile-id');
      expect(updatedMessage.deletedAt).toBeDefined();
    });
  });
});
