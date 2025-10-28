/**
 * AUTHENTICATION & AUTHORIZATION UTILITIES
 *
 * Provides comprehensive auth helpers for GraphQL operations with:
 * - Authentication checks
 * - Ownership verification
 * - Blocked user checks
 * - Privacy checks
 * - Access control helpers
 *
 * @fileoverview Authentication and authorization utilities
 * @version 1.0.0
 * @author Swaggo Development Team
 */

import { AuthenticationError, AuthorizationError } from './errors.js';
import BlockedAccount from '../../Models/FeedModels/BlockedAccounts.js';
import RestrictedAccount from '../../Models/FeedModels/RestrictedAccounts.js';
import Profile from '../../Models/FeedModels/Profile.js';
import Following from '../../Models/FeedModels/Following.js';
import CloseFriends from '../../Models/FeedModels/CloseFriends.js';

/**
 * Require authentication - throws error if user not authenticated
 *
 * @param {Object} context - GraphQL context
 * @throws {AuthenticationError} If user is not authenticated
 * @returns {Object} Authenticated user object
 *
 * @example
 * const user = requireAuth(context);
 * console.log(user.profileid);
 */
export const requireAuth = (context) => {
  if (!context.user || !context.user.profileid) {
    throw new AuthenticationError('You must be logged in to perform this action');
  }
  return context.user;
};

/**
 * Check if two users have blocked each other (bi-directional check)
 *
 * @param {string} profileid - First user's profile ID
 * @param {string} targetprofileid - Second user's profile ID
 * @returns {Promise<boolean>} True if blocked in either direction
 *
 * @example
 * const blocked = await isBlocked('user1', 'user2');
 * if (blocked) {
 *   throw new AuthorizationError('Cannot access this user');
 * }
 */
export const isBlocked = async (profileid, targetprofileid) => {
  if (!profileid || !targetprofileid) {
    return false;
  }

  if (profileid === targetprofileid) {
    return false; // Can't block yourself
  }

  try {
    const blocked = await BlockedAccount.findOne({
      $or: [
        { profileid, blockedprofileid: targetprofileid },
        { profileid: targetprofileid, blockedprofileid: profileid }
      ]
    }).lean();

    return !!blocked;
  } catch (error) {
    console.error('Error checking blocked status:', error);
    return false; // Fail open - allow access if check fails
  }
};

/**
 * Check if user is restricted by another user
 *
 * @param {string} profileid - User who may have restricted
 * @param {string} targetprofileid - User who may be restricted
 * @returns {Promise<boolean>} True if restricted
 */
export const isRestricted = async (profileid, targetprofileid) => {
  if (!profileid || !targetprofileid) {
    return false;
  }

  try {
    const restricted = await RestrictedAccount.findOne({
      profileid,
      restrictedprofileid: targetprofileid
    }).lean();

    return !!restricted;
  } catch (error) {
    console.error('Error checking restricted status:', error);
    return false;
  }
};

/**
 * Check if viewer can access a profile
 * Handles private profiles and following relationships
 *
 * @param {string} profileid - Profile to access
 * @param {string} viewerProfileid - Viewer's profile ID
 * @returns {Promise<boolean>} True if viewer can access profile
 *
 * @example
 * const canAccess = await canAccessProfile(targetProfileId, currentUserId);
 * if (!canAccess) {
 *   throw new AuthorizationError('This profile is private');
 * }
 */
export const canAccessProfile = async (profileid, viewerProfileid) => {
  if (!profileid) {
    return false;
  }

  // User can always access their own profile
  if (profileid === viewerProfileid) {
    return true;
  }

  try {
    // Check if profile exists and is active
    const profile = await Profile.findOne({
      profileid,
      isDeleted: { $ne: true },
      isActive: true
    }).lean();

    if (!profile) {
      return false;
    }

    // Check if blocked
    if (viewerProfileid) {
      const blocked = await isBlocked(profileid, viewerProfileid);
      if (blocked) {
        return false;
      }
    }

    // Public profiles are accessible to everyone
    if (!profile.isPrivate) {
      return true;
    }

    // Private profile - check if viewer is following
    if (!viewerProfileid) {
      return false; // Not authenticated, can't access private profile
    }

    const following = await Following.findOne({
      profileid: viewerProfileid,
      followingid: profileid
    }).lean();

    return !!following;
  } catch (error) {
    console.error('Error checking profile access:', error);
    return false;
  }
};

/**
 * Check if viewer can access a post
 * Handles private profiles, close friends only posts, and blocked users
 *
 * @param {Object} post - Post object
 * @param {string} viewerProfileid - Viewer's profile ID
 * @returns {Promise<boolean>} True if viewer can access post
 * @throws {AuthorizationError} If access is denied with specific reason
 *
 * @example
 * await canAccessPost(post, currentUser.profileid);
 * // Throws if access denied, returns true if allowed
 */
