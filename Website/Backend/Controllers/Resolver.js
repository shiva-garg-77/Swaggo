import Profile from '../models/FeedModels/Profile.js'
import Comment from '../models/FeedModels/Comments.js'
import Post from '../models/FeedModels/Post.js';
import Draft from '../models/FeedModels/Draft.js';
import Followers from '../models/FeedModels/Followers.js';
import Following from '../models/FeedModels/Following.js';
import Likes from '../models/FeedModels/Likes.js';
import TagPost from '../models/FeedModels/Tagpost.js';
import LikedPost from '../models/FeedModels/LikedPost.js';
import SavedPost from '../models/FeedModels/SavedPost.js';
import Memory from '../models/FeedModels/Memory.js';
import BlockedAccount from '../models/FeedModels/BlockedAccounts.js';
import RestrictedAccount from '../models/FeedModels/RestrictedAccounts.js';
import CloseFriends from '../models/FeedModels/CloseFriends.js';
import Mentions from '../models/FeedModels/Mentions.js';
import UserSettings from '../models/FeedModels/UserSettings.js';
import User from '../models/LoginModels/User.js';
import Chat from '../models/FeedModels/Chat.js';
import Message from '../models/FeedModels/Message.js';
import Story from '../models/FeedModels/Story.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
    getPostLikeCount,
    getCommentLikeCount,
    getPostCommentCount,
    hasUserLikedPost,
    hasUserLikedComment,
    hasUserSavedPost,
    getCommentReplies,
    getTopLevelComments,
    getPostStats
} from '../Helper/LikeCommentHelpers.js';

// Helper function to extract mentions from text
const extractMentions = (text) => {
    const mentionRegex = /@([a-zA-Z0-9_\.]+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]); // Extract username without @
    }
    
    return [...new Set(mentions)]; // Remove duplicates
};


// Helper function to create mentions for a comment
const createMentionsForComment = async (commentText, mentionerProfileId, contextType, contextId) => {
    try {
        const mentionedUsernames = extractMentions(commentText);
        const mentionPromises = [];
        
        for (const username of mentionedUsernames) {
            // Find the mentioned user
            const mentionedUser = await Profile.findOne({ username });
            if (mentionedUser && mentionedUser.profileid !== mentionerProfileId) {
                // Check if mention already exists to avoid duplicates
                const existingMention = await Mentions.findOne({
                    mentionedprofileid: mentionedUser.profileid,
                    mentionerprofileid: mentionerProfileId,
                    contexttype: contextType,
                    contextid: contextId
                });
                
                if (!existingMention) {
                    const newMention = new Mentions({
                        mentionid: uuidv4(),
                        mentionedprofileid: mentionedUser.profileid,
                        mentionerprofileid: mentionerProfileId,
                        contexttype: contextType,
                        contextid: contextId,
                        isnotified: false,
                        isread: false
                    });
                    
                    mentionPromises.push(newMention.save());
                }
            }
        }
        
        await Promise.all(mentionPromises);
        console.log(`Created ${mentionPromises.length} mentions for ${contextType} ${contextId}`);
    } catch (err) {
        console.error('Error creating mentions:', err);
    }
};

