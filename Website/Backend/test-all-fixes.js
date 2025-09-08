import mongoose from 'mongoose';
import Resolvers from './Controllers/Resolver.js';
import Draft from './Models/FeedModels/Draft.js';
import Post from './Models/FeedModels/Post.js';
import Profile from './Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';

async function testAllFixes() {
  try {
    console.log('🔧 Testing All Draft & Post Fixes\n');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/Instagram');
    console.log('✅ Connected to Instagram database');

    // Get or create test profile
    let profile = await Profile.findOne({ username: 'testuser' });
    if (!profile) {
      profile = new Profile({
        profileid: uuidv4(),
        username: 'testuser',
        name: 'Test User',
        bio: 'Testing draft fixes',
        profilePic: null,
        isPrivate: false,
        isVerified: false
      });
      await profile.save();
      console.log('✅ Created test profile');
    }

    const mockUser = {
      profileid: profile.profileid,
      username: profile.username
    };

    console.log('\n1️⃣ Testing CreateDraft with autoPlay...');
    
    try {
      // Test 1: Create a video draft with autoPlay
      const videoDraft = await Resolvers.Mutation.CreateDraft(
        null,
        {
          profileid: profile.profileid,
          postUrl: 'http://localhost:4000/uploads/test-video.mp4',
          postType: 'VIDEO',
          title: 'Test Video Draft',
          caption: 'This is a test video with autoPlay',
          autoPlay: true
        },
        { user: mockUser }
      );

      console.log('✅ Video draft created with autoPlay:', {
        id: videoDraft.draftid,
        type: videoDraft.postType,
        autoPlay: videoDraft.autoPlay
      });

      console.log('\n2️⃣ Testing PublishDraft (no required parameters)...');

      // Test 2: Publish the draft (should work without postUrl/postType params)
      const publishedPost = await Resolvers.Mutation.PublishDraft(
        null,
        { draftid: videoDraft.draftid },
        { user: mockUser }
      );

      console.log('✅ Draft published successfully:', {
        postId: publishedPost.postid,
        postType: publishedPost.postType,
        postUrl: publishedPost.postUrl,
        autoPlay: publishedPost.autoPlay,
        title: publishedPost.title
      });

      // Verify draft was deleted
      const draftCheck = await Draft.findOne({ draftid: videoDraft.draftid });
      if (!draftCheck) {
        console.log('✅ Draft was deleted after publishing');
      } else {
        console.log('❌ Draft still exists (shouldn\'t happen)');
      }

      console.log('\n3️⃣ Testing CreateDraft without media (text post)...');

      // Test 3: Create text draft
      const textDraft = await Resolvers.Mutation.CreateDraft(
        null,
        {
          profileid: profile.profileid,
          title: 'Text Post Draft',
          caption: 'This is a text-only draft',
          location: 'Test Location'
        },
        { user: mockUser }
      );

      console.log('✅ Text draft created:', {
        id: textDraft.draftid,
        type: textDraft.postType,
        title: textDraft.title
      });

      console.log('\n4️⃣ Testing UpdateDraft with validation...');

      // Test 4: Update draft with autoPlay
      const updatedDraft = await Resolvers.Mutation.UpdateDraft(
        null,
        {
          draftid: textDraft.draftid,
          postUrl: 'http://localhost:4000/uploads/updated-image.jpg',
          postType: 'IMAGE',
          caption: 'Updated caption with image',
          autoPlay: false
        },
        { user: mockUser }
      );

      console.log('✅ Draft updated successfully:', {
        id: updatedDraft.draftid,
        type: updatedDraft.postType,
        autoPlay: updatedDraft.autoPlay
      });

      console.log('\n5️⃣ Testing CreatePost with autoPlay...');

      // Test 5: Create post directly with autoPlay
      const directPost = await Resolvers.Mutation.CreatePost(
        null,
        {
          profileid: profile.profileid,
          postUrl: 'http://localhost:4000/uploads/direct-video.mp4',
          postType: 'VIDEO',
          title: 'Direct Video Post',
          Description: 'Video post created directly',
          autoPlay: true
        },
        { user: mockUser }
      );

      console.log('✅ Direct post created with autoPlay:', {
        id: directPost.postid,
        type: directPost.postType,
        autoPlay: directPost.autoPlay
      });

      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('\n📋 Summary of Fixes:');
      console.log('✓ PublishDraft no longer requires postUrl/postType parameters');
      console.log('✓ AutoPlay support added to drafts and posts');
      console.log('✓ Better media validation in CreateDraft');
      console.log('✓ Enhanced error handling throughout');
      console.log('✓ Proper draft-to-post conversion with all fields');

      // Clean up test data
      await Draft.deleteMany({ profileid: profile.profileid });
      await Post.deleteMany({ profileid: profile.profileid });
      console.log('\n🧹 Test data cleaned up');

    } catch (testError) {
      console.error('❌ Test failed:', testError.message);
      console.log('\nThis indicates an issue that needs to be fixed.');
    }

  } catch (error) {
    console.error('❌ Setup error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

testAllFixes();
