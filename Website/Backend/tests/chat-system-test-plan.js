/**
 * SwagGo Chat System - Comprehensive Test Plan
 * 
 * This test suite validates the UNIFIED EVENT CONTRACT implementation
 * across Socket.IO, REST endpoints, and WebRTC functionality.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import io from 'socket.io-client';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Test Configuration
const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:45799';
const TEST_TIMEOUT = 30000;

describe('SwagGo Chat System - Unified Contract Tests', () => {
  let authToken;
  let testUser1, testUser2;
  let socket1, socket2;
  let testChatId;

  beforeAll(async () => {
    // Setup test users and authentication
    const testUsers = await setupTestUsers();
    testUser1 = testUsers.user1;
    testUser2 = testUsers.user2;
    authToken = testUsers.token;
    testChatId = await createTestChat(testUser1.profileid, testUser2.profileid);
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();
  });

  beforeEach(() => {
    // Reset sockets for each test
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();
  });

  // ===========================================
  // AUTHENTICATION TESTS
  // ===========================================
  
  describe('Authentication', () => {
    it('should reject socket connection without token', (done) => {
      const socket = io(SERVER_URL);
      
      socket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication required');
        socket.disconnect();
        done();
      });
      
      socket.on('connect', () => {
        socket.disconnect();
        done(new Error('Should not connect without token'));
      });
    });

    it('should accept socket connection with valid token', (done) => {
      socket1 = io(SERVER_URL, {
        auth: { token: authToken }
      });
      
      socket1.on('connect', () => {
        expect(socket1.connected).toBe(true);
        done();
      });
      
      socket1.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should reject REST requests without authorization', async () => {
      try {
        await axios.post(`${SERVER_URL}/api/message/send`, {
          chatid: testChatId,
          clientMessageId: 'test-msg-1',
          content: 'Test message'
        });
        throw new Error('Should have been rejected');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  // ===========================================
  // MESSAGE IDEMPOTENCY TESTS
  // ===========================================
  
  describe('Message Idempotency', () => {
    beforeEach((done) => {
      socket1 = io(SERVER_URL, { auth: { token: authToken } });
      socket1.on('connect', () => {
        socket1.emit('join_chat', testChatId);
        done();
      });
    });

    it('should handle duplicate messages via Socket.IO', (done) => {
      const clientMessageId = `test-duplicate-${Date.now()}`;
      const messageData = {
        chatid: testChatId,
        clientMessageId,
        messageType: 'text',
        content: 'Duplicate test message'
      };

      let ackCount = 0;
      const callback = (response) => {
        ackCount++;
        expect(response.success).toBe(true);
        expect(response.clientMessageId).toBe(clientMessageId);
        
        if (ackCount === 1) {
          expect(response.duplicate).toBe(false);
          expect(response.messageid).toBeDefined();
          
          // Send the same message again
          socket1.emit('send_message', messageData, callback);
        } else {
          expect(response.duplicate).toBe(true);
          expect(response.messageid).toBeDefined();
          done();
        }
      };

      socket1.emit('send_message', messageData, callback);
    }, TEST_TIMEOUT);

    it('should handle duplicate messages via REST API', async () => {
      const clientMessageId = `test-rest-duplicate-${Date.now()}`;
      const messageData = {
        chatid: testChatId,
        clientMessageId,
        messageType: 'text',
        content: 'REST duplicate test message'
      };

      // First request
      const response1 = await axios.post(`${SERVER_URL}/api/message/send`, messageData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response1.data.success).toBe(true);
      expect(response1.data.duplicate).toBe(false);
      expect(response1.data.messageid).toBeDefined();

      // Second request (duplicate)
      const response2 = await axios.post(`${SERVER_URL}/api/message/send`, messageData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response2.data.success).toBe(true);
      expect(response2.data.duplicate).toBe(true);
      expect(response2.data.messageid).toBe(response1.data.messageid);
    });
  });

  // ===========================================
  // REAL-TIME MESSAGING TESTS
  // ===========================================
  
  describe('Real-time Messaging', () => {
    beforeEach((done) => {
      let connectCount = 0;
      const onConnect = () => {
        connectCount++;
        if (connectCount === 2) {
          socket1.emit('join_chat', testChatId);
          socket2.emit('join_chat', testChatId);
          setTimeout(done, 100); // Allow time for room joining
        }
      };

      socket1 = io(SERVER_URL, { auth: { token: authToken } });
      socket2 = io(SERVER_URL, { auth: { token: authToken } });
      
      socket1.on('connect', onConnect);
      socket2.on('connect', onConnect);
    });

    it('should send and receive messages with delivery tracking', (done) => {
      const clientMessageId = `test-delivery-${Date.now()}`;
      const messageContent = 'Test delivery tracking';
      
      let steps = 0;
      const expectedSteps = 3; // ack, new_message, message_delivered

      // Listen for new message on socket2
      socket2.on('new_message', (data) => {
        expect(data.message.content).toBe(messageContent);
        expect(data.message.clientMessageId).toBe(clientMessageId);
        steps++;
        if (steps === expectedSteps) done();
      });

      // Listen for delivery confirmation on socket1
      socket1.on('message_delivered', (data) => {
        expect(data.messageid).toBeDefined();
        expect(data.deliveredTo).toBe(testUser2.profileid);
        expect(data.deliveredAt).toBeDefined();
        steps++;
        if (steps === expectedSteps) done();
      });

      // Send message
      socket1.emit('send_message', {
        chatid: testChatId,
        clientMessageId,
        messageType: 'text',
        content: messageContent
      }, (response) => {
        expect(response.success).toBe(true);
        expect(response.clientMessageId).toBe(clientMessageId);
        expect(response.messageid).toBeDefined();
        steps++;
        if (steps === expectedSteps) done();
      });
    }, TEST_TIMEOUT);

    it('should handle read receipts correctly', (done) => {
      const clientMessageId = `test-read-${Date.now()}`;
      let messageid;

      // Listen for read receipt on socket1
      socket1.on('message_read', (data) => {
        expect(data.messageid).toBe(messageid);
        expect(data.readBy.profileid).toBe(testUser2.profileid);
        expect(data.readBy.readAt).toBeDefined();
        done();
      });

      // Listen for new message on socket2
      socket2.on('new_message', (data) => {
        messageid = data.message.messageid;
        // Mark message as read
        socket2.emit('mark_message_read', {
          chatid: testChatId,
          messageid: messageid
        });
      });

      // Send message
      socket1.emit('send_message', {
        chatid: testChatId,
        clientMessageId,
        messageType: 'text',
        content: 'Test read receipt'
      });
    }, TEST_TIMEOUT);
  });

  // ===========================================
  // CALL SYSTEM TESTS
  // ===========================================
  
  describe('Call System', () => {
    beforeEach((done) => {
      let connectCount = 0;
      const onConnect = () => {
        connectCount++;
        if (connectCount === 2) {
          socket1.emit('join_chat', testChatId);
          socket2.emit('join_chat', testChatId);
          setTimeout(done, 100);
        }
      };

      socket1 = io(SERVER_URL, { auth: { token: authToken } });
      socket2 = io(SERVER_URL, { auth: { token: authToken } });
      
      socket1.on('connect', onConnect);
      socket2.on('connect', onConnect);
    });

    it('should initiate and answer voice call', (done) => {
      let callId;
      let steps = 0;

      // Listen for incoming call on socket2
      socket2.on('incoming_call', (data) => {
        expect(data.callType).toBe('voice');
        expect(data.chatid).toBe(testChatId);
        expect(data.caller.profileid).toBe(testUser1.profileid);
        callId = data.callId;
        steps++;

        // Answer the call
        socket2.emit('answer_call', {
          callId: callId,
          accepted: true,
          chatid: testChatId
        });
      });

      // Listen for call answer on socket1
      socket1.on('call_answer', (data) => {
        expect(data.callId).toBe(callId);
        expect(data.accepted).toBe(true);
        expect(data.answerer.profileid).toBe(testUser2.profileid);
        steps++;

        if (steps === 2) {
          // End the call
          socket1.emit('end_call', {
            callId: callId,
            reason: 'test_complete'
          });
          
          setTimeout(() => done(), 100);
        }
      });

      // Initiate call
      socket1.emit('initiate_call', {
        chatid: testChatId,
        callType: 'voice',
        receiverId: testUser2.profileid
      }, (response) => {
        expect(response.success).toBe(true);
        callId = response.callId;
      });
    }, TEST_TIMEOUT);

    it('should handle WebRTC signaling', (done) => {
      const mockOffer = { type: 'offer', sdp: 'mock-sdp-offer' };
      const mockAnswer = { type: 'answer', sdp: 'mock-sdp-answer' };
      let steps = 0;

      // Listen for WebRTC offer on socket2
      socket2.on('webrtc_offer', (data) => {
        expect(data.offer).toEqual(mockOffer);
        expect(data.chatid).toBe(testChatId);
        steps++;

        // Send answer
        socket2.emit('webrtc_answer', {
          chatid: testChatId,
          callId: data.callId,
          answer: mockAnswer
        });
      });

      // Listen for WebRTC answer on socket1
      socket1.on('webrtc_answer', (data) => {
        expect(data.answer).toEqual(mockAnswer);
        expect(data.chatid).toBe(testChatId);
        steps++;

        if (steps === 2) done();
      });

      // Send offer
      socket1.emit('webrtc_offer', {
        chatid: testChatId,
        callId: 'test-call-123',
        offer: mockOffer
      });
    }, TEST_TIMEOUT);
  });

  // ===========================================
  // FILE UPLOAD TESTS
  // ===========================================
  
  describe('File Upload', () => {
    it('should upload file and return absolute URL', async () => {
      // Create a test file
      const testFilePath = path.join(process.cwd(), 'test-file.txt');
      fs.writeFileSync(testFilePath, 'Test file content');

      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));

      try {
        const response = await axios.post(`${SERVER_URL}/upload`, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        });

        expect(response.data.success).toBe(true);
        expect(response.data.fileUrl).toMatch(/^https?:\/\/.+\/uploads\/.+\.txt$/);
        expect(response.data.filename).toBeDefined();
        expect(response.data.originalname).toBe('test-file.txt');
        expect(response.data.size).toBe('Test file content'.length);
        expect(response.data.uploadedAt).toBeDefined();

        // Verify file is accessible
        const fileResponse = await axios.get(response.data.fileUrl);
        expect(fileResponse.data).toBe('Test file content');

      } finally {
        // Cleanup test file
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
  });

  // ===========================================
  // OFFLINE MESSAGE HANDLING
  // ===========================================
  
  describe('Offline Message Handling', () => {
    it('should queue messages for offline users', (done) => {
      const clientMessageId = `test-offline-${Date.now()}`;
      
      // Only socket1 connects
      socket1 = io(SERVER_URL, { auth: { token: authToken } });
      
      socket1.on('connect', () => {
        socket1.emit('join_chat', testChatId);
        
        // Send message when socket2 is offline
        socket1.emit('send_message', {
          chatid: testChatId,
          clientMessageId,
          messageType: 'text',
          content: 'Offline message test'
        }, (response) => {
          expect(response.success).toBe(true);
          
          // Now connect socket2 to receive queued messages
          socket2 = io(SERVER_URL, { auth: { token: authToken } });
          
          socket2.on('connect', () => {
            socket2.emit('join_chat', testChatId);
          });
          
          socket2.on('new_message', (data) => {
            if (data.message.clientMessageId === clientMessageId) {
              expect(data.message.content).toBe('Offline message test');
              done();
            }
          });
        });
      });
    }, TEST_TIMEOUT);
  });

  // ===========================================
  // ERROR HANDLING TESTS
  // ===========================================
  
  describe('Error Handling', () => {
    beforeEach((done) => {
      socket1 = io(SERVER_URL, { auth: { token: authToken } });
      socket1.on('connect', done);
    });

    it('should handle missing required fields', (done) => {
      socket1.emit('send_message', {
        // Missing chatid and clientMessageId
        content: 'Invalid message'
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('Missing required fields');
        done();
      });
    });

    it('should handle unauthorized chat access', (done) => {
      socket1.emit('send_message', {
        chatid: 'unauthorized-chat-id',
        clientMessageId: 'test-unauthorized',
        content: 'Unauthorized message'
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('not a participant');
        done();
      });
    });
  });
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function setupTestUsers() {
  // This would typically create test users in your database
  // For now, return mock data
  return {
    user1: {
      profileid: 'test-user-1',
      username: 'testuser1'
    },
    user2: {
      profileid: 'test-user-2', 
      username: 'testuser2'
    },
    token: 'demo_token_for_testing' // Use actual JWT in real tests
  };
}

async function createTestChat(user1Id, user2Id) {
  // This would typically create a test chat in your database
  // For now, return a mock chat ID
  return `test-chat-${user1Id}-${user2Id}`;
}

async function cleanupTestData() {
  // Cleanup test users, chats, and messages
  console.log('🧹 Cleaning up test data...');
}

export default {
  setupTestUsers,
  createTestChat,
  cleanupTestData,
  SERVER_URL,
  TEST_TIMEOUT
};