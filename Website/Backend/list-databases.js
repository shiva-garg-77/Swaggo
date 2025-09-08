import mongoose from 'mongoose';

async function listDatabases() {
  try {
    await mongoose.connect('mongodb://localhost:27017/website');
    console.log('✅ Connected to MongoDB');

    // List all databases
    const adminDb = mongoose.connection.db.admin();
    const dbs = await adminDb.listDatabases();
    
    console.log('\n🗄 Available Databases:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name} (${Math.round(db.sizeOnDisk / 1024)}KB)`);
    });

    // List collections in current database
    console.log('\n📁 Collections in "website" database:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });

    // Check specific collections
    const profilesCount = await mongoose.connection.db.collection('profiles').countDocuments();
    const draftsCount = await mongoose.connection.db.collection('drafts').countDocuments();
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    
    console.log('\n📊 Document Counts:');
    console.log(`- Profiles: ${profilesCount}`);
    console.log(`- Drafts: ${draftsCount}`);
    console.log(`- Users: ${usersCount}`);

    // Try other common database names
    await mongoose.connection.close();
    
    const otherDbNames = ['swaggo', 'app', 'social', 'main'];
    for (const dbName of otherDbNames) {
      try {
        await mongoose.connect(`mongodb://localhost:27017/${dbName}`);
        const collections = await mongoose.connection.db.listCollections().toArray();
        if (collections.length > 0) {
          console.log(`\n🔍 Found collections in "${dbName}" database:`);
          for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
          }
        }
        await mongoose.connection.close();
      } catch (err) {
        // Database doesn't exist or can't connect
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listDatabases();
