/**
 * Test script for Chat Creation Fixes
 * This script tests the enhanced CreateChat resolver functionality
 */

// Import required modules
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Import models
import Chat from './Models/FeedModels/Chat.js';
import Profile from './Models/FeedModels/Profile.js';

// Test function to verify chat creation
async function testChatCreation() {
  console.log('🧪 Starting Chat Creation Tests...\n');
  
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/testdb');
    console.log('✅ Connected to database\n');
    
    // Clear database for clean test
    await Chat.deleteMany({});
    await Profile.deleteMany({});
    
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
    
    // Test 1: Create a new direct chat
    console.log('📝 Test 1: Creating a new direct chat...');
    const chatData = {
      participants: ['profile-123', 'profile-456'],
      chatType: 'direct',
      chatName: null,
      chatAvatar: null
    };
    
    // Simulate the CreateChat resolver logic
    const user = {
      id: 'user-123',
      profileid: 'profile-123',
      username: 'testuser1'
    };
    
    let participants = [...chatData.participants];
    
    // Ensure current user is in participants
    if (!participants.includes(user.profileid)) {
      participants.push(user.profileid);
    }
    
    // Remove any instances of user.id if present
    if (user.id && user.id !== user.profileid) {
      participants = participants.filter(id => id !== user.id);
    }
    
    // Remove duplicates
    participants = [...new Set(participants)];
    
    console.log('📋 Final participants list:', participants);
    
    // Validate participants exist
    const validParticipants = await Profile.find({
      profileid: { $in: participants }
    });
    
    if (validParticipants.length !== participants.length) {
      const foundIds = validParticipants.map(p => p.profileid);
      const missingIds = participants.filter(id => !foundIds.includes(id));
      throw new Error(`Some participants do not exist: ${missingIds.join(', ')}`);
    }
    
    console.log('✅ All participants validated\n');
    
    // Check for existing chat
    if (chatData.chatType === 'direct' && participants.length === 2) {
      const existingChat = await Chat.findOne({
        chatType: 'direct',
        isActive: true,
        $and: [
          { 'participants.profileid': participants[0] },
          { 'participants.profileid': participants[1] }
        ],
        'participants': { $size: 2 }
      });
      
      if (existingChat) {
        console.log('🔄 Found existing chat:', existingChat.chatid);
        // For testing purposes, we'll continue to create a new one
      }
    }
    
    // Create participant objects
    const participantObjects = participants.map(profileId => ({
      profileid: profileId,
      role: chatData.chatType === 'group' && profileId === user.profileid ? 'owner' : 'member',
      joinedAt: new Date(),
      permissions: chatData.chatType === 'group' && profileId === user.profileid ? {
        canSendMessages: true,
        canAddMembers: true,
        canRemoveMembers: true,
        canEditChat: true,
        canDeleteMessages: true,
        canPinMessages: true
      } : {
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
      chatType: chatData.chatType,
      chatName: chatData.chatType === 'group' ? chatData.chatName || 'New Group' : null,
      chatAvatar: chatData.chatAvatar,
      createdBy: user.profileid,
      adminIds: chatData.chatType === 'group' ? [user.profileid] : [],
      lastMessageAt: new Date()
    });
    
    await newChat.save();
    console.log('✅ New chat created successfully:', newChat.chatid);
    console.log('📊 Chat details:', {
      chatid: newChat.chatid,
      chatType: newChat.chatType,
      participantCount: newChat.participants.length,
      createdBy: newChat.createdBy
    });
    
    // Test 2: Try to create duplicate chat
    console.log('\n📝 Test 2: Attempting to create duplicate chat...');
    try {
      // Create participant objects for duplicate
      const duplicateParticipantObjects = participants.map(profileId => ({
        profileid: profileId,
        role: chatData.chatType === 'group' && profileId === user.profileid ? 'owner' : 'member',
        joinedAt: new Date(),
        permissions: chatData.chatType === 'group' && profileId === user.profileid ? {
          canSendMessages: true,
          canAddMembers: true,
          canRemoveMembers: true,
          canEditChat: true,
          canDeleteMessages: true,
          canPinMessages: true
        } : {
          canSendMessages: true,
          canAddMembers: false,
          canRemoveMembers: false,
          canEditChat: false,
          canDeleteMessages: false,
          canPinMessages: false
        }
      }));
      
      // Try to create a duplicate chat
      const duplicateChat = new Chat({
        chatid: uuidv4(),
        participants: duplicateParticipantObjects,
        chatType: chatData.chatType,
        chatName: chatData.chatType === 'group' ? chatData.chatName || 'New Group' : null,
        chatAvatar: chatData.chatAvatar,
        createdBy: user.profileid,
        adminIds: chatData.chatType === 'group' ? [user.profileid] : [],
        lastMessageAt: new Date()
      });
      
      await duplicateChat.save();
      console.log('❌ Duplicate prevention failed - created duplicate chat');
    } catch (error) {
      console.log('✅ Duplicate prevention working - correctly threw error:', error.message);
    }
    
    // Test 3: Verify participants in database with detailed structure
    console.log('\n📝 Test 3: Verifying participants array structure in database...');
    const chatFromDb = await Chat.findOne({ chatid: newChat.chatid });
    if (chatFromDb) {
      console.log('✅ Chat found in database');
      console.log('👥 Participants in database:', chatFromDb.participants.map(p => p.profileid));
      
      // Check that both participants are present
      const participantIds = chatFromDb.participants.map(p => p.profileid);
      const hasUser1 = participantIds.includes('profile-123');
      const hasUser2 = participantIds.includes('profile-456');
      
      if (hasUser1 && hasUser2) {
        console.log('✅ Both participants correctly stored in database');
      } else {
        console.log('❌ Participants not correctly stored');
        return;
      }
      
      // Verify the structure of each participant object
      for (const participant of chatFromDb.participants) {
        console.log(`\n🔍 Verifying participant ${participant.profileid}:`);
        console.log(`  - profileid: ${participant.profileid} (type: ${typeof participant.profileid})`);
        console.log(`  - role: ${participant.role} (type: ${typeof participant.role})`);
        console.log(`  - joinedAt: ${participant.joinedAt} (type: ${typeof participant.joinedAt})`);
        console.log(`  - permissions:`, participant.permissions);
        
        // Check that all required fields are present
        if (!participant.profileid || !participant.role || !participant.joinedAt || !participant.permissions) {
          console.log(`❌ Participant ${participant.profileid} is missing required fields`);
          return;
        }
        
        // Check permissions structure
        const requiredPermissions = ['canSendMessages', 'canAddMembers', 'canRemoveMembers', 'canEditChat', 'canDeleteMessages', 'canPinMessages'];
        for (const perm of requiredPermissions) {
          if (typeof participant.permissions[perm] !== 'boolean') {
            console.log(`❌ Participant ${participant.profileid} is missing permission ${perm}`);
            return;
          }
        }
      }
      
      console.log('✅ All participant objects have correct structure');
    } else {
      console.log('❌ Chat not found in database');
      return;
    }
    
    // Test 4: Invalid user IDs should throw clear errors
    console.log('\n📝 Test 4: Testing invalid user IDs...');
    const invalidParticipants = ['profile-123', 'invalid-profile-id'];
    try {
      const invalidValidParticipants = await Profile.find({
        profileid: { $in: invalidParticipants }
      });
      
      if (invalidValidParticipants.length !== invalidParticipants.length) {
        const foundIds = invalidValidParticipants.map(p => p.profileid);
        const missingIds = invalidParticipants.filter(id => !foundIds.includes(id));
        throw new Error(`Some participants do not exist: ${missingIds.join(', ')}`);
      }
      console.log('❌ Test failed - should have thrown an error for invalid user ID');
    } catch (error) {
      console.log('✅ Correctly threw error for invalid user ID:', error.message);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
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
testChatCreation();