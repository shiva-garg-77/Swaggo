import { gql } from '@apollo/client';

/**
 * Post Statistics and Discovery Queries
 * For analytics, trending, and discovery features
 */

// ============ QUERIES ============

/**
 * Get detailed statistics for a post
 */
export const GET_POST_STATS = gql`
  query GetPostStats($postid: String!) {
    getPostStats(postid: $postid) {
      postid
      likeCount
      commentCount
      shareCount
      isLikedByCurrentUser
      isSavedByCurrentUser
    }
  }
`;

/**
 * Get trending posts based on engagement
 */
export const GET_TRENDING_POSTS = gql`
  query GetTrendingPosts($timeRange: String, $limit: Int) {
    getTrendingPosts(timeRange: $timeRange, limit: $limit) {
      postid
      postUrl
      title
      description
      postType
      likeCount
      commentCount
      engagementScore
      createdAt
      profile {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

/**
 * Get posts by hashtag
 */
export const GET_POSTS_BY_HASHTAG = gql`
  query GetPostsByHashtag($hashtag: String!, $limit: Int, $offset: Int) {
    getPostsByHashtag(hashtag: $hashtag, limit: $limit, offset: $offset) {
      postid
      postUrl
      title
      description
      postType
      tags
      likeCount
      commentCount
      createdAt
      profile {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

/**
 * Advanced post search
 */
export const SEARCH_POSTS = gql`
  query SearchPosts($query: String!, $limit: Int, $offset: Int, $filters: SearchFilters) {
    searchPosts(query: $query, limit: $limit, offset: $offset, filters: $filters) {
      postid
      postUrl
      title
      description
      postType
      tags
      location
      likeCount
      commentCount
      createdAt
      profile {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

/**
 * Get profile statistics
 */
export const GET_PROFILE_STATS = gql`
  query GetProfileStats($profileid: String!) {
    getProfileStats(profileid: $profileid) {
      profileid
      postsCount
      followersCount
      followingCount
      likesReceived
      commentsReceived
      averageEngagement
    }
  }
`;

/**
 * Get suggested profiles for user
 */
export const GET_SUGGESTED_PROFILES = gql`
  query GetSuggestedProfiles($profileid: String!, $limit: Int) {
    getSuggestedProfiles(profileid: $profileid, limit: $limit) {
      profileid
      username
      name
      profilePic
      bio
      isVerified
      isPrivate
      followersCount
      postsCount
      mutualFollowersCount
    }
  }
`;

// ============ MUTATIONS ============

/**
 * Share a post
 */
export const SHARE_POST = gql`
  mutation SharePost($profileid: String!, $postid: String!, $caption: String, $shareType: String) {
    SharePost(profileid: $profileid, postid: $postid, caption: $caption, shareType: $shareType) {
      shareid
      profileid
      postid
      caption
      shareType
      createdAt
    }
  }
`;

/**
 * Report a post
 */
export const REPORT_POST = gql`
  mutation ReportPost($profileid: String!, $postid: String!, $reason: String!, $description: String) {
    ReportPost(profileid: $profileid, postid: $postid, reason: $reason, description: $description) {
      reportid
      profileid
      postid
      reason
      description
      status
      createdAt
    }
  }
`;

/**
 * Report a profile
 */
export const REPORT_PROFILE = gql`
  mutation ReportProfile($profileid: String!, $reportedprofileid: String!, $reason: String!, $description: String) {
    ReportProfile(profileid: $profileid, reportedprofileid: $reportedprofileid, reason: $reason, description: $description) {
      reportid
      profileid
      reportedprofileid
      reason
      description
      status
      createdAt
    }
  }
`;
