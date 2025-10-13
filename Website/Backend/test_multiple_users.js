/**
 * Test script for Multiple User Combinations
 * This script tests chat creation and messaging with 5+ different user combinations
 */

// Import required modules
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Import models
import Chat from './Models/FeedModels/Chat.js';
import Profile from './Models/FeedModels/Profile.js';
import Message from './Models/FeedModels/Message.js';

// Test function to verify multiple user combinations
async function testMultipleUsers() {
  console.log('🧪 Starting Multiple User Combination Tests...\n');
  
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/testdb');
    console.log('✅ Connected to database\n');
    
    // Clear database for clean test
    await Chat.deleteMany({});
    await Profile.deleteMany({});
    await Message.deleteMany({});
    
    // Create 5 test profiles
    const profiles = [];
    for (let i = 1; i <= 5; i++) {
      const profile = new Profile({
        profileid: `profile-${i}`,
        username: `testuser${i}`,
        name: `Test User ${i}`,
        email: `testuser${i}@example.com`
      });
      await profile.save();
      profiles.push(profile);
    }
    
    console.log(`👥 Created ${profiles.length} test profiles\n`);
    
    // Test 1: Create direct chats between all combinations of users
    console.log('📝 Test 1: Creating direct chats between all user combinations...\n');
    
    const chats = [];
    let chatCount = 0;
    
    // Create direct chats between each pair of users
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const profile1 = profiles[i];
        const profile2 = profiles[j];
        
        console.log(`  Creating chat between ${profile1.username} and ${profile2.username}...`);
        
        // Create participant objects
        const participantObjects = [
          {
            profileid: profile1.profileid,
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
          },
          {
            profileid: profile2.profileid,
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
          }
        ];
        
        // Create new chat
        const newChat = new Chat({
          chatid: uuidv4(),
          participants: participantObjects,
          chatType: 'direct',
          chatName: null,
          chatAvatar: null,
          createdBy: profile1.profileid,
          adminIds: [],
          lastMessageAt: new Date()
        });
        
        await newChat.save();
        chats.push(newChat);
        chatCount++;
        console.log(`    ✅ Chat created: ${newChat.chatid}`);
      }
    }
    
    console.log(`\n✅ Created ${chatCount} direct chats between all user combinations\n`);
    
    // Test 2: Verify all chats were created correctly
    console.log('📝 Test 2: Verifying all chats were created correctly...\n');
    
    for (const chat of chats) {
      const chatFromDb = await Chat.findOne({ chatid: chat.chatid });
      if (chatFromDb) {
        console.log(`  ✅ Chat ${chat.chatid} found in database`);
        console.log(`    Participants: ${chatFromDb.participants.map(p => p.profileid).join(', ')}`);
        
        // Verify participant count
        if (chatFromDb.participants.length === 2) {
          console.log(`    ✅ Correct participant count (2)`);
        } else {
          console.log(`    ❌ Incorrect participant count: ${chatFromDb.participants.length}`);
        }
      } else {
        console.log(`  ❌ Chat ${chat.chatid} not found in database`);
      }
    }
    
    // Test 3: Send messages in each chat
    console.log('\n📝 Test 3: Sending messages in each chat...\n');
    
    const messages = [];
    for (const chat of chats) {
      const participants = chat.participants.map(p => p.profileid);
      const senderId = participants[0];
      const receiverId = participants[1];
      
      console.log(`  Sending message in chat ${chat.chatid} from ${senderId} to ${receiverId}...`);
      
      // Create a message
      const message = new Message({
        messageid: uuidv4(),
        chatid: chat.chatid,
        senderid: senderId,
        messageType: 'text',
        content: `Hello from ${senderId} to ${receiverId}!`,
        messageStatus: 'sent',
        deliveredTo: [{
          profileid: receiverId,
          deliveredAt: new Date()
        }]
      });
      
      await message.save();
      messages.push(message);
      console.log(`    ✅ Message sent: ${message.content}`);
      
      // Update chat's last message
      chat.lastMessage = message.messageid;
      chat.lastMessageAt = message.createdAt;
      await chat.save();
    }
    
    console.log(`\n✅ Sent ${messages.length} messages across all chats\n`);
    
    // Test 4: Verify messages were delivered correctly
    console.log('📝 Test 4: Verifying messages were delivered correctly...\n');
    
    for (const message of messages) {
      const messageFromDb = await Message.findOne({ messageid: message.messageid });
      if (messageFromDb) {
        console.log(`  ✅ Message ${message.messageid} found in database`);
        console.log(`    Content: ${messageFromDb.content}`);
        console.log(`    Sender: ${messageFromDb.senderid}`);
        console.log(`    Chat: ${messageFromDb.chatid}`);
        
        // Verify delivery
        if (messageFromDb.deliveredTo.length > 0) {
          console.log(`    ✅ Delivered to: ${messageFromDb.deliveredTo.map(d => d.profileid).join(', ')}`);
        } else {
          console.log(`    ❌ Not delivered to anyone`);
        }
      } else {
        console.log(`  ❌ Message ${message.messageid} not found in database`);
      }
    }
    
    // Test 5: Verify each user can access their chats
    console.log('\n📝 Test 5: Verifying each user can access their chats...\n');
    
    for (const profile of profiles) {
      console.log(`  Checking chats for ${profile.username} (${profile.profileid})...`);
      
      // Find chats where this user is a participant
      const userChats = await Chat.find({ 
        'participants.profileid': profile.profileid,
        isActive: true 
      });
      
      console.log(`    ✅ ${profile.username} has ${userChats.length} chats`);
      
      // List the other participants in each chat
      for (const chat of userChats) {
        const otherParticipants = chat.participants
          .filter(p => p.profileid !== profile.profileid)
          .map(p => p.profileid);
        console.log(`      Chat with: ${otherParticipants.join(', ')}`);
      }
    }
    
    console.log('\n✅ All multiple user combination tests completed successfully!');
    
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
testMultipleUsers();