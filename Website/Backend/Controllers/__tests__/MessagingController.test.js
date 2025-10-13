/**
 * @fileoverview Automated tests for MessagingController
 * @version 1.0.0
 */

import MessagingController from '../MessagingController.js';
import Message from '../../Models/FeedModels/Message.js';
import Chat from '../../Models/FeedModels/Chat.js';
import Profile from '../../Models/FeedModels/Profile.js';

// Mock dependencies
jest.mock('../../Models/FeedModels/Message.js');
jest.mock('../../Models/FeedModels/Chat.js');
jest.mock('../../Models/FeedModels/Profile.js');

describe('MessagingController', () => {
  let messagingController;
  let mockSocket;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock socket
    mockSocket = {
      id: 'test-socket-id',
      emit: jest.fn(),
      to: jest.fn(() => mockSocket),
      user: {
        profileid: 'test-user-id',
        username: 'testuser'
      }
    };
    
    // Create a new instance of the controller
    messagingController = new MessagingController();
  });

  describe('Message Validation', () => {
    test('should validate message content length', () => {
      const validMessage = 'This is a valid message';
      const invalidMessage = 'a'.repeat(5001); // Exceeds max length
      
      expect(messagingController.validateMessageContent(validMessage)).toBe(true);
      expect(messagingController.validateMessageContent(invalidMessage)).toBe(false);
    });

    test('should sanitize message content', () => {
      const messageWithScript = 'Hello <script>alert("xss")</script> World';
      const sanitizedMessage = messagingController.sanitizeMessageContent(messageWithScript);
      
      // Should remove script tags
      expect(sanitizedMessage).not.toContain('<script>');
      expect(sanitizedMessage).toContain('Hello');
      expect(sanitizedMessage).toContain('World');
    });
  });

  describe('Message Processing', () => {
    test('should process new message', async () => {
      const messageData = {
        chatid: 'test-chat-id',
        content: 'Hello World',
        messageType: 'text'
      };
      
      const mockMessage = {
        messageid: 'test-message-id',
        save: jest.fn().mockResolvedValue(true)
      };
      
      Message.mockImplementation(() => mockMessage);
      
      const result = await messagingController.processNewMessage(messageData, mockSocket);
      
      expect(Message).toHaveBeenCalled();
      expect(mockMessage.save).toHaveBeenCalled();
      expect(result).toEqual(mockMessage);
    });

    test('should handle message processing errors', async () => {
      const messageData = {
        chatid: 'test-chat-id',
        content: 'Hello World'
      };
      
      Message.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      await expect(messagingController.processNewMessage(messageData, mockSocket))
        .rejects.toThrow('Database error');
    });
  });

  describe('Message Delivery', () => {
    test('should deliver message to socket', () => {
      const message = {
        messageid: 'test-message-id',
        content: 'Hello World',
        senderid: 'sender-id'
      };
      
      messagingController.deliverMessageToSocket(message, mockSocket);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('message_received', message);
    });

    test('should broadcast message to chat', () => {
      const message = {
        messageid: 'test-message-id',
        content: 'Hello World',
        chatid: 'test-chat-id'
      };
      
      messagingController.broadcastMessageToChat(message);
      
      expect(mockSocket.to).toHaveBeenCalledWith('test-chat-id');
      expect(mockSocket.emit).toHaveBeenCalledWith('message_received', message);
    });
  });

  describe('Message Status Updates', () => {
    test('should update message status', async () => {
      const messageId = 'test-message-id';
      const status = 'delivered';
      
      Message.findByIdAndUpdate.mockResolvedValue({
        messageid: messageId,
        messageStatus: status
      });
      
      const result = await messagingController.updateMessageStatus(messageId, status);
      
      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(
        { messageid: messageId },
        { messageStatus: status },
        { new: true }
      );
      expect(result.messageStatus).toBe(status);
    });

    test('should mark message as read', async () => {
      const messageId = 'test-message-id';
      const profileId = 'test-user-id';
      
      Message.findByIdAndUpdate.mockResolvedValue({
        messageid: messageId,
        readBy: [{ profileid: profileId }]
      });
      
      const result = await messagingController.markMessageAsRead(messageId, profileId);
      
      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(
        { messageid: messageId },
        {
          $push: {
            readBy: {
              profileid: profileId,
              readAt: expect.any(Date)
            }
          }
        },
        { new: true }
      );
      expect(result.readBy[0].profileid).toBe(profileId);
    });
  });

  describe('Message Attachments', () => {
    test('should validate attachment size', () => {
      const validAttachment = { size: 5 * 1024 * 1024 }; // 5MB
      const invalidAttachment = { size: 100 * 1024 * 1024 }; // 100MB
      
      expect(messagingController.validateAttachmentSize(validAttachment)).toBe(true);
      expect(messagingController.validateAttachmentSize(invalidAttachment)).toBe(false);
    });

    test('should process attachment metadata', () => {
      const attachment = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      
      const metadata = messagingController.processAttachmentMetadata(attachment);
      
      expect(metadata).toEqual({
        filename: 'test.jpg',
        filetype: 'image/jpeg',
        size: 1024,
        uploadedAt: expect.any(Date)
      });
    });
  });

  describe('Message Search and Filtering', () => {
    test('should filter messages by user', () => {
      const messages = [
        { senderid: 'user1', content: 'Message 1' },
        { senderid: 'user2', content: 'Message 2' },
        { senderid: 'user1', content: 'Message 3' }
      ];
      
      const filtered = messagingController.filterMessagesByUser(messages, 'user1');
      
      expect(filtered.length).toBe(2);
      expect(filtered.every(msg => msg.senderid === 'user1')).toBe(true);
    });

    test('should search messages by content', () => {
      const messages = [
        { content: 'Hello world', senderid: 'user1' },
        { content: 'Goodbye world', senderid: 'user2' },
        { content: 'Hello universe', senderid: 'user3' }
      ];
      
      const results = messagingController.searchMessages(messages, 'Hello');
      
      expect(results.length).toBe(2);
      expect(results.some(msg => msg.content.includes('Hello'))).toBe(true);
    });
  });

  describe('Message Reactions', () => {
    test('should add reaction to message', async () => {
      const messageId = 'test-message-id';
      const reaction = '👍';
      const profileId = 'test-user-id';
      
      Message.findByIdAndUpdate.mockResolvedValue({
        messageid: messageId,
        reactions: [{ reaction, profileid: profileId }]
      });
      
      const result = await messagingController.addReactionToMessage(messageId, reaction, profileId);
      
      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(
        { messageid: messageId },
        {
          $push: {
            reactions: {
              reaction,
              profileid: profileId,
              reactedAt: expect.any(Date)
            }
          }
        },
        { new: true }
      );
      expect(result.reactions[0].reaction).toBe(reaction);
    });

    test('should remove reaction from message', async () => {
      const messageId = 'test-message-id';
      const profileId = 'test-user-id';
      
      Message.findByIdAndUpdate.mockResolvedValue({
        messageid: messageId,
        reactions: []
      });
      
      const result = await messagingController.removeReactionFromMessage(messageId, profileId);
      
      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(
        { messageid: messageId },
        {
          $pull: {
            reactions: {
              profileid: profileId
            }
          }
        },
        { new: true }
      );
      expect(result.reactions.length).toBe(0);
    });
  });

  describe('Message Editing and Deletion', () => {
    test('should edit message content', async () => {
      const messageId = 'test-message-id';
      const newContent = 'Edited content';
      
      Message.findByIdAndUpdate.mockResolvedValue({
        messageid: messageId,
        content: newContent,
        edited: true,
        editedAt: expect.any(Date)
      });
      
      const result = await messagingController.editMessageContent(messageId, newContent);
      
      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(
        { messageid: messageId },
        {
          content: newContent,
          edited: true,
          editedAt: expect.any(Date)
        },
        { new: true }
      );
      expect(result.content).toBe(newContent);
      expect(result.edited).toBe(true);
    });

    test('should delete message', async () => {
      const messageId = 'test-message-id';
      
      Message.findByIdAndUpdate.mockResolvedValue({
        messageid: messageId,
        deleted: true,
        deletedAt: expect.any(Date)
      });
      
      const result = await messagingController.deleteMessage(messageId);
      
      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(
        { messageid: messageId },
        {
          deleted: true,
          deletedAt: expect.any(Date)
        },
        { new: true }
      );
      expect(result.deleted).toBe(true);
    });
  });

  describe('Message Threading', () => {
    test('should create message thread', async () => {
      const parentMessageId = 'parent-message-id';
      const threadData = {
        content: 'Thread reply',
        senderid: 'test-user-id'
      };
      
      const mockThreadMessage = {
        messageid: 'thread-message-id',
        parentMessageId,
        ...threadData,
        save: jest.fn().mockResolvedValue(true)
      };
      
      Message.mockImplementation(() => mockThreadMessage);
      
      const result = await messagingController.createMessageThread(parentMessageId, threadData);
      
      expect(Message).toHaveBeenCalled();
      expect(mockThreadMessage.save).toHaveBeenCalled();
      expect(result.parentMessageId).toBe(parentMessageId);
    });

    test('should get threaded messages', async () => {
      const parentMessageId = 'parent-message-id';
      const mockThreadedMessages = [
        { messageid: 'reply-1', parentMessageId },
        { messageid: 'reply-2', parentMessageId }
      ];
      
      Message.find.mockResolvedValue(mockThreadedMessages);
      
      const result = await messagingController.getThreadedMessages(parentMessageId);
      
      expect(Message.find).toHaveBeenCalledWith({ parentMessageId });
      expect(result).toEqual(mockThreadedMessages);
    });
  });

  describe('Message Notifications', () => {
    test('should send message notification', () => {
      const notificationData = {
        type: 'new_message',
        chatid: 'test-chat-id',
        message: 'Hello World'
      };
      
      messagingController.sendMessageNotification(notificationData, mockSocket);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('message_notification', notificationData);
    });

    test('should send typing notification', () => {
      const typingData = {
        chatid: 'test-chat-id',
        userid: 'test-user-id'
      };
      
      messagingController.sendTypingNotification(typingData);
      
      expect(mockSocket.to).toHaveBeenCalledWith('test-chat-id');
      expect(mockSocket.emit).toHaveBeenCalledWith('user_typing', typingData);
    });
  });

  describe('Message Archiving', () => {
    test('should archive old messages', async () => {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const archivedCount = 50;
      
      Message.updateMany.mockResolvedValue({ modifiedCount: archivedCount });
      
      const result = await messagingController.archiveOldMessages(cutoffDate);
      
      expect(Message.updateMany).toHaveBeenCalledWith(
        {
          createdAt: { $lt: cutoffDate },
          archived: { $ne: true }
        },
        { archived: true }
      );
      expect(result).toBe(archivedCount);
    });

    test('should cleanup archived messages', async () => {
      const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      const deletedCount = 100;
      
      Message.deleteMany.mockResolvedValue({ deletedCount });
      
      const result = await messagingController.cleanupArchivedMessages(cutoffDate);
      
      expect(Message.deleteMany).toHaveBeenCalledWith({
        archived: true,
        createdAt: { $lt: cutoffDate }
      });
      expect(result).toBe(deletedCount);
    });
  });
});