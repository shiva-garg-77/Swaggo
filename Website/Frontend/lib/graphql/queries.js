import { gql } from '@apollo/client';

// ============ POSTS ============
export const GET_ALL_POSTS = gql`
  query GetAllPosts {
    getPosts {
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
  }
`;

export const TOGGLE_POST_LIKE = gql`
  mutation TogglePostLike($profileid: String!, $postid: String!) {
    TogglePostLike(profileid: $profileid, postid: $postid) {
      profileid
      postid
      createdAt
    }
  }
`;

export const TOGGLE_SAVE_POST = gql`
  mutation ToggleSavePost($profileid: String!, $postid: String!) {
    ToggleSavePost(profileid: $profileid, postid: $postid) {
      postid
      title
    }
  }
`;

// ============ COMMENTS ============
export const GET_POST_COMMENTS = gql`
  query GetPostComments($postid: String!) {
    getCommentsByPost(postid: $postid) {
      commentid
      comment
      likeCount
      isLikedByUser
      createdAt
      profile {
        profileid
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
          profileid
          username
          profilePic
          isVerified
        }
      }
    }
  }
`;

export const CREATE_COMMENT = gql`
  mutation CreateComment($postid: String!, $profileid: String!, $comment: String!) {
    CreateComment(postid: $postid, profileid: $profileid, comment: $comment) {
      commentid
      comment
      likeCount
      isLikedByUser
      createdAt
      profile {
        profileid
        username
        profilePic
        isVerified
      }
    }
  }
`;

export const CREATE_COMMENT_REPLY = gql`
  mutation CreateCommentReply($commentid: String!, $profileid: String!, $comment: String!) {
    CreateCommentReply(commentid: $commentid, profileid: $profileid, comment: $comment) {
      commentid
      comment
      likeCount
      isLikedByUser
      createdAt
      profile {
        profileid
        username
        profilePic
        isVerified
      }
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

// ============ PROFILE ============
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
        likeCount
        commentCount
        isLikedByUser
        isSavedByUser
        createdAt
      }
    }
  }
`;

export const TOGGLE_FOLLOW_USER = gql`
  mutation ToggleFollowUser($profileid: String!, $followid: String!) {
    ToggleFollowUser(profileid: $profileid, followid: $followid) {
      profileid
      username
    }
  }
`;

// ============ MEMORIES ============
export const GET_MEMORIES = gql`
  query GetMemories($profileid: String!) {
    getMemories(profileid: $profileid) {
      memoryid
      title
      coverImage
      postUrl
      createdAt
      stories {
        storyid
        mediaUrl
        mediaType
        createdAt
      }
    }
  }
`;

// Fixed CREATE_MEMORY to handle optional parameters  
export const CREATE_MEMORY = gql`
  mutation CreateMemory($profileid: String!, $title: String!, $coverImage: String, $postUrl: String) {
    CreateMemory(profileid: $profileid, title: $title, coverImage: $coverImage, postUrl: $postUrl) {
      memoryid
      title
      coverImage
      postUrl
      createdAt
    }
  }
`;

export const ADD_STORY_TO_MEMORY = gql`
  mutation AddStoryToMemory($memoryid: String!, $mediaUrl: String!, $mediaType: String!) {
    AddStoryToMemory(memoryid: $memoryid, mediaUrl: $mediaUrl, mediaType: $mediaType) {
      memoryid
      title
      stories {
        storyid
        mediaUrl
        mediaType
        createdAt
      }
    }
  }
`;

// ============ SIMPLE QUERIES ============
export const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;
