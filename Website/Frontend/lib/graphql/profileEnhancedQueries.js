import { gql } from '@apollo/client';

// Enhanced UPDATE_PROFILE mutation with cover photo and story support
export const UPDATE_PROFILE_ENHANCED = gql`
  mutation UpdateProfileEnhanced(
    $id: String!
    $New_username: String
    $profilesPic: String
    $name: String
    $bio: String
    $coverPhoto: String
    $location: String
    $website: String
    $dateOfBirth: String
    $gender: String
    $phoneNumber: String
  ) {
    UpdateProfile(
      id: $id
      New_username: $New_username
      profilesPic: $profilesPic
      name: $name
      bio: $bio
      coverPhoto: $coverPhoto
      location: $location
      website: $website
      dateOfBirth: $dateOfBirth
      gender: $gender
      phoneNumber: $phoneNumber
    ) {
      profileid
      profilePic
      username
      name
      bio
      coverPhoto
      location
      website
      dateOfBirth
      gender
      phoneNumber
      updatedAt
    }
  }
`;

// Enhanced CREATE_STORY mutation for profile stories
export const CREATE_STORY = gql`
  mutation CreateStory(
    $profileid: String!
    $mediaUrl: String!
    $mediaType: String!
    $caption: String
    $backgroundColor: String
    $textColor: String
    $duration: Int
    $isHighlight: Boolean
    $highlightTitle: String
  ) {
    CreateStory(
      profileid: $profileid
      mediaUrl: $mediaUrl
      mediaType: $mediaType
      caption: $caption
      backgroundColor: $backgroundColor
      textColor: $textColor
      duration: $duration
      isHighlight: $isHighlight
      highlightTitle: $highlightTitle
    ) {
      storyid
      profileid
      mediaUrl
      mediaType
      caption
      backgroundColor
      textColor
      duration
      isHighlight
      highlightTitle
      viewCount
      isActive
      createdAt
      expiresAt
      profile {
        profileid
        username
        profilePic
        isVerified
      }
    }
  }
`;

// Get user's active stories
export const GET_USER_STORIES = gql`
  query GetUserStories($profileid: String!) {
    getUserStories(profileid: $profileid) {
      storyid
      profileid
      mediaUrl
      mediaType
      caption
      backgroundColor
      textColor
      duration
      isHighlight
      highlightTitle
      viewCount
      isActive
      createdAt
      expiresAt
      views {
        profileid
        viewedAt
        profile {
          username
          profilePic
        }
      }
      profile {
        profileid
        username
        profilePic
        isVerified
      }
    }
  }
`;

// Get all active stories from followed users
// ✅ FIX: Changed from getFollowingStories to getActiveStoriesForUser (correct backend query)
export const GET_FOLLOWING_STORIES = gql`
  query GetFollowingStories($profileid: String!) {
    getActiveStoriesForUser(profileid: $profileid) {
      storyid
      profileid
      mediaUrl
      mediaType
      caption
      backgroundColor
      textColor
      duration
      isHighlight
      highlightTitle
      viewCount
      isActive
      createdAt
      expiresAt
      isViewed
      profile {
        profileid
        username
        profilePic
        isVerified
      }
    }
  }
`;

// Update story (for highlights)
export const UPDATE_STORY = gql`
  mutation UpdateStory(
    $storyid: String!
    $caption: String
    $isHighlight: Boolean
    $highlightTitle: String
  ) {
    UpdateStory(
      storyid: $storyid
      caption: $caption
      isHighlight: $isHighlight
      highlightTitle: $highlightTitle
    ) {
      storyid
      caption
      isHighlight
      highlightTitle
      updatedAt
    }
  }
`;

// Delete story
export const DELETE_STORY = gql`
  mutation DeleteStory($storyid: String!) {
    DeleteStory(storyid: $storyid) {
      storyid
      profileid
    }
  }
`;

// Mark story as viewed
export const MARK_STORY_VIEWED = gql`
  mutation MarkStoryViewed($storyid: String!, $viewerProfileid: String!) {
    MarkStoryViewed(storyid: $storyid, viewerProfileid: $viewerProfileid) {
      storyid
      viewerProfileid
      viewedAt
    }
  }
`;

// Get story views
export const GET_STORY_VIEWS = gql`
  query GetStoryViews($storyid: String!) {
    getStoryViews(storyid: $storyid) {
      profileid
      viewedAt
      profile {
        profileid
        username
        profilePic
        isVerified
      }
    }
  }
`;

// Get profile highlights
export const GET_PROFILE_HIGHLIGHTS = gql`
  query GetProfileHighlights($profileid: String!) {
    getProfileHighlights(profileid: $profileid) {
      highlightid
      title
      coverImage
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

// Create highlight from stories
export const CREATE_HIGHLIGHT = gql`
  mutation CreateHighlight(
    $profileid: String!
    $title: String!
    $storyIds: [String!]!
    $coverImage: String
  ) {
    CreateHighlight(
      profileid: $profileid
      title: $title
      storyIds: $storyIds
      coverImage: $coverImage
    ) {
      highlightid
      title
      coverImage
      storyCount
      createdAt
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

// Update highlight
export const UPDATE_HIGHLIGHT = gql`
  mutation UpdateHighlight(
    $highlightid: String!
    $title: String
    $coverImage: String
    $storyIds: [String!]
  ) {
    UpdateHighlight(
      highlightid: $highlightid
      title: $title
      coverImage: $coverImage
      storyIds: $storyIds
    ) {
      highlightid
      title
      coverImage
      storyCount
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

// Delete highlight
export const DELETE_HIGHLIGHT = gql`
  mutation DeleteHighlight($highlightid: String!) {
    DeleteHighlight(highlightid: $highlightid) {
      highlightid
      title
    }
  }
`;

// Upload media mutation (for stories and profile pics)
export const UPLOAD_MEDIA = gql`
  mutation UploadMedia(
    $file: Upload!
    $mediaType: String!
    $purpose: String!
    $profileid: String!
  ) {
    uploadMedia(
      file: $file
      mediaType: $mediaType
      purpose: $purpose
      profileid: $profileid
    ) {
      url
      mediaType
      size
      width
      height
      duration
      thumbnailUrl
      uploadedAt
    }
  }
`;

// Fragment definitions for reusability
export const STORY_FRAGMENT = gql`
  fragment StoryDetails on Story {
    storyid
    profileid
    mediaUrl
    mediaType
    caption
    backgroundColor
    textColor
    duration
    isHighlight
    highlightTitle
    viewCount
    isActive
    createdAt
    expiresAt
  }
`;

export const PROFILE_ENHANCED_FRAGMENT = gql`
  fragment ProfileEnhancedDetails on Profile {
    profileid
    username
    name
    profilePic
    coverPhoto
    bio
    location
    website
    dateOfBirth
    gender
    phoneNumber
    isVerified
    isPrivate
  }
`;

export const HIGHLIGHT_FRAGMENT = gql`
  fragment HighlightDetails on Highlight {
    highlightid
    title
    coverImage
    storyCount
    createdAt
    updatedAt
  }
`;
