/**
 * End-to-End Tests for Critical User Flows
 * 
 * These tests simulate real user interactions with the chat system
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Chat from '../../Models/FeedModels/Chat.js';
import Message from '../../Models/FeedModels/Message.js';
import Profile from '../../Models/FeedModels/Profile.js';
import CallLog from '../../Models/FeedModels/CallLog.js';

describe('End-to-End User Flows', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/swaggo_e2e_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    // Clean up all test data
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await Profile.deleteMany({});
    await CallLog.deleteMany({});
    await mongoose.connection.close();
  });

  describe('User Registration and Profile Setup', () => {
    it('should allow new user registration and profile creation', async () => {
      // Simulate user registration
      const userProfile = await Profile.create({
        profileid: `user-${uuidv4()}`,
        username: 'newuser123',
        email: 'newuser123@example.com',
        name: 'New User',
        bio: 'Just joined the platform!',
        isActive: true,
        accountStatus: 'active',
        role: 'user'
      });

      expect(userProfile).toBeDefined();
      expect(userProfile.username).toBe('newuser123');
      expect(userProfile.email).toBe('newuser123@example.com');
      expect(userProfile.isActive).toBe(true);
      expect(userProfile.accountStatus).toBe('active');
    });
  });

  describe('Chat Creation Flow', () => {
    let user1, user2;

    beforeEach(async () => {
      // Create test users
      user1 = await Profile.create({
        profileid: `user1-${uuidv4()}`,
        username: 'user1',
        email: 'user1@example.com',
        isActive: true,
        accountStatus: 'active'
      });

      user2 = await Profile.create({
        profileid: `user2-${uuidv4()}`,
        username: 'user2',
        email: 'user2@example.com',
        isActive: true,
        accountStatus: 'active'
      });
    });

    it('should create a new direct chat between two users', async () => {
      // Simulate chat creation
      const chat = await Chat.createDirectChat(user1.profileid, user2.profileid);

      expect(chat).toBeDefined();
      expect(chat.chatType).toBe('direct');
      expect(chat.participants).toHaveLength(2);
      
      // Verify both users are participants
      const participantIds = chat.participants.map(p => p.profileid);
      expect(participantIds).toContain(user1.profileid);
      expect(participantIds).toContain(user2.profileid);

      // Verify no duplicate chats are created
      const existingChat = await Chat.findOne({
        chatType: 'direct',
        isActive: true,
        $and: [
          { 'participants.profileid': user1.profileid },
          { 'participants.profileid': user2.profileid }
        ]
      });

      expect(existingChat).toBeDefined();
      expect(existingChat.chatid).toBe(chat.chatid);
    });

    it('should create a group chat with multiple participants', async () => {
      // Create additional users
      const user3 = await Profile.create({
        profileid: `user3-${uuidv4()}`,
        username: 'user3',
        email: 'user3@example.com',
        isActive: true,
        accountStatus: 'active'
      });

      // Simulate group chat creation
      const groupName = 'Test Group Chat';
      const groupChat = await Chat.createGroupChat(groupName, user1.profileid, [user2.profileid, user3.profileid]);

      expect(groupChat).toBeDefined();
      expect(groupChat.chatType).toBe('group');
      expect(groupChat.chatName).toBe(groupName);
      expect(groupChat.participants).toHaveLength(3);
      expect(groupChat.createdBy).toBe(user1.profileid);

      // Verify owner has correct permissions
      const owner = groupChat.getParticipant(user1.profileid);
      expect(owner.role).toBe('owner');
      expect(owner.permissions.canAddMembers).toBe(true);
      expect(owner.permissions.canRemoveMembers).toBe(true);
    });
  });

  describe('Messaging Flow', () => {
    let chat, user1, user2;

    beforeEach(async () => {
      // Create test users
      user1 = await Profile.create({
        profileid: `sender-${uuidv4()}`,
        username: 'sender',
        email: 'sender@example.com',
        isActive: true,
        accountStatus: 'active'
      });

      user2 = await Profile.create({
        profileid: `receiver-${uuidv4()}`,
        username: 'receiver',
        email: 'receiver@example.com',
        isActive: true,
        accountStatus: 'active'
      });

      // Create chat
      chat = await Chat.createDirectChat(user1.profileid, user2.profileid);
    });

    it('should send, deliver, and read a text message', async () => {
      // Step 1: Send message
      const originalContent = 'Hello, this is a test message!';
      const clientMessageId = `client-${uuidv4()}`;
      
      const message = await Message.create({
        messageid: uuidv4(),
        clientMessageId,
        chatid: chat.chatid,
        senderid: user1.profileid,
        messageType: 'text',
        content: originalContent,
        messageStatus: 'sent'
      });

      expect(message).toBeDefined();
      expect(message.content).toBe(originalContent);
      expect(message.senderid).toBe(user1.profileid);
      expect(message.messageStatus).toBe('sent');

      // Step 2: Mark as delivered
      await message.markAsDelivered(user2.profileid);
      
      const deliveredMessage = await Message.findById(message._id);
      expect(deliveredMessage.messageStatus).toBe('delivered');
      expect(deliveredMessage.deliveredTo).toHaveLength(1);
      expect(deliveredMessage.deliveredTo[0].profileid).toBe(user2.profileid);

      // Step 3: Mark as read
      await message.markAsRead(user2.profileid);
      
      const readMessage = await Message.findById(message._id);
      expect(readMessage.messageStatus).toBe('read');
      expect(readMessage.readBy).toHaveLength(1);
      expect(readMessage.readBy[0].profileid).toBe(user2.profileid);
    });

    it('should handle media message sending', async () => {
      // Send an image message
      const imageMessage = await Message.create({
        messageid: uuidv4(),
        clientMessageId: `client-${uuidv4()}`,
        chatid: chat.chatid,
        senderid: user1.profileid,
        messageType: 'image',
        content: '',
        fileData: {
          name: 'test-photo.jpg',
          size: 2048000, // 2MB
          mimeType: 'image/jpeg',
          url: 'https://example.com/uploads/test-photo.jpg'
        },
        messageStatus: 'sent'
      });

      expect(imageMessage).toBeDefined();
      expect(imageMessage.messageType).toBe('image');
      expect(imageMessage.fileData).toBeDefined();
      expect(imageMessage.fileData.name).toBe('test-photo.jpg');
      expect(imageMessage.fileData.size).toBe(2048000);
      expect(imageMessage.fileData.mimeType).toBe('image/jpeg');
    });

    it('should handle message editing', async () => {
      // Create original message
      const originalMessage = await Message.create({
        messageid: uuidv4(),
        clientMessageId: `client-${uuidv4()}`,
        chatid: chat.chatid,
        senderid: user1.profileid,
        messageType: 'text',
        content: 'Original message content',
        messageStatus: 'sent'
      });

      // Edit the message
      const editedContent = 'This message has been edited';
      originalMessage.content = editedContent;
      originalMessage.isEdited = true;
      originalMessage.editHistory.push({
        content: 'Original message content',
        editedAt: new Date()
      });
      await originalMessage.save();

      const editedMessage = await Message.findById(originalMessage._id);
      expect(editedMessage.content).toBe(editedContent);
      expect(editedMessage.isEdited).toBe(true);
      expect(editedMessage.editHistory).toHaveLength(1);
    });

    it('should handle message reactions', async () => {
      // Create message
      const message = await Message.create({
        messageid: uuidv4(),
        clientMessageId: `client-${uuidv4()}`,
        chatid: chat.chatid,
        senderid: user1.profileid,
        messageType: 'text',
        content: 'Message for reactions',
        messageStatus: 'sent'
      });

      // Add reaction
      await message.addReaction(user2.profileid, '👍');

      const messageWithReaction = await Message.findById(message._id);
      expect(messageWithReaction.reactions).toHaveLength(1);
      expect(messageWithReaction.reactions[0].profileid).toBe(user2.profileid);
      expect(messageWithReaction.reactions[0].emoji).toBe('👍');

      // Toggle reaction off
      await message.addReaction(user2.profileid, '👍');

      const messageWithoutReaction = await Message.findById(message._id);
      expect(messageWithoutReaction.reactions).toHaveLength(0);
    });
  });

  describe('Call Flow', () => {
    let chat, user1, user2;

    beforeEach(async () => {
      // Create test users
      user1 = await Profile.create({
        profileid: `caller-${uuidv4()}`,
        username: 'caller',
        email: 'caller@example.com',
        isActive: true,
        accountStatus: 'active'
      });

      user2 = await Profile.create({
        profileid: `callee-${uuidv4()}`,
        username: 'callee',
        email: 'callee@example.com',
        isActive: true,
        accountStatus: 'active'
      });

      // Create chat
      chat = await Chat.createDirectChat(user1.profileid, user2.profileid);
    });

    it('should initiate, answer, and end a voice call', async () => {
      // Step 1: Initiate call
      const callId = uuidv4();
      const callLog = await CallLog.create({
        callId,
        chatid: chat.chatid,
        callerId: user1.profileid,
        receiverId: user2.profileid,
        participants: [user1.profileid, user2.profileid],
        callType: 'voice',
        status: 'initiated',
        startedAt: new Date()
      });

      expect(callLog).toBeDefined();
      expect(callLog.callId).toBe(callId);
      expect(callLog.callType).toBe('voice');
      expect(callLog.status).toBe('initiated');

      // Step 2: Call starts ringing
      await callLog.updateStatus('ringing');

      const ringingCall = await CallLog.findById(callLog._id);
      expect(ringingCall.status).toBe('ringing');

      // Step 3: Call is answered
      await callLog.updateStatus('answered', {
        answeredAt: new Date()
      });

      const answeredCall = await CallLog.findById(callLog._id);
      expect(answeredCall.status).toBe('answered');
      expect(answeredCall.answeredAt).toBeDefined();

      // Step 4: Call ends normally
      const endTime = new Date();
      await callLog.updateStatus('completed', {
        endedAt: endTime,
        endedBy: user1.profileid,
        endReason: 'normal',
        duration: 120 // 2 minutes
      });

      const completedCall = await CallLog.findById(callLog._id);
      expect(completedCall.status).toBe('completed');
      expect(completedCall.endedAt).toBeDefined();
      expect(completedCall.duration).toBe(120);
      expect(completedCall.endReason).toBe('normal');
    });

    it('should handle missed calls', async () => {
      // Initiate call
      const callId = uuidv4();
      const callLog = await CallLog.create({
        callId,
        chatid: chat.chatid,
        callerId: user1.profileid,
        receiverId: user2.profileid,
        participants: [user1.profileid, user2.profileid],
        callType: 'video',
        status: 'initiated',
        startedAt: new Date()
      });

      // Call times out (missed)
      await callLog.updateStatus('missed', {
        endedAt: new Date(),
        endReason: 'no_answer'
      });

      const missedCall = await CallLog.findById(callLog._id);
      expect(missedCall.status).toBe('missed');
      expect(missedCall.endReason).toBe('no_answer');
    });
  });

  describe('Chat Management', () => {
    let user1, user2, chat;

    beforeEach(async () => {
      // Create test users
      user1 = await Profile.create({
        profileid: `user1-${uuidv4()}`,
        username: 'user1',
        email: 'user1@example.com',
        isActive: true,
        accountStatus: 'active'
      });

      user2 = await Profile.create({
        profileid: `user2-${uuidv4()}`,
        username: 'user2',
        email: 'user2@example.com',
        isActive: true,
        accountStatus: 'active'
      });

      // Create chat
      chat = await Chat.createDirectChat(user1.profileid, user2.profileid);
    });

    it('should archive and unarchive a chat', async () => {
      // Archive chat
      chat.isArchived = true;
      chat.archivedBy.push(user1.profileid);
      await chat.save();

      const archivedChat = await Chat.findById(chat._id);
      expect(archivedChat.isArchived).toBe(true);
      expect(archivedChat.archivedBy).toContain(user1.profileid);

      // Unarchive chat
      chat.isArchived = false;
      chat.archivedBy = chat.archivedBy.filter(id => id !== user1.profileid);
      await chat.save();

      const unarchivedChat = await Chat.findById(chat._id);
      expect(unarchivedChat.isArchived).toBe(false);
      expect(unarchivedChat.archivedBy).not.toContain(user1.profileid);
    });

    it('should mute and unmute a chat', async () => {
      // Mute chat
      chat.mutedBy.push(user1.profileid);
      await chat.save();

      const mutedChat = await Chat.findById(chat._id);
      expect(mutedChat.mutedBy).toContain(user1.profileid);

      // Unmute chat
      chat.mutedBy = chat.mutedBy.filter(id => id !== user1.profileid);
      await chat.save();

      const unmutedChat = await Chat.findById(chat._id);
      expect(unmutedChat.mutedBy).not.toContain(user1.profileid);
    });
  });
});