import mongoose from 'mongoose';
import Resolvers from './Controllers/Resolver.js';

async function testPublishDraftFix() {
  try {
    await mongoose.connect('mongodb://localhost:27017/Instagram');
    console.log('✅ Connected to Instagram database');

    // Get shivahumai profile
    const profile = await mongoose.connection.db.collection('profiles')
      .findOne({ username: 'shivahumai' });
    
    if (!profile) {
      console.log('❌ shivahumai profile not found!');
      return;
    }

    console.log(`\n👤 Testing PublishDraft with profile: ${profile.username}`);

    // Get the first draft
    const drafts = await mongoose.connection.db.collection('drafts')
      .find({ profileid: profile.profileid }).toArray();
    
    if (drafts.length === 0) {
      console.log('❌ No drafts found to test with!');
      return;
    }

    const testDraft = drafts[0];
    console.log('\n📝 Testing with draft:');
    console.log('- Draft ID:', testDraft.draftid);
    console.log('- Title:', testDraft.title);
    console.log('- Post URL:', testDraft.postUrl || 'None');
    console.log('- Post Type:', testDraft.postType || 'None');

    // Mock user context
    const mockUser = {
      profileid: profile.profileid,
      username: profile.username
    };

    console.log('\n🧪 Testing PublishDraft resolver...');

    try {
      // Test the fixed PublishDraft resolver (no required parameters)
      const publishResult = await Resolvers.Mutation.PublishDraft(
        null,
        { draftid: testDraft.draftid }, // Only provide draftid
        { user: mockUser }
      );

      console.log('\n✅ SUCCESS! PublishDraft worked:');
      console.log('- New Post ID:', publishResult.postid);
      console.log('- Post URL:', publishResult.postUrl);
      console.log('- Post Type:', publishResult.postType);
      console.log('- Title:', publishResult.title);
      console.log('- Description:', publishResult.Description);

      // Verify the draft was deleted
      const draftAfterPublish = await mongoose.connection.db.collection('drafts')
        .findOne({ draftid: testDraft.draftid });
      
      if (!draftAfterPublish) {
        console.log('✅ Draft was successfully deleted after publishing');
      } else {
        console.log('❌ Draft still exists after publishing (this shouldn\'t happen)');
      }

      // Check if post was created
      const newPost = await mongoose.connection.db.collection('posts')
        .findOne({ postid: publishResult.postid });
      
      if (newPost) {
        console.log('✅ Post was successfully created in database');
        console.log('- Post Title:', newPost.title);
        console.log('- Post Description:', newPost.Description);
        console.log('- Post URL:', newPost.postUrl);
        console.log('- Post Type:', newPost.postType);
      } else {
        console.log('❌ Post was not found in database');
      }

    } catch (resolverError) {
      console.error('❌ PublishDraft resolver error:', resolverError.message);
      console.log('\nThis error should now be fixed with the resolver updates.');
    }

    console.log('\n🔧 The PublishDraft fix should resolve the 400 error you were seeing.');
    console.log('The resolver now uses the draft\'s existing media fields instead of requiring parameters.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

testPublishDraftFix();
