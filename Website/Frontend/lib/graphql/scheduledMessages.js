import { gql } from '@apollo/client';

/**
 * Scheduled Messages Queries and Mutations
 */

export const GET_SCHEDULED_MESSAGES_BY_CHAT = gql`
  query GetScheduledMessagesByChat($chatid: String!) {
    getScheduledMessagesByChat(chatid: $chatid) {
      scheduledMessageId
      chatid
      senderid
      content
      scheduledFor
      status
      createdAt
      failureReason
    }
  }
`;

export const GET_SCHEDULED_MESSAGE = gql`
  query GetScheduledMessage($scheduledMessageId: String!) {
    getScheduledMessage(scheduledMessageId: $scheduledMessageId) {
      scheduledMessageId
      chatid
      senderid
      content
      scheduledFor
      status
      createdAt
      failureReason
    }
  }
`;

export const CREATE_SCHEDULED_MESSAGE = gql`
  mutation CreateScheduledMessage($input: ScheduledMessageInput!) {
    createScheduledMessage(input: $input) {
      scheduledMessageId
      chatid
      content
      scheduledFor
      status
      createdAt
    }
  }
`;

export const UPDATE_SCHEDULED_MESSAGE = gql`
  mutation UpdateScheduledMessage($scheduledMessageId: String!, $input: ScheduledMessageInput!) {
    updateScheduledMessage(scheduledMessageId: $scheduledMessageId, input: $input) {
      scheduledMessageId
      content
      scheduledFor
      status
    }
  }
`;

export const DELETE_SCHEDULED_MESSAGE = gql`
  mutation DeleteScheduledMessage($scheduledMessageId: String!) {
    deleteScheduledMessage(scheduledMessageId: $scheduledMessageId) {
      scheduledMessageId
      status
    }
  }
`;

export const SEND_SCHEDULED_MESSAGE_NOW = gql`
  mutation SendScheduledMessageNow($scheduledMessageId: String!) {
    sendScheduledMessageNow(scheduledMessageId: $scheduledMessageId) {
      scheduledMessageId
      status
      sentAt
    }
  }
`;
