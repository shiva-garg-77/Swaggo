import mongoose from 'mongoose';
import Draft from './Models/FeedModels/Draft.js';
import Profile from './Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/swaggo');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const createTestDraft = async () => {
    await connectDB();
    
    try {
        // Find the first profile to use as test
        const profile = await Profile.findOne();
        if (!profile) {
            console.log('No profiles found. Create a profile first.');
            return;
        }
        
        console.log('Using profile:', profile.username, 'ID:', profile.profileid);
        
        // Create test draft
        const testDraft = new Draft({
            draftid: uuidv4(),
            profileid: profile.profileid,
            title: 'Test Draft Title',
            caption: 'This is a test draft created from backend script',
            location: 'Test Location',
            tags: ['test', 'draft'],
            taggedPeople: [],
            allowComments: true,
            hideLikeCount: false
        });
        
        await testDraft.save();
        console.log('✅ Test draft created:', testDraft);
        
        // Verify it was saved
        const savedDrafts = await Draft.find({ profileid: profile.profileid });
        console.log(`Found ${savedDrafts.length} drafts for profile ${profile.profileid}`);
        
    } catch (error) {
        console.error('Error creating test draft:', error);
    } finally {
        mongoose.connection.close();
    }
};

createTestDraft();
