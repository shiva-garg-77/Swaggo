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

export const HELLO_QUERY = gql`
  query Hello {
    hello
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
      profile {
        profileid
        username
        profilePic
      }
    }
  }
`;
