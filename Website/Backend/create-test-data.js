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

const createTestData = async () => {
    await connectDB();
    
    try {
        // Check existing profiles
        let profile = await Profile.findOne();
        
        if (!profile) {
            // Create a test profile
            profile = new Profile({
                profileid: uuidv4(),
                username: 'testuser',
                name: 'Test User',
                bio: 'This is a test profile for draft testing',
                profilePic: null,
                isPrivate: false,
                isVerified: false
            });
            await profile.save();
            console.log('✅ Test profile created:', profile.username);
        } else {
            console.log('Using existing profile:', profile.username, 'ID:', profile.profileid);
        }
        
        // Create multiple test drafts
        const drafts = [
            {
                draftid: uuidv4(),
                profileid: profile.profileid,
                title: 'My First Draft',
                caption: 'This is my first draft post with some content',
                location: 'New York, NY',
                tags: ['first', 'draft', 'test'],
                taggedPeople: [],
                allowComments: true,
                hideLikeCount: false
            },
            {
                draftid: uuidv4(),
                profileid: profile.profileid,
                title: 'Another Draft',
                caption: 'Working on another draft with different content',
                location: 'San Francisco, CA',
                tags: ['second', 'draft'],
                taggedPeople: [],
                allowComments: true,
                hideLikeCount: false
            },
            {
                draftid: uuidv4(),
                profileid: profile.profileid,
                title: '',
                caption: 'Draft without title - just caption',
                location: '',
                tags: [],
                taggedPeople: [],
                allowComments: true,
                hideLikeCount: false
            }
        ];
        
        // Save all drafts
        for (const draftData of drafts) {
            const draft = new Draft(draftData);
            await draft.save();
            console.log('✅ Created draft:', draft.title || 'Untitled');
        }
        
        // Verify drafts were saved
        const savedDrafts = await Draft.find({ profileid: profile.profileid });
        console.log(`\n📊 Total drafts for profile ${profile.username}: ${savedDrafts.length}`);
        
        savedDrafts.forEach((draft, index) => {
            console.log(`${index + 1}. ${draft.title || 'Untitled'} - "${draft.caption}"`);
        });
        
    } catch (error) {
        console.error('Error creating test data:', error);
    } finally {
        mongoose.connection.close();
    }
};

createTestData();
