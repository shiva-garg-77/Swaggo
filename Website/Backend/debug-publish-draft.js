import mongoose from 'mongoose';
import Profile from './Models/FeedModels/Profile.js';
import Draft from './Models/FeedModels/Draft.js';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debugPublishDraft() {
  console.log('🔍 DEBUG: Publishing Draft Issue\n');
  
  try {
    await mongoose.connect('mongodb://localhost:27017/Instagram');
    console.log('✅ Connected to Instagram database');
    
    // Get a user profile
    const profile = await Profile.findOne({ username: 'shiva' });
    if (!profile) {
      console.error('❌ No profile found for shiva');
      return;
    }
    console.log('👤 Using profile:', profile.username, '(ID:', profile.profileid + ')');
    
    // Create JWT token
    const token = jwt.sign({
      username: profile.username,
      profileid: profile.profileid,
      _id: profile._id.toString()
    }, process.env.ACCESS_TOKEN_SECRET);
    console.log('🔑 JWT Token created');
    
    // Get a draft to test with
    const drafts = await Draft.find({ profileid: profile.profileid }).limit(1);
    if (drafts.length === 0) {
      console.log('📝 No drafts found, creating test draft...');
      
      // Create a test draft
      const testDraft = new Draft({
        draftid: 'test-draft-' + Date.now(),
        profileid: profile.profileid,
        title: 'Test Draft for Publishing',
        caption: 'Test caption',
        postUrl: 'http://localhost:45799/uploads/test-video.mp4',
        postType: 'VIDEO',
        autoPlay: true
      });
      await testDraft.save();
      console.log('✅ Test draft created:', testDraft.draftid);
      drafts.push(testDraft);
    }
    
    const draftToPublish = drafts[0];
    console.log('\n📄 Draft to publish:');
    console.log('- Draft ID:', draftToPublish.draftid);
    console.log('- Title:', draftToPublish.title);
    console.log('- Caption:', draftToPublish.caption);
    console.log('- Post URL:', draftToPublish.postUrl);
    console.log('- Post Type:', draftToPublish.postType);
    console.log('- AutoPlay:', draftToPublish.autoPlay);
    
    // Test the GraphQL mutation
    const GRAPHQL_URL = 'http://localhost:45799/graphql';
    
    console.log('\n🔄 Testing PublishDraft GraphQL mutation...');
    const publishMutation = `
      mutation TestPublishDraft {
        PublishDraft(draftid: "${draftToPublish.draftid}") {
          postid
          title
          Description
          postType
          postUrl
          autoPlay
          createdAt
        }
      }
    `;
    
    console.log('📤 Sending GraphQL request...');
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        query: publishMutation 
      })
    });
    
    console.log('📥 Response status:', response.status);
    
    const result = await response.json();
    
    if (result.errors) {
      console.error('\n❌ GraphQL Errors:');
      result.errors.forEach(error => {
        console.error('- Error:', error.message);
        console.error('- Path:', error.path);
        console.error('- Extensions:', error.extensions);
      });
    } else {
      console.log('\n✅ SUCCESS! Draft published:');
      console.log('- New Post ID:', result.data.PublishDraft.postid);
      console.log('- Post Type:', result.data.PublishDraft.postType);
      console.log('- Post URL:', result.data.PublishDraft.postUrl);
      console.log('- AutoPlay:', result.data.PublishDraft.autoPlay);
    }
    
    // Check if draft was deleted
    const draftAfterPublish = await Draft.findOne({ draftid: draftToPublish.draftid });
    if (!draftAfterPublish) {
      console.log('✅ Draft was properly deleted after publishing');
    } else {
      console.log('❌ Draft still exists after publishing');
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

debugPublishDraft().catch(console.error);
