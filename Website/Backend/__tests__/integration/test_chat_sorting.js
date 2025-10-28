/**
 * Test script for Chat Sorting Functionality
 * This script tests that chats are properly sorted by last activity
 */

// Import required modules
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Import models
import Chat from '../../Models/FeedModels/Chat.js';
import Profile from '../../Models/FeedModels/Profile.js';
import Message from '../../Models/FeedModels/Message.js';

// Test function to verify chat sorting
async function testChatSorting() {
  console.log('🧪 Starting Chat Sorting Tests...\n');
  
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/testdb');
    console.log('✅ Connected to database\n');
    
    // Clear database for clean test
    await Chat.deleteMany({});
    await Profile.deleteMany({});
    await Message.deleteMany({});
    
    // Create test profiles
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
    
    // Create chats with different lastMessageAt values
    console.log('📝 Creating test chats...');
    
    // Chat with recent lastMessageAt
    const recentChat = new Chat({
      chatid: 'chat-recent',
      participants: [
        { 
          profileid: 'profile-123', 
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
          profileid: 'profile-456', 
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
      lastMessageAt: new Date(),
      createdBy: 'profile-123',
      isActive: true
    });
    await recentChat.save();
    
    // Chat with older lastMessageAt
    const oldChat = new Chat({
      chatid: 'chat-old',
      participants: [
        { 
          profileid: 'profile-123', 
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
          profileid: 'profile-456', 
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
      lastMessageAt: new Date(Date.now() - 86400000), // 1 day ago
      createdBy: 'profile-123',
      isActive: true
    });
    await oldChat.save();
    
    // Chat with null lastMessageAt (simulating old chats)
    const nullChat = new Chat({
      chatid: 'chat-null',
      participants: [
        { 
          profileid: 'profile-123', 
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
          profileid: 'profile-456', 
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
      lastMessageAt: null,
      createdBy: 'profile-123',
      isActive: true
    });
    await nullChat.save();
    
    console.log('✅ Created test chats\n');
    
    // Test the getChats query logic
    console.log('🔍 Testing chat sorting...');
    const chats = await Chat.find({
      'participants.profileid': 'profile-123',
      isActive: true
    }).sort({ lastMessageAt: -1 });
    
    console.log('📊 Sorted chats:');
    chats.forEach((chat, index) => {
      console.log(`  ${index + 1}. ${chat.chatid} - lastMessageAt: ${chat.lastMessageAt}`);
    });
    
    // Verify the order
    if (chats.length === 3) {
      const firstChat = chats[0];
      const secondChat = chats[1];
      const thirdChat = chats[2];
      
      // The recent chat should be first
      if (firstChat.chatid === 'chat-recent') {
        console.log('✅ Recent chat is correctly first');
      } else {
        console.log('❌ Recent chat is not first');
      }
      
      // The old chat should be second
      if (secondChat.chatid === 'chat-old') {
        console.log('✅ Old chat is correctly second');
      } else {
        console.log('❌ Old chat is not second');
      }
      
      // The null chat should be third
      if (thirdChat.chatid === 'chat-null') {
        console.log('✅ Null chat is correctly third');
      } else {
        console.log('❌ Null chat is not third');
      }
    } else {
      console.log('❌ Unexpected number of chats returned');
    }
    
    console.log('\n✅ Chat sorting test completed!');
    
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
testChatSorting();