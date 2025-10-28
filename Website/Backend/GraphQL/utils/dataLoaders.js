/**
 * DATALOADER UTILITY - N+1 QUERY PREVENTION
 *
 * This file implements DataLoader patterns to batch and cache database requests,
 * preventing N+1 query problems in GraphQL resolvers.
 *
 * Issue #76: Implement DataLoader for N+1 prevention
 *
 * @fileoverview DataLoader implementation for efficient data fetching
 * @version 1.0.0
 * @author Swaggo Development Team
 */

import DataLoader from "dataloader";
import Profile from "../../Models/FeedModels/Profile.js";
import Post from "../../Models/FeedModels/Post.js";
import Comment from "../../Models/FeedModels/Comments.js";
import Likes from "../../Models/FeedModels/Likes.js";
import Following from "../../Models/FeedModels/Following.js";
import Followers from "../../Models/FeedModels/Followers.js";
import BlockedAccount from "../../Models/FeedModels/BlockedAccounts.js";
import RestrictedAccount from "../../Models/FeedModels/RestrictedAccounts.js";
import CloseFriends from "../../Models/FeedModels/CloseFriends.js";
import Mentions from "../../Models/FeedModels/Mentions.js";
import UserSettings from "../../Models/FeedModels/UserSettings.js";
import Draft from "../../Models/FeedModels/Draft.js";
import Memory from "../../Models/FeedModels/Memory.js";
import SavedPosts from "../../Models/FeedModels/SavedPosts.js";

/**
 * ========================================
 * BATCH LOADING FUNCTIONS
 * ========================================
 */

/**
 * Batch load profiles by profileid
 * @param {string[]} profileIds - Array of profile IDs
 * @returns {Promise<Profile[]>} Array of profiles in same order as input
 */
const batchProfiles = async (profileIds) => {
  const profiles = await Profile.find({
    profileid: { $in: profileIds },
    isDeleted: false,
  }).lean();

  // Create a map for O(1) lookup
  const profileMap = new Map();
  profiles.forEach((profile) => {
    profileMap.set(profile.profileid, profile);
  });

  // Return profiles in the same order as requested IDs
  // Return null for profiles that don't exist
  return profileIds.map((id) => profileMap.get(id) || null);
};

/**
 * Batch load posts by postid
 * @param {string[]} postIds - Array of post IDs
 * @returns {Promise<Post[]>} Array of posts in same order as input
 */
const batchPosts = async (postIds) => {
  const posts = await Post.find({
    postid: { $in: postIds },
    isDeleted: { $ne: true },
  }).lean();

  const postMap = new Map();
  posts.forEach((post) => {
    postMap.set(post.postid, post);
  });

  return postIds.map((id) => postMap.get(id) || null);
};

/**
 * Batch load comments by commentid
 * @param {string[]} commentIds - Array of comment IDs
 * @returns {Promise<Comment[]>} Array of comments in same order as input
 */
const batchComments = async (commentIds) => {
  const comments = await Comment.find({
    commentid: { $in: commentIds },
  }).lean();

  const commentMap = new Map();
  comments.forEach((comment) => {
    commentMap.set(comment.commentid, comment);
  });

  return commentIds.map((id) => commentMap.get(id) || null);
};

/**
 * Batch load posts by profileid (all posts for multiple users)
 * @param {string[]} profileIds - Array of profile IDs
 * @returns {Promise<Post[][]>} Array of post arrays, one per profile
 */
