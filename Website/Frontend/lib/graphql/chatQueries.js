import { gql } from '@apollo/client';

/**
 * Chat and Messaging Queries, Mutations, and Subscriptions
 * ⚠️ IMPORTANT: All mutation names must be in camelCase (e.g., createChat, not CreateChat)
 */

// ============ QUERIES ============

/**
 * Get all chats for a user
 */
export const GET_USER_CHATS = gql`
  query GetUserChats($profileid: String!) {
    getUserChats(profileid: $profileid) {
      chatid
      chatType
      name
      avatarUrl
      description
      lastMessage {
        messageid
        content
        createdAt
      }
      participants {
        profileid
        username
        name
        profilePic
      }
      unreadCount
      isPinned
      mutedBy
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get a single chat by ID
 */
export const GET_CHAT = gql`
  query GetChat($id: String!) {
    chat(id: $id) {
      chatid
      chatType
      name
      avatarUrl
      description
      participants {
        profileid
        username
        name
        profilePic
        isVerified
      }
      adminIds
      createdBy {
        profileid
        username
        name
        profilePic
      }
      lastMessage {
        messageid
        content
        createdAt
      }
      unreadCount
      isPinned
      mutedBy
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get chat by participants (for finding existing DM)
 */
export const GET_CHAT_BY_PARTICIPANTS = gql`
  query GetChatByParticipants($participants: [String!]!) {
    chatByParticipants(participants: $participants) {
      chatid
      chatType
      name
      participants {
        profileid
        username
        name
        profilePic
      }
      lastMessage {
        messageid
        content
        createdAt
      }
    }
  }
`;

/**
 * Get messages for a chat
 */
export const GET_MESSAGES = gql`
  query GetMessages($chatid: String!, $limit: Int, $cursor: String) {
    messages(chatid: $chatid, limit: $limit, cursor: $cursor) {
      messageid
      chatid
      content
      messageType
      attachments {
        url
        type
        size
        name
      }
      sender {
        profileid
        username
        name
        profilePic
        isVerified
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
        name
      }
      reactions {
        emoji
        profileid
      }
      readBy
      isEdited
      isDeleted
      deletedBy
      createdAt
      updatedAt
    }
  }
`;

/**
 * Search chats
 */
export const SEARCH_CHATS = gql`
  query SearchChats($profileid: String!, $query: String!) {
    searchChats(profileid: $profileid, query: $query) {
      chatid
      chatType
      name
      avatarUrl
      participants {
        profileid
        username
        name
        profilePic
      }
      lastMessage {
        content
        createdAt
      }
    }
  }
`;

// ============ MUTATIONS ============

/**
 * Create a new one-on-one chat
 * ⚠️ IMPORTANT: Backend uses ChatInput, not CreateChatInput
 */
export const CREATE_CHAT = gql`
  mutation CreateChat($input: ChatInput!) {
    createChat(input: $input) {
      chatid
      chatType
      participants {
        profileid
        username
        name
        profilePic
      }
      createdAt
    }
  }
`;

/**
 * Create a group chat
 */
export const CREATE_GROUP_CHAT = gql`
  mutation CreateGroupChat($input: CreateGroupChatInput!) {
    createGroupChat(input: $input) {
      chatid
      chatType
      name
      avatarUrl
      description
      participants {
        profileid
        username
        name
        profilePic
      }
      adminIds
      createdAt
    }
  }
`;

/**
 * Send a message
 */
export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      messageid
      chatid
      content
      messageType
      sender {
        profileid
        username
        name
        profilePic
      }
      createdAt
    }
  }
`;

/**
 * Send message with attachments
 */
export const SEND_MESSAGE_WITH_ATTACHMENTS = gql`
  mutation SendMessageWithAttachments($input: SendMessageWithAttachmentsInput!) {
    sendMessageWithAttachments(input: $input) {
      messageid
      chatid
      content
      messageType
      attachments {
        url
        type
        size
        name
      }
      sender {
        profileid
        username
        name
      }
      createdAt
    }
  }
`;

/**
 * Edit a message
 */
export const EDIT_MESSAGE = gql`
  mutation EditMessage($id: String!, $content: String!) {
    editMessage(id: $id, content: $content) {
      messageid
      content
      isEdited
      updatedAt
    }
  }
`;

/**
 * Delete a message
 */
export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($id: String!) {
    deleteMessage(id: $id) {
      messageid
      isDeleted
    }
  }
`;

/**
 * Delete message for everyone
 */
export const DELETE_MESSAGE_FOR_EVERYONE = gql`
  mutation DeleteMessageForEveryone($messageid: String!) {
    deleteMessageForEveryone(messageid: $messageid) {
      messageid
      isDeleted
      deletedBy
    }
  }
`;

/**
 * Delete message for me
 */
export const DELETE_MESSAGE_FOR_ME = gql`
  mutation DeleteMessageForMe($messageid: String!) {
    deleteMessageForMe(messageid: $messageid) {
      messageid
      success
    }
  }
`;

