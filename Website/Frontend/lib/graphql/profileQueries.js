import { gql } from '@apollo/client';

// Get user profile by username - EXACT match with backend schema
export const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String) {
    getUserbyUsername(username: $username) {
      profileid
      profilePic
      isPrivate
      isVerified
      username
      name
      bio
      followers {
        profileid
        username
        profilePic
      }
      following {
        profileid
        username
        profilePic
      }
      post {
        postid
        postUrl
        title
        Description
        postType
        like {
          profile {
            profileid
            username
          }
          postid
        }
        comments {
          commentid
          profile {
            profileid
            username
          }
          comment
        }
      }
      memories {
        memoryid
        title
        coverImage
        stories {
          storyid
          mediaUrl
          mediaType
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  }
`;

// Get all users (for suggestions)
export const GET_ALL_USERS = gql`
  query GetAllUsers {
    getUsers {
      profileid
      profilePic
      username
      name
      isVerified
      followers {
        profileid
      }
      following {
        profileid
      }
    }
  }
`;

// Get posts by user
export const GET_USER_POSTS = gql`
  query GetUserPosts($username: String) {
    getUserbyUsername(username: $username) {
      post {
        postid
        postUrl
        title
        Description
        postType
        like {
          profile {
            profileid
            username
          }
        }
        comments {
          commentid
          comment
          profile {
            profileid
            username
          }
        }
      }
    }
  }
`;

// Toggle follow user
export const TOGGLE_FOLLOW_USER = gql`
  mutation ToggleFollowUser($profileid: String!, $followid: String!) {
    ToggleFollowUser(profileid: $profileid, followid: $followid) {
      profileid
      username
    }
  }
`;

// Create/Update profile
export const UPDATE_PROFILE = gql`
  mutation UpdateProfile(
    $id: String!
    $New_username: String
    $profilesPic: String
    $name: String
    $bio: String
  ) {
    UpdateProfile(
      id: $id
      New_username: $New_username
      profilesPic: $profilesPic
      name: $name
      bio: $bio
    ) {
      profileid
      profilePic
      username
      name
      bio
    }
  }
`;

// Create profile (for new users)
export const CREATE_PROFILE = gql`
  mutation CreateProfile($username: String!) {
    CreateProfile(username: $username) {
      profileid
      username
      profilePic
      name
      bio
    }
  }
`;

// Create post
export const CREATE_POST_MUTATION = gql`
  mutation CreatePost(
    $profileid: String!
    $postUrl: String!
    $title: String
    $Description: String
    $postType: String!
    $location: String
    $taggedPeople: [String!]
    $tags: [String!]
    $allowComments: Boolean
    $hideLikeCount: Boolean
  ) {
    CreatePost(
      profileid: $profileid
      postUrl: $postUrl
      title: $title
      Description: $Description
      postType: $postType
      location: $location
      taggedPeople: $taggedPeople
      tags: $tags
      allowComments: $allowComments
      hideLikeCount: $hideLikeCount
    ) {
      postid
      postUrl
      title
      Description
      postType
      location
      taggedPeople
      tags
      allowComments
      hideLikeCount
      createdAt
    }
  }
`;

// Toggle save post
export const TOGGLE_SAVE_POST = gql`
  mutation ToggleSavePost($profileid: String!, $postid: String!) {
    ToggleSavePost(profileid: $profileid, postid: $postid) {
      postid
    }
  }
`;

// Toggle like post
export const TOGGLE_LIKE_POST = gql`
  mutation ToggleLike($profileid: String!, $postid: String!) {
    ToggleLike(profileid: $profileid, postid: $postid) {
      profileid
      postid
    }
  }
`;

// Get memories for a profile
export const GET_MEMORIES = gql`
  query GetMemories($profileid: String!) {
    getMemories(profileid: $profileid) {
      memoryid
      title
      coverImage
      stories {
        storyid
        mediaUrl
        mediaType
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

// Create memory
export const CREATE_MEMORY = gql`
  mutation CreateMemory($profileid: String!, $title: String!, $coverImage: String) {
    CreateMemory(profileid: $profileid, title: $title, coverImage: $coverImage) {
      memoryid
      title
      coverImage
      stories {
        storyid
        mediaUrl
        mediaType
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

// Add story to memory
export const ADD_STORY_TO_MEMORY = gql`
  mutation AddStoryToMemory($memoryid: String!, $mediaUrl: String!, $mediaType: String!) {
    AddStoryToMemory(memoryid: $memoryid, mediaUrl: $mediaUrl, mediaType: $mediaType) {
      memoryid
      title
      coverImage
      stories {
        storyid
        mediaUrl
        mediaType
        createdAt
      }
      updatedAt
    }
  }
`;
