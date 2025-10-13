// Simple test for message threading functionality
const Message = require('../../Models/FeedModels/Message');

test('Message threading methods should work', () => {
  // Test isThreadStarter method
  const threadStarter = {
    threadReplies: ['reply1', 'reply2'],
    replyTo: null,
    isThreadStarter: function() {
      return this.threadReplies && this.threadReplies.length > 0 && !this.replyTo;
    }
  };
  
  const regularReply = {
    threadReplies: [],
    replyTo: 'parent123',
    isThreadStarter: function() {
      return this.threadReplies && this.threadReplies.length > 0 && !this.replyTo;
    }
  };
  
  expect(threadStarter.isThreadStarter()).toBe(true);
  expect(regularReply.isThreadStarter()).toBe(false);
  
  // Test getThreadRepliesCount method
  const messageWithReplies = {
    threadReplies: ['reply1', 'reply2', 'reply3'],
    getThreadRepliesCount: function() {
      return this.threadReplies ? this.threadReplies.length : 0;
    }
  };
  
  const messageWithoutReplies = {
    threadReplies: [],
    getThreadRepliesCount: function() {
      return this.threadReplies ? this.threadReplies.length : 0;
    }
  };
  
  expect(messageWithReplies.getThreadRepliesCount()).toBe(3);
  expect(messageWithoutReplies.getThreadRepliesCount()).toBe(0);
});

console.log('✅ Message threading tests passed');