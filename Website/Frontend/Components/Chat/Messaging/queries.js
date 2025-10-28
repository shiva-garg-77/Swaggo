import { gql } from '@apollo/client';

// Chat Queries
export const GET_CHATS = gql`
  query GetChats($profileid: String!) {
    getUserChats(profileid: $profileid) {
      chatid
      chatType
      chatName
      chatAvatar
      lastMessageAt
      participants {
        profileid
        username
        profilePic
        name
      }
      lastMessage {
        messageid
        content
        messageType
        createdAt
        sender {
          profileid
          username
          profilePic
        }
      }
      mutedBy {
        profileid
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_CHAT_BY_ID = gql`
  query GetChatById($id: ID!) {
    chat(id: $id) {
      chatid
      chatType
      chatName
      chatAvatar
      participants {
        profileid
        username
        profilePic
        name
      }
      adminIds {
        profileid
        username
      }
      createdBy {
        profileid
        username
      }
      lastMessageAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_CHAT_BY_PARTICIPANTS = gql`
  query GetChatByParticipants($participants: [String!]!) {
    chatByParticipants(participants: $participants) {
      chatid
      chatType
      chatName
      participants {
        profileid
        username
        profilePic
      }
    }
  }
`;

export const GET_MESSAGES_BY_CHAT = gql`
  query GetMessagesByChat($chatid: String!, $limit: Int, $cursor: String) {
    getMessagesByChatWithPagination(chatid: $chatid, limit: $limit, cursor: $cursor) {
      messages {
        messageid
        messageType
        content
        attachments {
          type
          url
          filename
          size
          mimetype
        }
        sender {
          profileid
          username
          profilePic
          name
        }
        replyTo {
          messageid
          content
          sender {
            username
          }
        }
        mentions {
          profileid
          username
        }
        reactions {
          profileid
          profile {
            username
            profilePic
          }
          emoji
          createdAt
        }
        readBy {
          profileid
          profile {
            username
          }
          readAt
        }
        isEdited
        isDeleted
        messageStatus
        createdAt
        updatedAt
        # Add media data fields for proper display of media messages
        stickerData {
          id
          name
          preview
          url
          category
        }
        gifData {
          id
          title
          url
          thumbnail
          category
          dimensions {
            width
            height
          }
        }
        voiceData {
          duration
          size
          mimeType
          fileId
          url
        }
        fileData {
          fileId
          name
          size
          mimeType
          url
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const SEARCH_MESSAGES = gql`
  query SearchMessages($chatid: String!, $query: String!) {
    searchMessages(chatid: $chatid, query: $query) {
      messageid
      content
      sender {
        username
        profilePic
      }
      createdAt
    }
  }
`;

export const GET_UNREAD_MESSAGE_COUNT = gql`
  query GetUnreadMessageCount($profileid: String!) {
    getUnreadMessageCount(profileid: $profileid)
  }
`;

export const GET_CHAT_UNREAD_COUNT = gql`
  query GetChatUnreadCount($chatid: String!, $profileid: String!) {
    getChatUnreadCount(chatid: $chatid, profileid: $profileid)
  }
`;

// Call History Queries
export const GET_CALL_HISTORY = gql`
  query GetCallHistory($profileid: String!) {
    getCallHistory(profileid: $profileid) {
      callId
      chatid
      callerId
      caller {
        profileid
        username
        profilePic
        name
      }
      receiverId
      receiver {
        profileid
        username
        profilePic
        name
      }
      participants {
        profileid
        username
        profilePic
        name
      }
      callType
      status
      duration
      startedAt
      answeredAt
      endedAt
      endedBy
      endReason
      quality {
        overall
        audio
        video
        connection
      }
      techDetails {
        iceConnectionState
        connectionState
        signalingState
        bandwidth {
          upload
          download
        }
        codec {
          audio
          video
        }
        resolution {
          width
          height
        }
        frameRate
        jitter
        packetLoss
        latency
      }
      isRecorded
      recordingUrl
      hadScreenShare
      notificationStatus {
        sent
        delivered
        read
        sentAt
        deliveredAt
        readAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_CALL_HISTORY_BY_CHAT = gql`
  query GetCallHistoryByChat($chatid: String!) {
    getCallHistoryByChat(chatid: $chatid) {
      callId
      chatid
      callerId
      caller {
        profileid
        username
        profilePic
        name
      }
      receiverId
      receiver {
        profileid
        username
        profilePic
        name
      }
      participants {
        profileid
        username
        profilePic
        name
      }
      callType
      status
      duration
      startedAt
      answeredAt
      endedAt
      endedBy
      endReason
      quality {
        overall
        audio
        video
        connection
      }
      techDetails {
        iceConnectionState
        connectionState
        signalingState
        bandwidth {
          upload
          download
        }
        codec {
          audio
          video
        }
        resolution {
          width
          height
        }
        frameRate
        jitter
        packetLoss
        latency
      }
      isRecorded
      recordingUrl
      hadScreenShare
      notificationStatus {
        sent
        delivered
        read
        sentAt
        deliveredAt
        readAt
      }
      createdAt
      updatedAt
    }
  }
`;

// User Search Query
export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $limit: Int) {
    searchUsers(query: $query, limit: $limit) {
      profileid
      username
      name
      profilePic
      isVerified
      followersCount
      followingCount
    }
  }
`;

// Chat Mutations
// ⚠️ FIXED: Backend uses ChatInput, not CreateChatInput
export const CREATE_CHAT = gql`
  mutation CreateChat($input: ChatInput!) {
    createChat(input: $input) {
      chatid
      chatType
      chatName
      chatAvatar
      participants {
        profileid
        username
        profilePic
        name
      }
      createdBy {
        profileid
        username
      }
      createdAt
      lastMessageAt
    }
  }
`;

export const UPDATE_CHAT = gql`
  mutation UpdateChat($chatid: String!, $chatName: String, $chatAvatar: String) {
    UpdateChat(chatid: $chatid, chatName: $chatName, chatAvatar: $chatAvatar) {
      chatid
      chatName
      chatAvatar
      updatedAt
    }
  }
`;

export const DELETE_CHAT = gql`
  mutation DeleteChat($chatid: String!) {
    DeleteChat(chatid: $chatid) {
      chatid
      isActive
    }
  }
`;

// Message Mutations
export const SEND_MESSAGE = gql`
  mutation SendMessage($input: MessageInput!) {
    sendMessage(input: $input) {
      messageid
      messageType
      content
      attachments {
        type
        url
        filename
        size
        mimetype
      }
      sender {
        profileid
        username
        profilePic
        name
      }
      replyTo {
        messageid
        content
        sender {
          username
        }
      }
      mentions {
        profileid
        username
      }
      reactions {
        profileid
        emoji
        createdAt
      }
      readBy {
        profileid
        readAt
      }
      messageStatus
      createdAt
    }
  }
`;

export const EDIT_MESSAGE = gql`
  mutation EditMessage($messageid: String!, $content: String!) {
    EditMessage(messageid: $messageid, content: $content) {
      messageid
      content
      isEdited
      editHistory {
        content
        editedAt
      }
      updatedAt
    }
  }
`;

export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($messageid: String!) {
    DeleteMessage(messageid: $messageid) {
      messageid
      isDeleted
      deletedAt
    }
  }
`;

export const REACT_TO_MESSAGE = gql`
  mutation ReactToMessage($messageid: String!, $emoji: String!) {
    ReactToMessage(messageid: $messageid, emoji: $emoji) {
      messageid
      reactions {
        profileid
        profile {
          username
          profilePic
        }
        emoji
        createdAt
      }
    }
  }
`;

export const REMOVE_REACTION = gql`
  mutation RemoveReaction($messageid: String!, $emoji: String!) {
    RemoveReaction(messageid: $messageid, emoji: $emoji) {
      messageid
      reactions {
        profileid
        emoji
        createdAt
      }
    }
  }
`;

export const MARK_MESSAGE_AS_READ = gql`
  mutation MarkMessageAsRead($messageid: String!) {
    MarkMessageAsRead(messageid: $messageid) {
      messageid
      readBy {
        profileid
        profile {
          username
        }
        readAt
      }
    }
  }
`;

export const MARK_CHAT_AS_READ = gql`
  mutation MarkChatAsRead($chatid: String!) {
    MarkChatAsRead(chatid: $chatid) {
      messageid
      readBy {
        profileid
        readAt
      }
    }
  }
`;

// Story Queries
export const GET_STORIES = gql`
  query GetStories($profileid: String) {
    getStories(profileid: $profileid) {
      storyid
      profileid
      profile {
        profileid
        username
        name
        profilePic
        isVerified
      }
      mediaUrl
      mediaType
      caption
      viewers {
        profileid
        profile {
          username
          profilePic
        }
        viewedAt
      }
      viewersCount
      isViewedByUser
      isActive
      expiresAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACTIVE_STORIES = gql`
  query GetActiveStories {
    getActiveStories {
      storyid
      profileid
      profile {
        profileid
        username
        name
        profilePic
        isVerified
      }
      mediaUrl
      mediaType
      caption
      viewersCount
      isViewedByUser
      createdAt
    }
  }
`;

export const GET_STORY_BY_ID = gql`
  query GetStoryById($storyid: String!) {
    getStoryById(storyid: $storyid) {
      storyid
      profileid
      profile {
        profileid
        username
        name
        profilePic
        isVerified
      }
      mediaUrl
      mediaType
      caption
      viewers {
        profileid
        profile {
          username
          profilePic
        }
        viewedAt
      }
      viewersCount
      isViewedByUser
      createdAt
    }
  }
`;

export const GET_STORY_VIEWERS = gql`
  query GetStoryViewers($storyid: String!) {
    getStoryViewers(storyid: $storyid) {
      profileid
      profile {
        profileid
        username
        name
        profilePic
      }
      viewedAt
    }
  }
`;

// Story Mutations
export const CREATE_STORY = gql`
  mutation CreateStory($profileid: String!, $mediaUrl: String!, $mediaType: String!, $caption: String) {
    CreateStory(profileid: $profileid, mediaUrl: $mediaUrl, mediaType: $mediaType, caption: $caption) {
      storyid
      profileid
      mediaUrl
      mediaType
      caption
      isActive
      expiresAt
      createdAt
    }
  }
`;

export const DELETE_STORY = gql`
  mutation DeleteStory($storyid: String!) {
    DeleteStory(storyid: $storyid) {
      storyid
      isActive
    }
  }
`;

export const VIEW_STORY = gql`
  mutation ViewStory($storyid: String!) {
    ViewStory(storyid: $storyid) {
      storyid
      viewers {
        profileid
        viewedAt
      }
      viewersCount
      isViewedByUser
    }
  }
`;