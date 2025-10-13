'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../Helper/ThemeProvider';

const VoiceCallModal = ({ 
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
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callTimer, setCallTimer] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [error, setError] = useState(null);
  // Enhanced state for call quality
  const [quality, setQuality] = useState(callQuality);

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
      console.log('📞 Incoming voice call:', data);
      setCallStatus('ringing');
    };

    const handleCallAnswered = (data) => {
      console.log('📞 Call answered:', data);
      setCallStatus('connected');
      startCallTimer();
    };

    const handleCallEnded = (data) => {
      console.log('📞 Call ended:', data);
      endCall('Call ended');
    };

    const handleCallFailed = (data) => {
      console.log('📞 Call failed:', data);
      setError(data.reason || 'Call failed');
      endCall(data.reason || 'Call failed');
    };

    // Enhanced: Handle call quality updates
    const handleCallQualityUpdate = (data) => {
      console.log('📊 Call quality update:', data);
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

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
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
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-green-400';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`rounded-2xl p-6 w-full max-w-sm mx-4 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            {remoteUser?.profilePic ? (
              <img 
                src={remoteUser.profilePic} 
                alt={remoteUser.username} 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-blue-500 dark:text-blue-400" />
            )}
          </div>
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {remoteUser?.username || 'Unknown'}
          </h2>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'connected' && formatDuration(callDuration)}
            {callStatus === 'ended' && 'Call ended'}
          </p>
          
          {/* Enhanced: Call Quality Indicator */}
          {callStatus === 'connected' && quality !== 'unknown' && (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <div className={`flex space-x-1`}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`w-1 h-3 rounded-full ${
                      i <= (quality === 'excellent' ? 5 : 
                            quality === 'good' ? 4 :
                            quality === 'fair' ? 3 : 2)
                        ? getQualityColor(quality)
                        : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs capitalize">
                {quality} quality
              </span>
            </div>
          )}
          
          {/* Enhanced: Call Stats */}
          {callStatus === 'connected' && callStats && Object.keys(callStats).length > 0 && (
            <div className="flex justify-center space-x-4 text-xs mt-1 text-gray-500 dark:text-gray-400">
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

        {/* Error message */}
        {error && (
          <div className={`mb-4 p-3 rounded-lg text-center ${
            theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
          }`}>
            {error}
          </div>
        )}

        {/* Call controls */}
        <div className="flex justify-center items-center space-x-8">
          <button
            onClick={toggleSpeaker}
            className={`p-3 rounded-full ${
              isSpeakerOn 
                ? 'bg-blue-500 text-white' 
                : theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-200 text-gray-700'
            }`}
            aria-label={isSpeakerOn ? "Turn speaker off" : "Turn speaker on"}
          >
            <Volume2 className="w-6 h-6" />
          </button>

          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${
              isMuted 
                ? 'bg-red-500 text-white' 
                : theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-200 text-gray-700'
            }`}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
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
        <div className={`text-center mt-4 text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {callStatus === 'connecting' && 'Establishing connection...'}
          {callStatus === 'ringing' && 'Calling...'}
          {callStatus === 'connected' && 'Call in progress'}
          {callStatus === 'ended' && 'Call has ended'}
        </div>
      </div>
    </div>
  );
};

export default VoiceCallModal;
