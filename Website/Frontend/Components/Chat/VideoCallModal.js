'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../Helper/ThemeProvider';

// WebRTC configuration
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export default function VideoCallModal({ isOpen, onClose, chat, user, socket }) {
  const { theme } = useTheme();
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const callStartTime = useRef(null);
  const durationInterval = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCallStatus('connecting');
      callStartTime.current = Date.now();
      initializeCall();
      
      // Set participants
      if (chat?.participants) {
        setParticipants(chat.participants.filter(p => p.profileid !== user.profileid));
      }
    }

    return () => {
      cleanup();
    };
  }, [isOpen, chat, user]);

  const initializeCall = async () => {
    try {
      console.log('🎥 Initializing video call...');
      
      // Get user media
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: isVideoOn,
        audio: !isMuted
      });
      
      // Display local video
      if (localVideoRef.current && localStream.current) {
        localVideoRef.current.srcObject = localStream.current;
      }
      
      // Create peer connection
      peerConnection.current = new RTCPeerConnection(rtcConfiguration);
      
      // Add local stream to peer connection
      localStream.current.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, localStream.current);
      });
      
      // Handle remote stream
      peerConnection.current.ontrack = (event) => {
        console.log('📹 Received remote stream');
        remoteStream.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream.current;
        }
      };
      
      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log('🧊 Sending ICE candidate');
          socket.emit('webrtc_ice_candidate', {
            chatid: chat.chatid,
            candidate: event.candidate
          });
        }
      };
      
      // Handle connection state changes
      peerConnection.current.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', peerConnection.current.connectionState);
        if (peerConnection.current.connectionState === 'connected') {
          setCallStatus('connected');
          startDurationTimer();
        } else if (peerConnection.current.connectionState === 'disconnected' || 
                   peerConnection.current.connectionState === 'failed') {
          setCallStatus('ended');
        }
      };
      
      // Set up WebRTC signaling listeners
      if (socket) {
        socket.on('webrtc_offer', handleOffer);
        socket.on('webrtc_answer', handleAnswer);
        socket.on('webrtc_ice_candidate', handleIceCandidate);
        socket.on('call_ended', handleCallEnded);
        
        // Create and send offer if we're the caller
        // (The logic for who creates the offer can be based on user IDs or other criteria)
        if (shouldCreateOffer()) {
          createOffer();
        }
      }
      
    } catch (error) {
      console.error('🔥 Error initializing call:', error);
      setCallStatus('ended');
    }
  };
  
  const shouldCreateOffer = () => {
    // Simple logic: user with higher profileid creates the offer
    // This ensures only one user creates the offer
    const otherParticipant = participants[0];
    return otherParticipant && user?.profileid > otherParticipant.profileid;
  };
  
  const createOffer = async () => {
    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      
      console.log('📤 Sending WebRTC offer');
      socket.emit('webrtc_offer', {
        chatid: chat.chatid,
        offer: offer
      });
    } catch (error) {
      console.error('🔥 Error creating offer:', error);
    }
  };
  
  const handleOffer = async (data) => {
    try {
      console.log('📥 Received WebRTC offer');
      await peerConnection.current.setRemoteDescription(data.offer);
      
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      console.log('📤 Sending WebRTC answer');
      socket.emit('webrtc_answer', {
        chatid: chat.chatid,
        answer: answer
      });
    } catch (error) {
      console.error('🔥 Error handling offer:', error);
    }
  };
  
  const handleAnswer = async (data) => {
    try {
      console.log('📥 Received WebRTC answer');
      await peerConnection.current.setRemoteDescription(data.answer);
    } catch (error) {
      console.error('🔥 Error handling answer:', error);
    }
  };
  
  const handleIceCandidate = async (data) => {
    try {
      console.log('🧊 Received ICE candidate');
      await peerConnection.current.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('🔥 Error handling ICE candidate:', error);
    }
  };
  
  const handleCallEnded = () => {
    console.log('📞 Call ended by remote participant');
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 1000);
  };
  
  const cleanup = () => {
    console.log('🧹 Cleaning up video call resources');
    
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    
    // Stop local media tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        track.stop();
      });
      localStream.current = null;
    }
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    // Remove socket listeners
    if (socket) {
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('call_ended', handleCallEnded);
    }
  };

  const startDurationTimer = () => {
    durationInterval.current = setInterval(() => {
      if (callStartTime.current) {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // Mute/unmute local audio tracks
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Note: isMuted is current state, so we want opposite
      });
    }
    
    if (socket) {
      socket.emit('toggle_mute', { chatid: chat.chatid, muted: !isMuted });
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    
    // Enable/disable local video tracks
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn; // Note: isVideoOn is current state, so we want opposite
      });
    }
    
    if (socket) {
      socket.emit('toggle_video', { chatid: chat.chatid, videoOn: !isVideoOn });
    }
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    if (socket) {
      socket.emit('toggle_screen_share', { chatid: chat.chatid, sharing: !isScreenSharing });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  const otherParticipant = participants[0] || {};
  const displayName = chat?.chatType === 'group' 
    ? (chat.chatName || 'Group Call') 
    : (otherParticipant?.name || otherParticipant?.username || 'Unknown User');

  return (
    <div className={`fixed inset-0 bg-black z-50 ${isFullscreen ? '' : 'bg-opacity-90 flex items-center justify-center p-4'}`}>
      <div className={`relative ${isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl h-5/6'} rounded-xl overflow-hidden shadow-2xl bg-black`}>
        
        {/* Main Video Area */}
        <div className="relative w-full h-full">
          {/* Remote Video / Main Display */}
          <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
            {callStatus === 'connected' ? (
              <>
                {/* Remote Video */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ display: remoteStream.current ? 'block' : 'none' }}
                />
                
                {/* Fallback when no remote video */}
                {!remoteStream.current && (
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-1">
                      <img
                        src={chat?.chatType === 'group' ? chat.chatAvatar : otherParticipant?.profilePic || '/default-avatar.png'}
                        alt={displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <p className="text-white text-xl font-semibold">{displayName}</p>
                    <p className="text-gray-400 text-sm">Connecting...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 p-1">
                  <img
                    src={chat?.chatType === 'group' ? chat.chatAvatar : otherParticipant?.profilePic || '/default-avatar.png'}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <p className="text-white text-xl font-semibold">{displayName}</p>
                <p className="text-gray-400 text-sm">
                  {callStatus === 'connecting' ? 'Connecting...' : 'Camera is off'}
                </p>
              </div>
            )}

            {/* Screen Share Indicator */}
            {isScreenSharing && (
              <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Screen sharing</span>
              </div>
            )}

            {/* Call Info Overlay */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
              {callStatus === 'connected' && `${formatDuration(callDuration)}`}
              {chat?.chatType === 'group' && ` • ${participants.length + 1} people`}
            </div>

            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
              {isVideoOn && localStream.current ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted // Mute local video to prevent echo
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/20 p-1">
                      <img
                        src={user?.profilePic || '/default-avatar.png'}
                        alt={user?.name || 'You'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <p className="text-white text-sm font-medium">You</p>
                    <p className="text-gray-400 text-xs">Camera off</p>
                  </div>
                </div>
              )}
            </div>

            {/* Group Call Participants */}
            {chat?.chatType === 'group' && participants.length > 1 && (
              <div className="absolute bottom-4 left-4 flex space-x-2">
                {participants.slice(1, 4).map((participant, index) => (
                  <div key={participant.profileid} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={participant.profilePic || '/default-avatar.png'}
                      alt={participant.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {participants.length > 4 && (
                  <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">+{participants.length - 3}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <div className="flex justify-center space-x-4">
              
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              {/* Video Toggle Button */}
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                  !isVideoOn 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
                title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoOn ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>

              {/* Screen Share Button */}
              <button
                onClick={toggleScreenShare}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isScreenSharing 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors transform hover:scale-105"
                title="End Call"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>

              {/* Fullscreen Toggle */}
              {!isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="w-14 h-14 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 flex items-center justify-center transition-all duration-200"
                  title="Enter fullscreen"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              )}

            </div>

            {/* Secondary Controls */}
            <div className="flex justify-center space-x-3 mt-4">
              
              {/* Chat Button */}
              <button
                className="p-3 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all duration-200"
                title="Open chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>

              {/* Add Person (for group calls) */}
              {chat?.chatType === 'group' && (
                <button
                  className="p-3 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all duration-200"
                  title="Add person"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </button>
              )}

              {/* Settings */}
              <button
                className="p-3 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all duration-200"
                title="Call settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </button>

            </div>
          </div>

          {/* Exit Fullscreen Button */}
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 left-4 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200"
              title="Exit fullscreen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15H4.5M9 15v4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
