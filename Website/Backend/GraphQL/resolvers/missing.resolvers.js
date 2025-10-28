/**
 * Missing GraphQL Resolvers
 * Implements all frontend queries/mutations that were missing backend resolvers
 *
 * @fileoverview Adds resolvers for:
 * - Post queries (getPostbyId, getPostStats, getTrendingPosts, etc.)
 * - Follow Request system
 * - Notification system
 * - Memory system
 * - Share functionality
 * - Bulk operations
 */

import Profile from '../../Models/FeedModels/Profile.js';
import Post from '../../Models/FeedModels/Post.js';
import Comment from '../../Models/FeedModels/Comments.js';
import Likes from '../../Models/FeedModels/Likes.js';
import Following from '../../Models/FeedModels/Following.js';
import Followers from '../../Models/FeedModels/Followers.js';
import SavedPost from '../../Models/FeedModels/SavedPost.js';
import Memory from '../../Models/FeedModels/Memory.js';
import { v4 as uuidv4 } from 'uuid';

// Import or create FollowRequest model
let FollowRequest;
try {
  FollowRequest = (await import('../../Models/FeedModels/FollowRequest.js')).default;
} catch (e) {
  console.warn('⚠️ FollowRequest model not found. Follow request queries will not work.');
}

// Import or create Notification model
let Notification;
try {
  Notification = (await import('../../Models/FeedModels/Notification.js')).default;
} catch (e) {
  console.warn('⚠️ Notification model not found. Notification queries will not work.');
}

// Import or create Share model
let Share;
try {
  Share = (await import('../../Models/FeedModels/Share.js')).default;
} catch (e) {
  console.warn('⚠️ Share model not found. Share functionality will not work.');
}

