import { gql } from '@apollo/client';

// Get user profile by username - EXACT match with backend schema
export const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String!) {
    profileByUsername(username: $username) {
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
      posts {
        postid
        postUrl
        title
        description
        postType
        like {
          profile {
            profileid
            username
          }
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
    }
  }
`;

// Get all users (for suggestions)
export const GET_ALL_USERS = gql`
  query GetAllUsers {
    users {
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
  query GetUserPosts($username: String!) {
    profileByUsername(username: $username) {
      posts {
        postid
        postUrl
        title
        description
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
    $profilePic: String
    $name: String
    $bio: String
  ) {
    UpdateProfile(
      id: $id
      New_username: $New_username
      profilePic: $profilePic
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
export const CREATE_DRAFT_MUTATION = gql`
  mutation CreateDraft(
    $profileid: String!
    $postUrl: String
    $postType: String
    $title: String
    $caption: String
    $location: String
    $tags: [String!]
    $taggedPeople: [String!]
    $allowComments: Boolean
    $hideLikeCount: Boolean
    $autoPlay: Boolean
  ) {
    CreateDraft(
      profileid: $profileid
      postUrl: $postUrl
      postType: $postType
      title: $title
      caption: $caption
      location: $location
      tags: $tags
      taggedPeople: $taggedPeople
      allowComments: $allowComments
      hideLikeCount: $hideLikeCount
      autoPlay: $autoPlay
    ) {
      draftid
      profileid
      postUrl
      postType
      title
      caption
      location
      tags
      taggedPeople
      allowComments
      hideLikeCount
      autoPlay
      createdAt
      updatedAt
    }
  }
`;

export const GET_DRAFTS_QUERY = gql`
  query GetDrafts($profileid: String!) {
    getDraftsByUser(profileid: $profileid) {
      draftid
      postUrl
      postType
      title
      caption
      location
      tags
      taggedPeople
      allowComments
      hideLikeCount
      autoPlay
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_DRAFT_MUTATION = gql`
  mutation UpdateDraft(
    $draftid: String!
    $postUrl: String
    $postType: String
    $title: String
    $caption: String
    $location: String
    $tags: [String!]
    $taggedPeople: [String!]
    $allowComments: Boolean
    $hideLikeCount: Boolean
    $autoPlay: Boolean
  ) {
    UpdateDraft(
      draftid: $draftid
      postUrl: $postUrl
      postType: $postType
      title: $title
      caption: $caption
      location: $location
      tags: $tags
      taggedPeople: $taggedPeople
      allowComments: $allowComments
      hideLikeCount: $hideLikeCount
      autoPlay: $autoPlay
    ) {
      draftid
      profileid
      postUrl
      postType
      title
      caption
      location
      tags
      taggedPeople
      allowComments
      hideLikeCount
      autoPlay
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_DRAFT_MUTATION = gql`
  mutation DeleteDraft($draftid: String!) {
    DeleteDraft(draftid: $draftid) {
      draftid
      profileid
      title
      caption
    }
  }
`;

export const PUBLISH_DRAFT_MUTATION = gql`
  mutation PublishDraft($draftid: String!) {
    publishDraftToPost(draftid: $draftid) {
      postid
      postUrl
      title
      description
      postType
      location
      tags
      taggedPeople
      allowComments
      hideLikeCount
      autoPlay
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_POST_MUTATION = gql`
  mutation CreatePostWithMedia(
    $profileid: String!
    $postUrl: String!
    $title: String
    $description: String
    $postType: String!
    $location: String
    $taggedPeople: [String!]
    $tags: [String!]
    $allowComments: Boolean
    $hideLikeCount: Boolean
    $autoPlay: Boolean
    $isCloseFriendOnly: Boolean
  ) {
    createPostWithMedia(
      profileid: $profileid
      postUrl: $postUrl
      title: $title
      description: $description
      postType: $postType
      location: $location
      taggedPeople: $taggedPeople
      tags: $tags
      allowComments: $allowComments
      hideLikeCount: $hideLikeCount
      autoPlay: $autoPlay
      isCloseFriendOnly: $isCloseFriendOnly
    ) {
      postid
      postUrl
      title
      description
      postType
      location
      taggedPeople
      tags
      allowComments
      hideLikeCount
      autoPlay
      isCloseFriendOnly
      createdAt
    }
  }
`;

// Toggle save post
export const TOGGLE_SAVE_POST = gql`
  mutation ToggleSavePost($profileid: String!, $postid: String!) {
    ToggleSavePost(profileid: $profileid, postid: $postid) {
      postid
      title
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
      postUrl
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

// Create memory - Fixed to handle optional parameters properly
export const CREATE_MEMORY = gql`
  mutation CreateMemory(
    $profileid: String!
    $title: String!
    $coverImage: String
    $postUrl: String
  ) {
    CreateMemory(
      profileid: $profileid
      title: $title
      coverImage: $coverImage
      postUrl: $postUrl
    ) {
      memoryid
      title
      coverImage
      postUrl
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
  mutation AddStoryToMemory(
    $memoryid: String!
    $mediaUrl: String!
    $mediaType: String!
  ) {
    AddStoryToMemory(
      memoryid: $memoryid
      mediaUrl: $mediaUrl
      mediaType: $mediaType
    ) {
      memoryid
      title
      coverImage
      postUrl
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

// Block and Restrict User Queries
export const GET_BLOCKED_ACCOUNTS = gql`
  query GetBlockedAccounts($profileid: String!) {
    getBlockedAccounts(profileid: $profileid) {
      blockid
      blockedprofileid
      reason
      createdAt
      blockedProfile {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

export const GET_RESTRICTED_ACCOUNTS = gql`
  query GetRestrictedAccounts($profileid: String!) {
    getRestrictedAccounts(profileid: $profileid) {
      restrictid
      restrictedprofileid
      createdAt
      restrictedProfile {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

// Check if user is blocked or restricted
export const IS_USER_BLOCKED = gql`
  query IsUserBlocked($profileid: String!, $targetprofileid: String!) {
    isUserBlocked(profileid: $profileid, targetprofileid: $targetprofileid)
  }
`;

export const IS_USER_RESTRICTED = gql`
  query IsUserRestricted($profileid: String!, $targetprofileid: String!) {
    isUserRestricted(profileid: $profileid, targetprofileid: $targetprofileid)
  }
`;

// Block and Restrict User Mutations
export const BLOCK_USER = gql`
  mutation BlockUser(
    $profileid: String!
    $targetprofileid: String!
    $reason: String
  ) {
    BlockUser(
      profileid: $profileid
      targetprofileid: $targetprofileid
      reason: $reason
    ) {
      blockid
      profileid
      blockedprofileid
      reason
      createdAt
      blockedProfile {
        profileid
        username
        name
        profilePic
      }
    }
  }
`;

export const UNBLOCK_USER = gql`
  mutation UnblockUser($profileid: String!, $targetprofileid: String!) {
    UnblockUser(profileid: $profileid, targetprofileid: $targetprofileid) {
      blockid
      profileid
      blockedprofileid
    }
  }
`;

export const RESTRICT_USER = gql`
  mutation RestrictUser($profileid: String!, $targetprofileid: String!) {
    RestrictUser(profileid: $profileid, targetprofileid: $targetprofileid) {
      restrictid
      profileid
      restrictedprofileid
      createdAt
      restrictedProfile {
        profileid
        username
        name
        profilePic
      }
    }
  }
`;

export const UNRESTRICT_USER = gql`
  mutation UnrestrictUser($profileid: String!, $targetprofileid: String!) {
    UnrestrictUser(profileid: $profileid, targetprofileid: $targetprofileid) {
      restrictid
      profileid
      restrictedprofileid
    }
  }
`;

// Close Friends Queries
export const GET_CLOSE_FRIENDS = gql`
  query GetCloseFriends($profileid: String!) {
    getCloseFriends(profileid: $profileid) {
      closefriendid
      profileid
      status
      createdAt
      updatedAt
      closeFriend {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

export const IS_CLOSE_FRIEND = gql`
  query IsCloseFriend($profileid: String!, $targetprofileid: String!) {
    isCloseFriend(profileid: $profileid, targetprofileid: $targetprofileid)
  }
`;

// Close Friends Mutations
export const ADD_CLOSE_FRIEND = gql`
  mutation AddCloseFriend($profileid: String!, $targetprofileid: String!) {
    addToCloseFriends(
      profileid: $profileid
      targetProfileId: $targetprofileid
    ) {
      closefriendid
      profileid
      status
      createdAt
      closeFriend {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

export const REMOVE_CLOSE_FRIEND = gql`
  mutation RemoveCloseFriend($profileid: String!, $targetprofileid: String!) {
    removeFromCloseFriends(
      profileid: $profileid
      targetProfileId: $targetprofileid
    ) {
      closefriendid
      profileid
      status
    }
  }
`;

// Mentions Queries
export const GET_MENTIONS = gql`
  query GetMentions($profileid: String!) {
    getMentions(profileid: $profileid) {
      mentionid
      mentionedprofileid
      mentionerprofileid
      contexttype
      contextid
      isnotified
      isread
      createdAt
      updatedAt
      mentionedProfile {
        profileid
        username
        name
        profilePic
      }
      mentionerProfile {
        profileid
        username
        name
        profilePic
      }
    }
  }
`;

export const GET_MENTIONS_BY_CONTEXT = gql`
  query GetMentionsByContext($contexttype: String!, $contextid: String!) {
    getMentionsByContext(contexttype: $contexttype, contextid: $contextid) {
      mentionid
      mentionedprofileid
      mentionerprofileid
      contexttype
      contextid
      isnotified
      isread
      createdAt
      mentionedProfile {
        profileid
        username
        name
        profilePic
      }
      mentionerProfile {
        profileid
        username
        name
        profilePic
      }
    }
  }
`;

// Search Users for tagging/mentioning
export const SEARCH_USERS = gql`
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      profileid
      username
      name
      profilePic
      isVerified
    }
  }
`;

// Mentions Mutations
export const CREATE_MENTION = gql`
  mutation CreateMention(
    $mentionedprofileid: String!
    $mentionerprofileid: String!
    $contexttype: String!
    $contextid: String!
  ) {
    CreateMention(
      mentionedprofileid: $mentionedprofileid
      mentionerprofileid: $mentionerprofileid
      contexttype: $contexttype
      contextid: $contextid
    ) {
      mentionid
      mentionedprofileid
      mentionerprofileid
      contexttype
      contextid
      isnotified
      isread
      createdAt
      mentionedProfile {
        profileid
        username
        name
        profilePic
      }
    }
  }
`;

export const MARK_MENTION_AS_READ = gql`
  mutation MarkMentionAsRead($mentionid: String!) {
    MarkMentionAsRead(mentionid: $mentionid) {
      mentionid
      isread
    }
  }
`;

// User Settings Operations
export const GET_USER_SETTINGS = gql`
  query GetUserSettings($profileid: String!) {
    getUserSettings(profileid: $profileid) {
      profileid
      allowMentions
      mentionNotifications
      tagNotifications
      showTaggedPosts
      isPrivate
      allowMessages
      showActivity
      twoFactor
      notificationsEnabled
      darkMode
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_USER_SETTINGS = gql`
  mutation UpdateUserSettings(
    $profileid: String!
    $allowMentions: Boolean
    $mentionNotifications: Boolean
    $tagNotifications: Boolean
    $showTaggedPosts: Boolean
    $isPrivate: Boolean
    $allowMessages: String
    $showActivity: Boolean
    $twoFactor: Boolean
    $notificationsEnabled: Boolean
    $darkMode: Boolean
  ) {
    UpdateUserSettings(
      profileid: $profileid
      allowMentions: $allowMentions
      mentionNotifications: $mentionNotifications
      tagNotifications: $tagNotifications
      showTaggedPosts: $showTaggedPosts
      isPrivate: $isPrivate
      allowMessages: $allowMessages
      showActivity: $showActivity
      twoFactor: $twoFactor
      notificationsEnabled: $notificationsEnabled
      darkMode: $darkMode
    ) {
      profileid
      allowMentions
      mentionNotifications
      tagNotifications
      showTaggedPosts
      isPrivate
      allowMessages
      showActivity
      twoFactor
      notificationsEnabled
      darkMode
      updatedAt
    }
  }
`;
