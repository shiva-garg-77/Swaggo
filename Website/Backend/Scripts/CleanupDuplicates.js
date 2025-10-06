import mongoose from 'mongoose';
import Likes from '../Models/FeedModels/Likes.js';
import LikedPost from '../Models/FeedModels/LikedPost.js';
import SavedPost from '../Models/FeedModels/SavedPost.js';

/**
 * Clean up duplicate records from collections before creating unique indexes
 */

export const cleanupDuplicateLikes = async () => {
    console.log('🧹 Cleaning up duplicate likes...');
    
    try {
        // Find duplicate likes based on postid and profileid combination
        const duplicates = await Likes.aggregate([
            {
                $match: {
                    commentid: { $exists: false } // Only post likes, not comment likes
                }
            },
            {
                $group: {
                    _id: { postid: "$postid", profileid: "$profileid" },
                    count: { $sum: 1 },
                    docs: { $push: "$_id" }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        let removedCount = 0;
        for (const duplicate of duplicates) {
            // Keep the first document, remove the rest
            const docsToRemove = duplicate.docs.slice(1);
            await Likes.deleteMany({ _id: { $in: docsToRemove } });
            removedCount += docsToRemove.length;
        }

        console.log(`✅ Removed ${removedCount} duplicate likes from Likes collection`);
        return removedCount;
    } catch (error) {
        console.error('❌ Error cleaning up duplicate likes:', error);
        throw error;
    }
};

export const cleanupDuplicateLikedPosts = async () => {
    console.log('🧹 Cleaning up duplicate liked posts...');
    
    try {
        // Find duplicate liked posts based on postid and profileid combination
        const duplicates = await LikedPost.aggregate([
            {
                $group: {
                    _id: { postid: "$postid", profileid: "$profileid" },
                    count: { $sum: 1 },
                    docs: { $push: "$_id" }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        let removedCount = 0;
        for (const duplicate of duplicates) {
            // Keep the first document, remove the rest
            const docsToRemove = duplicate.docs.slice(1);
            await LikedPost.deleteMany({ _id: { $in: docsToRemove } });
            removedCount += docsToRemove.length;
        }

        console.log(`✅ Removed ${removedCount} duplicate liked posts from LikedPost collection`);
        return removedCount;
    } catch (error) {
        console.error('❌ Error cleaning up duplicate liked posts:', error);
        throw error;
    }
};

export const cleanupDuplicateSavedPosts = async () => {
    console.log('🧹 Cleaning up duplicate saved posts...');
    
    try {
        // Find duplicate saved posts based on postid and profileid combination
        const duplicates = await SavedPost.aggregate([
            {
                $group: {
                    _id: { postid: "$postid", profileid: "$profileid" },
                    count: { $sum: 1 },
                    docs: { $push: "$_id" }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        let removedCount = 0;
        for (const duplicate of duplicates) {
            // Keep the first document, remove the rest
            const docsToRemove = duplicate.docs.slice(1);
            await SavedPost.deleteMany({ _id: { $in: docsToRemove } });
            removedCount += docsToRemove.length;
        }

        console.log(`✅ Removed ${removedCount} duplicate saved posts from SavedPost collection`);
        return removedCount;
    } catch (error) {
        console.error('❌ Error cleaning up duplicate saved posts:', error);
        throw error;
    }
};

export const cleanupAllDuplicates = async () => {
    console.log('🚀 Starting cleanup of all duplicate records...');
    
    try {
        const likesRemoved = await cleanupDuplicateLikes();
        const likedPostsRemoved = await cleanupDuplicateLikedPosts();
        const savedPostsRemoved = await cleanupDuplicateSavedPosts();
        
        const totalRemoved = likesRemoved + likedPostsRemoved + savedPostsRemoved;
        console.log(`🎉 Cleanup completed! Total duplicates removed: ${totalRemoved}`);
        
        return {
            likesRemoved,
            likedPostsRemoved,
            savedPostsRemoved,
            totalRemoved
        };
    } catch (error) {
        console.error('❌ Error during cleanup process:', error);
        throw error;
    }
};