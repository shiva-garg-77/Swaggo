import { gql } from '@apollo/client';

// Enhanced version of GET_ALL_POSTS with better field selection and error handling
export const GET_ALL_POSTS_ENHANCED = gql`
  query GetAllPostsEnhanced($limit: Int, $offset: Int) {
    getPosts(limit: $limit, offset: $offset) {
      postid
      postUrl
      title
      Description
      postType
      location
      tags
      taggedPeople
      allowComments
      hideLikeCount
      autoPlay
      likeCount
      commentCount
      isLikedByUser
      isSavedByUser
      createdAt
      updatedAt
      profile {
        profileid
        username
        name
        profilePic
        isVerified
      }
      like {
        profile {
          username
          profilePic
        }
        createdAt
      }
      comments {
        commentid
        comment
        likeCount
        isLikedByUser
        createdAt
        profile {
          username
          profilePic
          isVerified
        }
        replies {
          commentid
          comment
          likeCount
          isLikedByUser
          createdAt
          profile {
            username
            profilePic
            isVerified
          }
        }
      }
    }
  }
`;

// Enhanced post stats query with subscription support
export const GET_POST_STATS_ENHANCED = gql`
  query GetPostStatsEnhanced($postid: String!) {
    getPostStats(postid: $postid) {
      postid
      likeCount
      commentCount
      shareCount
      isLikedByCurrentUser
      isSavedByCurrentUser
      recentLikes {
        profile {
          username
          profilePic
        }
        createdAt
      }
      topComments {
        commentid
        comment
        likeCount
        createdAt
        profile {
          username
          profilePic
        }
      }
    }
  }
`;

// Get single post with full details
export const GET_POST_BY_ID = gql`
  query GetPostById($postid: String!) {
    getPostbyId(postid: $postid) {
      postid
      postUrl
      title
      Description
      postType
      location
      tags
      taggedPeople
      allowComments
      hideLikeCount
      autoPlay
      likeCount
      commentCount
      isLikedByUser
      isSavedByUser
      createdAt
      updatedAt
      profile {
        profileid
        username
        name
        profilePic
        isVerified
      }
      like {
        profile {
          username
          profilePic
        }
        createdAt
      }
      comments {
        commentid
        comment
        likeCount
        isLikedByUser
        createdAt
        profile {
          username
          profilePic
          isVerified
        }
        replies {
          commentid
          comment
          likeCount
          isLikedByUser
          createdAt
          profile {
            username
            profilePic
            isVerified
          }
        }
      }
    }
  }
`;

// Enhanced comment creation with optimistic response
export const CREATE_COMMENT_ENHANCED = gql`
  mutation CreateCommentEnhanced($postid: String!, $profileid: String!, $comment: String!, $usertoid: String) {
    CreateComment(postid: $postid, profileid: $profileid, comment: $comment, usertoid: $usertoid) {
      commentid
      comment
      likeCount
      isLikedByUser
      createdAt
      profile {
        username
        profilePic
        isVerified
      }
      replies {
        commentid
        comment
        likeCount
        isLikedByUser
        createdAt
        profile {
          username
          profilePic
          isVerified
        }
      }
    }
  }
`;

// Enhanced comment reply creation
export const CREATE_COMMENT_REPLY_ENHANCED = gql`
  mutation CreateCommentReplyEnhanced($commentid: String!, $profileid: String!, $comment: String!, $usertoid: String) {
    CreateCommentReply(commentid: $commentid, profileid: $profileid, comment: $comment, usertoid: $usertoid) {
      commentid
      comment
      likeCount
      isLikedByUser
      createdAt
      profile {
        username
        profilePic
        isVerified
      }
    }
  }
`;

// Enhanced post like toggle with real-time updates
export const TOGGLE_POST_LIKE_ENHANCED = gql`
  mutation TogglePostLikeEnhanced($profileid: String!, $postid: String!) {
    TogglePostLike(profileid: $profileid, postid: $postid) {
      profileid
      postid
      createdAt
      isLiked
      newLikeCount
    }
  }
`;

// Enhanced comment like toggle
export const TOGGLE_COMMENT_LIKE_ENHANCED = gql`
  mutation ToggleCommentLikeEnhanced($profileid: String!, $commentid: String!) {
    ToggleCommentLike(profileid: $profileid, commentid: $commentid) {
      profileid
      commentid
      createdAt
      isLiked
      newLikeCount
    }
  }
`;

// Share post mutation (if we want to track shares)
export const SHARE_POST = gql`
  mutation SharePost($profileid: String!, $postid: String!, $shareType: String!) {
    SharePost(profileid: $profileid, postid: $postid, shareType: $shareType) {
      shareid
      profileid
      postid
      shareType
      createdAt
    }
  }
`;

