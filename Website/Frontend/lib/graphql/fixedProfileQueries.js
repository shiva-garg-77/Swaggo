import { gql } from '@apollo/client';

// Simple profile query that should work reliably
export const GET_SIMPLE_PROFILE = gql`
  query GetSimpleProfile($username: String) {
    getUserbyUsername(username: $username) {
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
      post {
        postid
        postUrl
        title
        Description
        postType
        createdAt
      }
      savedpost {
        postid
        postUrl
        title
        Description
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
export const GET_CURRENT_USER_PROFILE = gql`
  query GetCurrentUserProfile {
    getUserbyUsername(username: null) {
      profileid
      username
      name
      profilePic
      bio
      isVerified
      isPrivate
      post {
        postid
        postUrl
        title
        Description
        postType
        createdAt
      }
      savedpost {
        postid
        postUrl
        title
        Description
        postType
        createdAt
        profile {
          profileid
          username
          profilePic
          isVerified
        }
      }
      likedpost {
        postid
        postUrl
        title
        Description
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
  query CheckProfileExists($username: String) {
    getUserbyUsername(username: $username) {
      profileid
      username
    }
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
