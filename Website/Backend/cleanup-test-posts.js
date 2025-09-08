import mongoose from 'mongoose';
import Post from './Models/FeedModels/Post.js';
import { Connectdb } from './db/Connectdb.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function cleanupTestPosts() {
    try {
        console.log('🔌 Connecting to database...');
        await Connectdb();
        
        // Define test URL patterns to remove
        const testPatterns = [
            /example\.com/i,
            /test\.com/i,
            /debug-test/i,
            /placeholder/i,
            /test-image/i,
            /lorem/i
        ];
        
        console.log('🔍 Finding test posts...');
        
        // Find all posts
        const allPosts = await Post.find({});
        console.log(`📊 Total posts in database: ${allPosts.length}`);
        
        // Filter test posts
        const testPosts = allPosts.filter(post => {
            return testPatterns.some(pattern => pattern.test(post.postUrl));
        });
        
        console.log(`🧪 Found ${testPosts.length} test posts:`);
        testPosts.forEach(post => {
            console.log(`  - ID: ${post.postid}, URL: ${post.postUrl}, Title: ${post.title || 'No title'}`);
        });
        
        if (testPosts.length === 0) {
            console.log('✅ No test posts found to clean up!');
            return;
        }
        
        // Ask for confirmation (in a real environment, you might want to make this interactive)
        console.log('🗑️ Removing test posts...');
        
        // Remove test posts
        const testPostIds = testPosts.map(post => post._id);
        const deleteResult = await Post.deleteMany({ _id: { $in: testPostIds } });
        
        console.log(`✅ Cleanup completed! Removed ${deleteResult.deletedCount} test posts.`);
        
        // Show remaining posts
        const remainingPosts = await Post.find({});
        console.log(`📊 Remaining posts: ${remainingPosts.length}`);
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        console.log('🔌 Closing database connection...');
        await mongoose.connection.close();
        process.exit(0);
    }
}

// Run cleanup
cleanupTestPosts();
