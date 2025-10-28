import { gql } from '@apollo/client';

/**
 * Story Queries and Mutations
 * For managing stories (view, delete, report)
 */

// ============ QUERIES ============

/**
 * Get a single story by ID
 */
export const GET_STORY_BY_ID = gql`
  query GetStoryById($storyid: String!) {
    getStoryById(storyid: $storyid) {
      storyid
      profileid
      mediaUrl
      mediaType
      caption
      backgroundColor
      textColor
      duration
      viewCount
      isActive
      isHighlight
      highlightTitle
      createdAt
      expiresAt
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
 * Get views for a story
 */
export const GET_STORY_VIEWS = gql`
  query GetStoryViews($storyid: String!) {
    getStoryViews(storyid: $storyid) {
      viewid
      storyid
      profileid
      viewedAt
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
 * Mark a story as viewed
 */
export const VIEW_STORY = gql`
  mutation ViewStory($storyid: String!, $profileid: String!) {
    viewStory(storyid: $storyid, profileid: $profileid) {
      viewid
      storyid
      profileid
      viewedAt
    }
  }
`;

/**
 * Delete a story
 */
export const DELETE_STORY = gql`
  mutation DeleteStory($storyid: String!) {
    deleteStory(storyid: $storyid) {
      storyid
      profileid
      deletedAt
    }
  }
`;

/**
 * Report a story
 */
export const REPORT_STORY = gql`
  mutation ReportStory($profileid: String!, $storyid: String!, $reason: String!, $description: String) {
    reportStory(profileid: $profileid, storyid: $storyid, reason: $reason, description: $description) {
      reportid
      profileid
      storyid
      reason
      description
      status
      createdAt
    }
  }
`;
