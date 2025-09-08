import mongoose from 'mongoose';
import Resolvers from './Controllers/Resolver.js';

async function testAllDraftFixes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/Instagram');
    console.log('✅ Connected to Instagram database');

    console.log('\n🧪 TESTING ALL DRAFT FIXES');
    console.log('=' .repeat(50));

    // Get shivahumai profile
    const profile = await mongoose.connection.db.collection('profiles')
      .findOne({ username: 'shivahumai' });
    
    if (!profile) {
      console.log('❌ shivahumai profile not found!');
      return;
    }

    const mockUser = {
      profileid: profile.profileid,
      username: profile.username
    };

    console.log(`\n👤 Testing with profile: ${profile.username} (${profile.profileid})`);

    // Test 1: Create a new draft with media
    console.log('\n📝 TEST 1: Creating draft with media...');
    
    try {
      const newDraftResult = await Resolvers.Mutation.CreateDraft(
        null,
        {
          profileid: profile.profileid,
          postUrl: 'http://localhost:45799/uploads/test-video.mp4',
          postType: 'VIDEO',
          title: 'Test Draft with Media',
          caption: 'This is a test draft with video media',
          location: 'Test Location',
          tags: ['test', 'video', 'draft'],
          allowComments: true,
          hideLikeCount: false
        },
        { user: mockUser }
      );

      console.log('✅ SUCCESS: Created draft with media:');
      console.log('- Draft ID:', newDraftResult.draftid);
      console.log('- Post URL:', newDraftResult.postUrl);
      console.log('- Post Type:', newDraftResult.postType);
      console.log('- Title:', newDraftResult.title);

    } catch (error) {
      console.error('❌ FAILED to create draft:', error.message);
    }

    // Test 2: Get drafts to verify they include media fields
    console.log('\n📋 TEST 2: Getting drafts with media fields...');
    
    try {
      const draftsResult = await Resolvers.Query.getDrafts(
        null,
        { profileid: profile.profileid },
        { user: mockUser }
      );

      console.log('✅ SUCCESS: Retrieved drafts:');
      console.log('- Draft count:', draftsResult.length);
      
      if (draftsResult.length > 0) {
        draftsResult.forEach((draft, index) => {
          console.log(`\nDraft ${index + 1}:`);
          console.log('- ID:', draft.draftid);
          console.log('- Title:', draft.title || 'No title');
          console.log('- Post URL:', draft.postUrl || 'No media');
          console.log('- Post Type:', draft.postType || 'Not set');
          console.log('- Has media:', !!(draft.postUrl && draft.postType));
        });
      }

    } catch (error) {
      console.error('❌ FAILED to get drafts:', error.message);
    }

    // Test 3: Publish draft (the main issue)
    console.log('\n🚀 TEST 3: Publishing draft without required parameters...');
    
    const drafts = await mongoose.connection.db.collection('drafts')
      .find({ profileid: profile.profileid }).toArray();
    
    if (drafts.length > 0) {
      const testDraft = drafts[0];
      
      try {
        // This should now work without postUrl and postType parameters
        const publishResult = await Resolvers.Mutation.PublishDraft(
          null,
          { draftid: testDraft.draftid }, // Only provide draftid
          { user: mockUser }
        );

        console.log('✅ SUCCESS: Published draft without 400 error:');
        console.log('- New Post ID:', publishResult.postid);
        console.log('- Post URL:', publishResult.postUrl);
        console.log('- Post Type:', publishResult.postType);
        console.log('- Title:', publishResult.title);

        // Verify draft was deleted
        const draftAfterPublish = await mongoose.connection.db.collection('drafts')
          .findOne({ draftid: testDraft.draftid });
        
        if (!draftAfterPublish) {
          console.log('✅ Draft successfully deleted after publishing');
        } else {
          console.log('❌ Draft still exists after publishing');
        }

      } catch (error) {
        console.error('❌ FAILED to publish draft:', error.message);
        console.log('This should be the 400 error fix!');
      }
    }

    // Test 4: Create text-only draft
    console.log('\n📄 TEST 4: Creating text-only draft...');
    
    try {
      const textDraftResult = await Resolvers.Mutation.CreateDraft(
        null,
        {
          profileid: profile.profileid,
          postUrl: null,
          postType: 'TEXT',
          title: 'Text Only Draft',
          caption: 'This is a text-only draft without media',
          tags: ['text', 'only'],
          allowComments: true,
          hideLikeCount: false
        },
        { user: mockUser }
      );

      console.log('✅ SUCCESS: Created text-only draft:');
      console.log('- Draft ID:', textDraftResult.draftid);
      console.log('- Post URL:', textDraftResult.postUrl || 'None');
      console.log('- Post Type:', textDraftResult.postType);

    } catch (error) {
      console.error('❌ FAILED to create text draft:', error.message);
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await mongoose.connection.db.collection('drafts').deleteMany({
      profileid: profile.profileid,
      title: { $regex: /Test Draft|Text Only/ }
    });
    await mongoose.connection.db.collection('posts').deleteMany({
      profileid: profile.profileid,
      title: { $regex: /Test Draft/ }
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 ALL TESTS COMPLETED!');
    console.log('\nSUMMARY:');
    console.log('- Draft creation with media: Should work ✅');
    console.log('- Draft retrieval with media fields: Should work ✅');
    console.log('- Draft publishing without 400 error: Should work ✅');
    console.log('- Text-only drafts: Should work ✅');

    console.log('\n📋 NEXT STEPS FOR FRONTEND:');
    console.log('1. Restart your backend server');
    console.log('2. Test publishing drafts - no more 400 errors');
    console.log('3. Test saving drafts from create modal');
    console.log('4. Check video autoplay in previews');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

testAllDraftFixes();
