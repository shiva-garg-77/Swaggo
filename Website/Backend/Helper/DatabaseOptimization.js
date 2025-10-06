import Profile from '../Models/FeedModels/Profile.js';
import Post from '../Models/FeedModels/Post.js';
import Comment from '../Models/FeedModels/Comments.js';
import Message from '../Models/FeedModels/Message.js';
import Chat from '../Models/FeedModels/Chat.js';
import Followers from '../Models/FeedModels/Followers.js';
import Following from '../Models/FeedModels/Following.js';
import Likes from '../Models/FeedModels/Likes.js';
import BlockedAccount from '../Models/FeedModels/BlockedAccounts.js';
import Notification from '../Models/FeedModels/Notification.js';
import { cleanupAllDuplicates } from './CleanupDuplicates.js';

/**
 * Database optimization utilities and indexing
 */

export const setupDatabaseIndexes = async () => {
    console.log('🔍 Setting up database indexes for performance optimization...');
    
    try {
        // Clean up duplicates before creating unique indexes
        await cleanupAllDuplicates();
        // Profile indexes
        await Profile.collection.createIndex({ username: 1 }, { unique: true });
        await Profile.collection.createIndex({ profileid: 1 }, { unique: true });
        await Profile.collection.createIndex({ isVerified: 1 });
        await Profile.collection.createIndex({ isPrivate: 1 });
        await Profile.collection.createIndex({ isOnline: 1, lastSeen: -1 });
        
        // Post indexes
        await Post.collection.createIndex({ profileid: 1, createdAt: -1 });
        await Post.collection.createIndex({ postid: 1 }, { unique: true });
        await Post.collection.createIndex({ createdAt: -1 }); // For chronological feeds
        await Post.collection.createIndex({ isCloseFriendOnly: 1 });
        await Post.collection.createIndex({ postType: 1 });
        
        // Comment indexes
        await Comment.collection.createIndex({ postid: 1, createdAt: -1 });
        await Comment.collection.createIndex({ commentid: 1 }, { unique: true });
        await Comment.collection.createIndex({ profileid: 1 });
        await Comment.collection.createIndex({ commenttoid: 1 }); // For replies
        
        // Message indexes  
        await Message.collection.createIndex({ chatid: 1, createdAt: -1 });
        await Message.collection.createIndex({ messageid: 1 }, { unique: true });
        await Message.collection.createIndex({ senderid: 1 });
        await Message.collection.createIndex({ messageStatus: 1 });
        await Message.collection.createIndex({ isDeleted: 1 });
        
        // Chat indexes
        await Chat.collection.createIndex({ chatid: 1 }, { unique: true });
        await Chat.collection.createIndex({ participants: 1 });
        await Chat.collection.createIndex({ isActive: 1 });
        await Chat.collection.createIndex({ lastMessageAt: -1 });
        
        // Followers/Following indexes
        await Followers.collection.createIndex({ profileid: 1 });
        await Followers.collection.createIndex({ followerid: 1 });
        await Followers.collection.createIndex({ profileid: 1, followerid: 1 }, { unique: true });
        
        await Following.collection.createIndex({ profileid: 1 });
        await Following.collection.createIndex({ followingid: 1 });
        await Following.collection.createIndex({ profileid: 1, followingid: 1 }, { unique: true });
        
        // Likes indexes
        try {
            await Likes.collection.createIndex({ postid: 1, profileid: 1 }, { unique: true });
        } catch (indexError) {
            if (indexError.code === 11000) {
                console.log('⚠️ Unique index on likes (postid, profileid) already exists or has duplicates');
            } else {
                throw indexError;
            }
        }
        
        try {
            await Likes.collection.createIndex({ commentid: 1, profileid: 1 }, { unique: true });
        } catch (indexError) {
            if (indexError.code === 11000) {
                console.log('⚠️ Unique index on likes (commentid, profileid) already exists or has duplicates');
            } else {
                throw indexError;
            }
        }
        
        await Likes.collection.createIndex({ profileid: 1 });
        
        // BlockedAccount indexes
        await BlockedAccount.collection.createIndex({ profileid: 1 });
        await BlockedAccount.collection.createIndex({ blockedprofileid: 1 });
        await BlockedAccount.collection.createIndex({ profileid: 1, blockedprofileid: 1 }, { unique: true });
        
        // Notification indexes
        await Notification.collection.createIndex({ recipientid: 1, createdAt: -1 });
        await Notification.collection.createIndex({ isRead: 1 });
        await Notification.collection.createIndex({ expiresAt: 1 });
        
        console.log('✅ Database indexes created successfully');
        
        // Log index statistics
        const collections = [
            { name: 'profiles', model: Profile },
            { name: 'posts', model: Post },
            { name: 'comments', model: Comment },
            { name: 'messages', model: Message },
            { name: 'chats', model: Chat }
        ];
        
        for (const collection of collections) {
            const indexes = await collection.model.collection.getIndexes();
            console.log(`📊 ${collection.name} indexes:`, Object.keys(indexes).length);
        }
        
    } catch (error) {
        console.error('❌ Error setting up database indexes:', error);
        throw error;
    }
};

/**
 * Optimized query helpers to prevent N+1 problems
 */

export const getPostsWithAuthors = async (postIds) => {
    return await Post.aggregate([
        { $match: { postid: { $in: postIds } } },
        {
            $lookup: {
                from: 'profiles',
                localField: 'profileid',
                foreignField: 'profileid',
                as: 'author'
            }
        },
        { $unwind: '$author' },
        {
            $project: {
                postid: 1,
                profileid: 1,
                postUrl: 1,
                postType: 1,
                title: 1,
                Description: 1,
                createdAt: 1,
                'author.username': 1,
                'author.profilePic': 1,
                'author.isVerified': 1
            }
        }
    ]);
};