export const canAccessPost = async (post, viewerProfileid) => {
  if (!post) {
    throw new AuthorizationError('Post not found');
  }

  // Check if post is deleted
  if (post.isDeleted) {
    throw new AuthorizationError('This post is no longer available');
  }

  // Post owner can always access their own posts
  if (post.profileid === viewerProfileid) {
    return true;
  }

  // Check if viewer is blocked
  if (viewerProfileid) {
    const blocked = await isBlocked(post.profileid, viewerProfileid);
    if (blocked) {
      throw new AuthorizationError('Cannot access this post');
    }
  }

  // Check if post is close friends only
  if (post.isCloseFriendOnly) {
    if (!viewerProfileid) {
      throw new AuthorizationError('This post is only visible to close friends');
    }

    const isCloseFriend = await CloseFriends.findOne({
      profileid: post.profileid,
      closefriendprofileid: viewerProfileid,
      status: 'accepted'
    }).lean();

    if (!isCloseFriend && post.profileid !== viewerProfileid) {
      throw new AuthorizationError('This post is only visible to close friends');
    }
  }

  // Check if profile is private
  const canAccess = await canAccessProfile(post.profileid, viewerProfileid);
  if (!canAccess) {
    throw new AuthorizationError('Cannot access posts from this private profile');
  }

  return true;
};

/**
 * Verify ownership - throws error if user doesn't own the resource
 *
 * @param {string} resourceOwnerId - ID of the resource owner
 * @param {string} userId - ID of the current user
 * @param {string} resourceType - Type of resource (for error message)
 * @throws {AuthorizationError} If user doesn't own the resource
 * @returns {boolean} True if user owns resource
 *
 * @example
 * verifyOwnership(post.profileid, currentUser.profileid, 'post');
 * // Throws if not owner
 */
export const verifyOwnership = (resourceOwnerId, userId, resourceType = 'resource') => {
  if (resourceOwnerId !== userId) {
    throw new AuthorizationError(`You can only modify your own ${resourceType}`);
  }
  return true;
};

/**
 * Check if user is admin
 *
 * @param {Object} user - User object or context.user
 * @returns {Promise<boolean>} True if user is admin
 */
export const isAdmin = async (user) => {
  if (!user || !user.profileid) {
    return false;
  }

  try {
    const profile = await Profile.findOne({ profileid: user.profileid }).lean();
    return profile && (profile.role === 'admin' || profile.role === 'super_admin');
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Require admin access - throws error if user is not admin
 *
 * @param {Object} context - GraphQL context
 * @throws {AuthorizationError} If user is not admin
 * @returns {Object} Authenticated admin user
 */
export const requireAdmin = async (context) => {
  const user = requireAuth(context);

  const admin = await isAdmin(user);
  if (!admin) {
    throw new AuthorizationError('Administrator access required');
  }

  return user;
};

/**
 * Check if user can moderate content
 * (Admin or moderator role)
 *
 * @param {Object} user - User object
 * @returns {Promise<boolean>} True if user can moderate
 */
export const canModerate = async (user) => {
  if (!user || !user.profileid) {
    return false;
  }

  try {
    const profile = await Profile.findOne({ profileid: user.profileid }).lean();
    return profile && ['admin', 'super_admin', 'moderator'].includes(profile.role);
  } catch (error) {
    console.error('Error checking moderator status:', error);
    return false;
  }
};

/**
 * Extract user from context (doesn't throw if not authenticated)
 * Use this when authentication is optional
 *
 * @param {Object} context - GraphQL context
 * @returns {Object|null} User object or null
 */
export const getUser = (context) => {
  return context.user && context.user.profileid ? context.user : null;
};

/**
 * Check if user is following another user
 *
 * @param {string} profileid - Follower's profile ID
 * @param {string} targetprofileid - Target profile ID
 * @returns {Promise<boolean>} True if following
 */
export const isFollowing = async (profileid, targetprofileid) => {
  if (!profileid || !targetprofileid) {
    return false;
  }

  if (profileid === targetprofileid) {
    return true; // User "follows" themselves
  }

  try {
    const following = await Following.findOne({
      profileid,
      followingid: targetprofileid
    }).lean();

    return !!following;
  } catch (error) {
    console.error('Error checking following status:', error);
    return false;
  }
};

/**
 * Check if user is close friend
 *
 * @param {string} profileid - Profile ID
 * @param {string} targetprofileid - Target profile ID
 * @returns {Promise<boolean>} True if close friend
 */
export const isCloseFriend = async (profileid, targetprofileid) => {
  if (!profileid || !targetprofileid) {
    return false;
  }

  try {
    const closeFriend = await CloseFriends.findOne({
      profileid,
      closefriendprofileid: targetprofileid,
      status: 'accepted'
    }).lean();

    return !!closeFriend;
  } catch (error) {
    console.error('Error checking close friend status:', error);
    return false;
  }
};

/**
 * Export all auth utilities
 */
export default {
  requireAuth,
  requireAdmin,
  isBlocked,
  isRestricted,
  canAccessProfile,
  canAccessPost,
  verifyOwnership,
  isAdmin,
  canModerate,
  getUser,
  isFollowing,
  isCloseFriend,
};
