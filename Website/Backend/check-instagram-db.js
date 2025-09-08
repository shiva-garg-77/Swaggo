import mongoose from 'mongoose';

async function checkInstagramDb() {
  try {
    await mongoose.connect('mongodb://localhost:27017/Instagram');
    console.log('✅ Connected to Instagram database');

    // List collections in Instagram database
    console.log('\n📁 Collections in "Instagram" database:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });

    // Check document counts
    const profilesCount = await mongoose.connection.db.collection('profiles').countDocuments();
    const draftsCount = await mongoose.connection.db.collection('drafts').countDocuments();
    const postsCount = await mongoose.connection.db.collection('posts').countDocuments();
    
    console.log('\n📊 Document Counts in Instagram DB:');
    console.log(`- Profiles: ${profilesCount}`);
    console.log(`- Drafts: ${draftsCount}`);
    console.log(`- Posts: ${postsCount}`);

    if (draftsCount > 0) {
      console.log('\n📝 Sample drafts in Instagram database:');
      const drafts = await mongoose.connection.db.collection('drafts').find({}).limit(3).toArray();
      drafts.forEach((draft, index) => {
        console.log(`${index + 1}. ${draft.title || 'No title'} (${draft.postType || 'TEXT'}) - Profile: ${draft.profileid}`);
      });
    }

    if (profilesCount > 0) {
      console.log('\n👥 Sample profiles in Instagram database:');
      const profiles = await mongoose.connection.db.collection('profiles').find({}).limit(3).toArray();
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.username} (ID: ${profile.profileid})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

checkInstagramDb();
