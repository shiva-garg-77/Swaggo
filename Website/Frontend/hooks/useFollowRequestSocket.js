/**
 * @fileoverview Hook for Follow Request Socket.IO real-time updates
 * @module hooks/useFollowRequestSocket
 */

import { useEffect } from 'react';
import { useFollowRequestStore } from '../store/followRequestStore';
import toast from 'react-hot-toast';

/**
 * Hook for handling real-time follow request updates via Socket.IO
 * @param {Object} socket - Socket.IO instance
 * @param {Object} user - Current user object
 */
export function useFollowRequestSocket(socket, user) {
  const {
    addReceivedRequest,
    removeReceivedRequest,
    removeSentRequest,
    updateRequestStatus
  } = useFollowRequestStore();

  useEffect(() => {
    if (!socket || !user) return;

    // Listen for new follow request received
    const handleFollowRequestReceived = (data) => {
      console.log('Follow request received:', data);
      
      addReceivedRequest({
        requestid: data.requestId,
        requesterid: data.fromProfileId,
        requestedid: user.profileid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        fromProfile: {
          profileid: data.fromProfileId,
          username: data.username,
          name: data.name,
          profilePic: data.profilePic,
          isVerified: data.isVerified
        }
      });

      // Show toast notification
      toast.success(`${data.username} wants to follow you`, {
        duration: 4000,
        icon: '👤'
      });
    };

    // Listen for follow request accepted
    const handleFollowRequestAccepted = (data) => {
      console.log('Follow request accepted:', data);
      
      // Remove from sent requests
      removeSentRequest(data.requestId);
      
      // Update status
      updateRequestStatus(data.requestId, 'accepted');

      // Show toast notification
      toast.success(`${data.username} accepted your follow request`, {
        duration: 4000,
        icon: '✅'
      });
    };

    // Listen for follow request rejected
    const handleFollowRequestRejected = (data) => {
      console.log('Follow request rejected:', data);
      
      // Remove from sent requests
      removeSentRequest(data.requestId);
      
      // Update status
      updateRequestStatus(data.requestId, 'rejected');

      // Show toast notification (optional - might be too negative)
      // toast.error(`${data.username} declined your follow request`);
    };

    // Listen for follow request cancelled
    const handleFollowRequestCancelled = (data) => {
      console.log('Follow request cancelled:', data);
      
      // Remove from received requests
      removeReceivedRequest(data.requestId);
      
      // Update status
      updateRequestStatus(data.requestId, 'cancelled');
    };

    // Register event listeners
    socket.on('follow_request_received', handleFollowRequestReceived);
    socket.on('follow_request_accepted', handleFollowRequestAccepted);
    socket.on('follow_request_rejected', handleFollowRequestRejected);
    socket.on('follow_request_cancelled', handleFollowRequestCancelled);

    // Cleanup on unmount
    return () => {
      socket.off('follow_request_received', handleFollowRequestReceived);
      socket.off('follow_request_accepted', handleFollowRequestAccepted);
      socket.off('follow_request_rejected', handleFollowRequestRejected);
      socket.off('follow_request_cancelled', handleFollowRequestCancelled);
    };
  }, [socket, user, addReceivedRequest, removeReceivedRequest, removeSentRequest, updateRequestStatus]);
}

export default useFollowRequestSocket;
