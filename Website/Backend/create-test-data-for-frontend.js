import mongoose from 'mongoose';
import Draft from './Models/FeedModels/Draft.js';
import Profile from './Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';

async function createTestDataForFrontend() {
  try {
    await mongoose.connect('mongodb://localhost:27017/website');
    console.log('✅ Connected to MongoDB');

    // First, let's check if there's already a profile
    let testProfile = await Profile.findOne({});
    
    if (!testProfile) {
      // Create a test profile
      testProfile = new Profile({
        profileid: uuidv4(),
        username: 'testuser',
        name: 'Test User',
        bio: 'Test profile for draft functionality',
        profilePic: null,
        isPrivate: false,
        isVerified: false
      });
      
      await testProfile.save();
      console.log('✅ Created test profile:', testProfile.username);
    } else {
      console.log('✅ Using existing profile:', testProfile.username);
    }

    // Create some test drafts with different types
    const draftsToCreate = [
      {
        draftid: uuidv4(),
        profileid: testProfile.profileid,
        postUrl: 'http://localhost:45799/uploads/sample-image.jpg',
        postType: 'IMAGE',
        title: 'My Vacation Photo',
        caption: 'Beautiful sunset from my vacation last week! 🌅',
        location: 'Bali, Indonesia',
        tags: ['vacation', 'sunset', 'travel'],
        allowComments: true,
        hideLikeCount: false
      },
      {
        draftid: uuidv4(),
        profileid: testProfile.profileid,
        postUrl: 'http://localhost:45799/uploads/sample-video.mp4',
        postType: 'VIDEO',
        title: 'Cooking Tutorial',
        caption: 'Making my favorite pasta dish! Step by step guide coming soon 👨‍🍳',
        location: 'My Kitchen',
        tags: ['cooking', 'pasta', 'food'],
        allowComments: true,
        hideLikeCount: false
      },
      {
        draftid: uuidv4(),
        profileid: testProfile.profileid,
        postUrl: null,
        postType: 'TEXT',
        title: 'Thoughts for Today',
        caption: 'Just some random thoughts I wanted to share... Maybe I should add a photo later? 🤔',
        location: null,
        tags: ['thoughts', 'personal'],
        allowComments: true,
        hideLikeCount: false
      },
      {
        draftid: uuidv4(),
        profileid: testProfile.profileid,
        postUrl: 'http://localhost:45799/uploads/workout-pic.jpg',
        postType: 'IMAGE',
        title: 'Morning Workout',
        caption: 'Finished my morning run! Feeling energized for the day 💪',
        location: 'Central Park',
        tags: ['workout', 'running', 'fitness', 'morning'],
        allowComments: true,
        hideLikeCount: false
      }
    ];

    // Delete existing test drafts first
    await Draft.deleteMany({ profileid: testProfile.profileid });
    console.log('🗑 Cleaned up old test drafts');

    // Create new drafts
    for (const draftData of draftsToCreate) {
      const draft = new Draft(draftData);
      await draft.save();
      console.log(`✅ Created draft: "${draft.title}" (${draft.postType})`);
    }

    console.log('\n🎉 Test data created successfully!');
    console.log(`📊 Profile: ${testProfile.username} (ID: ${testProfile.profileid})`);
    console.log(`📝 Drafts created: ${draftsToCreate.length}`);
    
    console.log('\n📋 Now you can test:');
    console.log('1. Make sure you\'re logged in as "testuser" or create this user in your auth system');
    console.log('2. Go to your profile page');
    console.log('3. Click on the "Draft" tab');
    console.log('4. You should see the drafts with media previews!');

    // Show what's in the database now
    const allDrafts = await Draft.find({ profileid: testProfile.profileid });
    console.log('\n📝 Drafts in database:');
    allDrafts.forEach((draft, index) => {
      console.log(`${index + 1}. ${draft.title} (${draft.postType}) - ${draft.postUrl ? 'Has Media' : 'Text Only'}`);
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

createTestDataForFrontend();
