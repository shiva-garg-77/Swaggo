import { gql } from '@apollo/client';

/**
 * Follow Request Queries and Mutations
 * For managing follow requests for private profiles
 */

// ============ QUERIES ============

/**
 * Get follow requests received (pending requests to follow you)
 */
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
    }
  }
`;

/**
 * Get follow requests sent (your pending requests to follow others)
 */
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
    }
  }
`;

/**
 * Check the status of a follow request between two users
 */
export const GET_FOLLOW_REQUEST_STATUS = gql`
  query GetFollowRequestStatus($requesterid: String!, $requestedid: String!) {
    getFollowRequestStatus(requesterid: $requesterid, requestedid: $requestedid)
  }
`;

// ============ MUTATIONS ============

/**
 * Send a follow request to a private profile
 */
export const SEND_FOLLOW_REQUEST = gql`
  mutation SendFollowRequest($requesterid: String!, $requestedid: String!, $message: String) {
    SendFollowRequest(requesterid: $requesterid, requestedid: $requestedid, message: $message) {
      requestid
      requesterid
      requestedid
      status
      message
      createdAt
      updatedAt
    }
  }
`;

/**
 * Accept a follow request
 */
export const ACCEPT_FOLLOW_REQUEST = gql`
  mutation AcceptFollowRequest($requestid: String!) {
    AcceptFollowRequest(requestid: $requestid) {
      requestid
      requesterid
      requestedid
      status
      updatedAt
    }
  }
`;

/**
 * Reject a follow request
 */
export const REJECT_FOLLOW_REQUEST = gql`
  mutation RejectFollowRequest($requestid: String!) {
    RejectFollowRequest(requestid: $requestid) {
      requestid
      requesterid
      requestedid
      status
      updatedAt
    }
  }
`;

/**
 * Cancel a sent follow request
 */
export const CANCEL_FOLLOW_REQUEST = gql`
  mutation CancelFollowRequest($requesterid: String!, $requestedid: String!) {
    CancelFollowRequest(requesterid: $requesterid, requestedid: $requestedid) {
      requestid
      requesterid
      requestedid
      status
      updatedAt
    }
  }
`;
