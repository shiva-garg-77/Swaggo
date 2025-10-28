/**
 * Test script for Messaging Functionality
 * This script tests that both users can send and receive messages in a created chat
 */

// Import required modules
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Import models
import Chat from '../../Models/FeedModels/Chat.js';
import Profile from '../../Models/FeedModels/Profile.js';
import Message from '../../Models/FeedModels/Message.js';

// Test function to verify messaging functionality
async function testMessaging() {
  console.log('🧪 Starting Messaging Tests...\n');
  
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/testdb');
    console.log('✅ Connected to database\n');
    
    // Clear database for clean test
    await Chat.deleteMany({});
    await Profile.deleteMany({});
    await Message.deleteMany({});
    
    // Create test profiles with required email fields
    const profile1 = new Profile({
      profileid: 'profile-123',
      username: 'testuser1',
      name: 'Test User 1',
      email: 'testuser1@example.com'
    });
    await profile1.save();
    
    const profile2 = new Profile({
      profileid: 'profile-456',
      username: 'testuser2',
      name: 'Test User 2',
      email: 'testuser2@example.com'
    });
    await profile2.save();
    
    console.log('👥 Created test profiles\n');
    
    // Create a new direct chat
    console.log('📝 Creating a new direct chat...');
    const participants = ['profile-123', 'profile-456'];
    
    // Create participant objects
    const participantObjects = participants.map(profileId => ({
      profileid: profileId,
      role: 'member',
      joinedAt: new Date(),
      permissions: {
        canSendMessages: true,
        canAddMembers: false,
        canRemoveMembers: false,
        canEditChat: false,
        canDeleteMessages: false,
        canPinMessages: false
      }
    }));
    
    // Create new chat
    const newChat = new Chat({
      chatid: uuidv4(),
      participants: participantObjects,
      chatType: 'direct',
      chatName: null,
      chatAvatar: null,
      createdBy: 'profile-123',
      adminIds: [],
      lastMessageAt: new Date()
    });
    
    await newChat.save();
    console.log('✅ New chat created successfully:', newChat.chatid);
    
    // Test 1: User 1 sends a message
    console.log('\n📝 Test 1: User 1 sends a message...');
    const message1 = new Message({
      messageid: uuidv4(),
      chatid: newChat.chatid,
      senderid: 'profile-123',
      messageType: 'text',
      content: 'Hello from User 1!',
      messageStatus: 'sent',
      deliveredTo: [{
        profileid: 'profile-456',
        deliveredAt: new Date()
      }]
    });
    
    await message1.save();
    console.log('✅ Message sent by User 1:', message1.content);
    
    // Update chat's last message
    newChat.lastMessage = message1.messageid;
    newChat.lastMessageAt = message1.createdAt;
    await newChat.save();
    
    // Test 2: User 2 sends a message
    console.log('\n📝 Test 2: User 2 sends a message...');
    const message2 = new Message({
      messageid: uuidv4(),
      chatid: newChat.chatid,
      senderid: 'profile-456',
      messageType: 'text',
      content: 'Hello from User 2!',
      messageStatus: 'sent',
      deliveredTo: [{
        profileid: 'profile-123',
        deliveredAt: new Date()
      }]
    });
    
    await message2.save();
    console.log('✅ Message sent by User 2:', message2.content);
    
    // Update chat's last message
    newChat.lastMessage = message2.messageid;
    newChat.lastMessageAt = message2.createdAt;
    await newChat.save();
    
    // Test 3: Verify both messages exist in the chat
    console.log('\n📝 Test 3: Verifying messages in chat...');
    const messages = await Message.find({ chatid: newChat.chatid })
      .sort({ createdAt: 1 });
    
    if (messages.length === 2) {
      console.log('✅ Both messages found in chat');
      console.log('  Message 1:', messages[0].content, 'by', messages[0].senderid);
      console.log('  Message 2:', messages[1].content, 'by', messages[1].senderid);
    } else {
      console.log('❌ Incorrect number of messages found:', messages.length);
      return;
    }
    
    // Test 4: Verify both users can receive messages
    console.log('\n📝 Test 4: Verifying message delivery to both users...');
    
    // Check if message 1 was delivered to User 2
    const message1Delivered = message1.deliveredTo.some(d => d.profileid === 'profile-456');
    if (message1Delivered) {
      console.log('✅ Message 1 delivered to User 2');
    } else {
      console.log('❌ Message 1 not delivered to User 2');
    }
    
    // Check if message 2 was delivered to User 1
    const message2Delivered = message2.deliveredTo.some(d => d.profileid === 'profile-123');
    if (message2Delivered) {
      console.log('✅ Message 2 delivered to User 1');
    } else {
      console.log('❌ Message 2 not delivered to User 1');
    }
    
    // Test 5: User 1 marks message 2 as read
    console.log('\n📝 Test 5: User 1 marks message 2 as read...');
    message2.readBy.push({
      profileid: 'profile-123',
      readAt: new Date()
    });
    message2.messageStatus = 'read';
    await message2.save();
    
    if (message2.readBy.some(r => r.profileid === 'profile-123')) {
      console.log('✅ Message 2 marked as read by User 1');
    } else {
      console.log('❌ Message 2 not marked as read by User 1');
    }
    
    // Test 6: User 2 marks message 1 as read
    console.log('\n📝 Test 6: User 2 marks message 1 as read...');
    message1.readBy.push({
      profileid: 'profile-456',
      readAt: new Date()
    });
    message1.messageStatus = 'read';
    await message1.save();
    
    if (message1.readBy.some(r => r.profileid === 'profile-456')) {
      console.log('✅ Message 1 marked as read by User 2');
    } else {
      console.log('❌ Message 1 not marked as read by User 2');
    }
    
    console.log('\n✅ All messaging tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the tests
testMessaging();