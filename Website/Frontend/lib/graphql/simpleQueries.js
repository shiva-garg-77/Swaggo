import { gql } from '@apollo/client';

// Simple version of the user query for debugging
export const GET_USER_SIMPLE = gql`
  query GetUserSimple($username: String) {
    getUserbyUsername(username: $username) {
      profileid
      username
      name
      bio
      profilePic
      isVerified
      post {
        postid
        postUrl
        title
        Description
        postType
      }
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($postid: String!) {
    DeletePost(postid: $postid) {
      postid
      title
      postUrl
      postType
    }
  }
`;

export const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

// Like/Comment Mutations
export const TOGGLE_POST_LIKE = gql`
  mutation TogglePostLike($profileid: String!, $postid: String!) {
    TogglePostLike(profileid: $profileid, postid: $postid) {
      profileid
      postid
      createdAt
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

export const CREATE_COMMENT = gql`
  mutation CreateComment($postid: String!, $profileid: String!, $comment: String!, $usertoid: String) {
    CreateComment(postid: $postid, profileid: $profileid, comment: $comment, usertoid: $usertoid) {
      commentid
      comment
      likeCount
      isLikedByUser
      createdAt
      profile {
        username
        profilePic
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
        }
      }
    }
  }
`;

export const CREATE_COMMENT_REPLY = gql`
  mutation CreateCommentReply($commentid: String!, $profileid: String!, $comment: String!, $usertoid: String) {
    CreateCommentReply(commentid: $commentid, profileid: $profileid, comment: $comment, usertoid: $usertoid) {
      commentid
      comment
      likeCount
      isLikedByUser
      createdAt
      profile {
        username
        profilePic
      }
    }
  }
`;

export const TOGGLE_SAVE_POST = gql`
  mutation ToggleSavePost($profileid: String!, $postid: String!) {
    ToggleSavePost(profileid: $profileid, postid: $postid)
  }
`;

// Additional Queries
export const GET_POST_STATS = gql`
  query GetPostStats($postid: String!) {
    getPostStats(postid: $postid) {
      postid
      likeCount
      commentCount
      isLikedByCurrentUser
      isSavedByCurrentUser
    }
  }
`;

// Get comments for a specific post with enhanced data
export const GET_POST_COMMENTS = gql`
  query GetPostComments($postid: String!) {
    getCommentsByPost(postid: $postid) {
      commentid
      comment
      likeCount
      isLikedByUser
      createdAt
      updatedAt
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
        updatedAt
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

// Enhanced post data query for modal/detailed view
export const GET_POST_WITH_DETAILS = gql`
  query GetPostWithDetails($postid: String!) {
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
        profileid
        createdAt
        profile {
          username
          profilePic
        }
      }
      comments {
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
  }
`;

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
