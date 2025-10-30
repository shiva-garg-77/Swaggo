/**
 * 🚀 PERFORMANCE: DataLoader Service for N+1 Query Resolution
 * 
 * Implements batching and caching for database queries to prevent N+1 problems
 * Provides significant performance improvements for GraphQL resolvers
 * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Enhanced with improved batching settings
 */

import DataLoader from 'dataloader';
import User from '../../Models/User.js';
import Profile from '../../Models/FeedModels/Profile.js';
import Chat from '../../Models/FeedModels/Chat.js';
import Message from '../../Models/FeedModels/Message.js';
import Comment from '../../Models/FeedModels/Comments.js';
import Post from '../../Models/FeedModels/Post.js';
import Likes from '../../Models/FeedModels/Likes.js';
import Followers from '../../Models/FeedModels/Followers.js';
import Following from '../../Models/FeedModels/Following.js';
import SavedPost from '../../Models/FeedModels/SavedPost.js';

/**
 * DataLoader service to batch and cache database queries
 * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Enhanced with improved performance settings
 */
class DataLoaderService {
  constructor() {
    this.loaders = new Map();
    this.queryCount = 0; // Track total queries
    this.batchCount = 0; // Track batch operations
    this.initializeLoaders();
  }

  /**
   * Initialize all data loaders with optimized settings
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Enhanced batching configuration
   */
  initializeLoaders() {
    // User loaders
    this.loaders.set('userById', new DataLoader(this.batchLoadUsersById.bind(this), {
      maxBatchSize: 100,
      cache: true,
      cacheKeyFn: (key) => key.toString(),
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms for faster response
    }));

    this.loaders.set('userByUsername', new DataLoader(this.batchLoadUsersByUsername.bind(this), {
      maxBatchSize: 100,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    // Profile loaders
    this.loaders.set('profileById', new DataLoader(this.batchLoadProfilesById.bind(this), {
      maxBatchSize: 100,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    this.loaders.set('profileByUserId', new DataLoader(this.batchLoadProfilesByUserId.bind(this), {
      maxBatchSize: 100,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    // Chat loaders
    this.loaders.set('chatById', new DataLoader(this.batchLoadChatsById.bind(this), {
      maxBatchSize: 50,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    this.loaders.set('chatsByParticipant', new DataLoader(this.batchLoadChatsByParticipant.bind(this), {
      maxBatchSize: 50,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    // Message loaders
    this.loaders.set('messageById', new DataLoader(this.batchLoadMessagesById.bind(this), {
      maxBatchSize: 200, // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Increased max batch size for messages
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    this.loaders.set('messagesByChat', new DataLoader(this.batchLoadMessagesByChat.bind(this), {
      maxBatchSize: 100, // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Increased max batch size for chat messages
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    // Comment loaders
    this.loaders.set('commentsByPost', new DataLoader(this.batchLoadCommentsByPost.bind(this), {
      maxBatchSize: 100,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    this.loaders.set('repliesByComment', new DataLoader(this.batchLoadRepliesByComment.bind(this), {
      maxBatchSize: 100,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    // Post loaders
    this.loaders.set('postsByProfile', new DataLoader(this.batchLoadPostsByProfile.bind(this), {
      maxBatchSize: 50,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    // Like loaders
    this.loaders.set('likesByPost', new DataLoader(this.batchLoadLikesByPost.bind(this), {
      maxBatchSize: 100,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    this.loaders.set('likesByComment', new DataLoader(this.batchLoadLikesByComment.bind(this), {
      maxBatchSize: 100,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    this.loaders.set('likesByUser', new DataLoader(this.batchLoadLikesByUser.bind(this), {
      maxBatchSize: 100,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    this.loaders.set('commentLikesByUser', new DataLoader(this.batchLoadCommentLikesByUser.bind(this), {
      maxBatchSize: 100,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    // Follow relationship loaders
    this.loaders.set('followersByUser', new DataLoader(this.batchLoadFollowersByUser.bind(this), {
      maxBatchSize: 50,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    this.loaders.set('followingByUser', new DataLoader(this.batchLoadFollowingByUser.bind(this), {
      maxBatchSize: 50,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    // Save loaders
    this.loaders.set('savesByUser', new DataLoader(this.batchLoadSavesByUser.bind(this), {
      maxBatchSize: 100,
      cache: true,
      batchScheduleFn: (callback) => setTimeout(callback, 2) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Reduced batching window to 2ms
    }));

    console.log('✅ DataLoader service initialized with optimized batching');
  }

  /**
   * Get a specific loader
   */
  getLoader(name) {
    const loader = this.loaders.get(name);
    if (!loader) {
      throw new Error(`DataLoader '${name}' not found`);
    }
    return loader;
  }

  /**
   * Clear all caches (use when data is mutated)
   */
  clearAllCaches() {
    for (const loader of this.loaders.values()) {
      loader.clearAll();
    }
  }

  /**
   * Clear specific loader cache
   */
  clearCache(loaderName, key = null) {
    const loader = this.loaders.get(loaderName);
    if (loader) {
      if (key !== null) {
        loader.clear(key);
      } else {
        loader.clearAll();
      }
    }
  }

  // =============================================================================
  // BATCH LOADING FUNCTIONS WITH ENHANCED PERFORMANCE MONITORING
  // =============================================================================

  /**
   * Batch load users by ID with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadUsersById(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} user queries by ID`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const users = await User.find({ 
        id: { $in: userIds } 
      })
      .select('_id id username email profilePic createdAt updatedAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .lean()
      .exec();
      
      // Create a map for O(1) lookup
      const userMap = new Map();
      users.forEach(user => userMap.set(user.id, user));
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  User batch load completed in ${duration}ms for ${userIds.length} users`);
      
      // Return results in the same order as requested IDs
      return userIds.map(id => userMap.get(id) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading users by ID:', error);
      // Return array of errors for each requested ID
      return userIds.map(() => error);
    }
  }

  /**
   * Batch load users by username with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadUsersByUsername(usernames) {
    try {
      console.log(`📊 DataLoader: Batching ${usernames.length} user queries by username`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const users = await User.find({ 
        username: { $in: usernames } 
      })
      .select('_id id username email profilePic createdAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .lean()
      .exec();
      
      const userMap = new Map();
      users.forEach(user => userMap.set(user.username, user));
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  User batch load by username completed in ${duration}ms for ${usernames.length} users`);
      
      return usernames.map(username => userMap.get(username) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading users by username:', error);
      return usernames.map(() => error);
    }
  }

  /**
   * Batch load profiles by ID with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadProfilesById(profileIds) {
    try {
      console.log(`📊 DataLoader: Batching ${profileIds.length} profile queries by ID`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const profiles = await Profile.find({ 
        profileid: { $in: profileIds } 
      })
      .select('_id profileid userid username bio profilePic followersCount followingCount postsCount') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .lean()
      .exec();
      
      const profileMap = new Map();
      profiles.forEach(profile => profileMap.set(profile.profileid, profile));
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Profile batch load completed in ${duration}ms for ${profileIds.length} profiles`);
      
      return profileIds.map(id => profileMap.get(id) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading profiles by ID:', error);
      return profileIds.map(() => error);
    }
  }

  /**
   * Batch load profiles by user ID with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadProfilesByUserId(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} profile queries by user ID`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const profiles = await Profile.find({ 
        userid: { $in: userIds } 
      })
      .select('_id profileid userid username bio profilePic followersCount followingCount postsCount') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .lean()
      .exec();
      
      const profileMap = new Map();
      profiles.forEach(profile => profileMap.set(profile.userid, profile));
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Profile batch load by user ID completed in ${duration}ms for ${userIds.length} users`);
      
      return userIds.map(userId => profileMap.get(userId) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading profiles by user ID:', error);
      return userIds.map(() => error);
    }
  }

  /**
   * Batch load chats by ID with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadChatsById(chatIds) {
    try {
      console.log(`📊 DataLoader: Batching ${chatIds.length} chat queries by ID`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const chats = await Chat.find({ 
        chatid: { $in: chatIds },
        isActive: true 
      })
      .select('_id chatid participants lastMessage lastMessageAt createdAt updatedAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .lean()
      .exec();
      
      const chatMap = new Map();
      chats.forEach(chat => chatMap.set(chat.chatid, chat));
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Chat batch load completed in ${duration}ms for ${chatIds.length} chats`);
      
      return chatIds.map(id => chatMap.get(id) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading chats by ID:', error);
      return chatIds.map(() => error);
    }
  }

  /**
   * Enhanced batch load chats by participant with optimized querying
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection and index optimization
   */
  async batchLoadChatsByParticipant(participantIds) {
    try {
      console.log(`📊 DataLoader: Batching ${participantIds.length} chat queries by participant`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection and optimized query
      const chats = await Chat.find({ 
        'participants.profileid': { $in: participantIds },
        isActive: true 
      })
      .select('_id chatid participants lastMessage lastMessageAt createdAt updatedAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .sort({ lastMessageAt: -1 })
      .lean()
      .exec();
      
      // Group chats by participant for efficient lookup
      const chatsByParticipant = new Map();
      participantIds.forEach(id => chatsByParticipant.set(id, []));
      
      chats.forEach(chat => {
        chat.participants.forEach(participant => {
          if (participantIds.includes(participant.profileid)) {
            if (!chatsByParticipant.has(participant.profileid)) {
              chatsByParticipant.set(participant.profileid, []);
            }
            chatsByParticipant.get(participant.profileid).push(chat);
          }
        });
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Chat batch load by participant completed in ${duration}ms for ${participantIds.length} participants`);
      
      return participantIds.map(id => chatsByParticipant.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading chats by participant:', error);
      return participantIds.map(() => error);
    }
  }

  /**
   * Batch load messages by ID with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadMessagesById(messageIds) {
    try {
      console.log(`📊 DataLoader: Batching ${messageIds.length} message queries by ID`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const messages = await Message.find({ 
        messageid: { $in: messageIds },
        isDeleted: false 
      })
      .select('_id messageid chatid senderid messageType content createdAt updatedAt replyTo mentions attachments reactions readBy isEdited messageStatus stickerData gifData voiceData fileData') // Select all needed fields
      .lean()
      .exec();
      
      // Manually populate sender and mentions using profileid (not _id)
      const senderIds = [...new Set(messages.map(m => m.senderid).filter(Boolean))];
      const mentionIds = [...new Set(messages.flatMap(m => m.mentions || []).filter(Boolean))];
      const allProfileIds = [...new Set([...senderIds, ...mentionIds])];
      
      if (allProfileIds.length > 0) {
        const profiles = await Profile.find({ profileid: { $in: allProfileIds } })
          .select('profileid username profilePic')
          .lean();
        
        const profileMap = new Map(profiles.map(p => [p.profileid, p]));
        
        // Attach populated data
        messages.forEach(message => {
          if (message.senderid) {
            message.sender = profileMap.get(message.senderid);
          }
          if (message.mentions && message.mentions.length > 0) {
            message.mentionedProfiles = message.mentions.map(id => profileMap.get(id)).filter(Boolean);
          }
        });
      }
      
      const messageMap = new Map();
      messages.forEach(message => messageMap.set(message.messageid, message));
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Message batch load completed in ${duration}ms for ${messageIds.length} messages`);
      
      return messageIds.map(id => messageMap.get(id) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading messages by ID:', error);
      return messageIds.map(() => error);
    }
  }

  /**
   * Enhanced batch load messages by chat with optimized querying and pagination
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection and optimized querying
   */
  async batchLoadMessagesByChat(chatIds) {
    try {
      console.log(`📊 DataLoader: Batching ${chatIds.length} message queries by chat`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection and optimized query
      const messages = await Message.find({ 
        chatid: { $in: chatIds },
        isDeleted: false 
      })
      .select('_id messageid chatid senderid content createdAt updatedAt replyTo mentions') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .sort({ createdAt: -1 })
      .limit(200) // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Increased limit for better performance with multiple chats
      .lean()
      .exec();
      
      // Group messages by chat for efficient lookup
      const messagesByChat = new Map();
      chatIds.forEach(id => messagesByChat.set(id, []));
      
      messages.forEach(message => {
        if (chatIds.includes(message.chatid)) {
          if (!messagesByChat.has(message.chatid)) {
            messagesByChat.set(message.chatid, []);
          }
          messagesByChat.get(message.chatid).push(message);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Message batch load by chat completed in ${duration}ms for ${chatIds.length} chats`);
      
      return chatIds.map(id => messagesByChat.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading messages by chat:', error);
      return chatIds.map(() => error);
    }
  }

  /**
   * Batch load comments by post with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadCommentsByPost(postIds) {
    try {
      console.log(`📊 DataLoader: Batching ${postIds.length} comment queries by post`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const comments = await Comment.find({ 
        postid: { $in: postIds },
        commenttoid: { $exists: false } // Only top-level comments, not replies
      })
      .select('_id commentid postid profileid content likeCount createdAt updatedAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .sort({ createdAt: -1 })
      .lean()
      .exec();
      
      // Group comments by post for efficient lookup
      const commentsByPost = new Map();
      postIds.forEach(id => commentsByPost.set(id, []));
      
      comments.forEach(comment => {
        if (postIds.includes(comment.postid)) {
          if (!commentsByPost.has(comment.postid)) {
            commentsByPost.set(comment.postid, []);
          }
          commentsByPost.get(comment.postid).push(comment);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Comment batch load by post completed in ${duration}ms for ${postIds.length} posts`);
      
      return postIds.map(id => commentsByPost.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading comments by post:', error);
      return postIds.map(() => error);
    }
  }

  /**
   * Batch load replies by comment with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadRepliesByComment(commentIds) {
    try {
      console.log(`📊 DataLoader: Batching ${commentIds.length} reply queries by comment`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const replies = await Comment.find({ 
        commenttoid: { $in: commentIds }
      })
      .select('_id commentid postid profileid content likeCount createdAt updatedAt commenttoid') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .sort({ createdAt: 1 }) // Replies in chronological order
      .lean()
      .exec();
      
      // Group replies by parent comment for efficient lookup
      const repliesByComment = new Map();
      commentIds.forEach(id => repliesByComment.set(id, []));
      
      replies.forEach(reply => {
        if (commentIds.includes(reply.commenttoid)) {
          if (!repliesByComment.has(reply.commenttoid)) {
            repliesByComment.set(reply.commenttoid, []);
          }
          repliesByComment.get(reply.commenttoid).push(reply);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Reply batch load by comment completed in ${duration}ms for ${commentIds.length} comments`);
      
      return commentIds.map(id => repliesByComment.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading replies by comment:', error);
      return commentIds.map(() => error);
    }
  }

  /**
   * Batch load posts by profile with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadPostsByProfile(profileIds) {
    try {
      console.log(`📊 DataLoader: Batching ${profileIds.length} post queries by profile`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const posts = await Post.find({ 
        profileid: { $in: profileIds }
      })
      .select('_id postid profileid content image likeCount commentCount createdAt updatedAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .sort({ createdAt: -1 })
      .lean()
      .exec();
      
      // Group posts by profile for efficient lookup
      const postsByProfile = new Map();
      profileIds.forEach(id => postsByProfile.set(id, []));
      
      posts.forEach(post => {
        if (profileIds.includes(post.profileid)) {
          if (!postsByProfile.has(post.profileid)) {
            postsByProfile.set(post.profileid, []);
          }
          postsByProfile.get(post.profileid).push(post);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Post batch load by profile completed in ${duration}ms for ${profileIds.length} profiles`);
      
      return profileIds.map(id => postsByProfile.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading posts by profile:', error);
      return profileIds.map(() => error);
    }
  }

  /**
   * Batch load likes by post with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadLikesByPost(postIds) {
    try {
      console.log(`📊 DataLoader: Batching ${postIds.length} like queries by post`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      // Manual filtering approach to avoid Mongoose casting issues
      const allPostLikes = await Likes.find({ 
        postid: { $in: postIds } 
      })
      .select('_id postid profileid createdAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .exec();
      
      // Filter to only include post likes (not comment likes)
      const postOnlyLikes = allPostLikes.filter(like => 
        !like.commentid || like.commentid === null || like.commentid === undefined
      );
      
      // Group likes by post for efficient lookup
      const likesByPost = new Map();
      postIds.forEach(id => likesByPost.set(id, []));
      
      postOnlyLikes.forEach(like => {
        if (postIds.includes(like.postid)) {
          if (!likesByPost.has(like.postid)) {
            likesByPost.set(like.postid, []);
          }
          likesByPost.get(like.postid).push(like);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Like batch load by post completed in ${duration}ms for ${postIds.length} posts`);
      
      return postIds.map(id => likesByPost.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading likes by post:', error);
      return postIds.map(() => error);
    }
  }

  /**
   * Batch load likes by comment with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadLikesByComment(commentIds) {
    try {
      console.log(`📊 DataLoader: Batching ${commentIds.length} like queries by comment`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const likes = await Likes.find({ 
        commentid: { $in: commentIds }
      })
      .select('_id commentid profileid createdAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .exec();
      
      // Group likes by comment for efficient lookup
      const likesByComment = new Map();
      commentIds.forEach(id => likesByComment.set(id, []));
      
      likes.forEach(like => {
        if (commentIds.includes(like.commentid)) {
          if (!likesByComment.has(like.commentid)) {
            likesByComment.set(like.commentid, []);
          }
          likesByComment.get(like.commentid).push(like);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Like batch load by comment completed in ${duration}ms for ${commentIds.length} comments`);
      
      return commentIds.map(id => likesByComment.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading likes by comment:', error);
      return commentIds.map(() => error);
    }
  }

  /**
   * Batch load likes by user with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadLikesByUser(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} like queries by user`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      // Manual filtering approach to avoid Mongoose casting issues
      const allUserLikes = await Likes.find({ 
        profileid: { $in: userIds } 
      })
      .select('_id postid commentid profileid createdAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .exec();
      
      // Filter to only include post likes (not comment likes)
      const postOnlyLikes = allUserLikes.filter(like => 
        !like.commentid || like.commentid === null || like.commentid === undefined
      );
      
      // Group likes by user for efficient lookup
      const likesByUser = new Map();
      userIds.forEach(id => likesByUser.set(id, []));
      
      postOnlyLikes.forEach(like => {
        if (userIds.includes(like.profileid)) {
          if (!likesByUser.has(like.profileid)) {
            likesByUser.set(like.profileid, []);
          }
          likesByUser.get(like.profileid).push(like);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Like batch load by user completed in ${duration}ms for ${userIds.length} users`);
      
      return userIds.map(id => likesByUser.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading likes by user:', error);
      return userIds.map(() => error);
    }
  }

  /**
   * Batch load comment likes by user with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadCommentLikesByUser(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} comment like queries by user`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const commentLikes = await Likes.find({ 
        profileid: { $in: userIds },
        commentid: { $exists: true, $ne: null }
      })
      .select('_id commentid profileid createdAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .exec();
      
      // Group comment likes by user for efficient lookup
      const commentLikesByUser = new Map();
      userIds.forEach(id => commentLikesByUser.set(id, []));
      
      commentLikes.forEach(like => {
        if (userIds.includes(like.profileid)) {
          if (!commentLikesByUser.has(like.profileid)) {
            commentLikesByUser.set(like.profileid, []);
          }
          commentLikesByUser.get(like.profileid).push(like);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Comment like batch load by user completed in ${duration}ms for ${userIds.length} users`);
      
      return userIds.map(id => commentLikesByUser.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading comment likes by user:', error);
      return userIds.map(() => error);
    }
  }

  /**
   * Batch load followers by user
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadFollowersByUser(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} follower queries`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const follows = await Followers.find({
        profileid: { $in: userIds }
      })
      .select('profileid followerid') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .lean()
      .exec();
      
      // Group followers by followed user
      const followersByUser = new Map();
      userIds.forEach(id => followersByUser.set(id, []));
      
      follows.forEach(follow => {
        if (userIds.includes(follow.profileid)) {
          if (!followersByUser.has(follow.profileid)) {
            followersByUser.set(follow.profileid, []);
          }
          followersByUser.get(follow.profileid).push(follow.followerid);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Follower batch load completed in ${duration}ms for ${userIds.length} users`);
      
      return userIds.map(id => followersByUser.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading followers:', error);
      return userIds.map(() => error);
    }
  }

  /**
   * Batch load following by user
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadFollowingByUser(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} following queries`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const follows = await Following.find({
        profileid: { $in: userIds }
      })
      .select('profileid followingid') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .lean()
      .exec();
      
      // Group following by user
      const followingByUser = new Map();
      userIds.forEach(id => followingByUser.set(id, []));
      
      follows.forEach(follow => {
        if (userIds.includes(follow.profileid)) {
          if (!followingByUser.has(follow.profileid)) {
            followingByUser.set(follow.profileid, []);
          }
          followingByUser.get(follow.profileid).push(follow.followingid);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Following batch load completed in ${duration}ms for ${userIds.length} users`);
      
      return userIds.map(id => followingByUser.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading following:', error);
      return userIds.map(() => error);
    }
  }

  /**
   * Batch load saves by user with enhanced performance monitoring
   * 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
   */
  async batchLoadSavesByUser(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} save queries by user`);
      
      // Performance monitoring
      const startTime = Date.now();
      
      // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Added field selection for better performance
      const saves = await SavedPost.find({ 
        profileid: { $in: userIds }
      })
      .select('_id postid profileid createdAt') // 🔧 GRAPHQL QUERY BATCHING OPTIMIZATION #151: Only select needed fields
      .exec();
      
      // Group saves by user for efficient lookup
      const savesByUser = new Map();
      userIds.forEach(id => savesByUser.set(id, []));
      
      saves.forEach(save => {
        if (userIds.includes(save.profileid)) {
          if (!savesByUser.has(save.profileid)) {
            savesByUser.set(save.profileid, []);
          }
          savesByUser.get(save.profileid).push(save);
        }
      });
      
      // Performance logging
      const duration = Date.now() - startTime;
      console.log(`⏱️  Save batch load by user completed in ${duration}ms for ${userIds.length} users`);
      
      return userIds.map(id => savesByUser.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading saves by user:', error);
      return userIds.map(() => error);
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const stats = {};
    
    for (const [name, loader] of this.loaders) {
      stats[name] = {
        cacheHitRatio: loader.cacheHitRatio || 0,
        cacheSize: loader._cacheMap ? loader._cacheMap.size : 0
      };
    }
    
    return stats;
  }

  /**
   * Get detailed performance statistics
   */
  getDetailedStats() {
    const stats = {
      loaders: {}
    };
    
    for (const [name, loader] of this.loaders) {
      stats.loaders[name] = {
        cacheHitRatio: loader.cacheHitRatio || 0,
        cacheSize: loader._cacheMap ? loader._cacheMap.size : 0,
        maxBatchSize: loader._maxBatchSize || 0,
        batchScheduleFn: typeof loader._batchScheduleFn === 'function'
      };
    }
    
    return stats;
  }

  /**
   * Clear statistics (useful for performance testing)
   */
  clearStats() {
    for (const loader of this.loaders.values()) {
      if (loader.clearAll) {
        loader.clearAll();
      }
    }
  }

  /**
   * Create context-specific loader instance
   */
  createContext() {
    return {
      loaders: this,
      
      // Convenient access methods
      loadUser: (id) => this.getLoader('userById').load(id),
      loadUserByUsername: (username) => this.getLoader('userByUsername').load(username),
      loadProfile: (id) => this.getLoader('profileById').load(id),
      loadProfileByUserId: (userId) => this.getLoader('profileByUserId').load(userId),
      loadChat: (id) => this.getLoader('chatById').load(id),
      loadChatsByParticipant: (participantId) => this.getLoader('chatsByParticipant').load(participantId),
      loadMessage: (id) => this.getLoader('messageById').load(id),
      loadMessagesByChat: (chatId) => this.getLoader('messagesByChat').load(chatId),
      loadCommentsByPost: (postId) => this.getLoader('commentsByPost').load(postId),
      loadRepliesByComment: (commentId) => this.getLoader('repliesByComment').load(commentId),
      loadPostsByProfile: (profileId) => this.getLoader('postsByProfile').load(profileId),
      loadLikesByPost: (postId) => this.getLoader('likesByPost').load(postId),
      loadLikesByComment: (commentId) => this.getLoader('likesByComment').load(commentId),
      loadLikesByUser: (userId) => this.getLoader('likesByUser').load(userId),
      loadCommentLikesByUser: (userId) => this.getLoader('commentLikesByUser').load(userId),
      loadFollowers: (userId) => this.getLoader('followersByUser').load(userId),
      loadFollowing: (userId) => this.getLoader('followingByUser').load(userId),
      loadSavesByUser: (userId) => this.getLoader('savesByUser').load(userId),
      
      // Cache management
      clearCache: (loaderName, key) => this.clearCache(loaderName, key),
      clearAllCaches: () => this.clearAllCaches(),
      
      // Performance monitoring
      getStats: () => this.getStats()
    };
  }
}

// Export singleton instance
export default new DataLoaderService();