// Get trending posts
export const GET_TRENDING_POSTS = gql`
  query GetTrendingPosts($timeRange: String = "24h", $limit: Int = 10) {
    getTrendingPosts(timeRange: $timeRange, limit: $limit) {
      postid
      postUrl
      title
      Description
      postType
      likeCount
      commentCount
      shareCount
      trendingScore
      profile {
        username
        profilePic
        isVerified
      }
    }
  }
`;

// Get posts by hashtag
export const GET_POSTS_BY_HASHTAG = gql`
  query GetPostsByHashtag($hashtag: String!, $limit: Int = 20, $offset: Int = 0) {
    getPostsByHashtag(hashtag: $hashtag, limit: $limit, offset: $offset) {
      postid
      postUrl
      title
      Description
      postType
      tags
      likeCount
      commentCount
      createdAt
      profile {
        username
        profilePic
        isVerified
      }
    }
  }
`;

// Search posts
export const SEARCH_POSTS = gql`
  query SearchPosts($query: String!, $limit: Int = 20, $offset: Int = 0, $filters: SearchFilters) {
    searchPosts(query: $query, limit: $limit, offset: $offset, filters: $filters) {
      postid
      postUrl
      title
      Description
      postType
      tags
      location
      likeCount
      commentCount
      relevanceScore
      createdAt
      profile {
        username
        profilePic
        isVerified
      }
    }
  }
`;

// Real-time subscription for post updates (if websocket support is added)
export const POST_UPDATES_SUBSCRIPTION = gql`
  subscription PostUpdates($postid: String!) {
    postUpdated(postid: $postid) {
      postid
      updateType
      likeCount
      commentCount
      newComment {
        commentid
        comment
        createdAt
        profile {
          username
          profilePic
        }
      }
      newLike {
        profile {
          username
          profilePic
        }
        createdAt
      }
    }
  }
`;

// Get user's feed with personalized algorithm
export const GET_USER_FEED = gql`
  query GetUserFeed($profileid: String!, $limit: Int = 10, $cursor: String) {
    getUserFeed(profileid: $profileid, limit: $limit, cursor: $cursor) {
      posts {
        postid
        postUrl
        title
        Description
        postType
        location
        tags
        taggedPeople
        allowComments
        hideLikeCount
        autoPlay
        likeCount
        commentCount
        isLikedByUser
        isSavedByUser
        createdAt
        profile {
          profileid
          username
          name
          profilePic
          isVerified
        }
      }
      pageInfo {
        hasNextPage
        endCursor
        totalCount
      }
      algorithm {
        reason
        score
        factors
      }
    }
  }
`;

// Bulk operations for performance
export const BULK_LIKE_POSTS = gql`
  mutation BulkLikePosts($profileid: String!, $postids: [String!]!, $action: String!) {
    bulkLikePosts(profileid: $profileid, postids: $postids, action: $action) {
      success
      results {
        postid
        liked
        likeCount
      }
      errors {
        postid
        error
      }
    }
  }
`;

// Cache management queries
export const INVALIDATE_POST_CACHE = gql`
  mutation InvalidatePostCache($postid: String!) {
    invalidatePostCache(postid: $postid) {
      success
      message
    }
  }
`;

// Fragment definitions for better code reuse
export const POST_FRAGMENT = gql`
  fragment PostDetails on Post {
    postid
    postUrl
    title
    Description
    postType
    location
    tags
    taggedPeople
    allowComments
    hideLikeCount
    autoPlay
    likeCount
    commentCount
    isLikedByUser
    isSavedByUser
    createdAt
    updatedAt
  }
`;

export const PROFILE_FRAGMENT = gql`
  fragment ProfileDetails on Profile {
    profileid
    username
    name
    profilePic
    isVerified
  }
`;

export const COMMENT_FRAGMENT = gql`
  fragment CommentDetails on Comment {
    commentid
    comment
    likeCount
    isLikedByUser
    createdAt
    profile {
      ...ProfileDetails
    }
  }
  ${PROFILE_FRAGMENT}
`;

// Error handling utilities
export const ERROR_FRAGMENT = gql`
  fragment ErrorDetails on Error {
    code
    message
    field
    timestamp
  }
`;

// Performance monitoring
export const QUERY_PERFORMANCE = gql`
  query QueryPerformance($operationName: String!) {
    getQueryPerformance(operationName: $operationName) {
      averageExecutionTime
      cacheHitRate
      errorRate
      totalExecutions
      lastExecuted
    }
  }
`;
