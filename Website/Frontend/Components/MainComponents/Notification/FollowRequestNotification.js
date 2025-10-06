'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { 
  ACCEPT_FOLLOW_REQUEST, 
  REJECT_FOLLOW_REQUEST,
  MARK_NOTIFICATION_AS_READ 
} from '../../../lib/graphql/queries';
import notificationService from '../../../services/UnifiedNotificationService.js';

export default function FollowRequestNotification({ 
  notification, 
  onUpdate, 
  onAccept, 
  onReject, 
  theme = 'light' 
}) {
  const [loading, setLoading] = useState(false);
  const [responded, setResponded] = useState(false);

  const [acceptRequestMutation] = useMutation(ACCEPT_FOLLOW_REQUEST, {
    onCompleted: () => {
      setResponded(true);
      notificationService.showToast('success', `Accepted follow request from ${notification.sender.username}`);
      onAccept?.(notification);
    },
    onError: (error) => {
      console.error('Error accepting follow request:', error);
      notificationService.showToast('error', 'Failed to accept follow request');
    }
  });

  const [rejectRequestMutation] = useMutation(REJECT_FOLLOW_REQUEST, {
    onCompleted: () => {
      setResponded(true);
      notificationService.showToast('', `Rejected follow request from ${notification.sender.username}`);
      onReject?.(notification);
    },
    onError: (error) => {
      console.error('Error rejecting follow request:', error);
      notificationService.showToast('error', 'Failed to reject follow request');
    }
  });

  const [markAsReadMutation] = useMutation(MARK_NOTIFICATION_AS_READ);

  const handleAccept = async () => {
    if (loading || responded) return;
    
    setLoading(true);
    try {
      // Extract request ID from metadata
      const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
      const requestId = metadata.requestId;
      
      if (!requestId) {
        throw new Error('Request ID not found in notification metadata');
      }

      await acceptRequestMutation({
        variables: { requestid: requestId }
      });

      // Mark notification as read
      await markAsReadMutation({
        variables: { notificationid: notification.notificationid }
      });

    } catch (error) {
      console.error('Error handling accept:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (loading || responded) return;
    
    setLoading(true);
    try {
      // Extract request ID from metadata
      const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
      const requestId = metadata.requestId;
      
      if (!requestId) {
        throw new Error('Request ID not found in notification metadata');
      }

      await rejectRequestMutation({
        variables: { requestid: requestId }
      });

      // Mark notification as read
      await markAsReadMutation({
        variables: { notificationid: notification.notificationid }
      });

    } catch (error) {
      console.error('Error handling reject:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = () => {
    // Mark as read when user clicks to view profile
    markAsReadMutation({
      variables: { notificationid: notification.notificationid }
    }).catch(console.error);
    
    // Navigate to profile
    window.location.href = `/profile?user=${notification.sender.username}`;
  };

  const isDark = theme === 'dark';
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} 
                    ${!notification.isRead ? (isDark ? 'bg-gray-750' : 'bg-blue-50') : ''} 
                    hover:${isDark ? 'bg-gray-750' : 'bg-gray-50'} transition-colors duration-200`}>
      
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <img
            src={notification.sender.profilePic || '/default-avatar.png'}
            alt={notification.sender.username}
            className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
            onClick={handleProfileClick}
          />
          {notification.sender.isVerified && (
            <div className="absolute -mt-3 -mr-1 ml-8">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Time */}
          <div className="flex items-center justify-between">
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {notification.title}
            </h3>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
          </div>

          {/* Message */}
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
            <span 
              className="font-semibold cursor-pointer hover:text-blue-500 transition-colors"
              onClick={handleProfileClick}
            >
              {notification.sender.username}
            </span>
            {' '}wants to follow you
          </p>

          {/* Time */}
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {timeAgo}
          </p>

          {/* Action Buttons */}
          {!responded && !notification.isActioned && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200
                         flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Accept
              </button>
              
              <button
                onClick={handleReject}
                disabled={loading}
                className={`px-4 py-2 ${isDark ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'} 
                          ${isDark ? 'text-white' : 'text-gray-700'} text-sm font-medium rounded-lg
                          disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200
                          flex items-center gap-2`}
              >
                {loading ? (
                  <div className={`w-4 h-4 border-2 ${isDark ? 'border-white' : 'border-gray-700'} border-t-transparent rounded-full animate-spin`}></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                Decline
              </button>
            </div>
          )}

          {/* Response Status */}
          {(responded || notification.isActioned) && (
            <div className="mt-3">
              <span className={`text-sm px-3 py-1 rounded-full ${
                notification.isActioned 
                  ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                  : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}>
                {notification.isActioned ? 'Responded' : 'Processing...'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to format time ago
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
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}
