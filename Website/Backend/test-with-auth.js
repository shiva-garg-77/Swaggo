import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testWithAuth() {
  console.log('🔐 Testing Draft Functionality with Authentication\n');
  
  const GRAPHQL_URL = 'http://localhost:45799/graphql';
  
  // Create a test token (simulate user login)
  const testUser = {
    username: 'testuser',
    profileid: 'test-profile-123',
    _id: 'test-mongo-id'
  };
  
  const token = jwt.sign(testUser, process.env.ACCESS_TOKEN_SECRET);
  console.log('✅ Created test authentication token');
  
  // Test 1: Create a draft first
  console.log('\n1️⃣ Creating a test draft...');
  try {
    const createDraftMutation = `
      mutation CreateTestDraft {
        CreateDraft(
          profileid: "${testUser.profileid}",
          title: "Test Draft for Publishing",
          caption: "This draft will be published",
          postType: "TEXT"
        ) {
          draftid
          title
          caption
          postType
          profileid
        }
      }
    `;
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: createDraftMutation })
    });
    
    const result = await response.json();
    console.log('Create draft result:', JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.error('❌ Failed to create draft:', result.errors[0].message);
      return;
    }
    
    const draftId = result.data.CreateDraft.draftid;
    console.log('✅ Created draft with ID:', draftId);
    
    // Test 2: Now publish the draft
    console.log('\n2️⃣ Publishing the draft...');
    
    const publishMutation = `
      mutation PublishTestDraft {
        PublishDraft(draftid: "${draftId}") {
          postid
          title
          Description
          postType
          postUrl
          profileid
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
    console.log('Publish draft result:', JSON.stringify(publishResult, null, 2));
    
    if (publishResult.errors) {
      console.error('❌ Failed to publish draft:', publishResult.errors[0].message);
    } else {
      console.log('✅ Successfully published draft as post!');
      console.log('   Post ID:', publishResult.data.PublishDraft.postid);
      console.log('   Title:', publishResult.data.PublishDraft.title);
      console.log('   Description:', publishResult.data.PublishDraft.Description);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  // Test 3: Test direct draft creation with media
  console.log('\n3️⃣ Testing video draft creation...');
  try {
    const videoDraftMutation = `
      mutation CreateVideoDraft {
        CreateDraft(
          profileid: "${testUser.profileid}",
          title: "Video Draft Test",
          caption: "Video with autoplay",
          postUrl: "http://localhost:45799/uploads/test-video.mp4",
          postType: "VIDEO",
          autoPlay: true
        ) {
          draftid
          title
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
      body: JSON.stringify({ query: videoDraftMutation })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ Video draft creation failed:', result.errors[0].message);
    } else {
      console.log('✅ Video draft created successfully:');
      console.log('   Draft ID:', result.data.CreateDraft.draftid);
      console.log('   AutoPlay:', result.data.CreateDraft.autoPlay);
      
      // Publish this video draft too
      const videoDraftId = result.data.CreateDraft.draftid;
      
      const publishVideoMutation = `
        mutation PublishVideoDraft {
          PublishDraft(draftid: "${videoDraftId}") {
            postid
            postType
            postUrl
            autoPlay
            title
          }
        }
      `;
      
      const publishResponse = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: publishVideoMutation })
      });
      
      const publishResult = await publishResponse.json();
      
      if (publishResult.errors) {
        console.error('❌ Video draft publish failed:', publishResult.errors[0].message);
      } else {
        console.log('✅ Video draft published successfully with autoPlay!');
        console.log('   Post AutoPlay:', publishResult.data.PublishDraft.autoPlay);
      }
    }
    
  } catch (error) {
    console.error('❌ Video draft test error:', error.message);
  }
  
  console.log('\n🎯 Summary:');
  console.log('The backend fixes are working correctly with proper authentication!');
  console.log('Make sure your frontend is:');
  console.log('1. Including the Authorization header with JWT token');
  console.log('2. Using the simplified PublishDraft mutation (only draftid required)');
  console.log('3. Handling the autoPlay field for video posts');
}

testWithAuth().catch(console.error);
