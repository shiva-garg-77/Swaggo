import mongoose from 'mongoose';
import Resolvers from './Controllers/Resolver.js';

async function testRealDrafts() {
  try {
    // Connect to the same database as your backend
    await mongoose.connect('mongodb://localhost:27017/Instagram');
    console.log('✅ Connected to Instagram database (same as backend)');

    // Get all profiles first
    const profiles = await mongoose.connection.db.collection('profiles').find({}).toArray();
    console.log('\n👥 Available profiles:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.username} (ID: ${profile.profileid})`);
    });

    if (profiles.length === 0) {
      console.log('❌ No profiles found!');
      return;
    }

    // Test with the first profile
    const testProfile = profiles[0];
    console.log(`\n🧪 Testing getDrafts resolver for profile: ${testProfile.username}`);

    // Mock user context (like when user is logged in)
    const mockUser = {
      profileid: testProfile.profileid,
      username: testProfile.username
    };

    try {
      // Call the GraphQL resolver directly
      const draftsResult = await Resolvers.Query.getDrafts(
        null, // parent
        { profileid: testProfile.profileid }, // args
        { user: mockUser } // context
      );

      console.log('\n📝 getDrafts resolver result:');
      console.log(`- Draft count: ${draftsResult.length}`);
      
      if (draftsResult.length > 0) {
        draftsResult.forEach((draft, index) => {
          console.log(`\nDraft ${index + 1}:`);
          console.log(`- ID: ${draft.draftid}`);
          console.log(`- Title: ${draft.title || 'No title'}`);
          console.log(`- Caption: ${draft.caption || 'No caption'}`);
          console.log(`- Post URL: ${draft.postUrl || 'No media'}`);
          console.log(`- Post Type: ${draft.postType}`);
          console.log(`- Tags: ${draft.tags?.join(', ') || 'No tags'}`);
          console.log(`- Created: ${draft.createdAt}`);
        });
      } else {
        console.log('❌ No drafts returned from resolver!');
        
        // Check database directly
        console.log('\n🔍 Checking database directly...');
        const directDrafts = await mongoose.connection.db.collection('drafts')
          .find({ profileid: testProfile.profileid }).toArray();
        console.log(`Direct database query found: ${directDrafts.length} drafts`);
        
        if (directDrafts.length > 0) {
          console.log('Direct draft data:');
          directDrafts.forEach((draft, index) => {
            console.log(`${index + 1}. ${JSON.stringify(draft, null, 2)}`);
          });
        }
      }

    } catch (resolverError) {
      console.error('❌ Error calling getDrafts resolver:', resolverError);
    }

    // Also test with a different profile to see if it's profile-specific
    if (profiles.length > 1) {
      const secondProfile = profiles[1];
      console.log(`\n🧪 Testing with second profile: ${secondProfile.username}`);
      
      const mockUser2 = {
        profileid: secondProfile.profileid,
        username: secondProfile.username
      };

      try {
        const draftsResult2 = await Resolvers.Query.getDrafts(
          null,
          { profileid: secondProfile.profileid },
          { user: mockUser2 }
        );
        console.log(`- ${secondProfile.username}'s drafts: ${draftsResult2.length}`);
      } catch (err) {
        console.error(`Error with ${secondProfile.username}:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

testRealDrafts();
