import mongoose from 'mongoose';
import Profile from './Models/FeedModels/Profile.js';
import Draft from './Models/FeedModels/Draft.js';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debug400Error() {
  console.log('🔍 DEBUG: 400 Status Code Issue\n');
  
  try {
    await mongoose.connect('mongodb://localhost:27017/Instagram');
    console.log('✅ Connected to Instagram database');
    
    // Get a user profile
    const profile = await Profile.findOne({ username: 'shiva' });
    const token = jwt.sign({
      username: profile.username,
      profileid: profile.profileid,
      _id: profile._id.toString()
    }, process.env.ACCESS_TOKEN_SECRET);
    
    // Get the test draft I created
    const testDraft = await Draft.findOne({ draftid: '2014481c-2ec0-4f7b-8509-3a8c3aaa0b53' });
    if (!testDraft) {
      console.log('❌ Test draft not found, creating new one...');
      return;
    }
    
    console.log('📄 Found test draft:');
    console.log('- ID:', testDraft.draftid);
    console.log('- Title:', testDraft.title);
    console.log('- PostType:', testDraft.postType);
    console.log('- PostURL:', testDraft.postUrl);
    
    const GRAPHQL_URL = 'http://localhost:45799/graphql';
    
    // Test with the FIXED mutation format (removed profileid)
    console.log('\n🔧 Testing FIXED GraphQL mutation...');
    const publishMutation = `
      mutation PublishDraft($draftid: String!) {
        PublishDraft(draftid: $draftid) {
          postid
          postUrl
          title
          Description
          postType
          location
          tags
          taggedPeople
          allowComments
          hideLikeCount
          autoPlay
          createdAt
          updatedAt
        }
      }
    `;
    
    console.log('📤 Sending GraphQL request...');
    console.log('Variables:', { draftid: testDraft.draftid });
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        query: publishMutation,
        variables: {
          draftid: testDraft.draftid
        }
      })
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('📥 Raw response:', responseText);
    
    if (response.status === 400) {
      console.error('\n❌ 400 BAD REQUEST DETECTED!');
      try {
        const errorData = JSON.parse(responseText);
        console.error('Parsed error:', errorData);
      } catch (e) {
        console.error('Could not parse error response as JSON');
      }
    } else {
      try {
        const result = JSON.parse(responseText);
        if (result.errors) {
          console.error('\n❌ GraphQL Errors:');
          result.errors.forEach(error => {
            console.error('- Error:', error.message);
            console.error('- Locations:', error.locations);
            console.error('- Path:', error.path);
          });
        } else {
          console.log('\n✅ SUCCESS!');
          console.log('Result:', result.data);
        }
      } catch (e) {
        console.error('Could not parse response as JSON:', e.message);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

debug400Error().catch(console.error);
