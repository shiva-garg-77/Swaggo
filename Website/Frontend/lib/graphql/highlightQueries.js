import { gql } from '@apollo/client';

/**
 * Highlight Queries and Mutations
 * For managing story highlights on profiles
 */

// ============ QUERIES ============

/**
 * Get all highlights for a user profile
 */
export const GET_USER_HIGHLIGHTS = gql`
  query GetUserHighlights($profileid: String!, $limit: Int) {
    getUserHighlights(profileid: $profileid, limit: $limit) {
      highlightid
      profileid
      title
      coverImage
      category
      storyCount
      createdAt
      updatedAt
      stories {
        storyid
        mediaUrl
        mediaType
        caption
        createdAt
      }
    }
  }
`;

/**
 * Get a single highlight by ID
 */
export const GET_HIGHLIGHT_BY_ID = gql`
  query GetHighlightById($highlightid: String!) {
    getHighlightById(highlightid: $highlightid) {
      highlightid
      profileid
      title
      coverImage
      category
      storyCount
      createdAt
      updatedAt
      stories {
        storyid
        mediaUrl
        mediaType
        caption
        duration
        backgroundColor
        textColor
        createdAt
      }
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

// ============ MUTATIONS ============

/**
 * Create a new highlight with stories
 */
export const CREATE_HIGHLIGHT_WITH_STORIES = gql`
  mutation CreateHighlightWithStories($input: HighlightInput!) {
    createHighlightWithStories(input: $input) {
      highlightid
      profileid
      title
      coverImage
      category
      storyCount
      createdAt
      stories {
        storyid
        mediaUrl
        mediaType
      }
    }
  }
`;

/**
 * Add a story to an existing highlight
 */
export const ADD_STORY_TO_HIGHLIGHT = gql`
  mutation AddStoryToHighlight($highlightid: String!, $storyid: String!) {
    addStoryToHighlight(highlightid: $highlightid, storyid: $storyid) {
      highlightid
      title
      storyCount
      updatedAt
    }
  }
`;

/**
 * Remove a story from a highlight
 */
export const REMOVE_STORY_FROM_HIGHLIGHT = gql`
  mutation RemoveStoryFromHighlight($highlightid: String!, $storyid: String!) {
    removeStoryFromHighlight(highlightid: $highlightid, storyid: $storyid) {
      highlightid
      title
      storyCount
      updatedAt
    }
  }
`;

/**
 * Update highlight details (title, cover, category)
 */
export const UPDATE_HIGHLIGHT = gql`
  mutation UpdateHighlight($highlightid: String!, $title: String, $coverImage: String, $category: String) {
    updateHighlight(highlightid: $highlightid, title: $title, coverImage: $coverImage, category: $category) {
      highlightid
      title
      coverImage
      category
      updatedAt
    }
  }
`;

/**
 * Delete a highlight
 */
export const DELETE_HIGHLIGHT = gql`
  mutation DeleteHighlight($highlightid: String!) {
    deleteHighlight(highlightid: $highlightid) {
      highlightid
      title
    }
  }
`;