const batchPostsByProfile = async (profileIds) => {
  const posts = await Post.find({
    profileid: { $in: profileIds },
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .lean();

  // Group posts by profileid
  const postsByProfile = new Map();
  profileIds.forEach((id) => postsByProfile.set(id, []));

  posts.forEach((post) => {
    if (postsByProfile.has(post.profileid)) {
      postsByProfile.get(post.profileid).push(post);
    }
  });

  return profileIds.map((id) => postsByProfile.get(id) || []);
};

/**
 * Batch load comments by postid (all comments for multiple posts)
 * @param {string[]} postIds - Array of post IDs
 * @returns {Promise<Comment[][]>} Array of comment arrays, one per post
 */
const batchCommentsByPost = async (postIds) => {
  const comments = await Comment.find({
    postid: { $in: postIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const commentsByPost = new Map();
  postIds.forEach((id) => commentsByPost.set(id, []));

  comments.forEach((comment) => {
    if (commentsByPost.has(comment.postid)) {
      commentsByPost.get(comment.postid).push(comment);
    }
  });

  return postIds.map((id) => commentsByPost.get(id) || []);
};

/**
 * Batch load likes by postid (all likes for multiple posts)
 * @param {string[]} postIds - Array of post IDs
 * @returns {Promise<Like[][]>} Array of like arrays, one per post
 */
const batchLikesByPost = async (postIds) => {
  const likes = await Likes.find({
    postid: { $in: postIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const likesByPost = new Map();
  postIds.forEach((id) => likesByPost.set(id, []));

  likes.forEach((like) => {
    if (likesByPost.has(like.postid)) {
      likesByPost.get(like.postid).push(like);
    }
  });

  return postIds.map((id) => likesByPost.get(id) || []);
};

/**
 * Batch load like counts by postid
 * @param {string[]} postIds - Array of post IDs
 * @returns {Promise<number[]>} Array of like counts
 */
const batchLikeCountsByPost = async (postIds) => {
  const likeCounts = await Likes.aggregate([
    { $match: { postid: { $in: postIds } } },
    { $group: { _id: "$postid", count: { $sum: 1 } } },
  ]);

  const countMap = new Map();
  likeCounts.forEach((item) => {
    countMap.set(item._id, item.count);
  });

  return postIds.map((id) => countMap.get(id) || 0);
};

/**
 * Batch load comment counts by postid
 * @param {string[]} postIds - Array of post IDs
 * @returns {Promise<number[]>} Array of comment counts
 */
const batchCommentCountsByPost = async (postIds) => {
  const commentCounts = await Comment.aggregate([
    { $match: { postid: { $in: postIds } } },
    { $group: { _id: "$postid", count: { $sum: 1 } } },
  ]);

  const countMap = new Map();
  commentCounts.forEach((item) => {
    countMap.set(item._id, item.count);
  });

  return postIds.map((id) => countMap.get(id) || 0);
};

/**
 * Batch load follower counts by profileid
 * @param {string[]} profileIds - Array of profile IDs
 * @returns {Promise<number[]>} Array of follower counts
 */
const batchFollowerCounts = async (profileIds) => {
  const followerCounts = await Followers.aggregate([
    { $match: { profileid: { $in: profileIds } } },
    { $group: { _id: "$profileid", count: { $sum: 1 } } },
  ]);

  const countMap = new Map();
  followerCounts.forEach((item) => {
    countMap.set(item._id, item.count);
  });

  return profileIds.map((id) => countMap.get(id) || 0);
};

/**
 * Batch load following counts by profileid
 * @param {string[]} profileIds - Array of profile IDs
 * @returns {Promise<number[]>} Array of following counts
 */
const batchFollowingCounts = async (profileIds) => {
  const followingCounts = await Following.aggregate([
    { $match: { profileid: { $in: profileIds } } },
    { $group: { _id: "$profileid", count: { $sum: 1 } } },
  ]);

  const countMap = new Map();
  followingCounts.forEach((item) => {
    countMap.set(item._id, item.count);
  });

  return profileIds.map((id) => countMap.get(id) || 0);
};

/**
 * Batch load followers by profileid (all followers for multiple profiles)
 * @param {string[]} profileIds - Array of profile IDs
 * @returns {Promise<Follower[][]>} Array of follower arrays
 */
const batchFollowersByProfile = async (profileIds) => {
  const followers = await Followers.find({
    profileid: { $in: profileIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const followersByProfile = new Map();
  profileIds.forEach((id) => followersByProfile.set(id, []));

  followers.forEach((follower) => {
    if (followersByProfile.has(follower.profileid)) {
      followersByProfile.get(follower.profileid).push(follower);
    }
  });

  return profileIds.map((id) => followersByProfile.get(id) || []);
};

/**
 * Batch load following by profileid (all following for multiple profiles)
 * @param {string[]} profileIds - Array of profile IDs
 * @returns {Promise<Following[][]>} Array of following arrays
 */
const batchFollowingByProfile = async (profileIds) => {
  const following = await Following.find({
    profileid: { $in: profileIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const followingByProfile = new Map();
  profileIds.forEach((id) => followingByProfile.set(id, []));

  following.forEach((follow) => {
    if (followingByProfile.has(follow.profileid)) {
      followingByProfile.get(follow.profileid).push(follow);
    }
  });

  return profileIds.map((id) => followingByProfile.get(id) || []);
};

/**
 * Batch check if user is following another user
 * @param {Array<{profileid: string, targetProfileid: string}>} keys
 * @returns {Promise<boolean[]>} Array of booleans
 */
const batchIsFollowing = async (keys) => {
  const following = await Following.find({
    $or: keys.map((k) => ({
      profileid: k.profileid,
      followingid: k.targetProfileid,
    })),
  }).lean();

  const followMap = new Set();
  following.forEach((follow) => {
    followMap.add(`${follow.profileid}:${follow.followingid}`);
  });

  return keys.map((key) =>
    followMap.has(`${key.profileid}:${key.targetProfileid}`),
  );
};

/**
 * Batch check if user is blocked
 * @param {Array<{profileid: string, targetProfileid: string}>} keys
 * @returns {Promise<boolean[]>} Array of booleans
 */
const batchIsBlocked = async (keys) => {
  const blocked = await BlockedAccount.find({
    $or: keys.flatMap((k) => [
      { profileid: k.profileid, blockedprofileid: k.targetProfileid },
      { profileid: k.targetProfileid, blockedprofileid: k.profileid },
    ]),
  }).lean();

  const blockMap = new Set();
  blocked.forEach((block) => {
    blockMap.add(`${block.profileid}:${block.blockedprofileid}`);
    blockMap.add(`${block.blockedprofileid}:${block.profileid}`);
  });

  return keys.map((key) =>
    blockMap.has(`${key.profileid}:${key.targetProfileid}`),
  );
};

/**
 * Batch check if post is liked by user
 * @param {Array<{postid: string, profileid: string}>} keys
 * @returns {Promise<boolean[]>} Array of booleans
 */
const batchIsPostLiked = async (keys) => {
  const likes = await Likes.find({
    $or: keys.map((k) => ({ postid: k.postid, profileid: k.profileid })),
  }).lean();

  const likeMap = new Set();
  likes.forEach((like) => {
    likeMap.add(`${like.postid}:${like.profileid}`);
  });

  return keys.map((key) => likeMap.has(`${key.postid}:${key.profileid}`));
};

/**
 * Batch check if post is saved by user
 * @param {Array<{postid: string, profileid: string}>} keys
 * @returns {Promise<boolean[]>} Array of booleans
 */
const batchIsPostSaved = async (keys) => {
  const saved = await SavedPosts.find({
    $or: keys.map((k) => ({ postid: k.postid, profileid: k.profileid })),
  }).lean();

  const savedMap = new Set();
  saved.forEach((save) => {
    savedMap.add(`${save.postid}:${save.profileid}`);
  });

  return keys.map((key) => savedMap.has(`${key.postid}:${key.profileid}`));
};

/**
 * Batch load user settings by profileid
 * @param {string[]} profileIds - Array of profile IDs
 * @returns {Promise<UserSettings[]>} Array of user settings
 */
const batchUserSettings = async (profileIds) => {
  const settings = await UserSettings.find({
    profileid: { $in: profileIds },
  }).lean();

  const settingsMap = new Map();
  settings.forEach((setting) => {
    settingsMap.set(setting.profileid, setting);
  });

  return profileIds.map((id) => settingsMap.get(id) || null);
};

/**
 * Batch load close friends by profileid
 * @param {string[]} profileIds - Array of profile IDs
 * @returns {Promise<CloseFriend[][]>} Array of close friend arrays
 */
const batchCloseFriends = async (profileIds) => {
  const closeFriends = await CloseFriends.find({
    profileid: { $in: profileIds },
    status: "accepted",
  })
    .sort({ createdAt: -1 })
    .lean();

  const closeFriendsByProfile = new Map();
  profileIds.forEach((id) => closeFriendsByProfile.set(id, []));

  closeFriends.forEach((cf) => {
    if (closeFriendsByProfile.has(cf.profileid)) {
      closeFriendsByProfile.get(cf.profileid).push(cf);
    }
  });

  return profileIds.map((id) => closeFriendsByProfile.get(id) || []);
};

/**
 * Batch check if user is close friend
 * @param {Array<{profileid: string, targetProfileid: string}>} keys
 * @returns {Promise<boolean[]>} Array of booleans
 */
const batchIsCloseFriend = async (keys) => {
  const closeFriends = await CloseFriends.find({
    $or: keys.map((k) => ({
      profileid: k.profileid,
      closefriendprofileid: k.targetProfileid,
      status: "accepted",
    })),
  }).lean();

  const cfMap = new Set();
  closeFriends.forEach((cf) => {
    cfMap.add(`${cf.profileid}:${cf.closefriendprofileid}`);
  });

  return keys.map((key) =>
    cfMap.has(`${key.profileid}:${key.targetProfileid}`),
  );
};

/**
 * ========================================
 * DATALOADER FACTORY
 * ========================================
 */

/**
 * Create all DataLoaders for a GraphQL context
 * This should be called once per request to create fresh loaders
 *
 * @returns {Object} Object containing all DataLoader instances
 */
export const createLoaders = () => {
  return {
    // Single entity loaders
    profileLoader: new DataLoader(batchProfiles, {
      cacheKeyFn: (key) => key.toString(),
    }),

    postLoader: new DataLoader(batchPosts, {
      cacheKeyFn: (key) => key.toString(),
    }),

    commentLoader: new DataLoader(batchComments, {
      cacheKeyFn: (key) => key.toString(),
    }),

    userSettingsLoader: new DataLoader(batchUserSettings, {
      cacheKeyFn: (key) => key.toString(),
    }),

    // Collection loaders (one-to-many)
    postsByProfileLoader: new DataLoader(batchPostsByProfile, {
      cacheKeyFn: (key) => key.toString(),
    }),

    commentsByPostLoader: new DataLoader(batchCommentsByPost, {
      cacheKeyFn: (key) => key.toString(),
    }),

    likesByPostLoader: new DataLoader(batchLikesByPost, {
      cacheKeyFn: (key) => key.toString(),
    }),

    followersByProfileLoader: new DataLoader(batchFollowersByProfile, {
      cacheKeyFn: (key) => key.toString(),
    }),

    followingByProfileLoader: new DataLoader(batchFollowingByProfile, {
      cacheKeyFn: (key) => key.toString(),
    }),

    closeFriendsLoader: new DataLoader(batchCloseFriends, {
      cacheKeyFn: (key) => key.toString(),
    }),

    // Count loaders
    likeCountLoader: new DataLoader(batchLikeCountsByPost, {
      cacheKeyFn: (key) => key.toString(),
    }),

    commentCountLoader: new DataLoader(batchCommentCountsByPost, {
      cacheKeyFn: (key) => key.toString(),
    }),

    followerCountLoader: new DataLoader(batchFollowerCounts, {
      cacheKeyFn: (key) => key.toString(),
    }),

    followingCountLoader: new DataLoader(batchFollowingCounts, {
      cacheKeyFn: (key) => key.toString(),
    }),

    // Boolean check loaders (compound keys)
    isFollowingLoader: new DataLoader(batchIsFollowing, {
      cacheKeyFn: (key) => `${key.profileid}:${key.targetProfileid}`,
    }),

    isBlockedLoader: new DataLoader(batchIsBlocked, {
      cacheKeyFn: (key) => `${key.profileid}:${key.targetProfileid}`,
    }),

    isPostLikedLoader: new DataLoader(batchIsPostLiked, {
      cacheKeyFn: (key) => `${key.postid}:${key.profileid}`,
    }),

    isPostSavedLoader: new DataLoader(batchIsPostSaved, {
      cacheKeyFn: (key) => `${key.postid}:${key.profileid}`,
    }),

    isCloseFriendLoader: new DataLoader(batchIsCloseFriend, {
      cacheKeyFn: (key) => `${key.profileid}:${key.targetProfileid}`,
    }),
  };
};

/**
 * ========================================
 * USAGE EXAMPLES
 * ========================================
 */

/**
 * Example usage in Apollo Server context:
 *
 * const server = new ApolloServer({
 *   typeDefs,
 *   resolvers,
 *   context: ({ req }) => ({
 *     user: req.user,
 *     loaders: createLoaders(), // Create fresh loaders per request
 *   }),
 * });
 *
 * Example usage in resolver:
 *
 * Post: {
 *   profile: (parent, _, { loaders }) => {
 *     return loaders.profileLoader.load(parent.profileid);
 *   },
 *   likes: (parent, _, { loaders }) => {
 *     return loaders.likesByPostLoader.load(parent.postid);
 *   },
 *   likeCount: (parent, _, { loaders }) => {
 *     return loaders.likeCountLoader.load(parent.postid);
 *   },
 * }
 */

export default createLoaders;
