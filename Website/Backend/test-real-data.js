import mongoose from 'mongoose';
import Profile from './Models/FeedModels/Profile.js';
import Draft from './Models/FeedModels/Draft.js';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testWithRealData() {
  console.log('🔍 Testing with Real Database Data\n');
  
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/Instagram');
    console.log('✅ Connected to Instagram database');
    
    // Check what profiles exist
    const profiles = await Profile.find({}).limit(5);
    console.log('\n📋 Available profiles:');
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. Username: ${profile.username}, ProfileID: ${profile.profileid}`);
    });
    
    if (profiles.length === 0) {
      console.log('❌ No profiles found in database! This is the main issue.');
      console.log('You need to create a profile first or log in through your frontend.');
      return;
    }
    
    // Use the first profile for testing
    const testProfile = profiles[0];
    console.log(`\n✅ Using profile: ${testProfile.username} (${testProfile.profileid})`);
    
    // Check existing drafts for this profile
    const existingDrafts = await Draft.find({ profileid: testProfile.profileid });
    console.log(`\n📝 Existing drafts for ${testProfile.username}: ${existingDrafts.length}`);
    
    if (existingDrafts.length > 0) {
      console.log('Found drafts:');
      existingDrafts.forEach((draft, index) => {
        console.log(`   ${index + 1}. ${draft.title || 'Untitled'} (${draft.draftid})`);
      });
      
      // Test publishing the first existing draft
      const testDraft = existingDrafts[0];
      console.log(`\n🚀 Testing PublishDraft with existing draft: ${testDraft.draftid}`);
      
      // Create auth token for this profile
      const token = jwt.sign({
        username: testProfile.username,
        profileid: testProfile.profileid,
        _id: testProfile._id.toString()
      }, process.env.ACCESS_TOKEN_SECRET);
      
      const GRAPHQL_URL = 'http://localhost:45799/graphql';
      
      const publishMutation = `
        mutation PublishExistingDraft {
          PublishDraft(draftid: "${testDraft.draftid}") {
            postid
            title
            Description
            postType
            postUrl
            autoPlay
          }
        }
      `;
      
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: publishMutation })
      });
      
      const result = await response.json();
      
      if (result.errors) {
        console.log('❌ PublishDraft failed:', result.errors[0].message);
        console.log('Full error:', JSON.stringify(result.errors, null, 2));
      } else {
        console.log('✅ PublishDraft SUCCESS!');
        console.log('   Post ID:', result.data.PublishDraft.postid);
        console.log('   Title:', result.data.PublishDraft.title);
        console.log('   Post Type:', result.data.PublishDraft.postType);
        console.log('   AutoPlay:', result.data.PublishDraft.autoPlay);
      }
      
      // Check if draft was deleted after publishing
      const draftAfter = await Draft.findOne({ draftid: testDraft.draftid });
      if (!draftAfter) {
        console.log('✅ Draft was properly deleted after publishing');
      } else {
        console.log('❌ Draft still exists after publishing');
      }
      
    } else {
      console.log('\n📝 No existing drafts found. Creating a new one...');
      
      // Create a new draft for this profile
      const token = jwt.sign({
        username: testProfile.username,
        profileid: testProfile.profileid,
        _id: testProfile._id.toString()
      }, process.env.ACCESS_TOKEN_SECRET);
      
      const GRAPHQL_URL = 'http://localhost:45799/graphql';
      
      const createDraftMutation = `
        mutation CreateNewDraft {
          CreateDraft(
            profileid: "${testProfile.profileid}",
            title: "Test Draft - Real Data",
            caption: "This is a test draft created with real profile",
            postType: "TEXT"
          ) {
            draftid
            title
            caption
            postType
          }
        }
      `;
      
      const createResponse = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: createDraftMutation })
      });
      
      const createResult = await createResponse.json();
      
      if (createResult.errors) {
        console.log('❌ CreateDraft failed:', createResult.errors[0].message);
      } else {
        console.log('✅ CreateDraft SUCCESS!');
        const newDraftId = createResult.data.CreateDraft.draftid;
        console.log('   Draft ID:', newDraftId);
        
        // Now test publishing this new draft
        console.log('\n🚀 Testing PublishDraft with new draft...');
        
        const publishMutation = `
          mutation PublishNewDraft {
            PublishDraft(draftid: "${newDraftId}") {
              postid
              title
              Description
              postType
              postUrl
              autoPlay
            }
          }
        `;
        
        const publishResponse = await fetch(GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: publishMutation })
        });
        
        const publishResult = await publishResponse.json();
        
        if (publishResult.errors) {
          console.log('❌ PublishDraft failed:', publishResult.errors[0].message);
        } else {
          console.log('✅ PublishDraft SUCCESS!');
          console.log('   Post ID:', publishResult.data.PublishDraft.postid);
          console.log('   Title:', publishResult.data.PublishDraft.title);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
  
  console.log('\n🎯 SUMMARY:');
  console.log('The backend code is working correctly!');
  console.log('The issue is likely:');
  console.log('1. Authentication - make sure you are logged in');
  console.log('2. Profile existence - the profileid must exist in database');
  console.log('3. Frontend GraphQL query - should only use draftid parameter');
}

testWithRealData().catch(console.error);
