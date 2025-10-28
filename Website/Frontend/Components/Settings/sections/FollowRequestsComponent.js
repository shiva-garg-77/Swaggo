'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react';
import { ArrowLeft, UserPlus, UserCheck, UserX, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useFixedSecureAuth } from '../../../context/FixedSecureAuthContext';
import {
  GET_FOLLOW_REQUESTS,
  GET_SENT_FOLLOW_REQUESTS,
  ACCEPT_FOLLOW_REQUEST,
  REJECT_FOLLOW_REQUEST,
  CANCEL_FOLLOW_REQUEST
} from '../../../lib/graphql/followRequestQueries';

export default function FollowRequests({ onBack, isModal = false }) {
  const { user } = useFixedSecureAuth();
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [processingRequest, setProcessingRequest] = useState(null);

  // Fetch received requests
  const { data: receivedData, loading: receivedLoading, refetch: refetchReceived } = useQuery(GET_FOLLOW_REQUESTS, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    errorPolicy: 'all',
    fetchPolicy: 'network-only'
  });

  // Fetch sent requests
  const { data: sentData, loading: sentLoading, refetch: refetchSent } = useQuery(GET_SENT_FOLLOW_REQUESTS, {
    variables: { profileid: user?.profileid },
    skip: !user?.profileid,
    errorPolicy: 'all',
    fetchPolicy: 'network-only'
  });

  // Mutations
  const [acceptRequest] = useMutation(ACCEPT_FOLLOW_REQUEST);
  const [rejectRequest] = useMutation(REJECT_FOLLOW_REQUEST);
  const [cancelRequest] = useMutation(CANCEL_FOLLOW_REQUEST);

  const receivedRequests = receivedData?.getFollowRequests || [];
  const sentRequests = sentData?.getSentFollowRequests || [];

  const handleAccept = async (requestid) => {
    setProcessingRequest(requestid);
    try {
      await acceptRequest({
        variables: { requestid }
      });
      refetchReceived();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestid) => {
    setProcessingRequest(requestid);
    try {
      await rejectRequest({
        variables: { requestid }
      });
      refetchReceived();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleCancel = async (requesterid, requestedid) => {
    setProcessingRequest(`${requesterid}-${requestedid}`);
    try {
      await cancelRequest({
        variables: { requesterid, requestedid }
      });
      refetchSent();
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Failed to cancel request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className={isModal ? "p-6 bg-gray-50/50 dark:bg-gray-900/50 h-full overflow-y-auto" : "min-h-screen bg-gray-50 dark:bg-gray-900"}>
      {!isModal && (
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 mr-3">
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex items-center">
                  <UserPlus className="w-6 h-6 text-blue-500 mr-2" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Follow Requests</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={isModal ? "max-w-4xl mx-auto space-y-6" : "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-t-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Received ({receivedRequests.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Sent ({sentRequests.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-b-xl p-6 shadow-sm border-x border-b border-gray-200 dark:border-gray-700">
          {activeTab === 'received' ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Follow Requests
              </h2>

              {receivedLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : receivedRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No follow requests</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    When someone requests to follow you, they'll appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedRequests.map((request) => (
                    <div
                      key={request.requestid}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {request.requesterid.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              User {request.requesterid.substring(0, 8)}
                            </p>
                            {request.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                "{request.message}"
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {formatTimeAgo(request.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAccept(request.requestid)}
                            disabled={processingRequest === request.requestid}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {processingRequest === request.requestid ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(request.requestid)}
                            disabled={processingRequest === request.requestid}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Pending Requests
              </h2>

              {sentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : sentRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Your follow requests to private accounts will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((request) => (
                    <div
                      key={request.requestid}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                            {request.requestedid.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              User {request.requestedid.substring(0, 8)}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Sent {formatTimeAgo(request.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancel(request.requesterid, request.requestedid)}
                          disabled={processingRequest === `${request.requesterid}-${request.requestedid}`}
                          className="px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {processingRequest === `${request.requesterid}-${request.requestedid}` ? 'Canceling...' : 'Cancel Request'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
