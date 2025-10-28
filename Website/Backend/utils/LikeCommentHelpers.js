import Likes from '../Models/FeedModels/Likes.js';
import Comments from '../Models/FeedModels/Comments.js';
import SavedPost from '../Models/FeedModels/SavedPost.js';

/**
 * Get like count for a post
 * @param {string} postid - Post ID
 * @returns {Promise<number>} - Number of likes
 */
export const getPostLikeCount = async (postid) => {
    try {
        // Manual filtering approach to avoid Mongoose casting issues
        const allPostLikes = await Likes.find({ postid }).exec();
        const postOnlyLikes = allPostLikes.filter(like => !like.commentid || like.commentid === null || like.commentid === undefined);
        return postOnlyLikes.length;
    } catch (error) {
        console.error('Error getting post like count:', error);
        return 0;
    }
};

/**
 * Get like count for a comment
 * @param {string} commentid - Comment ID
 * @returns {Promise<number>} - Number of likes
 */
export const getCommentLikeCount = async (commentid) => {
    try {
        return await Likes.countDocuments({ commentid });
    } catch (error) {
        console.error('Error getting comment like count:', error);
        return 0;
    }
};

/**
 * Get comment count for a post
 * @param {string} postid - Post ID
 * @returns {Promise<number>} - Number of comments
 */
export const getPostCommentCount = async (postid) => {
    try {
        return await Comments.countDocuments({ postid });
    } catch (error) {
        console.error('Error getting post comment count:', error);
        return 0;
    }
};

/**
 * Check if user has liked a post
 * @param {string} postid - Post ID
 * @param {string} profileid - User profile ID
 * @returns {Promise<boolean>} - True if user has liked the post
 */
export const hasUserLikedPost = async (postid, profileid) => {
    try {
        if (!profileid) return false;
        // Manual filtering approach to avoid Mongoose casting issues
        const userPostLikes = await Likes.find({ postid, profileid }).exec();
        const postOnlyLike = userPostLikes.find(like => !like.commentid || like.commentid === null || like.commentid === undefined);
        return !!postOnlyLike;
    } catch (error) {
        console.error('Error checking if user liked post:', error);
        return false;
    }
};

/**
 * Check if user has liked a comment
 * @param {string} commentid - Comment ID
 * @param {string} profileid - User profile ID
 * @returns {Promise<boolean>} - True if user has liked the comment
 */
export const hasUserLikedComment = async (commentid, profileid) => {
    try {
        if (!profileid) return false;
        const like = await Likes.findOne({ commentid, profileid });
        return !!like;
    } catch (error) {
        console.error('Error checking if user liked comment:', error);
        return false;
    }
};

/**
 * Check if user has saved a post
 * @param {string} postid - Post ID
 * @param {string} profileid - User profile ID
 * @returns {Promise<boolean>} - True if user has saved the post
 */
export const hasUserSavedPost = async (postid, profileid) => {
    try {
        if (!profileid) return false;
        const saved = await SavedPost.findOne({ postid, profileid });
        return !!saved;
    } catch (error) {
        console.error('Error checking if user saved post:', error);
        return false;
    }
};

/**
 * Get comment replies (comments that reply to a specific comment)
 * @param {string} commentid - Parent comment ID
 * @returns {Promise<Array>} - Array of reply comments
 */
export const getCommentReplies = async (commentid) => {
    try {
        return await Comments.find({ commenttoid: commentid }).sort({ createdAt: 1 });
    } catch (error) {
        console.error('Error getting comment replies:', error);
        return [];
    }
};

/**
 * Get top-level comments for a post (not replies)
 * @param {string} postid - Post ID
 * @returns {Promise<Array>} - Array of top-level comments
 */
export const getTopLevelComments = async (postid) => {
    try {
        // Manual filtering approach to avoid Mongoose casting issues
        const allPostComments = await Comments.find({ postid }).sort({ createdAt: -1 }).exec();
        const topLevelComments = allPostComments.filter(comment => !comment.commenttoid || comment.commenttoid === null || comment.commenttoid === undefined);
        return topLevelComments;
    } catch (error) {
        console.error('Error getting top-level comments:', error);
        return [];
    }
};

/**
 * Get post statistics including like and comment counts
 * @param {string} postid - Post ID
 * @param {string|null} currentUserProfileId - Current user's profile ID (optional)
 * @returns {Promise<Object>} - Post statistics object
 */
export const getPostStats = async (postid, currentUserProfileId = null) => {
    try {
        const [likeCount, commentCount, isLikedByUser, isSavedByUser] = await Promise.all([
            getPostLikeCount(postid),
            getPostCommentCount(postid),
            currentUserProfileId ? hasUserLikedPost(postid, currentUserProfileId) : false,
            currentUserProfileId ? hasUserSavedPost(postid, currentUserProfileId) : false
        ]);

        return {
            postid,
            likeCount,
            commentCount,
            isLikedByCurrentUser: isLikedByUser,
            isSavedByCurrentUser: isSavedByUser
        };
    } catch (error) {
        console.error('Error getting post stats:', error);
        return {
            postid,
            likeCount: 0,
            commentCount: 0,
            isLikedByCurrentUser: false,
            isSavedByCurrentUser: false
        };
    }
};
