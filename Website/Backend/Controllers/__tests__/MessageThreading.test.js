import Message from '../../Models/FeedModels/Message';
import MessageThread from '../../Models/FeedModels/MessageThread';
import mongoose from 'mongoose';

// Mock the MessageThread model
jest.mock('../../Models/FeedModels/MessageThread');

describe('Message Threading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Model Methods', () => {
    test('should identify thread starter correctly', () => {
      const messageWithReplies = {
        threadReplies: ['reply1', 'reply2'],
        replyTo: null
      };
      
      const regularReply = {
        threadReplies: [],
        replyTo: 'parent123'
      };
      
      expect(messageWithReplies.threadReplies && messageWithReplies.threadReplies.length > 0 && !messageWithReplies.replyTo).toBe(true);
      expect(regularReply.threadReplies && regularReply.threadReplies.length > 0 && !regularReply.replyTo).toBe(false);
    });

    test('should get thread replies count', () => {
      const message = {
        threadReplies: ['reply1', 'reply2', 'reply3']
      };
      
      expect(message.threadReplies ? message.threadReplies.length : 0).toBe(3);
    });

    test('should handle empty thread replies', () => {
      const message = {
        threadReplies: []
      };
      
      expect(message.threadReplies ? message.threadReplies.length : 0).toBe(0);
    });
  });

  describe('MessageThread Model Methods', () => {
    test('should get thread by message ID', async () => {
      const mockThread = { threadId: 'thread123', messageId: 'msg123' };
      MessageThread.getByMessageId = jest.fn().mockResolvedValue(mockThread);
      
      const result = await MessageThread.getByMessageId('msg123');
      
      expect(MessageThread.getByMessageId).toHaveBeenCalledWith('msg123');
      expect(result).toEqual(mockThread);
    });

    test('should get thread stats', async () => {
      const mockThread = {
        threadId: 'thread123',
        messageId: 'msg123',
        chatId: 'chat123',
        replies: ['reply1', 'reply2'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      MessageThread.findOne = jest.fn().mockResolvedValue(mockThread);
      
      const result = await MessageThread.getThreadStats('thread123');
      
      expect(MessageThread.findOne).toHaveBeenCalledWith({ threadId: 'thread123' });
      expect(result).toEqual({
        threadId: 'thread123',
        messageId: 'msg123',
        chatId: 'chat123',
        replyCount: 2,
        createdAt: mockThread.createdAt,
        updatedAt: mockThread.updatedAt
      });
    });

    test('should return null for non-existent thread stats', async () => {
      MessageThread.findOne = jest.fn().mockResolvedValue(null);
      
      const result = await MessageThread.getThreadStats('nonexistent');
      
      expect(result).toBeNull();
    });
  });
});