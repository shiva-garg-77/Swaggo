'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import { useFollowRequestStore } from '../../../store/followRequestStore';
import {
  GET_FOLLOW_REQUESTS,
  GET_SENT_FOLLOW_REQUESTS,
  ACCEPT_FOLLOW_REQUEST,
  REJECT_FOLLOW_REQUEST,
  CANCEL_FOLLOW_REQUEST
} from '../../../lib/graphql/followRequestQueries';
import { UserCheck, UserX, Clock, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Follow Requests Manager Component
 * Full page component for managing follow requests
 */
export default function FollowRequestsManager() {
  const { user } = useFixedSecureAuth();
  const [activeTab, setActiveTab] = useState('received'); // received, sent
  const {
    receivedRequests,
    sentRequests,
    setReceivedRequests,
    setSentRequests,
    removeReceivedRequest,
    removeSentRequest,
    updateRequestStatus,
    setLoading,
    markFetched
  } = useFollowRequestStore();

  // Fetch received requests
  const { 
    data: receivedData, 
    loading: receivedLoading, 
    refetch: refetchReceived 
  } = useQuery(GET_FOLLOW_REQUESTS, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    onCompleted: (data) => {
      setReceivedRequests(data?.getFollowRequests || []);
      markFetched();
    },
    errorPolicy: 'all'
  });

  // Fetch sent requests
  const { 
    data: sentData, 
    loading: sentLoading, 
    refetch: refetchSent 
  } = useQuery(GET_SENT_FOLLOW_REQUESTS, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    onCompleted: (data) => {
      setSentRequests(data?.getSentFollowRequests || []);
    },
    errorPolicy: 'all'
  });

  // Mutations
  const [acceptRequest] = useMutation(ACCEPT_FOLLOW_REQUEST);
  const [rejectRequest] = useMutation(REJECT_FOLLOW_REQUEST);
  const [cancelRequest] = useMutation(CANCEL_FOLLOW_REQUEST);

  // Handle accept
  const handleAccept = async (requestId, username) => {
    try {
      await acceptRequest({ variables: { requestid: requestId } });
      removeReceivedRequest(requestId);
      toast.success(`Accepted follow request from ${username}`);
      refetchReceived();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  // Handle reject
  const handleReject = async (requestId, username) => {
    if (!confirm(`Reject follow request from ${username}?`)) return;

    try {
      await rejectRequest({ variables: { requestid: requestId } });
      removeReceivedRequest(requestId);
      toast.success(`Rejected follow request from ${username}`);
      refetchReceived();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  // Handle cancel
  const handleCancel = async (requesterid, requestedid, username) => {
    if (!confirm(`Cancel follow request to ${username}?`)) return;

    try {
      await cancelRequest({ 
        variables: { 
          requesterid, 
          requestedid 
        } 
      });
      removeSentRequest(requesterid + requestedid);
      toast.success(`Cancelled follow request to ${username}`);
      refetchSent();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (activeTab === 'received') {
        await refetchReceived();
      } else {
        await refetchSent();
      }
      toast.success('Refreshed');
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = receivedLoading || sentLoading;
  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Follow Requests
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your follow requests for private profiles
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'received'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Received
              {receivedRequests.length > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs">
                  {receivedRequests.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'sent'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Sent
              {sentRequests.length > 0 && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                  {sentRequests.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Refresh Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 
                     hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading && currentRequests.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : currentRequests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No {activeTab} requests
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'received'
                  ? "You don't have any pending follow requests"
                  : "You haven't sent any follow requests"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentRequests.map((request) => (
                <RequestCard
                  key={request.requestid}
                  request={request}
                  type={activeTab}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Request Card Component
 */
function RequestCard({ request, type, onAccept, onReject, onCancel }) {
  const profile = type === 'received' 
    ? request.fromProfile || {} 
    : request.toProfile || {};

  const timeAgo = getTimeAgo(request.createdAt);

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      {/* Profile Info */}
      <div className="flex items-center gap-3 flex-1">
        <img
          src={profile.profilePic || '/default-avatar.png'}
          alt={profile.username}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {profile.name || profile.username}
            </h3>
            {profile.isVerified && (
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{profile.username}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {timeAgo}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {type === 'received' ? (
          <>
            <button
              onClick={() => onAccept(request.requestid, profile.username)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={() => onReject(request.requestid, profile.username)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 
                       text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <UserX className="w-4 h-4" />
              Reject
            </button>
          </>
        ) : (
          <button
            onClick={() => onCancel(request.requesterid, request.requestedid, profile.username)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 
                     text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// Helper function
function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}
