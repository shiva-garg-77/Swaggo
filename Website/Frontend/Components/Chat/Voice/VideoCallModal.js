'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../Helper/ThemeProvider';

// WebRTC configuration
const rtcConfiguration = {
  iceServers: [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Additional STUN servers
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:openrelay.metered.ca:80' },
    // Free TURN server for NAT traversal
    {
      urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

const VideoCallModal = ({ 
  isOpen, 
  onClose, 
  chat, 
  user, 
  socket,
  // Enhanced call state props
  callQuality = 'unknown',
  callStats = {},
  onCallQualityUpdate,
  onCallStatsUpdate
}) => {
  const { theme } = useTheme();
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callTimer, setCallTimer] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [error, setError] = useState(null);
  // Enhanced state for call quality
  const [quality, setQuality] = useState(callQuality);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Get remote user
  useEffect(() => {
    if (chat && user) {
      const remote = chat.participants?.find(p => p.profileid !== user.profileid);
      setRemoteUser(remote);
    }
  }, [chat, user]);

  // Update quality when prop changes
  useEffect(() => {
    setQuality(callQuality);
  }, [callQuality]);

  // Handle incoming call
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('📞 Incoming video call:', data);
      setCallStatus('ringing');
    };

    const handleCallAnswered = (data) => {
      console.log('📞 Video call answered:', data);
      setCallStatus('connected');
      startCallTimer();
    };

    const handleCallEnded = (data) => {
      console.log('📞 Video call ended:', data);
      endCall('Call ended');
    };

    const handleCallFailed = (data) => {
      console.log('📞 Video call failed:', data);
      setError(data.reason || 'Call failed');
      endCall(data.reason || 'Call failed');
    };

    // Enhanced: Handle call quality updates
    const handleCallQualityUpdate = (data) => {
      console.log('📊 Video call quality update:', data);
      if (onCallQualityUpdate) {
        onCallQualityUpdate(data.quality);
      }
      setQuality(data.quality);
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_answered', handleCallAnswered);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_failed', handleCallFailed);
    // Enhanced: Listen for quality updates
    socket.on('call_quality_update', handleCallQualityUpdate);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_answered', handleCallAnswered);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_failed', handleCallFailed);
      socket.off('call_quality_update', handleCallQualityUpdate);
    };
  }, [socket, onCallQualityUpdate]);

  // Start call timer
  const startCallTimer = () => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    setCallTimer(timer);
  };

  // End call
  const endCall = (reason = 'Call ended') => {
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    // Notify backend
    if (socket && chat) {
      socket.emit('end_call', {
        chatid: chat.chatid,
        reason
      });
    }
    
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  // Toggle mute
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    
    // Notify backend
    if (socket && chat) {
      socket.emit('toggle_mute', {
        chatid: chat.chatid,
        muted: newMuteState
      });
    }
  };

  // Toggle video
  const toggleVideo = () => {
    const newVideoState = !isVideoOff;
    setIsVideoOff(newVideoState);
    
    // Notify backend
    if (socket && chat) {
      socket.emit('toggle_video', {
        chatid: chat.chatid,
        videoOn: !newVideoState
      });
    }
  };

  // Toggle screen share
  const toggleScreenShare = () => {
    const newScreenShareState = !isScreenSharing;
    setIsScreenSharing(newScreenShareState);
    
    // Notify backend
    if (socket && chat) {
      socket.emit('toggle_screen_share', {
        chatid: chat.chatid,
        sharing: newScreenShareState
      });
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get quality color
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'bg-green-400';
      case 'good': return 'bg-green-300';
      case 'fair': return 'bg-yellow-400';
      case 'poor': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Video containers */}
      <div className="absolute inset-0 flex flex-col">
        {/* Remote video */}
        <div className="flex-1 relative bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Remote user info overlay */}
          <div className="absolute top-4 left-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {remoteUser?.username?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-white font-semibold">{remoteUser?.username || 'Unknown'}</h3>
              <p className="text-gray-300 text-sm">
                {callStatus === 'connecting' && 'Connecting...'}
                {callStatus === 'ringing' && 'Ringing...'}
                {callStatus === 'connected' && formatDuration(callDuration)}
                {callStatus === 'ended' && 'Call ended'}
              </p>
            </div>
          </div>
          
          {/* Enhanced: Call Quality Indicator */}
          {callStatus === 'connected' && quality !== 'unknown' && (
            <div className="absolute top-4 right-4 flex items-center space-x-1">
              <div className={`flex space-x-0.5`}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i <= (quality === 'excellent' ? 5 : 
                            quality === 'good' ? 4 :
                            quality === 'fair' ? 3 : 2)
                        ? getQualityColor(quality)
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white capitalize text-sm">{quality}</span>
            </div>
          )}
        </div>
        
        {/* Local video preview */}
        <div className="absolute bottom-24 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Call controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-6">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${
            isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'
          }`}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'
          }`}
          aria-label={isVideoOff ? "Turn video on" : "Turn video off"}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${
            isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'
          }`}
          aria-label={isScreenSharing ? "Stop screen share" : "Start screen share"}
        >
          <Monitor className="w-6 h-6" />
        </button>

        <button
          onClick={() => endCall()}
          className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          aria-label="End call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      {/* Call status message */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-gray-300 text-sm">
          {callStatus === 'connecting' && 'Establishing connection...'}
          {callStatus === 'ringing' && 'Calling...'}
          {callStatus === 'connected' && 'Call in progress'}
          {callStatus === 'ended' && 'Call has ended'}
        </p>
      </div>
      
      {/* Enhanced: Call Stats */}
      {callStatus === 'connected' && callStats && Object.keys(callStats).length > 0 && (
        <div className="absolute bottom-32 left-4 flex space-x-4 text-xs text-gray-300">
          {callStats.packetLoss !== undefined && (
            <span title="Packet Loss">PL: {callStats.packetLoss.toFixed(1)}%</span>
          )}
          {callStats.jitter !== undefined && (
            <span title="Jitter">J: {callStats.jitter.toFixed(1)}ms</span>
          )}
          {callStats.rtt !== undefined && (
            <span title="Round Trip Time">RTT: {callStats.rtt.toFixed(1)}ms</span>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCallModal;