/**
 * React to a message
 */
export const REACT_TO_MESSAGE = gql`
  mutation ReactToMessage($messageid: String!, $emoji: String!) {
    reactToMessage(messageid: $messageid, emoji: $emoji) {
      messageid
      reactions {
        emoji
        profileid
      }
    }
  }
`;

/**
 * Remove reaction from message
 */
export const REMOVE_REACTION = gql`
  mutation RemoveReaction($messageid: String!, $emoji: String!) {
    removeReaction(messageid: $messageid, emoji: $emoji) {
      messageid
      reactions {
        emoji
        profileid
      }
    }
  }
`;

/**
 * Mark message as read
 */
export const MARK_MESSAGE_AS_READ = gql`
  mutation MarkMessageAsRead($messageid: String!) {
    markMessageAsRead(messageid: $messageid) {
      messageid
      readBy
    }
  }
`;

/**
 * Mark chat as read
 */
export const MARK_CHAT_AS_READ = gql`
  mutation MarkChatAsRead($chatid: String!) {
    markChatAsRead(chatid: $chatid) {
      chatid
      unreadCount
    }
  }
`;

/**
 * Add participant to chat
 */
export const ADD_PARTICIPANT_TO_CHAT = gql`
  mutation AddParticipantToChat($chatid: String!, $profileid: String!) {
    addParticipantToChat(chatid: $chatid, profileid: $profileid) {
      chatid
      participants {
        profileid
        username
        name
        profilePic
      }
    }
  }
`;

/**
 * Remove participant from chat
 */
export const REMOVE_PARTICIPANT_FROM_CHAT = gql`
  mutation RemoveParticipantFromChat($chatid: String!, $profileid: String!) {
    removeParticipantFromChat(chatid: $chatid, profileid: $profileid) {
      chatid
      participants {
        profileid
        username
        name
      }
    }
  }
`;

/**
 * Make user admin
 */
export const MAKE_ADMIN = gql`
  mutation MakeAdmin($chatid: String!, $profileid: String!) {
    makeAdmin(chatid: $chatid, profileid: $profileid) {
      chatid
      adminIds
    }
  }
`;

/**
 * Remove admin
 */
export const REMOVE_ADMIN = gql`
  mutation RemoveAdmin($chatid: String!, $profileid: String!) {
    removeAdmin(chatid: $chatid, profileid: $profileid) {
      chatid
      adminIds
    }
  }
`;

/**
 * Mute chat
 */
export const MUTE_CHAT = gql`
  mutation MuteChat($chatid: String!) {
    muteChat(chatid: $chatid) {
      chatid
      mutedBy
    }
  }
`;

/**
 * Unmute chat
 */
export const UNMUTE_CHAT = gql`
  mutation UnmuteChat($chatid: String!) {
    unmuteChat(chatid: $chatid) {
      chatid
      mutedBy
    }
  }
`;

/**
 * Update chat settings
 */
export const UPDATE_CHAT_SETTINGS = gql`
  mutation UpdateChatSettings($chatid: String!, $input: UpdateChatSettingsInput!) {
    updateChatSettings(chatid: $chatid, input: $input) {
      chatid
      name
      avatarUrl
      description
      updatedAt
    }
  }
`;

/**
 * Delete chat
 */
export const DELETE_CHAT = gql`
  mutation DeleteChat($id: String!) {
    deleteChat(id: $id) {
      chatid
      isDeleted
    }
  }
`;

/**
 * Delete chat with all messages
 */
export const DELETE_CHAT_WITH_MESSAGES = gql`
  mutation DeleteChatWithMessages($chatid: String!) {
    deleteChatWithMessages(chatid: $chatid) {
      chatid
      success
    }
  }
`;

// ============ SUBSCRIPTIONS ============

/**
 * Subscribe to typing indicator
 */
export const TYPING_INDICATOR_SUBSCRIPTION = gql`
  subscription OnTyping($chatid: String!) {
    typingIndicator(chatid: $chatid) {
      profileid
      username
      isTyping
    }
  }
`;

/**
 * Subscribe to user presence
 */
export const USER_PRESENCE_SUBSCRIPTION = gql`
  subscription OnUserPresence($profileid: String!) {
    userPresence(profileid: $profileid) {
      profileid
      isOnline
      lastSeen
    }
  }
`;

/**
 * Subscribe to chat typing
 */
export const CHAT_TYPING_SUBSCRIPTION = gql`
  subscription OnChatTyping($chatid: String!) {
    chatTyping(chatid: $chatid) {
      profileid
      username
      isTyping
    }
  }
`;

/**
 * Subscribe to new messages in a chat
 */
export const NEW_MESSAGE_SUBSCRIPTION = gql`
  subscription OnNewMessage($chatid: String!) {
    messageAdded(chatid: $chatid) {
      messageid
      chatid
      content
      messageType
      sender {
        profileid
        username
        name
        profilePic
      }
      createdAt
    }
  }
`;
