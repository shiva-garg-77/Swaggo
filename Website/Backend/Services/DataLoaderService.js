/**
 * 🚀 PERFORMANCE: DataLoader Service for N+1 Query Resolution
 * 
 * Implements batching and caching for database queries to prevent N+1 problems
 * Provides significant performance improvements for GraphQL resolvers
 */

import DataLoader from 'dataloader';
import User from '../Models/User.js';
import Profile from '../Models/FeedModels/Profile.js';
import Chat from '../Models/FeedModels/Chat.js';
import Message from '../Models/FeedModels/Message.js';

/**
 * DataLoader service to batch and cache database queries
 */
class DataLoaderService {
  constructor() {
    this.loaders = new Map();
    this.initializeLoaders();
  }

  /**
   * Initialize all data loaders
   */
  initializeLoaders() {
    // User loaders
    this.loaders.set('userById', new DataLoader(this.batchLoadUsersById.bind(this), {
      maxBatchSize: 100,
      cache: true,
      cacheKeyFn: (key) => key.toString(),
      batchScheduleFn: (callback) => setTimeout(callback, 16) // 16ms batching window
    }));

    this.loaders.set('userByUsername', new DataLoader(this.batchLoadUsersByUsername.bind(this), {
      maxBatchSize: 100,
      cache: true
    }));

    // Profile loaders
    this.loaders.set('profileById', new DataLoader(this.batchLoadProfilesById.bind(this), {
      maxBatchSize: 100,
      cache: true
    }));

    this.loaders.set('profileByUserId', new DataLoader(this.batchLoadProfilesByUserId.bind(this), {
      maxBatchSize: 100,
      cache: true
    }));

    // Chat loaders
    this.loaders.set('chatById', new DataLoader(this.batchLoadChatsById.bind(this), {
      maxBatchSize: 50,
      cache: true
    }));

    this.loaders.set('chatsByParticipant', new DataLoader(this.batchLoadChatsByParticipant.bind(this), {
      maxBatchSize: 50,
      cache: true
    }));

    // Message loaders
    this.loaders.set('messageById', new DataLoader(this.batchLoadMessagesById.bind(this), {
      maxBatchSize: 200,
      cache: true
    }));

    this.loaders.set('messagesByChat', new DataLoader(this.batchLoadMessagesByChat.bind(this), {
      maxBatchSize: 50,
      cache: true
    }));

    // Follow relationship loaders
    this.loaders.set('followersByUser', new DataLoader(this.batchLoadFollowersByUser.bind(this), {
      maxBatchSize: 50,
      cache: true
    }));

    this.loaders.set('followingByUser', new DataLoader(this.batchLoadFollowingByUser.bind(this), {
      maxBatchSize: 50,
      cache: true
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
  // BATCH LOADING FUNCTIONS
  // =============================================================================

  /**
   * Batch load users by ID
   */
  async batchLoadUsersById(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} user queries by ID`);
      
      const users = await User.find({ 
        id: { $in: userIds } 
      }).lean().exec();
      
      // Create a map for O(1) lookup
      const userMap = new Map();
      users.forEach(user => userMap.set(user.id, user));
      
      // Return results in the same order as requested IDs
      return userIds.map(id => userMap.get(id) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading users by ID:', error);
      // Return array of errors for each requested ID
      return userIds.map(() => error);
    }
  }

  /**
   * Batch load users by username
   */
  async batchLoadUsersByUsername(usernames) {
    try {
      console.log(`📊 DataLoader: Batching ${usernames.length} user queries by username`);
      
      const users = await User.find({ 
        username: { $in: usernames } 
      }).lean().exec();
      
      const userMap = new Map();
      users.forEach(user => userMap.set(user.username, user));
      
      return usernames.map(username => userMap.get(username) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading users by username:', error);
      return usernames.map(() => error);
    }
  }

  /**
   * Batch load profiles by ID
   */
  async batchLoadProfilesById(profileIds) {
    try {
      console.log(`📊 DataLoader: Batching ${profileIds.length} profile queries by ID`);
      
      const profiles = await Profile.find({ 
        profileid: { $in: profileIds } 
      }).lean().exec();
      
      const profileMap = new Map();
      profiles.forEach(profile => profileMap.set(profile.profileid, profile));
      
      return profileIds.map(id => profileMap.get(id) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading profiles by ID:', error);
      return profileIds.map(() => error);
    }
  }

  /**
   * Batch load profiles by user ID
   */
  async batchLoadProfilesByUserId(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} profile queries by user ID`);
      
      const profiles = await Profile.find({ 
        userid: { $in: userIds } 
      }).lean().exec();
      
      const profileMap = new Map();
      profiles.forEach(profile => profileMap.set(profile.userid, profile));
      
      return userIds.map(userId => profileMap.get(userId) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading profiles by user ID:', error);
      return userIds.map(() => error);
    }
  }

  /**
   * Batch load chats by ID
   */
  async batchLoadChatsById(chatIds) {
    try {
      console.log(`📊 DataLoader: Batching ${chatIds.length} chat queries by ID`);
      
      const chats = await Chat.find({ 
        chatid: { $in: chatIds },
        isActive: true 
      }).lean().exec();
      
      const chatMap = new Map();
      chats.forEach(chat => chatMap.set(chat.chatid, chat));
      
      return chatIds.map(id => chatMap.get(id) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading chats by ID:', error);
      return chatIds.map(() => error);
    }
  }

  /**
   * Batch load chats by participant
   */
  async batchLoadChatsByParticipant(participantIds) {
    try {
      console.log(`📊 DataLoader: Batching ${participantIds.length} chat queries by participant`);
      
      // This is more complex as one participant can have multiple chats
      const chats = await Chat.find({ 
        participants: { $in: participantIds },
        isActive: true 
      })
      .populate('participants', 'username profilePic')
      // Don't populate lastMessage - GraphQL resolver will handle it
      .sort({ lastMessageAt: -1 })
      .lean().exec();
      
      // Group chats by participant
      const chatsByParticipant = new Map();
      participantIds.forEach(id => chatsByParticipant.set(id, []));
      
      chats.forEach(chat => {
        chat.participants.forEach(participantId => {
          if (participantIds.includes(participantId)) {
            if (!chatsByParticipant.has(participantId)) {
              chatsByParticipant.set(participantId, []);
            }
            chatsByParticipant.get(participantId).push(chat);
          }
        });
      });
      
      return participantIds.map(id => chatsByParticipant.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading chats by participant:', error);
      return participantIds.map(() => error);
    }
  }

  /**
   * Batch load messages by ID
   */
  async batchLoadMessagesById(messageIds) {
    try {
      console.log(`📊 DataLoader: Batching ${messageIds.length} message queries by ID`);
      
      const messages = await Message.find({ 
        messageid: { $in: messageIds },
        isDeleted: false 
      })
      .populate('senderid', 'username profilePic')
      .populate('mentions', 'username profilePic')
      .lean().exec();
      
      const messageMap = new Map();
      messages.forEach(message => messageMap.set(message.messageid, message));
      
      return messageIds.map(id => messageMap.get(id) || null);
    } catch (error) {
      console.error('DataLoader: Error batch loading messages by ID:', error);
      return messageIds.map(() => error);
    }
  }

  /**
   * Batch load messages by chat
   */
  async batchLoadMessagesByChat(chatIds) {
    try {
      console.log(`📊 DataLoader: Batching ${chatIds.length} message queries by chat`);
      
      const messages = await Message.find({ 
        chatid: { $in: chatIds },
        isDeleted: false 
      })
      .populate('senderid', 'username profilePic')
      .populate('mentions', 'username profilePic')
      .sort({ timestamp: -1 })
      .limit(50) // Limit messages per chat to prevent huge responses
      .lean().exec();
      
      // Group messages by chat
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
      
      return chatIds.map(id => messagesByChat.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading messages by chat:', error);
      return chatIds.map(() => error);
    }
  }

  /**
   * Batch load followers by user
   */
  async batchLoadFollowersByUser(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} follower queries`);
      
      // Assuming you have a Follow model
      const follows = await Profile.find({
        following: { $in: userIds }
      })
      .select('profileid username profilePic following')
      .lean().exec();
      
      // Group followers by followed user
      const followersByUser = new Map();
      userIds.forEach(id => followersByUser.set(id, []));
      
      follows.forEach(profile => {
        profile.following.forEach(followedUserId => {
          if (userIds.includes(followedUserId)) {
            if (!followersByUser.has(followedUserId)) {
              followersByUser.set(followedUserId, []);
            }
            followersByUser.get(followedUserId).push({
              profileid: profile.profileid,
              username: profile.username,
              profilePic: profile.profilePic
            });
          }
        });
      });
      
      return userIds.map(id => followersByUser.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading followers:', error);
      return userIds.map(() => error);
    }
  }

  /**
   * Batch load following by user
   */
  async batchLoadFollowingByUser(userIds) {
    try {
      console.log(`📊 DataLoader: Batching ${userIds.length} following queries`);
      
      const profiles = await Profile.find({
        profileid: { $in: userIds }
      })
      .select('profileid following')
      .populate('following', 'username profilePic')
      .lean().exec();
      
      const followingByUser = new Map();
      profiles.forEach(profile => {
        followingByUser.set(profile.profileid, profile.following || []);
      });
      
      return userIds.map(id => followingByUser.get(id) || []);
    } catch (error) {
      console.error('DataLoader: Error batch loading following:', error);
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
      loadFollowers: (userId) => this.getLoader('followersByUser').load(userId),
      loadFollowing: (userId) => this.getLoader('followingByUser').load(userId),
      
      // Cache management
      clearCache: (loaderName, key) => this.clearCache(loaderName, key),
      clearAllCaches: () => this.clearAllCaches()
    };
  }
}

// Export singleton instance
export default new DataLoaderService();