'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useSocket } from '../Helper/PerfectSocketProvider';
import { useSecureAuth } from '../../context/FixedSecureAuthContext';
import UnifiedWebRTCService from '../../services/WebRTCService';
import notificationService from '../../services/NotificationService';

// Call context
const CallContext = createContext();

// Call states
export const CALL_STATES = {
  IDLE: 'idle',
  CALLING: 'calling',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  ENDED: 'ended',
  FAILED: 'failed',
  DECLINED: 'declined'
};

// Call types
export const CALL_TYPES = {
  VOICE: 'voice',
  VIDEO: 'video'
};

// WebRTC configuration
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// Call Provider Component
export function CallProvider({ children }) {
  const { socket } = useSocket();
  const { user } = useSecureAuth();

  // Call state
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [currentCall, setCurrentCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [detailedStats, setDetailedStats] = useState({
    packetLoss: 0,
    jitter: 0,
    rtt: 0,
    bandwidth: 0,
    resolution: '',
    frameRate: 0
  });

  // Refs
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const webRTCServiceRef = useRef(null);

  // Initialize WebRTC service
  useEffect(() => {
    if (!webRTCServiceRef.current) {
      webRTCServiceRef.current = new UnifiedWebRTCService();
    }
    
    const webRTCService = webRTCServiceRef.current;
    
    // Initialize with socket
    if (socket) {
      webRTCService.initialize(socket);
    }
    
    // Listen for call state changes
    webRTCService.on('callStateChanged', (state) => {
      setCallState(state);
    });
    
    webRTCService.on('callInitiated', (call) => {
      setCurrentCall(call);
    });
    
    webRTCService.on('incomingCall', (call) => {
      setCallState(CALL_STATES.RINGING);
      setCurrentCall(call);
    });
    
    webRTCService.on('callAnswered', (call) => {
      setCallState(CALL_STATES.CONNECTED);
      startCallTimer();
    });
    
    webRTCService.on('callEnded', (data) => {
      setCallState(CALL_STATES.ENDED);
      setCallDuration(0);
      setIsAudioMuted(false);
      setIsVideoMuted(false);
      setIsScreenSharing(false);
      setCurrentCall(null);
      
      // Clear streams
      setLocalStream(null);
      setRemoteStream(null);
      
      // Clean up refs
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });
    
    webRTCService.on('localStreamAcquired', (stream) => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });
    
    webRTCService.on('remoteStreamReceived', (stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });
    
    webRTCService.on('statsUpdated', (stats) => {
      setConnectionQuality(stats.connectionQuality || stats.quality || 'good');
      setDetailedStats({
        packetLoss: stats.packetLossPercentage || 0,
        jitter: stats.jitter || 0,
        rtt: stats.rtt || 0,
        bandwidth: stats.bytesReceived || 0,
        resolution: stats.resolution || '',
        frameRate: stats.frameRate || 0
      });
    });
    
    webRTCService.on('callStateRestored', (state) => {
      console.log('🔁 Call state restored:', state);
      // Handle restored call state
      if (state.currentCall) {
        setCurrentCall(state.currentCall);
        setCallState(state.callState || CALL_STATES.IDLE);
      }
    });
    
    webRTCService.on('callReconnectNeeded', (data) => {
      console.log('🔄 Call reconnection needed:', data);
      // Handle reconnection in UI
      notificationService.warning(
        'Call Reconnection',
        'Attempting to reconnect to your call...'
      );
    });
    
    // Cleanup
    return () => {
      webRTCService.removeAllListeners();
    };
  }, [socket]);

  // Initialize WebRTC peer connection
  const createPeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', {
          candidate: event.candidate,
          callId: currentCall?.id
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      
      if (state === 'connected') {
        setCallState(CALL_STATES.CONNECTED);
        startCallTimer();
        startQualityMonitoring();
      } else if (state === 'disconnected' || state === 'failed') {
        endCall();
      }
    };

    return peerConnection;
  }, [socket, currentCall]);

  // Start quality monitoring with enhanced packet loss detection
  const startQualityMonitoring = useCallback(() => {
    if (!peerConnectionRef.current) return;

    statsIntervalRef.current = setInterval(async () => {
      try {
        const stats = await peerConnectionRef.current.getStats();
        let bytesReceived = 0;
        let packetsLost = 0;
        let packetsReceived = 0;
        let jitter = 0;
        let rtt = 0;
        let resolution = '';
        let frameRate = 0;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp') {
            bytesReceived += report.bytesReceived || 0;
            packetsLost += report.packetsLost || 0;
            packetsReceived += report.packetsReceived || 0;
            
            if (report.jitter !== undefined) {
              jitter = report.jitter;
            }
            
            // Get video resolution and frame rate
            if (report.kind === 'video') {
              if (report.frameWidth && report.frameHeight) {
                resolution = `${report.frameWidth}x${report.frameHeight}`;
              }
              if (report.framesPerSecond) {
                frameRate = report.framesPerSecond;
              }
            }
          }
          
          // Get round-trip time from candidate-pair reports
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = report.currentRoundTripTime || 0;
          }
        });

        // Calculate connection quality
        const totalPackets = packetsLost + packetsReceived;
        const lossRate = totalPackets > 0 ? packetsLost / totalPackets : 0;
        const packetLossPercentage = lossRate * 100;
        
        // Determine connection quality based on multiple factors
        let quality = 'good';
        if (packetLossPercentage < 1 && jitter < 0.03 && rtt < 0.2) {
          quality = 'excellent';
        } else if (packetLossPercentage < 3 && jitter < 0.05 && rtt < 0.5) {
          quality = 'good';
        } else if (packetLossPercentage < 5 && jitter < 0.1 && rtt < 1) {
          quality = 'fair';
        } else {
          quality = 'poor';
        }
        
        setConnectionQuality(quality);
        setDetailedStats({
          packetLoss: packetLossPercentage,
          jitter: jitter,
          rtt: rtt,
          bandwidth: bytesReceived,
          resolution: resolution,
          frameRate: frameRate
        });
        
        // Show warning if connection is poor
        if (quality === 'poor') {
          console.warn('⚠️ Poor connection quality detected:', {
            packetLoss: packetLossPercentage.toFixed(2) + '%',
            jitter: jitter.toFixed(3),
            rtt: rtt.toFixed(3) + 's'
          });
          
          // Show a visual warning to the user
          const warningElement = document.getElementById('connection-warning');
          if (warningElement) {
            warningElement.textContent = `Poor connection: ${packetLossPercentage.toFixed(2)}% packet loss`;
            warningElement.style.display = 'block';
            
            // Hide warning after 5 seconds
            setTimeout(() => {
              if (warningElement) {
                warningElement.style.display = 'none';
              }
            }, 5000);
          }
        }
      } catch (error) {
        console.error('Error getting call stats:', error);
      }
    }, 1000); // Check every second
  }, []);

  // Get user media
  const getUserMedia = useCallback(async (callType) => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === CALL_TYPES.VIDEO ? {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30, max: 60 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone');
    }
  }, []);

  // Start a call
  const startCall = useCallback(async (chatId, callType = CALL_TYPES.VOICE) => {
    try {
      setCallState(CALL_STATES.CALLING);
      
      // Use WebRTC service to initiate call
      if (webRTCServiceRef.current) {
        const call = await webRTCServiceRef.current.initiateCall(chatId, callType);
        setCurrentCall(call);
      } else {
        // Fallback to direct implementation
        // Get user media
        const stream = await getUserMedia(callType);
        
        // Create peer connection
        peerConnectionRef.current = createPeerConnection();
        
        // Add local stream tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        // Create offer
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        // Store call data
        const callData = {
          id: Date.now().toString(),
          chatId,
          callType,
          startTime: new Date(),
          isOutgoing: true
        };
        
        setCurrentCall(callData);

        // Emit call initiation (backend expects different format)
        if (socket) {
          socket.emit('initiate_call', {
            chatid: chatId,
            callType,
            receiverId: chatId, // For now, using chatId as receiverId - you may need to extract actual receiverId
            callId: callData.id
          });
        }
      }
    } catch (error) {
      console.error('Error starting call:', error);
      setCallState(CALL_STATES.FAILED);
    }
  }, [getUserMedia, createPeerConnection, socket]);

  // Answer a call
  const answerCall = useCallback(async (callData) => {
    try {
      setCallState(CALL_STATES.CONNECTED);
      
      // Use WebRTC service to answer call
      if (webRTCServiceRef.current) {
        await webRTCServiceRef.current.answerCall(true);
      } else {
        // Fallback to direct implementation
        // Get user media
        const stream = await getUserMedia(callData.callType);
        
        // Create peer connection
        peerConnectionRef.current = createPeerConnection();
        
        // Add local stream tracks
        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        // Set remote description
        await peerConnectionRef.current.setRemoteDescription(callData.offer);

        // Create answer
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        // Update call data
        setCurrentCall({
          ...callData,
          isOutgoing: false,
          acceptTime: new Date()
        });

        // Emit answer
        if (socket) {
          socket.emit('answer_call', {
            callId: callData.id,
            answer
          });
        }
      }
    } catch (error) {
      console.error('Error answering call:', error);
      declineCall(callData.id);
    }
  }, [getUserMedia, createPeerConnection, socket]);

  // Decline a call
  const declineCall = useCallback((callId) => {
    setCallState(CALL_STATES.DECLINED);
    
    // Use WebRTC service to decline call
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.answerCall(false);
    } else {
      if (socket) {
        socket.emit('decline_call', { callId });
      }
    }
    
    setTimeout(() => {
      setCallState(CALL_STATES.IDLE);
      setCurrentCall(null);
    }, 2000);
  }, [socket]);

  // End a call
  const endCall = useCallback(() => {
    // Stop call timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    // Stop quality monitoring
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Clear remote stream
    setRemoteStream(null);

    // Emit end call
    if (socket && currentCall) {
      socket.emit('end_call', { 
        callId: currentCall.id,
        duration: callDuration 
      });
    }

    // Use WebRTC service to end call
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.endCall('user_ended');
    }

    // Reset state
    setCallState(CALL_STATES.ENDED);
    setCallDuration(0);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIsScreenSharing(false);
    setDetailedStats({
      packetLoss: 0,
      jitter: 0,
      rtt: 0,
      bandwidth: 0,
      resolution: '',
      frameRate: 0
    });

    setTimeout(() => {
      setCallState(CALL_STATES.IDLE);
      setCurrentCall(null);
    }, 2000);
  }, [socket, currentCall, callDuration, localStream]);

  // Toggle audio mute
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle video mute
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        const videoTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track in peer connection
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        setIsScreenSharing(true);

        // Listen for screen share end
        videoTrack.onended = () => {
          stopScreenShare();
        };

      } else {
        await stopScreenShare();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }, [isScreenSharing]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    try {
      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      const videoTrack = cameraStream.getVideoTracks()[0];
      
      // Replace screen share track with camera track
      const sender = peerConnectionRef.current?.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      // Update local stream
      if (localStream) {
        const newStream = new MediaStream([
          ...localStream.getAudioTracks(),
          videoTrack
        ]);
        setLocalStream(newStream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }
      }

      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }, [localStream]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('📞 Incoming call received:', data);
      setCallState(CALL_STATES.RINGING);
      setCurrentCall({
        id: data.callId,
        callType: data.callType,
        chatId: data.chatid,
        caller: data.caller,
        participantName: data.caller?.username || 'Unknown'
      });
    };

    const handleCallRinging = (data) => {
      console.log('📞 Call ringing:', data);
      setCallState(CALL_STATES.CALLING);
    };

    const handleCallAnswered = async (data) => {
      console.log('📞 Call answered:', data);
      setCallState(CALL_STATES.CONNECTED);
      startCallTimer();
    };

    const handleCallConnected = (data) => {
      console.log('📞 Call connected:', data);
      setCallState(CALL_STATES.CONNECTED);
      startCallTimer();
    };

    const handleCallDeclined = (data) => {
      console.log('📞 Call declined:', data);
      setCallState(CALL_STATES.DECLINED);
      setTimeout(() => {
        setCallState(CALL_STATES.IDLE);
        setCurrentCall(null);
      }, 2000);
    };

    const handleCallEnded = (data) => {
      console.log('📞 Call ended:', data);
      endCall();
    };

    const handleCallFailed = (data) => {
      console.log('📞 Call failed:', data);
      setCallState(CALL_STATES.FAILED);
      
      // Show error notification
      notificationService.error('Call Failed', data.message || 'The call could not be established. Please try again.');
      
      setTimeout(() => {
        setCallState(CALL_STATES.IDLE);
        setCurrentCall(null);
      }, 3000);
    };

    const handleCallTimeout = (data) => {
      console.log('📞 Call timeout:', data);
      setCallState(CALL_STATES.FAILED);
      
      // Show timeout notification
      notificationService.warning('Call Timeout', 'The call timed out. The recipient may be offline or busy.');
      
      setTimeout(() => {
        setCallState(CALL_STATES.IDLE);
        setCurrentCall(null);
      }, 3000);
    };

    const handleIceCandidate = async (data) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    // Register all socket event listeners
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_ringing', handleCallRinging);
    socket.on('call_answered', handleCallAnswered);
    socket.on('call_connected', handleCallConnected);
    socket.on('call_declined', handleCallDeclined);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_failed', handleCallFailed);
    socket.on('call_timeout', handleCallTimeout);
    socket.on('call_error', (data) => {
      console.error('❌ Call error:', data);
      setCallState(CALL_STATES.FAILED);
      
      // Show error notification
      notificationService.error('Call Error', data.error || 'An error occurred during the call.');
    });
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    socket.on('webrtc_offer', async (data) => {
      console.log('📞 WebRTC offer received:', data);
      if (peerConnectionRef.current && data.offer) {
        await peerConnectionRef.current.setRemoteDescription(data.offer);
      }
    });
    socket.on('webrtc_answer', async (data) => {
      console.log('📞 WebRTC answer received:', data);
      if (peerConnectionRef.current && data.answer) {
        await peerConnectionRef.current.setRemoteDescription(data.answer);
      }
    });

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_ringing', handleCallRinging);
      socket.off('call_answered', handleCallAnswered);
      socket.off('call_connected', handleCallConnected);
      socket.off('call_declined', handleCallDeclined);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_failed', handleCallFailed);
      socket.off('call_timeout', handleCallTimeout);
      socket.off('call_error');
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
    };
  }, [socket, endCall]);

  // Format call duration
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Get quality indicator color
  const getQualityColor = useCallback((quality) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-green-300';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }, []);
  
  // Get quality icon
  const getQualityIcon = useCallback((quality) => {
    switch (quality) {
      case 'excellent': return '●';
      case 'good': return '●';
      case 'fair': return '●';
      case 'poor': return '●';
      default: return '●';
    }
  }, []);

  const value = {
    // State
    callState,
    currentCall,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    callDuration,
    connectionQuality,
    detailedStats,
    
    // Actions
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    
    // Refs
    localVideoRef,
    remoteVideoRef,
    
    // Utils
    formatDuration,
    getQualityColor,
    getQualityIcon
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}

// Custom hook for WebRTC call state management with unified store integration
export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

// Enhanced Quality Indicator Component
const QualityIndicator = ({ quality, detailedStats }) => {
  const getQualityIcon = (quality) => {
    switch (quality) {
      case 'excellent':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'good':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'fair':
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  const getQualityLabel = (quality) => {
    switch (quality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className="flex items-center">
        {getQualityIcon(quality)}
        <span className="ml-1 font-medium">{getQualityLabel(quality)}</span>
      </div>
      
      {/* Detailed stats tooltip */}
      <div className="group relative">
        <AlertTriangle className="w-3 h-3 text-gray-400 cursor-help" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded-lg p-3 z-10">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Packet Loss:</span>
              <span>{detailedStats.packetLoss.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Jitter:</span>
              <span>{detailedStats.jitter.toFixed(3)}s</span>
            </div>
            <div className="flex justify-between">
              <span>RTT:</span>
              <span>{(detailedStats.rtt * 1000).toFixed(0)}ms</span>
            </div>
            {detailedStats.resolution && (
              <div className="flex justify-between">
                <span>Resolution:</span>
                <span>{detailedStats.resolution}</span>
              </div>
            )}
            {detailedStats.frameRate > 0 && (
              <div className="flex justify-between">
                <span>Frame Rate:</span>
                <span>{detailedStats.frameRate} fps</span>
              </div>
            )}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
        </div>
      </div>
    </div>
  );
};

// Call UI Component
export function CallInterface() {
  const {
    callState,
    currentCall,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    callDuration,
    connectionQuality,
    detailedStats,
    answerCall,
    declineCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    localVideoRef,
    remoteVideoRef,
    formatDuration,
    getQualityColor,
    getQualityIcon
  } = useCall();

  if (callState === CALL_STATES.IDLE) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-4">
        {/* Call header */}
        <div className="text-center text-white mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            {callState === CALL_STATES.RINGING ? 'Incoming Call' :
             callState === CALL_STATES.CALLING ? 'Calling...' :
             callState === CALL_STATES.CONNECTED ? 'In Call' :
             callState === CALL_STATES.ENDED ? 'Call Ended' :
             callState === CALL_STATES.DECLINED ? 'Call Declined' : 'Call'}
          </h2>
          
          {currentCall && (
            <p className="text-lg text-gray-300">
              {currentCall.participantName || 'Unknown'}
            </p>
          )}
          
          {callState === CALL_STATES.CONNECTED && (
            <div className="flex items-center justify-center gap-4 mt-2">
              <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                <span className={getQualityColor(connectionQuality)}>
                  {getQualityIcon(connectionQuality)}
                </span>
                {formatDuration(callDuration)}
              </p>
              <QualityIndicator quality={connectionQuality} detailedStats={detailedStats} />
            </div>
          )}
          
          {/* Connection quality warning */}
          <div 
            id="connection-warning"
            className="mt-2 text-sm text-red-400 bg-red-900/50 rounded-lg p-2 hidden"
          >
            {/* Warning message will be populated by JavaScript */}
          </div>
        </div>

        {/* Video containers */}
        {currentCall?.callType === CALL_TYPES.VIDEO && (
          <div className="relative mb-6">
            {/* Remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-64 md:h-96 bg-gray-800 rounded-xl object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Local video (picture-in-picture) */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-4 right-4 w-32 h-24 bg-gray-700 rounded-lg object-cover border-2 border-white/20"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )}

        {/* Call controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Answer/Decline (for incoming calls) */}
          {callState === CALL_STATES.RINGING && (
            <>
              <button
                onClick={() => declineCall(currentCall.id)}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                aria-label="Decline call"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              
              <button
                onClick={() => answerCall(currentCall)}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                aria-label="Answer call"
              >
                <Phone className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Call controls (for active calls) */}
          {(callState === CALL_STATES.CONNECTED || callState === CALL_STATES.CALLING) && (
            <>
              {/* Mute audio */}
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                  isAudioMuted 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
                aria-label={isAudioMuted ? 'Unmute' : 'Mute'}
              >
                {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Mute video (for video calls) */}
              {currentCall?.callType === CALL_TYPES.VIDEO && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                    isVideoMuted 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                  aria-label={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
                >
                  {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* Screen share (for video calls) */}
              {currentCall?.callType === CALL_TYPES.VIDEO && (
                <button
                  onClick={toggleScreenShare}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                    isScreenSharing 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                  aria-label={isScreenSharing ? 'Stop screen share' : 'Share screen'}
                >
                  {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </button>
              )}

              {/* End call */}
              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                aria-label="End call"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WebRTCCallSystem({ chat, user, socket, onCallEnd }) {
  return (
    <div className="relative">
      <CallInterface />
      <div className="absolute inset-0">
        {/* Your main content goes here */}
      </div>
    </div>
  );
}