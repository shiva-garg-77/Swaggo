import { gql } from '@apollo/client';

/**
 * Scheduled Message Queries and Mutations
 * For scheduling messages to be sent later
 */

// ============ QUERIES ============

/**
 * Get scheduled messages for a chat
 */
export const GET_SCHEDULED_MESSAGES_BY_CHAT = gql`
  query GetScheduledMessagesByChat($chatid: String!) {
    getScheduledMessagesByChat(chatid: $chatid) {
      scheduledmessageid
      chatid
      senderid
      content
      messageType
      scheduledTime
      status
      attachments {
        url
        type
        size
        name
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get a single scheduled message
 */
export const GET_SCHEDULED_MESSAGE = gql`
  query GetScheduledMessage($scheduledmessageid: String!) {
    getScheduledMessage(scheduledmessageid: $scheduledmessageid) {
      scheduledmessageid
      chatid
      senderid
      content
      messageType
      scheduledTime
      status
      attachments {
        url
        type
        size
        name
      }
      createdAt
      updatedAt
    }
  }
`;

// ============ MUTATIONS ============

/**
 * Create a scheduled message
 */
export const CREATE_SCHEDULED_MESSAGE = gql`
  mutation CreateScheduledMessage($input: CreateScheduledMessageInput!) {
    createScheduledMessage(input: $input) {
      scheduledmessageid
      chatid
      senderid
      content
      messageType
      scheduledTime
      status
      createdAt
    }
  }
`;

/**
 * Create scheduled message with media attachments
 */
export const CREATE_SCHEDULED_MESSAGE_WITH_MEDIA = gql`
  mutation CreateScheduledMessageWithMedia($input: CreateScheduledMessageWithMediaInput!) {
    createScheduledMessageWithMedia(input: $input) {
      scheduledmessageid
      chatid
      senderid
      content
      messageType
      scheduledTime
      status
      attachments {
        url
        type
        size
        name
      }
      createdAt
    }
  }
`;

/**
 * Update a scheduled message
 */
export const UPDATE_SCHEDULED_MESSAGE = gql`
  mutation UpdateScheduledMessage($scheduledMessageId: String!, $input: UpdateScheduledMessageInput!) {
    updateScheduledMessage(scheduledMessageId: $scheduledMessageId, input: $input) {
      scheduledmessageid
      content
      messageType
      scheduledTime
      status
      updatedAt
    }
  }
`;

/**
 * Delete a scheduled message
 */
export const DELETE_SCHEDULED_MESSAGE = gql`
  mutation DeleteScheduledMessage($scheduledmessageid: String!) {
    deleteScheduledMessage(scheduledmessageid: $scheduledmessageid) {
      scheduledmessageid
      status
    }
  }
`;

/**
 * Cancel a scheduled message with notification
 */
export const CANCEL_SCHEDULED_MESSAGE_WITH_NOTIFICATION = gql`
  mutation CancelScheduledMessageWithNotification($scheduledMessageId: String!) {
    cancelScheduledMessageWithNotification(scheduledMessageId: $scheduledMessageId) {
      scheduledmessageid
      status
      cancelledAt
    }
  }
`;

/**
 * Send scheduled message immediately
 */
export const SEND_SCHEDULED_MESSAGE_NOW = gql`
  mutation SendScheduledMessageNow($scheduledmessageid: String!) {
    sendScheduledMessageNow(scheduledmessageid: $scheduledmessageid) {
      scheduledmessageid
      status
      sentAt
      message {
        messageid
        content
        createdAt
      }
    }
  }
`;
