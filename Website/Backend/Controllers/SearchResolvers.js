/**
 * 🔍 OPTIMIZED SEARCH RESOLVERS
 * High-performance search with timeout handling and caching
 */

import Profile from '../Models/FeedModels/Profile.js';
import Followers from '../Models/FeedModels/Followers.js';
import Following from '../Models/FeedModels/Following.js';
import Post from '../Models/FeedModels/Post.js';

class SearchResolvers {
  constructor() {
    // Cache for search results (5 minute TTL)
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Cleanup cache every 10 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 10 * 60 * 1000);
  }
  
  /**
   * Generate cache key for search
   */
  generateCacheKey(query, limit) {
    return `search:${query.toLowerCase().trim()}:${limit}`;
  }
  
  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.searchCache.delete(key);
      }
    }
  }
  
  /**
   * 🚀 OPTIMIZED USER SEARCH with timeout and caching
   */
  async searchUsers(query, limit = 10) {
    try {
      // Validate input
      if (!query || typeof query !== 'string' || query.trim().length < 1) {
        return [];
      }
      
      // Additional validation to prevent injection
      const searchTerm = query.trim();
      if (searchTerm.includes('$') || searchTerm.includes('{') || searchTerm.includes('}')) {
        console.warn(`🚨 Invalid search term detected: contains prohibited characters`);
        return [];
      }
      
      const cacheKey = this.generateCacheKey(searchTerm, limit);
      
      // Check cache first
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`🎯 Cache hit for search: "${searchTerm}"`);
        return cached.data;
      }
      
      console.log(`🔍 Searching users for: "${searchTerm}" (limit: ${limit})`);
      
      // Create timeout promise
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout')), 8000); // 8 second timeout
      });
      
      // Create search promise
      const searchPromise = this.performUserSearch(searchTerm, limit);
      
      // Race between search and timeout
      const result = await Promise.race([searchPromise, timeout]);
      
      // Cache successful results
      this.searchCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      console.log(`✅ Search completed: found ${result.length} users for "${searchTerm}"`);
      return result;
      
    } catch (error) {
      console.error('🚨 Search users error:', error.message);
      
      // Return empty array on timeout or error instead of throwing
      if (error.message === 'Search timeout') {
        console.warn(`⏱️ Search timed out for query: "${query}"`);
        return [];
      }
      
      // For other errors, still return empty array to prevent UI crashes
      return [];
    }
  }
  
  /**
   * Perform the actual search operation with optimizations
   */
  async performUserSearch(searchTerm, limit) {
    try {
      // Use lean queries for better performance  
      // Ultra-simplified query to avoid MongoDB casting issues
      const users = await Profile.find({
        $or: [
          { username: new RegExp(searchTerm, 'i') },
          { name: new RegExp(searchTerm, 'i') }
        ],
        accountStatus: 'active',
        isActive: true
      })
      .select('profileid username name profilePic isVerified isPrivate bio')
      .limit(limit)
      .lean(); // Use lean for better performance
      
      if (users.length === 0) {
        return [];
      }
    
    // Get counts in parallel with timeout
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        try {
          // Create timeout for individual count operations
          const countTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Count timeout')), 2000); // 2 second timeout per user
          });
          
          // Get counts with timeout
          const countsPromise = Promise.all([
            Followers.countDocuments({ profileid: user.profileid }),
            Following.countDocuments({ profileid: user.profileid }),
            Post.countDocuments({ profileid: user.profileid })
          ]);
          
          const [followersCount, followingCount, postsCount] = await Promise.race([
            countsPromise,
            countTimeout
          ]);
          
          return {
            ...user,
            followersCount,
            followingCount,
            postsCount
          };
        } catch (countError) {
          // If count fails, return user without counts
          console.warn(`⚠️ Failed to get counts for user ${user.username}: ${countError.message}`);
          return {
            ...user,
            followersCount: 0,
            followingCount: 0,
            postsCount: 0
          };
        }
      })
    );
    
      // Sort results: verified users first, then alphabetically
      return usersWithCounts.sort((a, b) => {
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return (a.username || '').localeCompare(b.username || '');
      });
      
    } catch (error) {
      console.error('🚨 MongoDB query error in performUserSearch:', {
        message: error.message,
        searchTerm,
        limit,
        stack: error.stack?.substring(0, 200) // First 200 chars of stack
      });
      
      // Log specific casting errors
      if (error.message.includes('Cast to string failed')) {
        console.error('🔍 String casting error - likely query structure issue:', {
          queryStructure: {
            searchTerm: typeof searchTerm,
            limit: typeof limit
          }
        });
      }
      
      throw error; // Re-throw to be handled by parent
    }
  }
  
  /**
   * 🔍 Quick username search (for autocomplete)
   */
  async quickUserSearch(query, limit = 5) {
    try {
      if (!query || query.trim().length < 1) {
        return [];
      }
      
      const searchTerm = query.trim();
      
      // Validate search term to prevent injection
      if (searchTerm.includes('$') || searchTerm.includes('{') || searchTerm.includes('}')) {
        console.warn(`🚨 Invalid quick search term detected: contains prohibited characters`);
        return [];
      }
      const cacheKey = `quick:${searchTerm}:${limit}`;
      
      // Check cache
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      
      // Quick search with minimal data
      const users = await Profile.find({
        username: new RegExp(`^${searchTerm}`, 'i'), // Starts with query for faster search
        isActive: true,
        accountStatus: 'active' // Only include active accounts
      })
      .select('profileid username name profilePic isVerified')
      .limit(limit)
      .lean();
      
      // Cache results
      this.searchCache.set(cacheKey, {
        data: users,
        timestamp: Date.now()
      });
      
      return users;
    } catch (error) {
      console.error('Quick search error:', error.message);
      return [];
    }
  }
}

// Export singleton instance
export default new SearchResolvers();