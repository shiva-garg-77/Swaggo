import mongoose from 'mongoose';
import Draft from './Models/FeedModels/Draft.js';

async function testDraftMediaFields() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect('mongodb://localhost:27017/website', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Test creating a draft with media
    const testDraft = new Draft({
      draftid: 'test-media-draft-' + Date.now(),
      profileid: 'test-profile-123',
      postUrl: 'http://localhost:45799/uploads/test-image.jpg',
      postType: 'IMAGE',
      title: 'Test Draft with Media',
      caption: 'This is a test draft with an image attached',
      location: 'Test Location',
      tags: ['test', 'media', 'draft'],
      taggedPeople: [],
      allowComments: true,
      hideLikeCount: false
    });

    await testDraft.save();
    console.log('✅ Created draft with media fields:', {
      draftid: testDraft.draftid,
      postUrl: testDraft.postUrl,
      postType: testDraft.postType,
      title: testDraft.title
    });

    // Test retrieving the draft
    const retrievedDraft = await Draft.findOne({ draftid: testDraft.draftid });
    console.log('✅ Retrieved draft:', {
      draftid: retrievedDraft.draftid,
      postUrl: retrievedDraft.postUrl,
      postType: retrievedDraft.postType,
      title: retrievedDraft.title,
      caption: retrievedDraft.caption,
      location: retrievedDraft.location,
      tags: retrievedDraft.tags
    });

    // Test creating a text-only draft
    const textDraft = new Draft({
      draftid: 'test-text-draft-' + Date.now(),
      profileid: 'test-profile-123',
      postUrl: null,
      postType: 'TEXT',
      title: 'Text-Only Draft',
      caption: 'This is a text-only draft without media',
      tags: ['text', 'draft'],
      allowComments: true,
      hideLikeCount: false
    });

    await textDraft.save();
    console.log('✅ Created text-only draft:', {
      draftid: textDraft.draftid,
      postUrl: textDraft.postUrl,
      postType: textDraft.postType,
      title: textDraft.title
    });

    // Test updating a draft with media
    await Draft.findOneAndUpdate(
      { draftid: testDraft.draftid },
      {
        postUrl: 'http://localhost:45799/uploads/updated-image.jpg',
        postType: 'VIDEO',
        title: 'Updated Draft with Video',
        caption: 'Updated caption with video media',
        updatedAt: new Date()
      }
    );

    const updatedDraft = await Draft.findOne({ draftid: testDraft.draftid });
    console.log('✅ Updated draft with new media:', {
      draftid: updatedDraft.draftid,
      postUrl: updatedDraft.postUrl,
      postType: updatedDraft.postType,
      title: updatedDraft.title,
      caption: updatedDraft.caption
    });

    // Clean up test data
    await Draft.deleteMany({ draftid: { $regex: /^test-.*-draft-/ } });
    console.log('✅ Cleaned up test drafts');

    console.log('\n🎉 All draft media field tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

// Run the test
testDraftMediaFields();
