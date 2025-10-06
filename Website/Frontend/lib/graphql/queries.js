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
      isCloseFriendOnly
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
// Query matching exact TypeDef structure
export const GET_POST_COMMENTS = gql`
  query GetPostComments($postid: String!) {
    getCommentsByPost(postid: $postid) {
      commentid
      postid
      comment
      commenttoid
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
      userto {
        profileid
        username
      }
      mentions {
        mentionid
        mentionedprofileid
        mentionerprofileid
        contexttype
        contextid
        isnotified
        isread
        createdAt
      }
      replies {
        commentid
        postid
        comment
        commenttoid
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
        userto {
          profileid
          username
        }
      }
    }
  }
`;

// Mutation matching exact TypeDef structure with postid included
export const CREATE_COMMENT = gql`
  mutation CreateComment(
    $postid: String!, 
    $profileid: String!, 
    $comment: String!,
    $usertoid: String,
    $commenttoid: String
  ) {
    CreateComment(
      postid: $postid, 
      profileid: $profileid, 
      comment: $comment,
      usertoid: $usertoid,
      commenttoid: $commenttoid
    ) {
      commentid
      postid
      comment
      commenttoid
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
      userto {
        profileid
        username
      }
      replies {
        commentid
        postid
        comment
        commenttoid
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
        userto {
          profileid
          username
        }
      }
      mentions {
        mentionid
        mentionedprofileid
        mentionerprofileid
        contexttype
        contextid
        isnotified
        isread
        createdAt
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
export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $limit: Int) {
    searchUsers(query: $query, limit: $limit) {
      profileid
      username
      name
      profilePic
      isVerified
      isPrivate
      bio
      followersCount
      followingCount
      postsCount
    }
  }
`;

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
      likedpost {
        postid
        postUrl
        title
        Description
        postType
        likeCount
        commentCount
        createdAt
        profile {
          profileid
          username
          profilePic
          isVerified
        }
      }
      savedpost {
        postid
        postUrl
        title
        Description
        postType
        likeCount
        commentCount
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
export const DELETE_POST = gql`
  mutation DeletePost($postid: String!) {
    DeletePost(postid: $postid) {
      postid
      title
      postUrl
      postType
      profile {
        profileid
        username
      }
    }
  }
`;

export const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

// ============ FOLLOW REQUESTS ============
export const GET_FOLLOW_REQUESTS = gql`
  query GetFollowRequests($profileid: String!) {
    getFollowRequests(profileid: $profileid) {
      requestid
      requesterid
      requestedid
      status
      message
      createdAt
      updatedAt
      requester {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

export const GET_SENT_FOLLOW_REQUESTS = gql`
  query GetSentFollowRequests($profileid: String!) {
    getSentFollowRequests(profileid: $profileid) {
      requestid
      requesterid
      requestedid
      status
      message
      createdAt
      updatedAt
      requested {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

export const GET_FOLLOW_REQUEST_STATUS = gql`
  query GetFollowRequestStatus($requesterid: String!, $requestedid: String!) {
    getFollowRequestStatus(requesterid: $requesterid, requestedid: $requestedid)
  }
`;

export const SEND_FOLLOW_REQUEST = gql`
  mutation SendFollowRequest($requesterid: String!, $requestedid: String!, $message: String) {
    SendFollowRequest(requesterid: $requesterid, requestedid: $requestedid, message: $message) {
      requestid
      requesterid
      requestedid
      status
      message
      createdAt
    }
  }
`;

export const ACCEPT_FOLLOW_REQUEST = gql`
  mutation AcceptFollowRequest($requestid: String!) {
    AcceptFollowRequest(requestid: $requestid) {
      requestid
      status
      updatedAt
    }
  }
`;

export const REJECT_FOLLOW_REQUEST = gql`
  mutation RejectFollowRequest($requestid: String!) {
    RejectFollowRequest(requestid: $requestid) {
      requestid
      status
      updatedAt
    }
  }
`;

export const CANCEL_FOLLOW_REQUEST = gql`
  mutation CancelFollowRequest($requesterid: String!, $requestedid: String!) {
    CancelFollowRequest(requesterid: $requesterid, requestedid: $requestedid) {
      requestid
      status
    }
  }
`;

// ============ NOTIFICATIONS ============
export const GET_NOTIFICATIONS = gql`
  query GetNotifications($profileid: String!, $limit: Int, $offset: Int) {
    getNotifications(profileid: $profileid, limit: $limit, offset: $offset) {
      notificationid
      recipientid
      senderid
      type
      title
      message
      contextType
      contextId
      actionUrl
      metadata
      isRead
      isActioned
      priority
      expiresAt
      createdAt
      updatedAt
      sender {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount($profileid: String!) {
    getUnreadNotificationCount(profileid: $profileid)
  }
`;

export const GET_NOTIFICATIONS_BY_TYPE = gql`
  query GetNotificationsByType($profileid: String!, $type: String!) {
    getNotificationsByType(profileid: $profileid, type: $type) {
      notificationid
      recipientid
      senderid
      type
      title
      message
      contextType
      contextId
      actionUrl
      metadata
      isRead
      isActioned
      priority
      expiresAt
      createdAt
      updatedAt
      sender {
        profileid
        username
        name
        profilePic
        isVerified
      }
    }
  }
`;

export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification(
    $recipientid: String!
    $senderid: String!
    $type: String!
    $title: String!
    $message: String!
    $contextType: String
    $contextId: String
    $actionUrl: String
    $metadata: String
    $priority: String
  ) {
    CreateNotification(
      recipientid: $recipientid
      senderid: $senderid
      type: $type
      title: $title
      message: $message
      contextType: $contextType
      contextId: $contextId
      actionUrl: $actionUrl
      metadata: $metadata
      priority: $priority
    ) {
      notificationid
      type
      title
      message
      createdAt
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationid: String!) {
    MarkNotificationAsRead(notificationid: $notificationid) {
      notificationid
      isRead
      updatedAt
    }
  }
`;

export const MARK_NOTIFICATION_AS_ACTIONED = gql`
  mutation MarkNotificationAsActioned($notificationid: String!) {
    MarkNotificationAsActioned(notificationid: $notificationid) {
      notificationid
      isActioned
      updatedAt
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead($profileid: String!) {
    MarkAllNotificationsAsRead(profileid: $profileid) {
      notificationid
      isRead
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($notificationid: String!) {
    DeleteNotification(notificationid: $notificationid) {
      notificationid
    }
  }
`;
