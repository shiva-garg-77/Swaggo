import mongoose from 'mongoose';
import Message from '../../../Models/FeedModels/Message.js';
import Chat from '../../../Models/FeedModels/Chat.js';
import Profile from '../../../Models/FeedModels/Profile.js';

describe('Message Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/swaggo_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await Message.deleteMany({});
    await Chat.deleteMany({});
    await Profile.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Message Creation', () => {
    let chat, sender;

    beforeEach(async () => {
      // Create test profile
      sender = await Profile.create({
        profileid: 'sender',
        username: 'sender',
        email: 'sender@example.com'
      });

      // Create chat
      chat = await Chat.create({
        chatid: 'test-chat',
        participants: [
          {
            profileid: 'sender',
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
        createdBy: 'sender'
      });
    });

    it('should create a text message', async () => {
      const message = await Message.create({
        messageid: 'msg-1',
        chatid: 'test-chat',
        senderid: 'sender',
        messageType: 'text',
        content: 'Hello, world!',
        messageStatus: 'sent'
      });

      expect(message).toBeDefined();
      expect(message.messageid).toBe('msg-1');
      expect(message.chatid).toBe('test-chat');
      expect(message.senderid).toBe('sender');
      expect(message.messageType).toBe('text');
      expect(message.content).toBe('Hello, world!');
      expect(message.messageStatus).toBe('sent');
    });

    it('should create a media message with file data', async () => {
      const message = await Message.create({
        messageid: 'msg-2',
        chatid: 'test-chat',
        senderid: 'sender',
        messageType: 'image',
        content: '',
        fileData: {
          name: 'test.jpg',
          size: 1024,
          mimeType: 'image/jpeg',
          url: 'http://example.com/test.jpg'
        },
        messageStatus: 'sent'
      });

      expect(message).toBeDefined();
      expect(message.messageType).toBe('image');
      expect(message.fileData).toBeDefined();
      expect(message.fileData.name).toBe('test.jpg');
      expect(message.fileData.size).toBe(1024);
      expect(message.fileData.mimeType).toBe('image/jpeg');
      expect(message.fileData.url).toBe('http://example.com/test.jpg');
    });

    it('should create a sticker message', async () => {
      const message = await Message.create({
        messageid: 'msg-3',
        chatid: 'test-chat',
        senderid: 'sender',
        messageType: 'sticker',
        content: '',
        stickerData: {
          id: 'sticker-1',
          name: 'Happy Face',
          preview: '😊',
          url: 'http://example.com/stickers/happy.png',
          category: 'emotions'
        },
        messageStatus: 'sent'
      });

      expect(message).toBeDefined();
      expect(message.messageType).toBe('sticker');
      expect(message.stickerData).toBeDefined();
      expect(message.stickerData.id).toBe('sticker-1');
      expect(message.stickerData.name).toBe('Happy Face');
      expect(message.stickerData.preview).toBe('😊');
      expect(message.stickerData.url).toBe('http://example.com/stickers/happy.png');
      expect(message.stickerData.category).toBe('emotions');
    });
  });

  describe('Message Status Management', () => {
    let message;

    beforeEach(async () => {
      // Create test profile
      const sender = await Profile.create({
        profileid: 'sender',
        username: 'sender',
        email: 'sender@example.com'
      });

      const receiver = await Profile.create({
        profileid: 'receiver',
        username: 'receiver',
        email: 'receiver@example.com'
      });

      // Create chat
      const chat = await Chat.create({
        chatid: 'status-test-chat',
        participants: [
          {
            profileid: 'sender',
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
            profileid: 'receiver',
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
        createdBy: 'sender'
      });

      // Create message
      message = await Message.create({
        messageid: 'status-msg',
        chatid: 'status-test-chat',
        senderid: 'sender',
        messageType: 'text',
        content: 'Status test message',
        messageStatus: 'sent'
      });
    });

    it('should mark message as delivered', async () => {
      await message.markAsDelivered('receiver');
      expect(message.messageStatus).toBe('delivered');
      expect(message.deliveredTo).toHaveLength(1);
      expect(message.deliveredTo[0].profileid).toBe('receiver');
    });

    it('should mark message as read', async () => {
      await message.markAsRead('receiver');
      expect(message.messageStatus).toBe('read');
      expect(message.readBy).toHaveLength(1);
      expect(message.readBy[0].profileid).toBe('receiver');
    });
  });

  describe('Message Reactions', () => {
    let message;

    beforeEach(async () => {
      // Create test profile
      const user = await Profile.create({
        profileid: 'user',
        username: 'user',
        email: 'user@example.com'
      });

      // Create chat
      const chat = await Chat.create({
        chatid: 'reaction-test-chat',
        participants: [
          {
            profileid: 'user',
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
        createdBy: 'user'
      });

      // Create message
      message = await Message.create({
        messageid: 'reaction-msg',
        chatid: 'reaction-test-chat',
        senderid: 'user',
        messageType: 'text',
        content: 'Reaction test message',
        messageStatus: 'sent'
      });
    });

    it('should add reaction to message', async () => {
      await message.addReaction('user', '👍');
      expect(message.reactions).toHaveLength(1);
      expect(message.reactions[0].profileid).toBe('user');
      expect(message.reactions[0].emoji).toBe('👍');
    });

    it('should remove reaction from message', async () => {
      await message.addReaction('user', '👍');
      await message.removeReaction('user', '👍');
      expect(message.reactions).toHaveLength(0);
    });

    it('should toggle reaction', async () => {
      // Add reaction
      await message.addReaction('user', '👍');
      expect(message.reactions).toHaveLength(1);

      // Toggle off
      await message.addReaction('user', '👍');
      expect(message.reactions).toHaveLength(0);
    });
  });

  describe('Message Editing', () => {
    let message;

    beforeEach(async () => {
      // Create test profile
      const user = await Profile.create({
        profileid: 'user',
        username: 'user',
        email: 'user@example.com'
      });

      // Create chat
      const chat = await Chat.create({
        chatid: 'edit-test-chat',
        participants: [
          {
            profileid: 'user',
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
        createdBy: 'user'
      });

      // Create message
      message = await Message.create({
        messageid: 'edit-msg',
        chatid: 'edit-test-chat',
        senderid: 'user',
        messageType: 'text',
        content: 'Original message',
        messageStatus: 'sent'
      });
    });

    it('should edit message content', async () => {
      const newContent = 'Edited message';
      message.content = newContent;
      message.isEdited = true;
      await message.save();

      const updatedMessage = await Message.findOne({ messageid: 'edit-msg' });
      expect(updatedMessage.content).toBe(newContent);
      expect(updatedMessage.isEdited).toBe(true);
    });

    it('should track edit history', async () => {
      // Add to edit history
      message.editHistory.push({
        content: message.content,
        editedAt: new Date()
      });

      message.content = 'Edited message';
      message.isEdited = true;
      await message.save();

      const updatedMessage = await Message.findOne({ messageid: 'edit-msg' });
      expect(updatedMessage.editHistory).toHaveLength(1);
      expect(updatedMessage.editHistory[0].content).toBe('Original message');
    });
  });

  describe('Message Deletion', () => {
    let message;

    beforeEach(async () => {
      // Create test profile
      const user = await Profile.create({
        profileid: 'user',
        username: 'user',
        email: 'user@example.com'
      });

      // Create chat
      const chat = await Chat.create({
        chatid: 'delete-test-chat',
        participants: [
          {
            profileid: 'user',
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
        createdBy: 'user'
      });

      // Create message
      message = await Message.create({
        messageid: 'delete-msg',
        chatid: 'delete-test-chat',
        senderid: 'user',
        messageType: 'text',
        content: 'Delete test message',
        messageStatus: 'sent'
      });
    });

    it('should soft delete message', async () => {
      message.isDeleted = true;
      message.deletedBy = 'user';
      message.deletedAt = new Date();
      await message.save();

      const updatedMessage = await Message.findOne({ messageid: 'delete-msg' });
      expect(updatedMessage.isDeleted).toBe(true);
      expect(updatedMessage.deletedBy).toBe('user');
      expect(updatedMessage.deletedAt).toBeDefined();
    });
  });
});