export const getCommentsWithAuthors = async (postId, limit = 50) => {
    return await Comment.aggregate([
        { 
            $match: { 
                postid: postId
            } 
        },
        // Filter for top-level comments only
        { 
            $match: { 
                $or: [
                    { commenttoid: { $exists: false } },
                    { commenttoid: null },
                    { commenttoid: "" }
                ]
            } 
        },
        { $sort: { createdAt: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'profiles',
                localField: 'profileid',
                foreignField: 'profileid',
                as: 'author'
            }
        },
        { $unwind: '$author' },
        {
            $lookup: {
                from: 'comments',
                localField: 'commentid',
                foreignField: 'commenttoid',
                as: 'replies'
            }
        },
        {
            $addFields: {
                replyCount: { $size: '$replies' }
            }
        },
        {
            $project: {
                commentid: 1,
                postid: 1,
                comment: 1,
                createdAt: 1,
                replyCount: 1,
                'author.username': 1,
                'author.profilePic': 1,
                'author.profileid': 1
            }
        }
    ]);
};

export const getFollowersWithDetails = async (profileId, limit = 50, offset = 0) => {
    return await Followers.aggregate([
        { $match: { profileid: profileId } },
        { $skip: offset },
        { $limit: limit },
        {
            $lookup: {
                from: 'profiles',
                localField: 'followerid',
                foreignField: 'profileid',
                as: 'followerProfile'
            }
        },
        { $unwind: '$followerProfile' },
        {
            $project: {
                'followerProfile.profileid': 1,
                'followerProfile.username': 1,
                'followerProfile.name': 1,
                'followerProfile.profilePic': 1,
                'followerProfile.isVerified': 1,
                createdAt: 1
            }
        }
    ]);
};

export const getChatsWithLastMessages = async (profileId, limit = 20) => {
    return await Chat.aggregate([
        { 
            $match: { 
                participants: profileId,
                isActive: true 
            } 
        },
        { $sort: { lastMessageAt: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'messages',
                localField: 'lastMessage',
                foreignField: 'messageid',
                as: 'lastMessageData'
            }
        },
        {
            $lookup: {
                from: 'profiles',
                localField: 'participants',
                foreignField: 'profileid',
                as: 'participantProfiles'
            }
        },
        {
            $addFields: {
                lastMessage: { $arrayElemAt: ['$lastMessageData', 0] },
                otherParticipants: {
                    $filter: {
                        input: '$participantProfiles',
                        cond: { $ne: ['$$this.profileid', profileId] }
                    }
                }
            }
        },
        {
            $project: {
                chatid: 1,
                chatType: 1,
                participants: 1,
                lastMessageAt: 1,
                'lastMessage.content': 1,
                'lastMessage.messageType': 1,
                'lastMessage.createdAt': 1,
                'otherParticipants.username': 1,
                'otherParticipants.profilePic': 1,
                'otherParticipants.profileid': 1
            }
        }
    ]);
};

/**
 * Pagination helpers
 */

export const paginateQuery = (query, { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = -1 }) => {
    const validLimit = Math.min(Math.max(parseInt(limit), 1), 100);
    const validOffset = Math.max(parseInt(offset), 0);
    
    return query
        .sort({ [sortBy]: sortOrder })
        .skip(validOffset)
        .limit(validLimit);
};

export const cursorPagination = (query, { after, first = 20, sortBy = 'createdAt' }) => {
    const validFirst = Math.min(Math.max(parseInt(first), 1), 100);
    
    if (after) {
        query = query.where(sortBy).lt(after);
    }
    
    return query
        .sort({ [sortBy]: -1 })
        .limit(validFirst + 1); // +1 to check if there are more items
};

/**
 * Query optimization helpers
 */

export const selectFields = (fields) => {
    return fields.reduce((obj, field) => {
        obj[field] = 1;
        return obj;
    }, {});
};

export const populateWithLimit = (path, select, options = {}) => {
    return {
        path,
        select,
        options: {
            limit: 20,
            sort: { createdAt: -1 },
            ...options
        }
    };
};

/**
 * Connection health check
 */

export const checkDatabaseHealth = async () => {
    try {
        const mongoose = await import('mongoose');
        const connection = mongoose.default.connection;
        
        if (connection.readyState === 1) {
            // Test a simple query
            await Profile.findOne().limit(1);
            return {
                status: 'healthy',
                readyState: connection.readyState,
                host: connection.host,
                name: connection.name
            };
        } else {
            return {
                status: 'unhealthy',
                readyState: connection.readyState,
                message: 'Database not connected'
            };
        }
    } catch (error) {
        return {
            status: 'error',
            message: error.message
        };
    }
};

/**
 * Query performance monitor
 */

export const withQueryMonitoring = (modelName) => {
    return (target, propertyName, descriptor) => {
        const method = descriptor.value;
        
        descriptor.value = async function (...args) {
            const startTime = Date.now();
            try {
                const result = await method.apply(this, args);
                const duration = Date.now() - startTime;
                
                if (duration > 1000) { // Log slow queries (>1s)
                    console.warn(`🐌 Slow query detected in ${modelName}.${propertyName}: ${duration}ms`);
                }
                
                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                console.error(`❌ Query failed in ${modelName}.${propertyName} after ${duration}ms:`, error.message);
                throw error;
            }
        };
        
        return descriptor;
    };
};