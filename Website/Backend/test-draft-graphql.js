import mongoose from 'mongoose';
import Resolvers from './Controllers/Resolver.js';
import Draft from './Models/FeedModels/Draft.js';
import Profile from './Models/FeedModels/Profile.js';

// Extract the mutation and query functions from the resolver
const { CreateDraft, UpdateDraft } = Resolvers.Mutation;
const { getDrafts } = Resolvers.Query;

// Mock user context for testing
const mockUser = {
  profileid: 'test-profile-123',
  username: 'testuser'
};

async function testDraftGraphQLResolvers() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/website');
    console.log('✅ Connected to MongoDB for GraphQL testing');

    // Create test profile first
    const testProfile = new Profile({
      profileid: mockUser.profileid,
      username: mockUser.username,
      name: 'Test User',
      bio: 'Test profile for GraphQL testing',
      profilePic: null,
      isPrivate: false,
      isVerified: false
    });
    await testProfile.save();
    console.log('✅ Created test profile for testing');

    console.log('\n📝 Testing CreateDraft resolver with media...');
    
    // Test CreateDraft resolver with media
    const createDraftResult = await CreateDraft(
      null, // parent
      {
        profileid: mockUser.profileid,
        postUrl: 'http://localhost:45799/uploads/test-resolver-image.jpg',
        postType: 'IMAGE',
        title: 'GraphQL Test Draft',
        caption: 'This draft was created via GraphQL resolver test',
        location: 'GraphQL Test Location',
        tags: ['graphql', 'test', 'resolver'],
        taggedPeople: [],
        allowComments: true,
        hideLikeCount: false
      },
      { user: mockUser } // context
    );

    console.log('✅ CreateDraft resolver result:', {
      draftid: createDraftResult.draftid,
      postUrl: createDraftResult.postUrl,
      postType: createDraftResult.postType,
      title: createDraftResult.title
    });

    console.log('\n📝 Testing getDrafts resolver...');
    
    // Test getDrafts resolver
    const getDraftsResult = await getDrafts(
      null,
      { profileid: mockUser.profileid },
      { user: mockUser }
    );

    console.log('✅ getDrafts resolver result count:', getDraftsResult.length);
    if (getDraftsResult.length > 0) {
      console.log('✅ First draft from getDrafts:', {
        draftid: getDraftsResult[0].draftid,
        postUrl: getDraftsResult[0].postUrl,
        postType: getDraftsResult[0].postType,
        title: getDraftsResult[0].title
      });
    }

    console.log('\n📝 Testing UpdateDraft resolver with media changes...');
    
    // Test UpdateDraft resolver
    const updateDraftResult = await UpdateDraft(
      null,
      {
        draftid: createDraftResult.draftid,
        postUrl: 'http://localhost:45799/uploads/updated-resolver-video.mp4',
        postType: 'VIDEO',
        title: 'Updated GraphQL Test Draft',
        caption: 'This draft was updated via GraphQL resolver test',
        location: 'Updated GraphQL Test Location',
        tags: ['updated', 'graphql', 'test'],
        allowComments: false,
        hideLikeCount: true
      },
      { user: mockUser }
    );

    console.log('✅ UpdateDraft resolver result:', {
      draftid: updateDraftResult.draftid,
      postUrl: updateDraftResult.postUrl,
      postType: updateDraftResult.postType,
      title: updateDraftResult.title,
      allowComments: updateDraftResult.allowComments,
      hideLikeCount: updateDraftResult.hideLikeCount
    });

    console.log('\n📝 Testing text-only draft creation...');
    
    // Test creating text-only draft
    const textDraftResult = await CreateDraft(
      null,
      {
        profileid: mockUser.profileid,
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

    console.log('✅ Text-only draft created:', {
      draftid: textDraftResult.draftid,
      postUrl: textDraftResult.postUrl,
      postType: textDraftResult.postType,
      title: textDraftResult.title
    });

    // Clean up test data
    await Draft.deleteMany({ 
      profileid: mockUser.profileid,
      title: { $regex: /GraphQL Test|Text Only/ }
    });
    await Profile.deleteOne({ profileid: mockUser.profileid });
    console.log('✅ Cleaned up test drafts and profile');

    console.log('\n🎉 All GraphQL resolver tests passed!');

  } catch (error) {
    console.error('❌ GraphQL resolver test failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

// Run the test
testDraftGraphQLResolvers();
