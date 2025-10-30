/**
 * 🌱 DATABASE SEEDING SCRIPT
 * 
 * This script creates test users and profiles for development and testing
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import User from '../Models/LoginModels/User.js';
import Profile from '../Models/FeedModels/Profile.js';
import Post from '../Models/FeedModels/Post.js';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('✅ Test user already exists, skipping seeding');
      return {
        success: true,
        message: 'Test data already exists',
        user: existingUser
      };
    }
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    const userId = uuidv4();
    const profileId = userId; // Use same ID
    
    const testUser = new User({
      id: userId,
      profileid: profileId, // ✅ Link to profile
      username: 'testuser',
      email: 'test@swaggo.com',
      password: hashedPassword,
      dateOfBirth: new Date('1990-01-01'),
      isVerify: true,
      accountStatus: 'active'
    });
    
    await testUser.save();
    console.log('✅ Test user created:', testUser.username);
    
    // Create test profile
    const testProfile = new Profile({
      profileid: profileId,
      userid: userId, // ✅ Link to user
      username: testUser.username,
      email: testUser.email,
      name: 'Test User',
      bio: 'This is a test profile for development',
      profilePic: null,
      isPrivate: false,
      isVerified: true,
      isActive: true,
      accountStatus: 'active',
      userId: testUser._id // For compatibility
    });
    
    await testProfile.save();
    console.log('✅ Test profile created:', testProfile.profileid);
    
    // Create some test posts
    const testPosts = [
      {
        postid: uuidv4(),
        profileid: testProfile.profileid,
        postUrl: 'https://picsum.photos/400/400?random=1',
        postType: 'IMAGE',
        title: 'Welcome to Swaggo!',
        Description: 'This is a test post to verify GraphQL data fetching works correctly.',
        allowComments: true,
        hideLikeCount: false
      },
      {
        postid: uuidv4(),
        profileid: testProfile.profileid,
        postUrl: 'text-post-placeholder',
        postType: 'TEXT',
        title: 'Text Post Test',
        Description: 'This is a text-only post for testing purposes. It should appear in the profile feed.',
        allowComments: true,
        hideLikeCount: false
      },
      {
        postid: uuidv4(),
        profileid: testProfile.profileid,
        postUrl: 'https://picsum.photos/400/600?random=2',
        postType: 'IMAGE',
        title: 'Another Test Image',
        Description: 'Testing multiple posts in the GraphQL feed.',
        allowComments: true,
        hideLikeCount: true
      }
    ];
    
    for (const postData of testPosts) {
      const post = new Post(postData);
      await post.save();
      console.log('✅ Test post created:', post.title);
    }
    
    // Create additional test user for testing interactions
    const secondUserId = uuidv4();
    const secondProfileId = secondUserId; // Use same ID
    
    const secondUser = new User({
      id: secondUserId,
      profileid: secondProfileId, // ✅ Link to profile
      username: 'johndoe',
      email: 'john@swaggo.com',
      password: await bcrypt.hash('password123', 12),
      dateOfBirth: new Date('1985-05-15'),
      isVerify: true,
      accountStatus: 'active'
    });
    
    await secondUser.save();
    
    const secondProfile = new Profile({
      profileid: secondProfileId,
      userid: secondUserId, // ✅ Link to user
      username: secondUser.username,
      email: secondUser.email,
      name: 'John Doe',
      bio: 'Another test user for interactions',
      profilePic: 'https://picsum.photos/150/150?random=user',
      isPrivate: false,
      isVerified: false,
      isActive: true,
      accountStatus: 'active',
      userId: secondUser._id
    });
    
    await secondProfile.save();
    console.log('✅ Second test user created:', secondProfile.username);
    
    // Create a post for the second user
    const secondUserPost = new Post({
      postid: uuidv4(),
      profileid: secondProfile.profileid,
      postUrl: 'https://picsum.photos/300/300?random=3',
      postType: 'IMAGE',
      title: 'Hello from John!',
      Description: 'Testing multi-user posts and interactions.',
      allowComments: true,
      hideLikeCount: false
    });
    
    await secondUserPost.save();
    console.log('✅ Second user post created');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('TEST CREDENTIALS:');
    console.log('================');
    console.log('User 1:');
    console.log('  Username: testuser');
    console.log('  Email: test@swaggo.com');
    console.log('  Password: testpassword');
    console.log('');
    console.log('User 2:');
    console.log('  Username: johndoe');
    console.log('  Email: john@swaggo.com');
    console.log('  Password: password123');
    console.log('');
    
    return {
      success: true,
      message: 'Database seeded successfully',
      users: [testUser, secondUser],
      profiles: [testProfile, secondProfile],
      posts: testPosts.length + 1
    };
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Connect to database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swaggo';
  
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('📦 Connected to MongoDB for seeding');
      return seedDatabase();
    })
    .then((result) => {
      console.log('✅ Seeding completed:', result.message);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;