import mongoose from 'mongoose';

async function checkDraftOwnership() {
  try {
    await mongoose.connect('mongodb://localhost:27017/Instagram');
    console.log('✅ Connected to Instagram database');

    // Get all profiles
    const profiles = await mongoose.connection.db.collection('profiles').find({}).toArray();
    console.log('\n👥 All profiles:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.username} (ID: ${profile.profileid})`);
    });

    // Get all drafts with their profile IDs
    const drafts = await mongoose.connection.db.collection('drafts').find({}).toArray();
    console.log(`\n📝 All drafts in database (${drafts.length} total):`);
    
    drafts.forEach((draft, index) => {
      console.log(`\nDraft ${index + 1}:`);
      console.log(`- Draft ID: ${draft.draftid}`);
      console.log(`- Profile ID: ${draft.profileid}`);
      console.log(`- Title: ${draft.title || 'No title'}`);
      console.log(`- Caption: ${draft.caption || 'No caption'}`);
      console.log(`- Post URL: ${draft.postUrl || 'No media'}`);
      console.log(`- Post Type: ${draft.postType || 'Not set'}`);
      console.log(`- Created: ${draft.createdAt}`);
      
      // Find which username this profile ID belongs to
      const owner = profiles.find(p => p.profileid === draft.profileid);
      console.log(`- Owner: ${owner ? owner.username : 'UNKNOWN PROFILE!'}`);
    });

    // Check for any profile ID mismatches
    console.log('\n🔍 Profile ID Analysis:');
    const draftProfileIds = drafts.map(d => d.profileid);
    const profileIds = profiles.map(p => p.profileid);
    
    const orphanDrafts = draftProfileIds.filter(id => !profileIds.includes(id));
    if (orphanDrafts.length > 0) {
      console.log('❌ Found orphan drafts (drafts without matching profiles):');
      orphanDrafts.forEach(id => console.log(`- ${id}`));
    } else {
      console.log('✅ All drafts have matching profiles');
    }

    // Count drafts per user
    console.log('\n📊 Drafts per user:');
    profiles.forEach(profile => {
      const userDrafts = drafts.filter(d => d.profileid === profile.profileid);
      console.log(`- ${profile.username}: ${userDrafts.length} drafts`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

checkDraftOwnership();