const Resolvers = {

    Profiles: {
        // parent = profile
        post: async (Parent) => {
            try {
                const post = await Post.find({ profileid: Parent.profileid });
                return post || [];
            } catch (err) {
                throw new Error(`Error fetching post for user ${Parent.username}: ${err.message}`);
            }
        },
        followers: async (Parent) => {
            try {
                const followers = await Followers.find({ profileid: Parent.profileid });
                return followers || [];
            } catch (err) {
                throw new Error(`Error fetching followers for user ${Parent.username}: ${err.message}`);
            }
        },
        following: async (Parent) => {
            try {
                const following = await Following.find({ profileid: Parent.profileid });
                return following || [];
            } catch (err) {
                throw new Error(`Error fetching following for user ${Parent.username}: ${err.message}`);
            }
        },
        likedpost: async (Parent) => {
            try {
                const likedPostRecords = await LikedPost.find({ profileid: Parent.profileid });
                if (!likedPostRecords || likedPostRecords.length === 0) {
                    return [];
                }
                // Get the actual post objects
                const postIds = likedPostRecords.map(lp => lp.postid);
                const posts = await Post.find({ postid: { $in: postIds } });
                return posts || [];
            } catch (err) {
                throw new Error(`Error fetching liked post for user ${Parent.username}: ${err.message}`);
            }
        },
        savedpost: async (Parent) => {
            try {
                const savedPostRecords = await SavedPost.find({ profileid: Parent.profileid });
                if (!savedPostRecords || savedPostRecords.length === 0) {
                    return [];
                }
                // Get the actual post objects
                const postIds = savedPostRecords.map(sp => sp.postid);
                const posts = await Post.find({ postid: { $in: postIds } });
                return posts || [];
            } catch (err) {
                throw new Error(`Error fetching saved post for user ${Parent.username}: ${err.message}`);
            }
        },
        drafts: async (Parent) => {
            try {
                const drafts = await Draft.find({ profileid: Parent.profileid });
                return drafts || [];
            } catch (err) {
                throw new Error(`Error fetching drafts for user ${Parent.username}: ${err.message}`);
            }
        },
        memories: async (Parent) => {
            try {
                const memories = await Memory.find({ profileid: Parent.profileid });
                return memories || [];
            } catch (err) {
                throw new Error(`Error fetching memories for user ${Parent.username}: ${err.message}`);
            }
        },
        stories: async (Parent) => {
            try {
                const stories = await Story.find({ 
                    profileid: Parent.profileid, 
                    isActive: true,
                    expiresAt: { $gt: new Date() }
                }).sort({ createdAt: -1 });
                return stories || [];
            } catch (err) {
                throw new Error(`Error fetching stories for user ${Parent.username}: ${err.message}`);
            }
        },
        blockedAccounts: async (Parent) => {
            try {
                const blockedAccounts = await BlockedAccount.find({ profileid: Parent.profileid });
                return blockedAccounts || [];
            } catch (err) {
                throw new Error(`Error fetching blocked accounts for user ${Parent.username}: ${err.message}`);
            }
        },
        restrictedAccounts: async (Parent) => {
            try {
                const restrictedAccounts = await RestrictedAccount.find({ profileid: Parent.profileid });
                return restrictedAccounts || [];
            } catch (err) {
                throw new Error(`Error fetching restricted accounts for user ${Parent.username}: ${err.message}`);
            }
        },
        closeFriends: async (Parent) => {
            try {
                const closeFriends = await CloseFriends.find({ profileid: Parent.profileid, status: 'active' });
                return closeFriends || [];
            } catch (err) {
                throw new Error(`Error fetching close friends for user ${Parent.username}: ${err.message}`);
            }
        },
        closeFriendsOf: async (Parent) => {
            try {
                const closeFriendsOf = await CloseFriends.find({ closefriendid: Parent.profileid, status: 'active' });
                return closeFriendsOf || [];
            } catch (err) {
                throw new Error(`Error fetching users who have ${Parent.username} as close friend: ${err.message}`);
            }
        },
        mentions: async (Parent) => {
            try {
                const mentions = await Mentions.find({ mentionedprofileid: Parent.profileid });
                return mentions || [];
            } catch (err) {
                throw new Error(`Error fetching mentions for user ${Parent.username}: ${err.message}`);
            }
        },
        settings: async (Parent) => {
            try {
                let settings = await UserSettings.findOne({ profileid: Parent.profileid });
                if (!settings) {
                    // Create default settings if they don't exist
                    settings = new UserSettings({ profileid: Parent.profileid });
                    await settings.save();
                }
                return settings;
            } catch (err) {
                throw new Error(`Error fetching settings for user ${Parent.username}: ${err.message}`);
            }
        },

    },


    Posts: {
        profile: async (Parent) => {
            try {
                const post = await Post.findOne({ postid: Parent.postid });
                if (!post) {
                    throw new Error(`Post not found for id ${Parent.postid}`);
                }
                const profile = await Profile.findOne({ profileid: post.profileid });
                if (!profile) {
                    throw new Error(`Profile not found for post with id ${Parent.postid}`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching profile for post: ${err.message}`);
            }
        },
        like: async (Parent) => {
            try {
                const likes = await Likes.find({ postid: Parent.postid, commentid: { $exists: false } });
                return likes || [];
            } catch (err) {
                throw new Error(`Error fetching likes for post with id ${Parent.postid}: ${err.message}`);
            }
        },
        comments: async (Parent, __, { user }) => {
            try {
                // Get only top-level comments (not replies)
                const comments = await getTopLevelComments(Parent.postid);
                if (!user?.profileid || !comments) return comments || [];
                // Filter out comments from blocked users
                const blocked = await BlockedAccount.find({ profileid: user.profileid });
                const blockedIds = new Set(blocked.map(b => b.blockedprofileid));
                return comments.filter(c => !blockedIds.has(c.profileid));
            } catch (err) {
                throw new Error(`Error fetching comments for post with id ${Parent.postid}: ${err.message}`);
            }
        },
        likeCount: async (Parent) => {
            return await getPostLikeCount(Parent.postid);
        },
        commentCount: async (Parent) => {
            return await getPostCommentCount(Parent.postid);
        },
        isLikedByUser: async (Parent, args, { user }) => {
            return user ? await hasUserLikedPost(Parent.postid, user.profileid) : false;
        },
        isSavedByUser: async (Parent, args, { user }) => {
            return user ? await hasUserSavedPost(Parent.postid, user.profileid) : false;
        },
        mentions: async (Parent) => {
            try {
                const mentions = await Mentions.find({ contexttype: 'post', contextid: Parent.postid });
                return mentions || [];
            } catch (err) {
                throw new Error(`Error fetching mentions for post with id ${Parent.postid}: ${err.message}`);
            }
        }
    },

    Likes: {
        profile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.profileid });
                if (!profile) {
                    throw new Error(`Profile with id ${Parent.profileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching profile for like: ${err.message}`);
            }
        }
    },
    Comments: {
        profile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.profileid });
                if (!profile) {
                    throw new Error(`Profile with id ${Parent.profileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching profile for comment: ${err.message}`);
            }
        },
        userto: async (Parent) => {
            try {
                if (!Parent.usertoid) return null;
                const user = await Profile.findOne({ profileid: Parent.usertoid });
                return user || null;
            } catch (err) {
                throw new Error(`Error fetching user for id ${Parent.usertoid}: ${err.message}`);
            }
        },
        replies: async (Parent) => {
            try {
                return await getCommentReplies(Parent.commentid);
            } catch (err) {
                throw new Error(`Error fetching replies for comment: ${err.message}`);
            }
        },
        likeCount: async (Parent) => {
            return await getCommentLikeCount(Parent.commentid);
        },
        isLikedByUser: async (Parent, args, { user }) => {
            return user ? await hasUserLikedComment(Parent.commentid, user.profileid) : false;
        },
        mentions: async (Parent) => {
            try {
                const mentions = await Mentions.find({ contexttype: 'comment', contextid: Parent.commentid });
                return mentions || [];
            } catch (err) {
                throw new Error(`Error fetching mentions for comment with id ${Parent.commentid}: ${err.message}`);
            }
        }
    },

    Drafts: {
        profile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.profileid });
                if (!profile) {
                    throw new Error(`Profile with id ${Parent.profileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching profile for draft: ${err.message}`);
            }
        }
    },

    Memory: {
        profile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.profileid });
                if (!profile) {
                    throw new Error(`Profile with id ${Parent.profileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching profile for memory: ${err.message}`);
            }
        }
    },

    BlockedAccount: {
        profile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.profileid });
                if (!profile) {
                    throw new Error(`Profile with id ${Parent.profileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching profile for blocked account: ${err.message}`);
            }
        },
        blockedProfile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.blockedprofileid });
                if (!profile) {
                    throw new Error(`Blocked profile with id ${Parent.blockedprofileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching blocked profile: ${err.message}`);
            }
        }
    },

    RestrictedAccount: {
        profile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.profileid });
                if (!profile) {
                    throw new Error(`Profile with id ${Parent.profileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching profile for restricted account: ${err.message}`);
            }
        },
        restrictedProfile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.restrictedprofileid });
                if (!profile) {
                    throw new Error(`Restricted profile with id ${Parent.restrictedprofileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching restricted profile: ${err.message}`);
            }
        }
    },

    CloseFriends: {
        profile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.profileid });
                if (!profile) {
                    throw new Error(`Profile with id ${Parent.profileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching profile for close friends: ${err.message}`);
            }
        },
        closeFriend: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.closefriendid });
                if (!profile) {
                    throw new Error(`Close friend profile with id ${Parent.closefriendid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching close friend profile: ${err.message}`);
            }
        }
    },

    Mentions: {
        mentionedProfile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.mentionedprofileid });
                if (!profile) {
                    throw new Error(`Mentioned profile with id ${Parent.mentionedprofileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching mentioned profile: ${err.message}`);
            }
        },
        mentionerProfile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.mentionerprofileid });
                if (!profile) {
                    throw new Error(`Mentioner profile with id ${Parent.mentionerprofileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching mentioner profile: ${err.message}`);
            }
        }
    },

    Query: {
         hello: () => "Hello from Apollo!",
        getUsers: async () => {
            try {
                const profiles = await Profile.find()
                return profiles
            } catch (err) {
                throw new Error(`Error fetching users: ${err.message}`);
            }
        },

        // make it like this async (_,args,{user})
        getUserbyUsername: async (_, args, { user }) => {
            try {
                const username = args.username;
                
                // If no username provided and no user authenticated, get all profiles for testing
                if (!username && !user) {
                    const profiles = await Profile.find({}).limit(1);
                    if (profiles.length > 0) {
                        return profiles[0];
                    }
                    // Create a test profile
                    const testProfile = new Profile({
                        profileid: uuidv4(),
                        username: 'testuser',
                        name: 'Test User',
                        bio: 'This is a test profile',
                        profilePic: null,
                        isPrivate: false,
                        isVerified: false
                    });
                    await testProfile.save();
                    console.log('Created test profile');
                    return testProfile;
                }
                
                const searchUsername = username || user?.username;
                if (!searchUsername) {
                    throw new Error("Username is required");
                }
                
                let profile = await Profile.findOne({ username: searchUsername });
                
                // If profile doesn't exist but user is authenticated, create one
                if (!profile && user?.username) {
                    profile = new Profile({
                        profileid: uuidv4(),
                        username: user.username,
                        name: user.name || null,
                        bio: null,
                        profilePic: null,
                        isPrivate: false,
                        isVerified: false
                    });
                    await profile.save();
                    console.log(`Auto-created profile for user: ${user.username}`);
                }
                
                if (!profile) {
                    throw new Error(`User with username ${searchUsername} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching user: ${err.message}`);
            }
        },
        getPosts: async (_, __, { user }) => {
            try {
                let posts = await Post.find();
                
                if (!user?.profileid) {
                    // Anonymous users only see public posts (not close friends only)
                    return posts.filter(p => !p.isCloseFriendOnly);
                }
                
                // Get user's close friends for filtering
                const closeFriendsRecs = await CloseFriends.find({ profileid: user.profileid, status: 'active' });
                const closeFriendIds = new Set(closeFriendsRecs.map(cf => cf.closefriendid));
                
                // Get profiles where current user is a close friend
                const isCloseFriendOfRecs = await CloseFriends.find({ closefriendid: user.profileid, status: 'active' });
                const isCloseFriendOfIds = new Set(isCloseFriendOfRecs.map(cf => cf.profileid));
                
                // Get blocked accounts
                const blocked = await BlockedAccount.find({ profileid: user.profileid });
                const blockedIds = new Set(blocked.map(b => b.blockedprofileid));
                
                // Filter posts based on visibility rules
                const filteredPosts = posts.filter(post => {
                    // Don't show posts from blocked users
                    if (blockedIds.has(post.profileid)) return false;
                    
                    // Show user's own posts (including their close friends only posts)
                    if (post.profileid === user.profileid) return true;
                    
                    // If post is close friends only, only show if:
                    // 1. Current user is in the poster's close friends list
                    if (post.isCloseFriendOnly && !isCloseFriendOfIds.has(post.profileid)) {
                        return false;
                    }
                    
                    return true;
                });
                
                return filteredPosts;
            } catch (err) {
                throw new Error(`Error fetching posts: ${err.message}`);
            }
        },
        getPostbyId: async (_, { postid }) => {
            try {
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`);
                }
                return post;
            } catch (err) {
                throw new Error(`Error fetching post: ${err.message}`);
            }
        },
        getMemories: async (_, { profileid }) => {
            try {
                const memories = await Memory.find({ profileid });
                return memories;
            } catch (err) {
                throw new Error(`Error fetching memories: ${err.message}`);
            }
        },
        getDrafts: async (_, { profileid }, { user }) => {
            try {
                console.log('\n📝 getDrafts Debug:');
                console.log('ProfileID requested:', profileid);
                console.log('User context:', user ? `Username: ${user.username}, ProfileID: ${user.profileid}` : 'NULL');
                
                // For testing: Allow getting drafts if no user but still verify profileid exists
                if (!user && profileid) {
                    console.log('⚠️ No authentication but allowing for testing...');
                    const drafts = await Draft.find({ profileid });
                    console.log(`Found ${drafts.length} drafts for profileid ${profileid}`);
                    return drafts || [];
                }
                
                // Normal authentication check
                if (!user) {
                    throw new Error('Authentication required to view drafts');
                }
                
                if (user.profileid !== profileid) {
                    throw new Error('You can only view your own drafts');
                }
                
                const drafts = await Draft.find({ profileid });
                console.log(`Found ${drafts.length} authenticated drafts`);
                return drafts || [];
            } catch (err) {
                console.error('getDrafts error:', err);
                throw new Error(`Error fetching drafts: ${err.message}`);
            }
        },
        getDraftById: async (_, { draftid }, { user }) => {
            try {
                if (!user) {
                    throw new Error('Authentication required to view draft');
                }
                
                const draft = await Draft.findOne({ draftid });
                if (!draft) {
                    throw new Error(`Draft with id ${draftid} not found`);
                }
                
                // Verify ownership
                if (draft.profileid !== user.profileid) {
                    throw new Error('You can only view your own drafts');
                }
                
                return draft;
            } catch (err) {
                throw new Error(`Error fetching draft: ${err.message}`);
            }
        },
        getMemoryById: async (_, { memoryid }) => {
            try {
                const memory = await Memory.findOne({ memoryid });
                if (!memory) {
                    throw new Error(`Memory with id ${memoryid} not found`);
                }
                return memory;
            } catch (err) {
                throw new Error(`Error fetching memory: ${err.message}`);
            }
        },
        getCommentsByPost: async (_, { postid }, { user }) => {
            try {
                console.log(`🔍 Fetching comments for post: ${postid}`);
                console.log(`👤 User context: ${user ? user.username : 'Anonymous'}`);
                
                const comments = await getTopLevelComments(postid);
                console.log(`📝 Found ${comments.length} comments for post ${postid}`);
                
                return comments;
            } catch (err) {
                console.error(`❌ Error fetching comments for post ${postid}:`, err);
                throw new Error(`Error fetching comments: ${err.message}`);
            }
        },
        getCommentReplies: async (_, { commentid }) => {
            try {
                return await getCommentReplies(commentid);
            } catch (err) {
                throw new Error(`Error fetching comment replies: ${err.message}`);
            }
        },
        getLikesByPost: async (_, { postid }) => {
            try {
                return await Likes.find({ postid, commentid: { $exists: false } });
            } catch (err) {
                throw new Error(`Error fetching post likes: ${err.message}`);
            }
        },
        getLikesByComment: async (_, { commentid }) => {
            try {
                return await Likes.find({ commentid });
            } catch (err) {
                throw new Error(`Error fetching comment likes: ${err.message}`);
            }
        },
        getPostStats: async (_, { postid }, { user }) => {
            try {
                const currentUserProfileId = user ? user.profileid : null;
                return await getPostStats(postid, currentUserProfileId);
            } catch (err) {
                throw new Error(`Error fetching post stats: ${err.message}`);
            }
        },
        // Block/Restrict Queries
        getBlockedAccounts: async (_, { profileid }, { user }) => {
            try {
                if (!profileid) throw new Error('profileid is required');
                // Optionally enforce auth: if (user?.profileid !== profileid) throw new Error('Unauthorized');
                const blocked = await BlockedAccount.find({ profileid });
                return blocked || [];
            } catch (err) {
                throw new Error(`Error fetching blocked accounts: ${err.message}`);
            }
        },
        getRestrictedAccounts: async (_, { profileid }, { user }) => {
            try {
                if (!profileid) throw new Error('profileid is required');
                const restricted = await RestrictedAccount.find({ profileid });
                return restricted || [];
            } catch (err) {
                throw new Error(`Error fetching restricted accounts: ${err.message}`);
            }
        },
        isUserBlocked: async (_, { profileid, targetprofileid }) => {
            const rec = await BlockedAccount.findOne({ profileid, blockedprofileid: targetprofileid });
            return !!rec;
        },
        isUserRestricted: async (_, { profileid, targetprofileid }) => {
            const rec = await RestrictedAccount.findOne({ profileid, restrictedprofileid: targetprofileid });
            return !!rec;
        },
        // Close Friends Queries
        getCloseFriends: async (_, { profileid }) => {
            try {
                const records = await CloseFriends.find({ profileid, status: 'active' });
                return records || [];
            } catch (err) {
                throw new Error(`Error fetching close friends: ${err.message}`);
            }
        },
        isCloseFriend: async (_, { profileid, targetprofileid }) => {
            const rec = await CloseFriends.findOne({ profileid, closefriendid: targetprofileid, status: 'active' });
            return !!rec;
        },
        // Mentions Queries
        getMentions: async (_, { profileid }) => {
            try {
                const records = await Mentions.find({ mentionedprofileid: profileid }).sort({ createdAt: -1 });
                return records || [];
            } catch (err) {
                throw new Error(`Error fetching mentions: ${err.message}`);
            }
        },
        getMentionsByContext: async (_, { contexttype, contextid }) => {
            try {
                const records = await Mentions.find({ contexttype, contextid }).sort({ createdAt: -1 });
                return records || [];
            } catch (err) {
                throw new Error(`Error fetching mentions for context: ${err.message}`);
            }
        },
        searchUsers: async (_, { query, limit = 10 }) => {
            try {
                if (!query || query.trim().length < 1) {
                    return [];
                }
                
                const searchTerm = query.trim();
                
                const users = await Profile.find({
                    $or: [
                        { username: { $regex: searchTerm, $options: 'i' } },
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { bio: { $regex: searchTerm, $options: 'i' } }
                    ]
                }).limit(limit);
                
                const usersWithCounts = await Promise.all(users.map(async (user) => {
                    try {
                        const [followersCount, followingCount, postsCount] = await Promise.all([
                            Followers.countDocuments({ profileid: user.profileid }),
                            Following.countDocuments({ profileid: user.profileid }),
                            Post.countDocuments({ profileid: user.profileid })
                        ]);
                        
                        return {
                            ...user.toObject(),
                            followersCount,
                            followingCount,
                            postsCount
                        };
                    } catch (countError) {
                        return {
                            ...user.toObject(),
                            followersCount: 0,
                            followingCount: 0,
                            postsCount: 0
                        };
                    }
                }));
                
                return usersWithCounts.sort((a, b) => {
                    if (a.isVerified && !b.isVerified) return -1;
                    if (!a.isVerified && b.isVerified) return 1;
                    return a.username.localeCompare(b.username);
                });
            } catch (err) {
                throw new Error(`Error searching users: ${err.message}`);
            }
        },
        // User Settings Queries
        getUserSettings: async (_, { profileid }, { user }) => {
            try {
                // Allow users to get their own settings or admin access
                if (user && user.profileid !== profileid) {
                    throw new Error('You can only access your own settings');
                }
                
                let settings = await UserSettings.findOne({ profileid });
                if (!settings) {
                    // Create default settings if they don't exist
                    settings = new UserSettings({ profileid });
                    await settings.save();
                }
                return settings;
            } catch (err) {
                throw new Error(`Error fetching user settings: ${err.message}`);
            }
        },
        
        // Chat queries
        getChats: async (_, { profileid }, { user }) => {
            try {
                if (!user || user.profileid !== profileid) {
                    throw new Error('Unauthorized: Cannot access other user\'s chats');
                }

                const chats = await Chat.find({
                    participants: profileid,
                    isActive: true
                }).sort({ lastMessageAt: -1 });

                return chats;
            } catch (error) {
                console.error('Error fetching chats:', error);
                throw new Error('Failed to fetch chats');
            }
        },

        getChatById: async (_, { chatid }, { user }) => {
            try {
                const chat = await Chat.findOne({ chatid, isActive: true });
                
                if (!chat) {
                    throw new Error('Chat not found');
                }

                // Check if user is a participant
                if (!chat.participants.includes(user.profileid)) {
                    throw new Error('Unauthorized: Not a participant in this chat');
                }

                return chat;
            } catch (error) {
                console.error('Error fetching chat by ID:', error);
                throw new Error('Failed to fetch chat');
            }
        },

        getChatByParticipants: async (_, { participants }, { user }) => {
            try {
                // Check if current user is in participants
                if (!participants.includes(user.profileid)) {
                    throw new Error('Unauthorized: User not in participants list');
                }

                // For direct chats, find existing chat
                if (participants.length === 2) {
                    const chat = await Chat.findOne({
                        participants: { $all: participants, $size: 2 },
                        chatType: 'direct',
                        isActive: true
                    });
                    return chat;
                }

                // For group chats, find exact match
                const chat = await Chat.findOne({
                    participants: { $all: participants, $size: participants.length },
                    chatType: 'group',
                    isActive: true
                });

                return chat;
            } catch (error) {
                console.error('Error fetching chat by participants:', error);
                throw new Error('Failed to fetch chat');
            }
        },

        // Message queries
        getMessagesByChat: async (_, { chatid, limit = 50, offset = 0 }, { user }) => {
            try {
                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid, isActive: true });
                if (!chat || !chat.participants.includes(user.profileid)) {
                    throw new Error('Unauthorized: Cannot access this chat');
                }

                const messages = await Message.find({
                    chatid,
                    isDeleted: false
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset);

                return messages.reverse(); // Return in chronological order
            } catch (error) {
                console.error('Error fetching messages:', error);
                throw new Error('Failed to fetch messages');
            }
        },

        getMessageById: async (_, { messageid }, { user }) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid: message.chatid });
                if (!chat || !chat.participants.includes(user.profileid)) {
                    throw new Error('Unauthorized: Cannot access this message');
                }

                return message;
            } catch (error) {
                console.error('Error fetching message by ID:', error);
                throw new Error('Failed to fetch message');
            }
        },

        searchMessages: async (_, { chatid, query }, { user }) => {
            try {
                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid, isActive: true });
                if (!chat || !chat.participants.includes(user.profileid)) {
                    throw new Error('Unauthorized: Cannot search this chat');
                }

                const messages = await Message.find({
                    chatid,
                    content: { $regex: query, $options: 'i' },
                    messageType: 'text',
                    isDeleted: false
                }).sort({ createdAt: -1 }).limit(20);

                return messages;
            } catch (error) {
                console.error('Error searching messages:', error);
                throw new Error('Failed to search messages');
            }
        },

        // Chat statistics
        getUnreadMessageCount: async (_, { profileid }, { user }) => {
            try {
                if (!user || user.profileid !== profileid) {
                    throw new Error('Unauthorized');
                }

                // Get all chats user participates in
                const chats = await Chat.find({
                    participants: profileid,
                    isActive: true
                });

                let unreadCount = 0;
                for (const chat of chats) {
                    const count = await Message.countDocuments({
                        chatid: chat.chatid,
                        senderid: { $ne: profileid },
                        'readBy.profileid': { $ne: profileid },
                        isDeleted: false
                    });
                    unreadCount += count;
                }

                return unreadCount;
            } catch (error) {
                console.error('Error getting unread message count:', error);
                return 0;
            }
        },

        getChatUnreadCount: async (_, { chatid, profileid }, { user }) => {
            try {
                if (!user || user.profileid !== profileid) {
                    throw new Error('Unauthorized');
                }

                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid, isActive: true });
                if (!chat || !chat.participants.includes(profileid)) {
                    throw new Error('Unauthorized: Cannot access this chat');
                }

                const count = await Message.countDocuments({
                    chatid,
                    senderid: { $ne: profileid },
                    'readBy.profileid': { $ne: profileid },
                    isDeleted: false
                });

                return count;
            } catch (error) {
                console.error('Error getting chat unread count:', error);
                return 0;
            }
        },
        
        // Story queries
        getStories: async (_, { profileid }, { user }) => {
            try {
                const stories = await Story.find({
                    profileid: profileid || user.profileid,
                    isActive: true,
                    expiresAt: { $gt: new Date() }
                }).sort({ createdAt: -1 });

                return stories;
            } catch (error) {
                console.error('Error fetching stories:', error);
                throw new Error('Failed to fetch stories');
            }
        },

        getActiveStories: async (_, args, { user }) => {
            try {
                if (!user) {
                    throw new Error('Authentication required');
                }

                const stories = await Story.find({
                    isActive: true,
                    expiresAt: { $gt: new Date() }
                }).sort({ createdAt: -1 });

                // Group by profile
                const storiesByProfile = {};
                stories.forEach(story => {
                    if (!storiesByProfile[story.profileid]) {
                        storiesByProfile[story.profileid] = [];
                    }
                    storiesByProfile[story.profileid].push(story);
                });

                // Return latest story from each profile
                const latestStories = Object.values(storiesByProfile).map(profileStories => profileStories[0]);
                
                return latestStories;
            } catch (error) {
                console.error('Error fetching active stories:', error);
                throw new Error('Failed to fetch active stories');
            }
        },

        getStoryById: async (_, { storyid }) => {
            try {
                const story = await Story.findOne({ 
                    storyid, 
                    isActive: true,
                    expiresAt: { $gt: new Date() }
                });

                if (!story) {
                    throw new Error('Story not found or expired');
                }

                return story;
            } catch (error) {
                console.error('Error fetching story by ID:', error);
                throw new Error('Failed to fetch story');
            }
        },

        getStoryViewers: async (_, { storyid }, { user }) => {
            try {
                const story = await Story.findOne({ storyid });
                
                if (!story) {
                    throw new Error('Story not found');
                }

                // Check if user owns this story
                if (story.profileid !== user.profileid) {
                    throw new Error('Unauthorized: Can only view your own story viewers');
                }

                const profileIds = story.viewers.map(viewer => viewer.profileid);
                const profiles = await Profile.find({ profileid: { $in: profileIds } });
                
                return story.viewers.map(viewer => ({
                    profileid: viewer.profileid,
                    profile: profiles.find(p => p.profileid === viewer.profileid),
                    viewedAt: viewer.viewedAt
                }));
            } catch (error) {
                console.error('Error fetching story viewers:', error);
                throw new Error('Failed to fetch story viewers');
            }
        },
    },




    Mutation: {
        CreateProfile: async (_, { username }) => {
            try {
                // Check if the user already exists
                const existingUser = await Profile.findOne({ username });
                if (existingUser) {
                    throw new Error(`User with username ${username} already exists`);
                }
                const profile = new Profile({
                    profileid: uuidv4(),
                    username
                })
                await profile.save()
                return profile
            } catch (err) {
                throw new Error(`Error creating profile: ${err.message}`);
            }
        },
        DeleteProfile: async (_, { profileid }) => {
            try {
                const profile = await Profile.findOneAndDelete({ profileid })
                if (!profile) {
                    throw new Error(`Profile with id ${profileid} not found`)
                }
                return profile
            } catch (err) {
                throw new Error(`Error deleting profile: ${err.message}`);
            }
        },
        UpdateProfile: async (_, { profileid, New_username, profilesPic, name, bio, isPrivate, isVerified }) => {
            try {
                // Check if the new username exists
                if (New_username) {
                    const existingProfile = await Profile.findOne({ username: New_username });
                    if (existingProfile && existingProfile.profileid !== profileid) {
                        throw new Error(`Profile with username ${New_username} already exists`);
                    }
                }
                const profile = await Profile.findOne({ profileid });
                if (!profile) {
                    throw new Error(`Profile not found for id ${profileid}`);
                }
                
                // Update the profile fields
                profile.isPrivate = isPrivate !== undefined ? isPrivate : profile.isPrivate;
                profile.isVerified = isVerified !== undefined ? isVerified : profile.isVerified;
                profile.username = New_username || profile.username;
                profile.profilePic = profilesPic || profile.profilePic;
                profile.name = name || profile.name;
                profile.bio = bio || profile.bio;

                await profile.save();
                return profile;
            } catch (err) {
                throw new Error(`Error updating profile: ${err.message}`);
            }
        },
        CreatePost: async (_, { profileid, postUrl, title, Description, postType, location, taggedPeople, tags, allowComments, hideLikeCount, autoPlay, isCloseFriendOnly }, { user }) => {
            try {
                console.log('\n📝 CreatePost Debug:');
                console.log('User context received:', user ? `Username: ${user.username}, ID: ${user._id}` : 'NULL');
                console.log('Arguments received:', { profileid, postUrl, title, postType });
                
                // Check if user is authenticated
                if (!user) {
                    console.log('❌ Authentication failed: No user context');
                    throw new Error('User not logged in. Please refresh and try again.');
                }
                
                if (!profileid) {
                    throw new Error('Profile ID is required');
                }
                
                console.log('✅ User authenticated:', user.username);
                
                // Verify that the profileid matches the authenticated user's profile
                if (user.profileid !== profileid) {
                    throw new Error('You can only create posts for your own profile');
                }
                
                // Verify the profile exists in database
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error('Profile not found');
                }
                // Enhanced validation for postUrl and postType
                if (!postUrl || postUrl.replace(/\s+/g, '') === "") {
                    throw new Error("Post URL cannot be empty");
                }
                
                // Validate postType
                if (!postType || !['IMAGE', 'VIDEO', 'TEXT'].includes(postType)) {
                    throw new Error("Post type must be IMAGE, VIDEO, or TEXT");
                }
                
                // Validate media URL format for media posts
                if (['IMAGE', 'VIDEO'].includes(postType) && postUrl === 'text-post-placeholder') {
                    throw new Error("Media posts require a valid media URL");
                }

                const newPost = new Post({
                    postid: uuidv4(),
                    profileid: profileid, // Use the provided profile ID
                    postUrl,
                    postType,
                    title: title || null,
                    Description: Description || null,
                    location: location || null,
                    taggedPeople: taggedPeople || [],
                    tags: tags || [],
                    allowComments: allowComments !== undefined ? allowComments : true,
                    hideLikeCount: hideLikeCount !== undefined ? hideLikeCount : false,
                    autoPlay: autoPlay !== undefined ? autoPlay : false,
                    isCloseFriendOnly: isCloseFriendOnly !== undefined ? isCloseFriendOnly : false
                })
                await newPost.save()
                console.log('Created post:', newPost);
                return newPost;
            } catch (err) {
                console.error('Error in CreatePost resolver:', err);
                throw new Error(`Error creating post: ${err.message}`);
            }
        },
        DeletePost: async (_, { postid }) => {
            try {
                const post = await Post.findOneAndDelete({ postid })
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`)
                }
                // Also delete associated comments and likes
                await Comment.deleteMany({ postid: post.postid });
                await Likes.deleteMany({ postid: post.postid });
                return post
            } catch (err) {
                throw new Error(`Error deleting post: ${err.message}`);
            }
        },
        UpdatePost: async (_, { postid, title, Description }) => {
            try {
                const post = await Post.findOne({ postid })
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`)
                }
                
                // Update only if new values are provided
                post.title = title && title.trim() ? title : post.title;
                post.Description = Description && Description.trim() ? Description : post.Description;
                
                await post.save();
                return post;
            } catch (err) {
                throw new Error(`Error updating post: ${err.message}`);
            }
        },
        CreateComment: async (_, { postid, profileid, usertoid, commenttoid, comment }, { user }) => {
            try {
                // Check if user is authenticated
                if (!user) {
                    throw new Error('User not logged in. Please refresh and try again.');
                }
                
                // Check if the user exists
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                if (usertoid) {
                    const userToProfile = await Profile.findOne({ profileid: usertoid });
                    if (!userToProfile) {
                        throw new Error(`User with id ${usertoid} does not exist`);
                    }
                }
                if(commenttoid){
                    const comment= await Comment.findOne({commentid:commenttoid})
                    if(!comment){
                        throw new Error(`comment with id ${commenttoid} does not exist`)
                    }
                }
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`)
                }
                if (!comment || comment.replace(/\s+/g, '') === "") {
                    throw new Error("Comment cannot be empty");
                }
                const newComment = new Comment({
                    commentid: uuidv4(),
                    postid,
                    profileid,
                    usertoid,
                    commenttoid,
                    comment
                })
                await newComment.save();
                
                // Create mentions for this new comment
                await createMentionsForComment(comment, profileid, 'comment', newComment.commentid);
                
                return newComment;
            } catch (err) {
                throw new Error(`Error creating comment: ${err.message}`);
            }
        },
        CreateCommentReply: async (_, { commentid, profileid, usertoid, comment }, { user }) => {
            try {
                // Check if user is authenticated
                if (!user) {
                    throw new Error('User not logged in. Please refresh and try again.');
                }
                
                // Find the parent comment to get the post ID
                const parentComment = await Comment.findOne({ commentid });
                if (!parentComment) {
                    throw new Error(`Parent comment with id ${commentid} not found`);
                }
                
                // Check if the user exists
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                
                if (usertoid) {
                    const userToProfile = await Profile.findOne({ profileid: usertoid });
                    if (!userToProfile) {
                        throw new Error(`User with id ${usertoid} does not exist`);
                    }
                }
                
                if (!comment || comment.replace(/\s+/g, '') === "") {
                    throw new Error("Comment cannot be empty");
                }
                
                const newReply = new Comment({
                    commentid: uuidv4(),
                    postid: parentComment.postid, // Use the parent comment's post ID
                    profileid,
                    usertoid,
                    commenttoid: commentid, // Reply to the parent comment
                    comment
                });
                
                await newReply.save();
                
                // Create mentions for this reply
                await createMentionsForComment(comment, profileid, 'comment', newReply.commentid);
                
                return newReply;
            } catch (err) {
                throw new Error(`Error creating comment reply: ${err.message}`);
            }
        },
        DeleteComment: async (_, { postid, commentid }) => {
            // Check if the post exists
            const post = await Post.findOne({ postid });
            if (!post) {
                throw new Error(`Post with id ${postid} not found`);
            }
            // Check if the comment exists
            const comment = await Comment.findOne({ postid, commentid });
            if (!comment) {
                throw new Error(`Comment with id ${commentid} not found for post ${postid}`);
            }
            try {
                const deletedComment = await Comment.findOneAndDelete({ postid, commentid });
                if (!deletedComment) {
                    throw new Error(`Comment not found for post ${postid}`);
                }
                return deletedComment;
            } catch (err) {
                throw new Error(`Error deleting comment: ${err.message}`);
            }

        },
        UpdateComment: async (_, { postid, commentid, comment }) => {
            try {
                // Check if the post exists
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`);
                }
                // Check if the comment exists
                const existingComment = await Comment.findOne({ postid, commentid });
                if (!existingComment) {
                    throw new Error(`Comment with id ${commentid} not found for post ${postid}`);
                }
                if (!comment || comment.replace(/\s+/g, '') === "") {
                    throw new Error("Comment cannot be empty");
                }
                existingComment.comment = comment;
                await existingComment.save();
                return existingComment;
            } catch (err) {
                throw new Error(`Error updating comment: ${err.message}`);
            }
        },
        TogglePostLike: async (_, { profileid, postid }, { user }) => {
            try {
                // Check if user is authenticated
                if (!user) {
                    throw new Error('User not logged in. Please refresh and try again.');
                }
                
                // Verify the user owns the profile
                if (user.profileid !== profileid) {
                    throw new Error('You can only like posts with your own profile');
                }
                
                // Check if the post exists
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`);
                }
                
                // Check if user already liked the post (no commentid means post like)
                const existingLike = await Likes.findOne({ 
                    postid, 
                    profileid, 
                    commentid: { $exists: false } 
                });
                
                let result;
                if (existingLike) {
                    // Unlike the post
                    await Likes.deleteOne({ postid, profileid, commentid: { $exists: false } });
                    await LikedPost.deleteOne({ postid, profileid });
                    result = existingLike;
                } else {
                    // Like the post
                    const newLike = new Likes({ postid, profileid });
                    const newLikedPost = new LikedPost({ postid, profileid });
                    await newLike.save();
                    await newLikedPost.save();
                    result = newLike;
                }
                
                return result;
            } catch (err) {
                throw new Error(`Error toggling post like: ${err.message}`);
            }
        },
        ToggleCommentLike: async (_, { profileid, commentid }, { user }) => {
            try {
                // Check if user is authenticated
                if (!user) {
                    throw new Error('User not logged in. Please refresh and try again.');
                }
                
                // Verify the user owns the profile
                if (user.profileid !== profileid) {
                    throw new Error('You can only like comments with your own profile');
                }
                
                // Check if the comment exists
                const comment = await Comment.findOne({ commentid });
                if (!comment) {
                    throw new Error(`Comment with id ${commentid} not found`);
                }
                
                // Check if user already liked the comment
                const existingLike = await Likes.findOne({ commentid, profileid });
                
                let result;
                if (existingLike) {
                    // Unlike the comment
                    await Likes.deleteOne({ commentid, profileid });
                    result = existingLike;
                } else {
                    // Like the comment  
                    const newLike = new Likes({ 
                        postid: comment.postid, // Include postid for consistency
                        commentid, 
                        profileid 
                    });
                    await newLike.save();
                    result = newLike;
                }
                
                return result;
            } catch (err) {
                throw new Error(`Error toggling comment like: ${err.message}`);
            }
        },
        ToggleSavePost: async (_, { profileid, postid }, { user }) => {
            try {
                // Check if user is authenticated
                if (!user) {
                    throw new Error('User not logged in. Please refresh and try again.');
                }
                
                // Verify the user owns the profile
                if (user.profileid !== profileid) {
                    throw new Error('You can only save posts with your own profile');
                }
                
                // Check if the user exists
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`);
                }
                // Check if the post is already saved
                const existingSavedPost = await SavedPost.findOne({ postid, profileid });
                if (existingSavedPost) {
                    // Unsaved the post
                    await SavedPost.deleteOne({ postid, profileid });
                } else {
                    // Saved the post
                    const newSavedPost = new SavedPost({ postid, profileid });
                    await newSavedPost.save();
                }
                return post; // Return the post object
            } catch (err) {
                throw new Error(`Error toggling save post: ${err.message}`);
            }
        },
        ToggleFollowUser: async (_, { profileid, followid }) => {
            try {
                // Check if the user exists
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                const followUser = await Profile.findOne({ profileid: followid });
                if (!followUser) {
                    throw new Error(`User with id ${followid} does not exist`);
                }
                // Check if the users are already a follower 
                // follow id -> the user to be followed
                // profileid -> the user who is following
                const existingFollow = await Following.findOne({ profileid: profileid, followingid: followid });
                let result;
                if (existingFollow) {
                    // Unfollow the user
                    await Following.deleteOne({ profileid: profileid, followingid: followid });
                    // Also remove the follower relationship
                    await Followers.deleteOne({ profileid: followid, followerid: profileid });
                    result = existingFollow;
                } else {
                    // Follow the user
                    const newFollow = new Following({ profileid: profileid, followingid: followid });
                    const newFollower = new Followers({ profileid: followid, followerid: profileid });
                    await newFollower.save();
                    await newFollow.save();
                    result = newFollow;
                }
                return result;
            } catch (err) {
                throw new Error(`Error toggling follow user: ${err.message}`);
            }
        },


        // check it not sure right or not
        Tag_and_MentionPost: async (_, { profileid, postid, tag }) => {
            try {
                // Check if the user exists
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`);
                }
                // Check if the post is already tagged
                if (!Array.isArray(tag) || tag.length === 0) {
                    throw new Error("Tag must be a non-empty array");
                }
                if (tag.length > 20) {
                    throw new Error("Tag array must not exceed 20 users");
                }
                // Validate each tag profile ID
                for (const tagProfileId of tag) {
                    const taggedProfile = await Profile.findOne({ profileid: tagProfileId });
                    if (!taggedProfile) {
                        throw new Error(`Profile with id ${tagProfileId} does not exist`);
                    }
                }


                const existingTagPost = await TagPost.findOne({ postid, profileid });
                if (existingTagPost) {
                    // Untag the post
                    await TagPost.deleteOne({ postid, profileid });
                } else {
                    // Tag the post
                    const newTagPost = new TagPost({ postid, profileid, tag });
                    await newTagPost.save();
                }
            } catch (err) {
                throw new Error(`Error toggling tag post: ${err.message}`);
            }
        },
        
        // Memory Management
        CreateMemory: async (_, { profileid, title, coverImage, postUrl }) => {
            try {
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                
                const newMemory = new Memory({
                    memoryid: uuidv4(),
                    profileid,
                    title,
                    coverImage,
                    postUrl,
                    stories: []
                });
                
                await newMemory.save();
                return newMemory;
            } catch (err) {
                throw new Error(`Error creating memory: ${err.message}`);
            }
        },
        
        UpdateMemory: async (_, { memoryid, title, coverImage, postUrl }) => {
            try {
                const memory = await Memory.findOne({ memoryid });
                if (!memory) {
                    throw new Error(`Memory with id ${memoryid} not found`);
                }
                
                if (title) memory.title = title;
                if (coverImage) memory.coverImage = coverImage;
                if (postUrl !== undefined) memory.postUrl = postUrl; // Allow null to clear postUrl
                memory.updatedAt = new Date();
                
                await memory.save();
                return memory;
            } catch (err) {
                throw new Error(`Error updating memory: ${err.message}`);
            }
        },
        
        DeleteMemory: async (_, { memoryid }) => {
            try {
                const memory = await Memory.findOneAndDelete({ memoryid });
                if (!memory) {
                    throw new Error(`Memory with id ${memoryid} not found`);
                }
                return memory;
            } catch (err) {
                throw new Error(`Error deleting memory: ${err.message}`);
            }
        },
        
        AddStoryToMemory: async (_, { memoryid, mediaUrl, mediaType }) => {
            try {
                const memory = await Memory.findOne({ memoryid });
                if (!memory) {
                    throw new Error(`Memory with id ${memoryid} not found`);
                }
                
                const newStory = {
                    storyid: uuidv4(),
                    mediaUrl,
                    mediaType,
                    createdAt: new Date()
                };
                
                memory.stories.push(newStory);
                memory.updatedAt = new Date();
                
                await memory.save();
                return memory;
            } catch (err) {
                throw new Error(`Error adding story to memory: ${err.message}`);
            }
        },
        
        RemoveStoryFromMemory: async (_, { memoryid, storyid }) => {
            try {
                const memory = await Memory.findOne({ memoryid });
                if (!memory) {
                    throw new Error(`Memory with id ${memoryid} not found`);
                }
                
                memory.stories = memory.stories.filter(story => story.storyid !== storyid);
                memory.updatedAt = new Date();
                
                await memory.save();
                return memory;
            } catch (err) {
                throw new Error(`Error removing story from memory: ${err.message}`);
            }
        },
        
        // Draft Management
        CreateDraft: async (_, { profileid, postUrl, postType, title, caption, location, tags, taggedPeople, allowComments, hideLikeCount, autoPlay }, { user }) => {
            try {
                console.log('\n📝 CreateDraft Debug:');
                console.log('User context:', user ? `Username: ${user.username}` : 'NULL');
                console.log('Arguments:', { profileid, title, caption });
                
                if (!profileid) {
                    throw new Error('Profile ID is required');
                }
                
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error('Profile not found');
                }
                
                // Validate media fields
                if (postType && ['IMAGE', 'VIDEO'].includes(postType) && !postUrl) {
                    console.log('⚠️ Warning: Media type specified but no postUrl provided');
                }
                
                // Set defaults based on content
                const finalPostType = postType || (postUrl ? 'IMAGE' : 'TEXT');
                const finalPostUrl = postUrl || null;
                
                // For testing: Allow draft creation without user if profileid exists
                if (!user) {
                    console.log('⚠️ No authentication but allowing for testing...');
                } else if (user.profileid !== profileid) {
                    throw new Error('You can only create drafts for your own profile');
                }
                
                const newDraft = new Draft({
                    draftid: uuidv4(),
                    profileid,
                    postUrl: finalPostUrl,
                    postType: finalPostType,
                    title: title || null,
                    caption: caption || null,
                    location: location || null,
                    tags: tags || [],
                    taggedPeople: taggedPeople || [],
                    allowComments: allowComments !== undefined ? allowComments : true,
                    hideLikeCount: hideLikeCount !== undefined ? hideLikeCount : false,
                    autoPlay: autoPlay !== undefined ? autoPlay : false
                });
                
                await newDraft.save();
                console.log('Created draft:', newDraft);
                return newDraft;
            } catch (err) {
                console.error('Error in CreateDraft resolver:', err);
                throw new Error(`Error creating draft: ${err.message}`);
            }
        },
        
        UpdateDraft: async (_, { draftid, postUrl, postType, title, caption, location, tags, taggedPeople, allowComments, hideLikeCount, autoPlay }, { user }) => {
            try {
                if (!user) {
                    throw new Error('Authentication required to update draft');
                }
                
                const draft = await Draft.findOne({ draftid });
                if (!draft) {
                    throw new Error(`Draft with id ${draftid} not found`);
                }
                
                if (draft.profileid !== user.profileid) {
                    throw new Error('You can only update your own drafts');
                }
                
                // Validate postType if provided
                if (postType !== undefined && !['IMAGE', 'VIDEO', 'TEXT'].includes(postType)) {
                    throw new Error('Post type must be IMAGE, VIDEO, or TEXT');
                }
                
                // Validate media consistency
                if (postType && ['IMAGE', 'VIDEO'].includes(postType) && (postUrl === null || postUrl === '')) {
                    console.log('⚠️ Warning: Setting media type without media URL');
                }
                
                // Update fields if provided
                if (postUrl !== undefined) draft.postUrl = postUrl;
                if (postType !== undefined) draft.postType = postType;
                if (title !== undefined) draft.title = title;
                if (caption !== undefined) draft.caption = caption;
                if (location !== undefined) draft.location = location;
                if (tags !== undefined) draft.tags = tags;
                if (taggedPeople !== undefined) draft.taggedPeople = taggedPeople;
                if (allowComments !== undefined) draft.allowComments = allowComments;
                if (hideLikeCount !== undefined) draft.hideLikeCount = hideLikeCount;
                if (autoPlay !== undefined) draft.autoPlay = autoPlay;
                
                draft.updatedAt = new Date();
                
                await draft.save();
                return draft;
            } catch (err) {
                throw new Error(`Error updating draft: ${err.message}`);
            }
        },
        
        DeleteDraft: async (_, { draftid }, { user }) => {
            try {
                if (!user) {
                    throw new Error('Authentication required to delete draft');
                }
                
                const draft = await Draft.findOne({ draftid });
                if (!draft) {
                    throw new Error(`Draft with id ${draftid} not found`);
                }
                
                if (draft.profileid !== user.profileid) {
                    throw new Error('You can only delete your own drafts');
                }
                
                await Draft.deleteOne({ draftid });
                return draft;
            } catch (err) {
                throw new Error(`Error deleting draft: ${err.message}`);
            }
        },
        
        PublishDraft: async (_, { draftid }, { user }) => {
            try {
                console.log('\n📤 PublishDraft Debug:');
                console.log('Draft ID:', draftid);
                console.log('User:', user ? user.username : 'NULL');
                
                if (!user) {
                    throw new Error('Authentication required to publish draft');
                }
                
                const draft = await Draft.findOne({ draftid });
                if (!draft) {
                    throw new Error(`Draft with id ${draftid} not found`);
                }
                
                console.log('Draft found:', {
                    draftid: draft.draftid,
                    title: draft.title,
                    postUrl: draft.postUrl,
                    postType: draft.postType
                });
                
                if (draft.profileid !== user.profileid) {
                    throw new Error('You can only publish your own drafts');
                }
                
                // Validate draft content before publishing
                if (!draft.title && !draft.caption && !draft.postUrl) {
                    throw new Error('Draft must have at least a title, caption, or media to be published');
                }
                
                // Use draft's existing media fields with proper defaults
                const finalPostUrl = draft.postUrl || 'text-post-placeholder';
                const finalPostType = draft.postType || 'TEXT';
                
                console.log('Final media fields:', {
                    postUrl: finalPostUrl,
                    postType: finalPostType
                });
                
                // Create a new post from the draft
                const newPost = new Post({
                    postid: uuidv4(),
                    profileid: draft.profileid,
                    postUrl: finalPostUrl,
                    postType: finalPostType,
                    title: draft.title,
                    Description: draft.caption, // Draft uses 'caption', Post uses 'Description'
                    location: draft.location,
                    taggedPeople: draft.taggedPeople || [],
                    tags: draft.tags || [],
                    allowComments: draft.allowComments !== false,
                    hideLikeCount: draft.hideLikeCount || false,
                    autoPlay: draft.autoPlay !== undefined ? draft.autoPlay : false
                });
                
                console.log('Creating post with data:', {
                    postid: newPost.postid,
                    postUrl: newPost.postUrl,
                    postType: newPost.postType,
                    title: newPost.title
                });
                
                await newPost.save();
                
                // Delete the draft after successful post creation
                await Draft.deleteOne({ draftid });
                
                console.log('✅ Successfully published draft as post');
                return newPost;
            } catch (err) {
                console.error('❌ Error in PublishDraft:', err);
            }
        },

        // Block and Restrict Mutations
        BlockUser: async (_, { profileid, targetprofileid, reason }, { user }) => {
            try {
                if (!profileid || !targetprofileid) throw new Error('profileid and targetprofileid are required');
                if (profileid === targetprofileid) throw new Error('You cannot block yourself');
                // Optionally enforce: if (user?.profileid !== profileid) throw new Error('Unauthorized');
                const existing = await BlockedAccount.findOne({ profileid, blockedprofileid: targetprofileid });
                if (existing) return existing;
                const rec = new BlockedAccount({ blockid: uuidv4(), profileid, blockedprofileid: targetprofileid, reason: reason || null });
                await rec.save();
                return rec;
            } catch (err) {
                throw new Error(`Error blocking user: ${err.message}`);
            }
        },
        UnblockUser: async (_, { profileid, targetprofileid }, { user }) => {
            try {
                const existing = await BlockedAccount.findOneAndDelete({ profileid, blockedprofileid: targetprofileid });
                if (!existing) {
                    throw new Error('Block relationship not found');
                }
                return existing;
            } catch (err) {
                throw new Error(`Error unblocking user: ${err.message}`);
            }
        },
        RestrictUser: async (_, { profileid, targetprofileid }, { user }) => {
            try {
                if (!profileid || !targetprofileid) throw new Error('profileid and targetprofileid are required');
                if (profileid === targetprofileid) throw new Error('You cannot restrict yourself');
                const existing = await RestrictedAccount.findOne({ profileid, restrictedprofileid: targetprofileid });
                if (existing) return existing;
                const rec = new RestrictedAccount({ restrictid: uuidv4(), profileid, restrictedprofileid: targetprofileid });
                await rec.save();
                return rec;
            } catch (err) {
                throw new Error(`Error restricting user: ${err.message}`);
            }
        },
        UnrestrictUser: async (_, { profileid, targetprofileid }, { user }) => {
            try {
                const existing = await RestrictedAccount.findOneAndDelete({ profileid, restrictedprofileid: targetprofileid });
                if (!existing) {
                    throw new Error('Restriction relationship not found');
                }
                return existing;
            } catch (err) {
                throw new Error(`Error unrestricting user: ${err.message}`);
            }
        },

        // Close Friends Mutations
        AddCloseFriend: async (_, { profileid, targetprofileid }, { user }) => {
            try {
                if (!profileid || !targetprofileid) throw new Error('profileid and targetprofileid are required');
                if (profileid === targetprofileid) throw new Error('You cannot add yourself as close friend');
                const owner = await Profile.findOne({ profileid });
                const target = await Profile.findOne({ profileid: targetprofileid });
                if (!owner || !target) throw new Error('Profile(s) not found');
                const existing = await CloseFriends.findOne({ profileid, closefriendid: targetprofileid });
                if (existing) {
                    if (existing.status !== 'active') {
                        existing.status = 'active';
                        await existing.save();
                    }
                    return existing;
                }
                const rec = new CloseFriends({ profileid, closefriendid: targetprofileid, status: 'active' });
                await rec.save();
                return rec;
            } catch (err) {
                throw new Error(`Error adding close friend: ${err.message}`);
            }
        },
        RemoveCloseFriend: async (_, { profileid, targetprofileid }, { user }) => {
            try {
                const existing = await CloseFriends.findOne({ profileid, closefriendid: targetprofileid });
                if (!existing) throw new Error('Close friend relationship not found');
                existing.status = 'removed';
                await existing.save();
                return existing;
            } catch (err) {
                throw new Error(`Error removing close friend: ${err.message}`);
            }
        },

        // Mentions Mutations
        CreateMention: async (_, { mentionedprofileid, mentionerprofileid, contexttype, contextid }, { user }) => {
            try {
                if (!['post', 'comment', 'story'].includes(contexttype)) throw new Error('Invalid contexttype');
                const mentioned = await Profile.findOne({ profileid: mentionedprofileid });
                const mentioner = await Profile.findOne({ profileid: mentionerprofileid });
                if (!mentioned || !mentioner) throw new Error('Profiles not found');
                const rec = new Mentions({
                    mentionid: uuidv4(),
                    mentionedprofileid,
                    mentionerprofileid,
                    contexttype,
                    contextid,
                    isnotified: false,
                    isread: false
                });
                await rec.save();
                return rec;
            } catch (err) {
                throw new Error(`Error creating mention: ${err.message}`);
            }
        },
        MarkMentionAsRead: async (_, { mentionid }, { user }) => {
            try {
                const rec = await Mentions.findOneAndUpdate({ mentionid }, { isread: true }, { new: true });
                if (!rec) throw new Error('Mention not found');
                return rec;
            } catch (err) {
                throw new Error(`Error marking mention as read: ${err.message}`);
            }
        },

        // User Settings Mutations
        UpdateUserSettings: async (_, args, { user }) => {
            try {
                const { profileid, ...updateFields } = args;
                
                // Allow users to update their own settings only
                if (!user || user.profileid !== profileid) {
                    throw new Error('You can only update your own settings');
                }
                
                // Filter out undefined values
                const fieldsToUpdate = {};
                Object.keys(updateFields).forEach(key => {
                    if (updateFields[key] !== undefined) {
                        fieldsToUpdate[key] = updateFields[key];
                    }
                });
                
                let settings = await UserSettings.findOneAndUpdate(
                    { profileid },
                    { $set: fieldsToUpdate },
                    { new: true, upsert: true }
                );
                
                return settings;
            } catch (err) {
                throw new Error(`Error updating user settings: ${err.message}`);
            }
        },

        // Authentication Mutations
        login: async (_, { email, password }) => {
            try {
                console.log('Login attempt for email:', email);
                
                // Find user by email
                const user = await User.findOne({ email });
                if (!user) {
                    throw new Error('Invalid email or password');
                }
                
                // Check password
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    throw new Error('Invalid email or password');
                }
                
                // Find or create profile
                let profile = await Profile.findOne({ username: user.username });
                if (!profile) {
                    profile = new Profile({
                        profileid: uuidv4(),
                        username: user.username,
                        name: user.username,
                        bio: null,
                        profilePic: null,
                        isPrivate: false,
                        isVerified: false
                    });
                    await profile.save();
                    console.log('Created profile for user:', user.username);
                }
                
                // Generate JWT token
                const token = jwt.sign(
                    { 
                        _id: user._id, 
                        username: user.username, 
                        email: user.email,
                        profileid: profile.profileid 
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '24h' }
                );
                
                console.log('✅ Login successful for:', user.username);
                return {
                    token,
                    user: profile
                };
            } catch (err) {
                console.error('Login error:', err);
                throw new Error(`Login failed: ${err.message}`);
            }
        },
        
        // Chat mutations
        CreateChat: async (_, { participants, chatType, chatName, chatAvatar }, { user }) => {
            try {
                if (!user) {
                    throw new Error('Authentication required');
                }

                // Ensure current user is in participants
                if (!participants.includes(user.profileid)) {
                    participants.push(user.profileid);
                }

                // Validate participants exist
                const validParticipants = await Profile.find({
                    profileid: { $in: participants }
                });

                if (validParticipants.length !== participants.length) {
                    throw new Error('Some participants do not exist');
                }

                // For direct chats, check if chat already exists
                if (chatType === 'direct' && participants.length === 2) {
                    const existingChat = await Chat.findOne({
                        participants: { $all: participants, $size: 2 },
                        chatType: 'direct',
                        isActive: true
                    });

                    if (existingChat) {
                        return existingChat;
                    }
                }

                // Create new chat
                const newChat = new Chat({
                    chatid: uuidv4(),
                    participants,
                    chatType,
                    chatName: chatType === 'group' ? chatName || 'New Group' : null,
                    chatAvatar,
                    createdBy: user.profileid,
                    adminIds: chatType === 'group' ? [user.profileid] : []
                });

                await newChat.save();
                return newChat;
            } catch (error) {
                console.error('Error creating chat:', error);
                throw new Error('Failed to create chat');
            }
        },

        UpdateChat: async (_, { chatid, chatName, chatAvatar }, { user }) => {
            try {
                const chat = await Chat.findOne({ chatid, isActive: true });
                
                if (!chat) {
                    throw new Error('Chat not found');
                }

                // Check if user is admin (for group chats) or participant (for direct chats)
                if (chat.chatType === 'group' && !chat.adminIds.includes(user.profileid)) {
                    throw new Error('Unauthorized: Only admins can update group chat');
                }

                if (!chat.participants.includes(user.profileid)) {
                    throw new Error('Unauthorized: Not a participant in this chat');
                }

                // Update chat
                if (chatName !== undefined) chat.chatName = chatName;
                if (chatAvatar !== undefined) chat.chatAvatar = chatAvatar;

                await chat.save();
                return chat;
            } catch (error) {
                console.error('Error updating chat:', error);
                throw new Error('Failed to update chat');
            }
        },

        // Message mutations
        SendMessage: async (_, { chatid, messageType, content, attachments, replyTo, mentions }, { user }) => {
            try {
                if (!user) {
                    throw new Error('Authentication required');
                }

                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid, isActive: true });
                if (!chat || !chat.participants.includes(user.profileid)) {
                    throw new Error('Unauthorized: Cannot send message to this chat');
                }

                // Create new message
                const newMessage = new Message({
                    messageid: uuidv4(),
                    chatid,
                    senderid: user.profileid,
                    messageType,
                    content,
                    attachments: attachments || [],
                    replyTo,
                    mentions: mentions || [],
                    messageStatus: 'sent'
                });

                await newMessage.save();

                // Update chat's last message
                chat.lastMessage = newMessage.messageid;
                chat.lastMessageAt = new Date();
                await chat.save();

                return newMessage;
            } catch (error) {
                console.error('Error sending message:', error);
                throw new Error('Failed to send message');
            }
        },

        EditMessage: async (_, { messageid, content }, { user }) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                if (message.senderid !== user.profileid) {
                    throw new Error('Unauthorized: Can only edit your own messages');
                }

                // Store edit history
                message.editHistory.push({
                    content: message.content,
                    editedAt: new Date()
                });

                message.content = content;
                message.isEdited = true;

                await message.save();
                return message;
            } catch (error) {
                console.error('Error editing message:', error);
                throw new Error('Failed to edit message');
            }
        },

        DeleteMessage: async (_, { messageid }, { user }) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                if (message.senderid !== user.profileid) {
                    throw new Error('Unauthorized: Can only delete your own messages');
                }

                message.isDeleted = true;
                message.deletedBy = user.profileid;
                message.deletedAt = new Date();

                await message.save();
                return message;
            } catch (error) {
                console.error('Error deleting message:', error);
                throw new Error('Failed to delete message');
            }
        },

        ReactToMessage: async (_, { messageid, emoji }, { user }) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid: message.chatid });
                if (!chat || !chat.participants.includes(user.profileid)) {
                    throw new Error('Unauthorized: Cannot react to this message');
                }

                // Remove existing reaction from this user
                message.reactions = message.reactions.filter(
                    reaction => reaction.profileid !== user.profileid
                );

                // Add new reaction
                message.reactions.push({
                    profileid: user.profileid,
                    emoji,
                    createdAt: new Date()
                });

                await message.save();
                return message;
            } catch (error) {
                console.error('Error reacting to message:', error);
                throw new Error('Failed to react to message');
            }
        },

        RemoveReaction: async (_, { messageid, emoji }, { user }) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                // Remove reaction
                message.reactions = message.reactions.filter(
                    reaction => !(reaction.profileid === user.profileid && reaction.emoji === emoji)
                );

                await message.save();
                return message;
            } catch (error) {
                console.error('Error removing reaction:', error);
                throw new Error('Failed to remove reaction');
            }
        },

        MarkMessageAsRead: async (_, { messageid }, { user }) => {
            try {
                const message = await Message.findOne({ messageid, isDeleted: false });
                
                if (!message) {
                    throw new Error('Message not found');
                }

                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid: message.chatid });
                if (!chat || !chat.participants.includes(user.profileid)) {
                    throw new Error('Unauthorized: Cannot mark this message as read');
                }

                // Check if already marked as read
                const existingRead = message.readBy.find(
                    read => read.profileid === user.profileid
                );

                if (!existingRead) {
                    message.readBy.push({
                        profileid: user.profileid,
                        readAt: new Date()
                    });
                    await message.save();
                }

                return message;
            } catch (error) {
                console.error('Error marking message as read:', error);
                throw new Error('Failed to mark message as read');
            }
        },

        MarkChatAsRead: async (_, { chatid }, { user }) => {
            try {
                // Check if user has access to this chat
                const chat = await Chat.findOne({ chatid, isActive: true });
                if (!chat || !chat.participants.includes(user.profileid)) {
                    throw new Error('Unauthorized: Cannot access this chat');
                }

                // Find unread messages
                const unreadMessages = await Message.find({
                    chatid,
                    senderid: { $ne: user.profileid },
                    'readBy.profileid': { $ne: user.profileid },
                    isDeleted: false
                });

                // Mark all as read
                const bulkOps = unreadMessages.map(message => ({
                    updateOne: {
                        filter: { _id: message._id },
                        update: {
                            $push: {
                                readBy: {
                                    profileid: user.profileid,
                                    readAt: new Date()
                                }
                            }
                        }
                    }
                }));

                if (bulkOps.length > 0) {
                    await Message.bulkWrite(bulkOps);
                }

                return unreadMessages;
            } catch (error) {
                console.error('Error marking chat as read:', error);
                throw new Error('Failed to mark chat as read');
            }
        },
        
        signup: async (_, { username, email, password }) => {
            try {
                console.log('Signup attempt:', { username, email });
                
                // Check if user already exists
                const existingUser = await User.findOne({ $or: [{ email }, { username }] });
                if (existingUser) {
                    throw new Error('User with this email or username already exists');
                }
                
                // Check if profile with username exists
                const existingProfile = await Profile.findOne({ username });
                if (existingProfile) {
                    throw new Error('Username already taken');
                }
                
                // Hash password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                
                // Create user
                const user = new User({
                    username,
                    email,
                    password: hashedPassword,
                    dateOfBirth: new Date(), // Default date, can be updated later
                    isVerify: false
                });
                await user.save();
                
                // Create profile
                const profile = new Profile({
                    profileid: uuidv4(),
                    username,
                    name: username,
                    bio: null,
                    profilePic: null,
                    isPrivate: false,
                    isVerified: false
                });
                await profile.save();
                
                // Generate JWT token
                const token = jwt.sign(
                    { 
                        _id: user._id, 
                        username: user.username, 
                        email: user.email,
                        profileid: profile.profileid 
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '24h' }
                );
                
                console.log('✅ Signup successful for:', username);
                return {
                    token,
                    user: profile
                };
            } catch (err) {
                console.error('Signup error:', err);
                throw new Error(`Signup failed: ${err.message}`);
            }
        },
        
        // Story mutations
        CreateStory: async (_, { profileid, mediaUrl, mediaType, caption }, { user }) => {
            try {
                if (!user) {
                    throw new Error('Authentication required');
                }

                // Ensure user can only create stories for themselves
                if (profileid !== user.profileid) {
                    throw new Error('Unauthorized: Can only create stories for yourself');
                }

                const newStory = new Story({
                    storyid: uuidv4(),
                    profileid,
                    mediaUrl,
                    mediaType,
                    caption: caption || ''
                });

                await newStory.save();
                return newStory;
            } catch (error) {
                console.error('Error creating story:', error);
                throw new Error('Failed to create story');
            }
        },

        DeleteStory: async (_, { storyid }, { user }) => {
            try {
                const story = await Story.findOne({ storyid });
                
                if (!story) {
                    throw new Error('Story not found');
                }

                // Check if user owns this story
                if (story.profileid !== user.profileid) {
                    throw new Error('Unauthorized: Can only delete your own stories');
                }

                story.isActive = false;
                await story.save();
                
                return story;
            } catch (error) {
                console.error('Error deleting story:', error);
                throw new Error('Failed to delete story');
            }
        },

        ViewStory: async (_, { storyid }, { user }) => {
            try {
                if (!user) {
                    throw new Error('Authentication required');
                }

                const story = await Story.findOne({ 
                    storyid, 
                    isActive: true,
                    expiresAt: { $gt: new Date() }
                });
                
                if (!story) {
                    throw new Error('Story not found or expired');
                }

                // Don't add view if it's the story owner
                if (story.profileid === user.profileid) {
                    return story;
                }

                // Check if user already viewed this story
                const existingView = story.viewers.find(viewer => viewer.profileid === user.profileid);
                
                if (!existingView) {
                    story.viewers.push({
                        profileid: user.profileid,
                        viewedAt: new Date()
                    });
                    await story.save();
                }

                return story;
            } catch (error) {
                console.error('Error viewing story:', error);
                throw new Error('Failed to view story');
            }
        },

    },

    // Chat field resolvers
    Chat: {
        participants: async (parent) => {
            try {
                const profiles = await Profile.find({ profileid: { $in: parent.participants } });
                return profiles;
            } catch (error) {
                console.error('Error fetching chat participants:', error);
                return [];
            }
        },
        lastMessage: async (parent) => {
            if (!parent.lastMessage) return null;
            try {
                const message = await Message.findOne({ messageid: parent.lastMessage });
                return message;
            } catch (error) {
                console.error('Error fetching last message:', error);
                return null;
            }
        },
        mutedBy: async (parent) => {
            if (!parent.mutedBy || parent.mutedBy.length === 0) return [];
            try {
                const profiles = await Profile.find({ profileid: { $in: parent.mutedBy } });
                return profiles;
            } catch (error) {
                console.error('Error fetching muted by profiles:', error);
                return [];
            }
        },
        adminIds: async (parent) => {
            if (!parent.adminIds || parent.adminIds.length === 0) return [];
            try {
                const profiles = await Profile.find({ profileid: { $in: parent.adminIds } });
                return profiles;
            } catch (error) {
                console.error('Error fetching admin profiles:', error);
                return [];
            }
        },
        createdBy: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.createdBy });
                return profile;
            } catch (error) {
                console.error('Error fetching created by profile:', error);
                return null;
            }
        },
        messages: async (parent, { limit = 50, offset = 0 }) => {
            try {
                const messages = await Message.find({ 
                    chatid: parent.chatid,
                    isDeleted: false
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset);
                return messages.reverse(); // Return in chronological order
            } catch (error) {
                console.error('Error fetching chat messages:', error);
                return [];
            }
        }
    },

    // Message field resolvers
    Message: {
        chat: async (parent) => {
            try {
                const chat = await Chat.findOne({ chatid: parent.chatid });
                return chat;
            } catch (error) {
                console.error('Error fetching message chat:', error);
                return null;
            }
        },
        sender: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.senderid });
                return profile;
            } catch (error) {
                console.error('Error fetching message sender:', error);
                return null;
            }
        },
        replyTo: async (parent) => {
            if (!parent.replyTo) return null;
            try {
                const message = await Message.findOne({ messageid: parent.replyTo });
                return message;
            } catch (error) {
                console.error('Error fetching reply to message:', error);
                return null;
            }
        },
        mentions: async (parent) => {
            if (!parent.mentions || parent.mentions.length === 0) return [];
            try {
                const profiles = await Profile.find({ profileid: { $in: parent.mentions } });
                return profiles;
            } catch (error) {
                console.error('Error fetching mentioned profiles:', error);
                return [];
            }
        },
        deletedBy: async (parent) => {
            if (!parent.deletedBy) return null;
            try {
                const profile = await Profile.findOne({ profileid: parent.deletedBy });
                return profile;
            } catch (error) {
                console.error('Error fetching deleted by profile:', error);
                return null;
            }
        }
    },

    // MessageReaction field resolvers
    MessageReaction: {
        profile: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.profileid });
                return profile;
            } catch (error) {
                console.error('Error fetching reaction profile:', error);
                return null;
            }
        }
    },

    // MessageReadStatus field resolvers
    MessageReadStatus: {
        profile: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.profileid });
                return profile;
            } catch (error) {
                console.error('Error fetching read status profile:', error);
                return null;
            }
        }
    },

    // Story field resolvers
    Story: {
        profile: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.profileid });
                return profile;
            } catch (error) {
                console.error('Error fetching story profile:', error);
                return null;
            }
        },
        viewers: async (parent) => {
            try {
                const profileIds = parent.viewers.map(viewer => viewer.profileid);
                const profiles = await Profile.find({ profileid: { $in: profileIds } });
                
                return parent.viewers.map(viewer => ({
                    profileid: viewer.profileid,
                    profile: profiles.find(p => p.profileid === viewer.profileid),
                    viewedAt: viewer.viewedAt
                }));
            } catch (error) {
                console.error('Error fetching story viewers:', error);
                return [];
            }
        },
        viewersCount: (parent) => {
            return parent.viewers ? parent.viewers.length : 0;
        },
        isViewedByUser: (parent, args, context) => {
            if (!context.user) return false;
            return parent.viewers ? parent.viewers.some(viewer => viewer.profileid === context.user.profileid) : false;
        }
    },

    // StoryViewer field resolvers
    StoryViewer: {
        profile: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.profileid });
                return profile;
            } catch (error) {
                console.error('Error fetching story viewer profile:', error);
                return null;
            }
        }
    }

}

export default Resolvers
