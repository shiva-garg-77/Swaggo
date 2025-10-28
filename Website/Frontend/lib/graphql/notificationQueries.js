import { gql } from '@apollo/client';

/**
 * Notification Queries and Mutations
 * For managing user notifications
 */

// ============ QUERIES ============

/**
 * Get all notifications for a user
 */
export const GET_NOTIFICATIONS = gql`
  query GetNotifications($profileid: String!, $limit: Int, $offset: Int) {
    getNotifications(profileid: $profileid, limit: $limit, offset: $offset) {
      notificationid
      recipientid
      senderid
      type
      content
      relatedid
      relatedtype
      isread
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get unread notification count
 */
export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount($profileid: String!) {
    getUnreadNotificationCount(profileid: $profileid)
  }
`;

// ============ MUTATIONS ============

/**
 * Mark a notification as read
 */
export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationid: String!) {
    MarkNotificationAsRead(notificationid: $notificationid) {
      notificationid
      isread
      updatedAt
    }
  }
`;

/**
 * Mark all notifications as read
 */
export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead($profileid: String!) {
    MarkAllNotificationsAsRead(profileid: $profileid)
  }
`;

/**
 * Delete a notification
 */
export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($notificationid: String!) {
    DeleteNotification(notificationid: $notificationid) {
      notificationid
    }
  }
`;
