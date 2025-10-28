import { gql } from '@apollo/client';

// Simple profile query that should work reliably
export const GET_SIMPLE_PROFILE = gql`
  query GetSimpleProfile($username: String!) {
    profileByUsername(username: $username) {
      profileid
      username
      name
      profilePic
      bio
      isVerified
      isPrivate
      followers {
        profileid
        username
      }
      following {
        profileid
        username
      }
      posts {
        postid
        postUrl
        title
        description
        postType
        createdAt
      }
      savedPosts {
        postid
        postUrl
        title
        description
        postType
        createdAt
        profile {
          profileid
          username
          profilePic
          isVerified
        }
      }
    }
  }
`;

// Current user profile query - more specific  
// ✅ FIX: This needs the current user's username as parameter
export const GET_CURRENT_USER_PROFILE = gql`
  query GetCurrentUserProfile($username: String!) {
    profileByUsername(username: $username) {
      profileid
      username
      name
      profilePic
      bio
      isVerified
      isPrivate
      posts {
        postid
        postUrl
        title
        description
        postType
        createdAt
      }
      savedPosts {
        postid
        postUrl
        title
        description
        postType
        createdAt
        profile {
          profileid
          username
          profilePic
          isVerified
        }
      }
      likedPosts {
        postid
        postUrl
        title
        description
        postType
        createdAt
        profile {
          profileid
          username
          profilePic
          isVerified
        }
      }
    }
  }
`;

// Minimal profile check query
export const CHECK_PROFILE_EXISTS = gql`
  query CheckProfileExists($username: String!) {
    profileByUsername(username: $username) {
      profileid
      username
    }
  }
`;

// Test query to check GraphQL connectivity
export const TEST_GRAPHQL = gql`
  query TestGraphQL {
    hello
  }
`;

export const TOGGLE_COMMENT_LIKE = gql`
  mutation ToggleCommentLike($profileid: String!, $commentid: String!) {
    ToggleCommentLike(profileid: $profileid, commentid: $commentid) {
      profileid
      commentid
      createdAt
    }
  }
`;
