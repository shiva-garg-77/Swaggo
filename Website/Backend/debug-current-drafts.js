import mongoose from 'mongoose';
import Draft from './Models/FeedModels/Draft.js';
import Profile from './Models/FeedModels/Profile.js';

async function debugCurrentDrafts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/website');
    console.log('✅ Connected to MongoDB');

    // Get all profiles
    const profiles = await Profile.find({});
    console.log('\n👥 Available Profiles:');
    profiles.forEach(profile => {
      console.log(`- ${profile.username} (ID: ${profile.profileid})`);
    });

    // Get all drafts
    const allDrafts = await Draft.find({});
    console.log('\n📝 All Drafts in Database:');
    console.log(`Total drafts count: ${allDrafts.length}`);
    
    if (allDrafts.length === 0) {
      console.log('❌ No drafts found in database!');
      console.log('This is why the Draft tab shows empty.');
    } else {
      allDrafts.forEach((draft, index) => {
        console.log(`\nDraft ${index + 1}:`);
        console.log(`- ID: ${draft.draftid}`);
        console.log(`- Profile ID: ${draft.profileid}`);
        console.log(`- Title: ${draft.title || 'No title'}`);
        console.log(`- Caption: ${draft.caption || 'No caption'}`);
        console.log(`- Post URL: ${draft.postUrl || 'No media'}`);
        console.log(`- Post Type: ${draft.postType}`);
        console.log(`- Created: ${draft.createdAt}`);
      });
    }

    // Let's create a test draft to make sure everything works
    if (profiles.length > 0) {
      const testProfile = profiles[0];
      console.log(`\n🧪 Creating test draft for profile: ${testProfile.username}`);
      
      const testDraft = new Draft({
        draftid: 'frontend-test-' + Date.now(),
        profileid: testProfile.profileid,
        postUrl: 'http://localhost:45799/uploads/test-frontend.jpg',
        postType: 'IMAGE',
        title: 'Frontend Test Draft',
        caption: 'This is a test draft to verify the frontend displays drafts correctly',
        location: 'Test Location',
        tags: ['frontend', 'test'],
        allowComments: true,
        hideLikeCount: false
      });

      await testDraft.save();
      console.log('✅ Test draft created successfully!');
      console.log('- Draft ID:', testDraft.draftid);
      console.log('- Profile ID:', testDraft.profileid);
      console.log('- Media URL:', testDraft.postUrl);
      
      console.log('\n🔄 Now try refreshing your frontend and check the Draft tab!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

debugCurrentDrafts();