export default {
  Query: {
    // REMOVED: getUserbyUsername - Already in core.resolvers.js line 566

    /**
     * Get post by ID
     */
    getPostbyId: async (_, { postid }) => {
      try {
        console.log(`🔍 [Missing Resolver] getPostbyId called with postid: ${postid}`);
        const post = await Post.findOne({ postid });
        if (!post) {
          throw new Error(`Post with id ${postid} not found`);
        }
        return post;
      } catch (err) {
        console.error('❌ Error in getPostbyId:', err.message);
        throw new Error(`Error fetching post ${postid}: ${err.message}`);
      }
    },

    /**
     * Get comments by post
     */
    getCommentsByPost: async (_, { postid }) => {
      try {
        console.log(`🔍 [Missing Resolver] getCommentsByPost called with postid: ${postid}`);
        const comments = await Comment.find({
          postid,
          commenttoid: null // Only root comments, replies are nested
        }).sort({ createdAt: -1 });
        return comments || [];
      } catch (err) {
        console.error('❌ Error in getCommentsByPost:', err.message);
        throw new Error(`Error fetching comments for post ${postid}: ${err.message}`);
      }
    },

    /**
     * Get post statistics
     */
    getPostStats: async (_, { postid }, context) => {
      try {
        console.log(`🔍 [Missing Resolver] getPostStats called with postid: ${postid}`);

        const [likeCount, commentCount, shareCount] = await Promise.all([
          Likes.countDocuments({ postid }),
          Comment.countDocuments({ postid }),
          Share ? Share.countDocuments({ postid }) : Promise.resolve(0)
        ]);

        let isLikedByCurrentUser = false;
        let isSavedByCurrentUser = false;

        if (context.user && context.user.profileid) {
          const [liked, saved] = await Promise.all([
            Likes.findOne({ postid, profileid: context.user.profileid }),
            SavedPost.findOne({ postid, profileid: context.user.profileid })
          ]);
          isLikedByCurrentUser = !!liked;
          isSavedByCurrentUser = !!saved;
        }

        return {
          postid,
          likeCount,
          commentCount,
          shareCount,
          isLikedByCurrentUser,
          isSavedByCurrentUser
        };
      } catch (err) {
        console.error('❌ Error in getPostStats:', err.message);
        throw new Error(`Error fetching post stats: ${err.message}`);
      }
    },

    /**
     * Get trending posts based on engagement
     */
    getTrendingPosts: async (_, { timeRange = '24h', limit = 10 }) => {
      try {
        console.log(`🔍 [Missing Resolver] getTrendingPosts called with timeRange: ${timeRange}, limit: ${limit}`);

        const timeRanges = {
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000
        };

        const since = new Date(Date.now() - (timeRanges[timeRange] || timeRanges['24h']));

        // Get posts with their like and comment counts
        const posts = await Post.find({
          createdAt: { $gte: since }
        }).lean();

        // Calculate engagement score for each post
        const postsWithScores = await Promise.all(
          posts.map(async (post) => {
            const [likeCount, commentCount] = await Promise.all([
              Likes.countDocuments({ postid: post.postid }),
              Comment.countDocuments({ postid: post.postid })
            ]);

            return {
              ...post,
              likeCount,
              commentCount,
              engagementScore: (likeCount * 1) + (commentCount * 2)
            };
          })
        );

        // Sort by engagement score and return top N
        return postsWithScores
          .sort((a, b) => b.engagementScore - a.engagementScore)
          .slice(0, limit);
      } catch (err) {
        console.error('❌ Error in getTrendingPosts:', err.message);
        throw new Error(`Error fetching trending posts: ${err.message}`);
      }
    },

    /**
     * Get posts by hashtag
     */
    getPostsByHashtag: async (_, { hashtag, limit = 20, offset = 0 }) => {
      try {
        console.log(`🔍 [Missing Resolver] getPostsByHashtag called with hashtag: ${hashtag}`);

        const posts = await Post.find({
          tags: new RegExp(`^${hashtag}$`, 'i')
        })
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit);

        return posts || [];
      } catch (err) {
        console.error('❌ Error in getPostsByHashtag:', err.message);
        throw new Error(`Error fetching posts by hashtag: ${err.message}`);
      }
    },

    /**
     * Search posts
     */
    searchPosts: async (_, { query, limit = 20, offset = 0, filters }) => {
      try {
        console.log(`🔍 [Missing Resolver] searchPosts called with query: ${query}`);

        const searchQuery = {
          $or: [
            { title: new RegExp(query, 'i') },
            { Description: new RegExp(query, 'i') },
            { tags: new RegExp(query, 'i') }
          ]
        };

        if (filters) {
          if (filters.postType) searchQuery.postType = filters.postType;
          if (filters.location) searchQuery.location = filters.location;
          if (filters.dateRange) {
            searchQuery.createdAt = {
              $gte: new Date(filters.dateRange.start),
              $lte: new Date(filters.dateRange.end)
            };
          }
        }

        const posts = await Post.find(searchQuery)
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit);

        return posts || [];
      } catch (err) {
        console.error('❌ Error in searchPosts:', err.message);
        throw new Error(`Error searching posts: ${err.message}`);
      }
    },

    /**
     * Get user feed with pagination
     */
    getUserFeed: async (_, { profileid, limit = 10, cursor }) => {
      try {
        console.log(`🔍 [Missing Resolver] getUserFeed called with profileid: ${profileid}`);

        // Get followed users
        const following = await Following.find({ profileid }).select('followingid');
        const followingIds = following.map(f => f.followingid);
        followingIds.push(profileid); // Include own posts

        // Build query
        const query = {
          profileid: { $in: followingIds }
        };

        if (cursor) {
          query.createdAt = { $lt: new Date(cursor) };
        }

        // Fetch posts
        const posts = await Post.find(query)
          .sort({ createdAt: -1 })
          .limit(limit + 1);

        const hasNextPage = posts.length > limit;
        const edges = posts.slice(0, limit);

        return {
          posts: edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage: !!cursor,
            endCursor: edges.length > 0 ? edges[edges.length - 1].createdAt.toISOString() : null,
            startCursor: edges.length > 0 ? edges[0].createdAt.toISOString() : null
          }
        };
      } catch (err) {
        console.error('❌ Error in getUserFeed:', err.message);
        throw new Error(`Error fetching user feed: ${err.message}`);
      }
    },

    /**
     * Get follow requests received
     */
    getFollowRequests: async (_, { profileid }) => {
      if (!FollowRequest) {
        console.warn('⚠️ FollowRequest model not available');
        return [];
      }
      try {
        console.log(`🔍 [Missing Resolver] getFollowRequests called with profileid: ${profileid}`);
        const requests = await FollowRequest.find({
          requestedid: profileid,
          status: 'pending'
        }).sort({ createdAt: -1 });
        return requests || [];
      } catch (err) {
        console.error('❌ Error in getFollowRequests:', err.message);
        return [];
      }
    },

    /**
     * Get follow requests sent
     */
    getSentFollowRequests: async (_, { profileid }) => {
      if (!FollowRequest) {
        console.warn('⚠️ FollowRequest model not available');
        return [];
      }
      try {
        console.log(`🔍 [Missing Resolver] getSentFollowRequests called with profileid: ${profileid}`);
        const requests = await FollowRequest.find({
          requesterid: profileid,
          status: 'pending'
        }).sort({ createdAt: -1 });
        return requests || [];
      } catch (err) {
        console.error('❌ Error in getSentFollowRequests:', err.message);
        return [];
      }
    },

    /**
     * Get follow request status
     */
    getFollowRequestStatus: async (_, { requesterid, requestedid }) => {
      if (!FollowRequest) {
        console.warn('⚠️ FollowRequest model not available');
        return null;
      }
      try {
        console.log(`🔍 [Missing Resolver] getFollowRequestStatus called`);
        const request = await FollowRequest.findOne({
          requesterid,
          requestedid,
          status: { $in: ['pending', 'accepted'] }
        });
        return request ? request.status : null;
      } catch (err) {
        console.error('❌ Error in getFollowRequestStatus:', err.message);
        return null;
      }
    },

    /**
     * Get notifications
     */
    getNotifications: async (_, { profileid, limit = 20, offset = 0 }) => {
      if (!Notification) {
        console.warn('⚠️ Notification model not available');
        return [];
      }
      try {
        console.log(`🔍 [Missing Resolver] getNotifications called with profileid: ${profileid}`);
        const notifications = await Notification.find({ recipientid: profileid })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset);
        return notifications || [];
      } catch (err) {
        console.error('❌ Error in getNotifications:', err.message);
        return [];
      }
    },

    /**
     * Get unread notification count
     */
    getUnreadNotificationCount: async (_, { profileid }) => {
      if (!Notification) {
        console.warn('⚠️ Notification model not available');
        return 0;
      }
      try {
        console.log(`🔍 [Missing Resolver] getUnreadNotificationCount called with profileid: ${profileid}`);
        return await Notification.countDocuments({
          recipientid: profileid,
          isRead: false
        });
      } catch (err) {
        console.error('❌ Error in getUnreadNotificationCount:', err.message);
        return 0;
      }
    },

    /**
     * Get notifications by type
     */
    getNotificationsByType: async (_, { profileid, type }) => {
      if (!Notification) {
        console.warn('⚠️ Notification model not available');
        return [];
      }
      try {
        console.log(`🔍 [Missing Resolver] getNotificationsByType called with profileid: ${profileid}, type: ${type}`);
        return await Notification.find({
          recipientid: profileid,
          type
        }).sort({ createdAt: -1 });
      } catch (err) {
        console.error('❌ Error in getNotificationsByType:', err.message);
        return [];
      }
    },

    /**
     * Get memories
     */
    getMemories: async (_, { profileid }) => {
      try {
        console.log(`🔍 [Missing Resolver] getMemories called with profileid: ${profileid}`);
        const memories = await Memory.find({ profileid }).sort({ createdAt: -1 });
        return memories || [];
      } catch (err) {
        console.error('❌ Error in getMemories:', err.message);
        return [];
      }
    }
  },

  Mutation: {
    /**
     * Share a post
     */
    SharePost: async (_, { profileid, postid, shareType }) => {
      if (!Share) {
        console.warn('⚠️ Share model not available');
        throw new Error('Share functionality not implemented');
      }
      try {
        console.log(`🔍 [Missing Resolver] SharePost called`);
        const share = new Share({
          shareid: uuidv4(),
          profileid,
          postid,
          shareType,
          createdAt: new Date()
        });
        await share.save();
        return share;
      } catch (err) {
        console.error('❌ Error in SharePost:', err.message);
        throw new Error(`Error sharing post: ${err.message}`);
      }
    },

    /**
     * Bulk like posts
     */
    bulkLikePosts: async (_, { profileid, postids, action }) => {
      try {
        console.log(`🔍 [Missing Resolver] bulkLikePosts called with ${postids.length} posts`);

        const results = [];
        const errors = [];

        for (const postid of postids) {
          try {
            if (action === 'like') {
              const existing = await Likes.findOne({ profileid, postid });
              if (!existing) {
                const like = new Likes({
                  likeid: uuidv4(),
                  profileid,
                  postid,
                  createdAt: new Date()
                });
                await like.save();
              }
            } else if (action === 'unlike') {
              await Likes.deleteOne({ profileid, postid });
            }

            const likeCount = await Likes.countDocuments({ postid });
            results.push({
              postid,
              liked: action === 'like',
              likeCount
            });
          } catch (err) {
            errors.push({
              postid,
              error: err.message
            });
          }
        }

        return {
          success: errors.length === 0,
          results,
          errors
        };
      } catch (err) {
        console.error('❌ Error in bulkLikePosts:', err.message);
        throw new Error(`Error bulk liking posts: ${err.message}`);
      }
    },

    /**
     * Send follow request
     */
    SendFollowRequest: async (_, { requesterid, requestedid, message }) => {
      if (!FollowRequest) {
        throw new Error('Follow request functionality not available');
      }
      try {
        console.log(`🔍 [Missing Resolver] SendFollowRequest called`);

        const existing = await FollowRequest.findOne({
          requesterid,
          requestedid,
          status: 'pending'
        });

        if (existing) {
          throw new Error('Follow request already sent');
        }

        const request = new FollowRequest({
          requestid: uuidv4(),
          requesterid,
          requestedid,
          message,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await request.save();
        return request;
      } catch (err) {
        console.error('❌ Error in SendFollowRequest:', err.message);
        throw new Error(`Error sending follow request: ${err.message}`);
      }
    },

    /**
     * Accept follow request
     */
    AcceptFollowRequest: async (_, { requestid }) => {
      if (!FollowRequest) {
        throw new Error('Follow request functionality not available');
      }
      try {
        console.log(`🔍 [Missing Resolver] AcceptFollowRequest called with requestid: ${requestid}`);

        const request = await FollowRequest.findOne({ requestid });
        if (!request) throw new Error('Request not found');

        // Create following/follower relationship
        const following = new Following({
          followid: uuidv4(),
          profileid: request.requesterid,
          followingid: request.requestedid,
          createdAt: new Date()
        });
        await following.save();

        const follower = new Followers({
          followerid: uuidv4(),
          profileid: request.requestedid,
          followersid: request.requesterid,
          createdAt: new Date()
        });
        await follower.save();

        request.status = 'accepted';
        request.updatedAt = new Date();
        await request.save();

        return request;
      } catch (err) {
        console.error('❌ Error in AcceptFollowRequest:', err.message);
        throw new Error(`Error accepting follow request: ${err.message}`);
      }
    },

    /**
     * Reject follow request
     */
    RejectFollowRequest: async (_, { requestid }) => {
      if (!FollowRequest) {
        throw new Error('Follow request functionality not available');
      }
      try {
        console.log(`🔍 [Missing Resolver] RejectFollowRequest called with requestid: ${requestid}`);

        const request = await FollowRequest.findOne({ requestid });
        if (!request) throw new Error('Request not found');

        request.status = 'rejected';
        request.updatedAt = new Date();
        await request.save();

        return request;
      } catch (err) {
        console.error('❌ Error in RejectFollowRequest:', err.message);
        throw new Error(`Error rejecting follow request: ${err.message}`);
      }
    },

    /**
     * Cancel follow request
     */
    CancelFollowRequest: async (_, { requesterid, requestedid }) => {
      if (!FollowRequest) {
        throw new Error('Follow request functionality not available');
      }
      try {
        console.log(`🔍 [Missing Resolver] CancelFollowRequest called`);

        const request = await FollowRequest.findOne({
          requesterid,
          requestedid,
          status: 'pending'
        });

        if (!request) throw new Error('Request not found');

        request.status = 'cancelled';
        request.updatedAt = new Date();
        await request.save();

        return request;
      } catch (err) {
        console.error('❌ Error in CancelFollowRequest:', err.message);
        throw new Error(`Error cancelling follow request: ${err.message}`);
      }
    },

    /**
     * Create notification
     */
    CreateNotification: async (_, args) => {
      if (!Notification) {
        throw new Error('Notification functionality not available');
      }
      try {
        console.log(`🔍 [Missing Resolver] CreateNotification called`);

        const notification = new Notification({
          notificationid: uuidv4(),
          ...args,
          isRead: false,
          isActioned: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await notification.save();
        return notification;
      } catch (err) {
        console.error('❌ Error in CreateNotification:', err.message);
        throw new Error(`Error creating notification: ${err.message}`);
      }
    },

    /**
     * Mark notification as read
     */
    MarkNotificationAsRead: async (_, { notificationid }) => {
      if (!Notification) {
        throw new Error('Notification functionality not available');
      }
      try {
        console.log(`🔍 [Missing Resolver] MarkNotificationAsRead called`);

        const notification = await Notification.findOneAndUpdate(
          { notificationid },
          { isRead: true, updatedAt: new Date() },
          { new: true }
        );

        return notification;
      } catch (err) {
        console.error('❌ Error in MarkNotificationAsRead:', err.message);
        throw new Error(`Error marking notification as read: ${err.message}`);
      }
    },

    /**
     * Mark notification as actioned
     */
    MarkNotificationAsActioned: async (_, { notificationid }) => {
      if (!Notification) {
        throw new Error('Notification functionality not available');
      }
      try {
        console.log(`🔍 [Missing Resolver] MarkNotificationAsActioned called`);

        const notification = await Notification.findOneAndUpdate(
          { notificationid },
          { isActioned: true, updatedAt: new Date() },
          { new: true }
        );

        return notification;
      } catch (err) {
        console.error('❌ Error in MarkNotificationAsActioned:', err.message);
        throw new Error(`Error marking notification as actioned: ${err.message}`);
      }
    },

    /**
     * Mark all notifications as read
     */
    MarkAllNotificationsAsRead: async (_, { profileid }) => {
      if (!Notification) {
        throw new Error('Notification functionality not available');
      }
      try {
        console.log(`🔍 [Missing Resolver] MarkAllNotificationsAsRead called`);

        await Notification.updateMany(
          { recipientid: profileid, isRead: false },
          { isRead: true, updatedAt: new Date() }
        );

        return await Notification.find({ recipientid: profileid });
      } catch (err) {
        console.error('❌ Error in MarkAllNotificationsAsRead:', err.message);
        throw new Error(`Error marking all notifications as read: ${err.message}`);
      }
    },

    /**
     * Delete notification
     */
    DeleteNotification: async (_, { notificationid }) => {
      if (!Notification) {
        throw new Error('Notification functionality not available');
      }
      try {
        console.log(`🔍 [Missing Resolver] DeleteNotification called`);

        const notification = await Notification.findOneAndDelete({ notificationid });
        return notification;
      } catch (err) {
        console.error('❌ Error in DeleteNotification:', err.message);
        throw new Error(`Error deleting notification: ${err.message}`);
      }
    },

    /**
     * Create memory
     */
    CreateMemory: async (_, { profileid, title, coverImage, postUrl }) => {
      try {
        console.log(`🔍 [Missing Resolver] CreateMemory called`);

        const memory = new Memory({
          memoryid: uuidv4(),
          profileid,
          title,
          coverImage,
          postUrl,
          stories: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await memory.save();
        return memory;
      } catch (err) {
        console.error('❌ Error in CreateMemory:', err.message);
        throw new Error(`Error creating memory: ${err.message}`);
      }
    },

    /**
     * Add story to memory
     */
    AddStoryToMemory: async (_, { memoryid, mediaUrl, mediaType }) => {
      try {
        console.log(`🔍 [Missing Resolver] AddStoryToMemory called`);

        const memory = await Memory.findOne({ memoryid });
        if (!memory) throw new Error('Memory not found');

        if (!memory.stories) memory.stories = [];

        memory.stories.push({
          storyid: uuidv4(),
          mediaUrl,
          mediaType,
          createdAt: new Date()
        });

        memory.updatedAt = new Date();
        await memory.save();

        return memory;
      } catch (err) {
        console.error('❌ Error in AddStoryToMemory:', err.message);
        throw new Error(`Error adding story to memory: ${err.message}`);
      }
    }
  }
};
