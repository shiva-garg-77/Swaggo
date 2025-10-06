/**
 * Unified WebRTC Service
 * Consolidates all WebRTC functionality into a single, comprehensive service
 */

import { EventEmitter } from 'events';

/**
 * WebRTC Configuration Constants
 */
const WEBRTC_CONFIG = {
  iceServers: [
    // Google STUN servers
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302'
      ]
    },
    // Additional reliable STUN servers
    {
      urls: [
        'stun:stun.stunprotocol.org:3478',
        'stun:openrelay.metered.ca:80'
      ]
    },
    // Free TURN server (limited usage)
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

/**
 * Media Constraints for different call types
 */
const MEDIA_CONSTRAINTS = {
  voice: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
      channelCount: 2
    },
    video: false
  },
  video: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: {
      width: { min: 320, ideal: 1280, max: 1920 },
      height: { min: 240, ideal: 720, max: 1080 },
      frameRate: { min: 15, ideal: 30, max: 60 }
    }
  },
  screen: {
    audio: true,
    video: {
      mediaSource: 'screen'
    }
  }
};

/**
 * Call States
 */
const CALL_STATES = {
  IDLE: 'idle',
  CALLING: 'calling',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ENDED: 'ended',
  DECLINED: 'declined',
  FAILED: 'failed'
};

/**
 * Unified WebRTC Service Class
 */
class UnifiedWebRTCService extends EventEmitter {
  constructor() {
    super();
    
    // Connection management
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.socket = null;
    
    // Call state management
    this.currentCall = null;
    this.callState = CALL_STATES.IDLE;
    this.isInitiator = false;
    this.callStartTime = null;
    this.callTimer = null;
    
    // Media state
    this.isMuted = false;
    this.isVideoEnabled = true;
    this.isCameraOn = true;
    this.isScreenSharing = false;
    this.currentFacingMode = 'user';
    
    // Statistics and monitoring
    this.callStats = {
      startTime: null,
      duration: 0,
      quality: 'unknown',
      bytesReceived: 0,
      bytesSent: 0,
      packetsLost: 0
    };
    
    // Connection health monitoring
    this.statsInterval = null;
    this.connectionMonitor = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    // Device management
    this.availableDevices = {
      audioInputs: [],
      audioOutputs: [],
      videoInputs: []
    };
    
    // Bind methods to preserve context
    this.bindMethods();
    
    // Setup device change monitoring
    this.setupDeviceChangeMonitoring();
  }

  /**
   * Bind methods to preserve 'this' context
   */
  bindMethods() {
    // Only bind methods that actually exist to prevent undefined errors
    const methodsToBind = [
      'handleIceCandidate',
      'handleConnectionStateChange', 
      'handleIceConnectionStateChange',
      'handleTrack',
      'handleDataChannel'
    ];
    
    methodsToBind.forEach(methodName => {
      if (typeof this[methodName] === 'function') {
        this[methodName] = this[methodName].bind(this);
      } else {
        console.warn(`⚠️ Method ${methodName} not found, skipping bind`);
      }
    });
    
    console.log('✅ WebRTC methods bound successfully:', 
      methodsToBind.filter(m => typeof this[m] === 'function'));
  }

  /**
   * Initialize WebRTC service with socket connection
   */
  initialize(socket) {
    this.socket = socket;
    this.setupSocketEventHandlers();
    this.refreshAvailableDevices();
    
    this.emit('initialized', {
      devices: this.availableDevices
    });
  }

  /**
   * Setup socket event handlers for WebRTC signaling
   */
  setupSocketEventHandlers() {
    if (!this.socket) return;

    // WebRTC signaling events
    this.socket.on('webrtc_offer', (data) => this.handleRemoteOffer(data));
    this.socket.on('webrtc_answer', (data) => this.handleRemoteAnswer(data));
    this.socket.on('webrtc_ice_candidate', (data) => this.handleRemoteIceCandidate(data));
    
    // Call management events
    this.socket.on('incoming_call', (data) => this.handleIncomingCall(data));
    this.socket.on('call_answered', (data) => this.handleCallAnswered(data));
    this.socket.on('call_declined', (data) => this.handleCallDeclined(data));
    this.socket.on('call_ended', (data) => this.handleCallEnded(data));
    this.socket.on('call_failed', (data) => this.handleCallFailed(data));
    
    // Media control events
    this.socket.on('toggle_mute', (data) => this.handleRemoteMuteToggle(data));
    this.socket.on('toggle_video', (data) => this.handleRemoteVideoToggle(data));
    this.socket.on('toggle_screen_share', (data) => this.handleRemoteScreenShareToggle(data));
    
    // Connection events
    this.socket.on('disconnect', () => this.handleSocketDisconnect());
    this.socket.on('reconnect', () => this.handleSocketReconnect());
  }

  /**
   * Initiate an outgoing call
   */
  async initiateCall(chatId, callType = 'video', targetUserId) {
    try {
      console.log('📞 Initiating call:', { chatId, callType, targetUserId });
      
      if (this.callState !== CALL_STATES.IDLE) {
        throw new Error('Already in a call or call in progress');
      }
      
      // Create call data
      this.currentCall = {
        callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chatId,
        callType,
        targetUserId,
        isInitiator: true
      };
      
      this.isInitiator = true;
      this.setCallState(CALL_STATES.CALLING);
      
      // Get user media
      await this.getUserMedia(callType);
      
      // Create peer connection
      await this.createPeerConnection();
      
      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      }
      
      // Create and send offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video' || callType === 'screen'
      });
      
      await this.peerConnection.setLocalDescription(offer);
      
      // Send offer via socket
      this.sendSignalingMessage('webrtc_offer', {
        offer,
        callId: this.currentCall.callId,
        chatId,
        callType,
        targetUserId,
        caller: this.getCurrentUserInfo()
      });
      
      // Start call timer
      this.startCallTimer();
      
      // Set timeout for call response
      this.setCallTimeout(30000); // 30 seconds
      
      this.emit('callInitiated', this.currentCall);
      
      return this.currentCall;
      
    } catch (error) {
      console.error('❌ Failed to initiate call:', error);
      await this.cleanup();
      this.emit('callError', { error, phase: 'initiation' });
      throw error;
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(accept = true) {
    try {
      console.log('📞 Answering call:', { accept, call: this.currentCall });
      
      if (!this.currentCall || this.callState !== CALL_STATES.RINGING) {
        throw new Error('No incoming call to answer');
      }
      
      if (!accept) {
        // Decline the call
        this.sendSignalingMessage('call_declined', {
          callId: this.currentCall.callId,
          chatId: this.currentCall.chatId
        });
        
        this.setCallState(CALL_STATES.DECLINED);
        await this.cleanup();
        return;
      }
      
      this.setCallState(CALL_STATES.CONNECTING);
      
      // Get user media
      await this.getUserMedia(this.currentCall.callType);
      
      // Create peer connection if not already created
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }
      
      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      }
      
      // Create and send answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      this.sendSignalingMessage('webrtc_answer', {
        answer,
        callId: this.currentCall.callId,
        chatId: this.currentCall.chatId
      });
      
      // Notify that call was answered
      this.sendSignalingMessage('call_answered', {
        callId: this.currentCall.callId,
        chatId: this.currentCall.chatId,
        answerer: this.getCurrentUserInfo()
      });
      
      this.startCallTimer();
      
      this.emit('callAnswered', this.currentCall);
      
    } catch (error) {
      console.error('❌ Error answering call:', error);
      await this.cleanup();
      this.emit('callError', { error, phase: 'answer' });
      throw error;
    }
  }

  /**
   * End the current call
   */
  async endCall(reason = 'normal') {
    try {
      console.log('📞 Ending call:', { reason, call: this.currentCall });
      
      const duration = this.stopCallTimer();
      
      if (this.currentCall && this.socket) {
        this.sendSignalingMessage('call_ended', {
          callId: this.currentCall.callId,
          chatId: this.currentCall.chatId,
          reason,
          duration,
          endedBy: this.getCurrentUserInfo()
        });
      }
      
      this.setCallState(CALL_STATES.ENDED);
      
      this.emit('callEnded', {
        call: this.currentCall,
        duration,
        reason,
        stats: this.callStats
      });
      
      await this.cleanup();
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
      await this.cleanup();
    }
  }

  /**
   * Get user media with comprehensive fallback handling
   */
  async getUserMedia(callType, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      console.log(`📷 Requesting user media (${callType}) - Attempt ${retryCount + 1}/${maxRetries + 1}`);
      
      // Check available devices
      await this.refreshAvailableDevices();
      
      if (!this.availableDevices.audioInputs.length && callType !== 'screen') {
        throw new Error('No audio input devices found');
      }
      
      if (!this.availableDevices.videoInputs.length && callType === 'video') {
        console.warn('⚠️ No video devices found, falling back to audio-only');
        callType = 'voice';
      }
      
      // Get optimal constraints
      const constraints = this.getOptimalConstraints(callType, retryCount);
      console.log('🎥 Using constraints:', constraints);
      
      let stream;
      
      if (callType === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      } else {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      // Validate stream
      if (!this.validateStream(stream, callType)) {
        throw new Error('Invalid stream received');
      }
      
      this.localStream = stream;
      this.setupStreamMonitoring(stream);
      
      console.log('✅ User media acquired successfully:', {
        audio: stream.getAudioTracks().length > 0,
        video: stream.getVideoTracks().length > 0,
        tracks: stream.getTracks().length
      });
      
      this.emit('localStreamAcquired', stream);
      return stream;
      
    } catch (error) {
      console.error(`❌ Error getting user media (attempt ${retryCount + 1}):`, error);
      
      return this.handleMediaError(error, callType, retryCount, maxRetries);
    }
  }

  /**
   * Handle media acquisition errors with fallbacks
   */
  async handleMediaError(error, callType, retryCount, maxRetries) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      const permissionError = new Error('Camera/microphone permissions denied. Please allow access and try again.');
      this.emit('permissionDenied', { error: permissionError, callType });
      throw permissionError;
    }
    
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      if (callType === 'video') {
        // Try audio-only as fallback
        console.log('🔄 Video device not found, trying audio-only...');
        try {
          return await this.getUserMedia('voice', 0);
        } catch (audioError) {
          const deviceError = new Error('No camera or microphone found. Please check your devices.');
          this.emit('deviceNotFound', { error: deviceError, callType });
          throw deviceError;
        }
      } else {
        const deviceError = new Error('No microphone found. Please check your audio devices.');
        this.emit('deviceNotFound', { error: deviceError, callType });
        throw deviceError;
      }
    }
    
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      if (retryCount < maxRetries) {
        console.log(`🔄 Device busy, retrying in 1 second... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getUserMedia(callType, retryCount + 1);
      } else {
        const busyError = new Error('Camera/microphone is busy or being used by another application.');
        this.emit('deviceBusy', { error: busyError, callType });
        throw busyError;
      }
    }
    
    if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      if (retryCount < maxRetries) {
        console.log('🔄 Constraints too strict, trying with relaxed constraints...');
        return this.getUserMedia(callType, retryCount + 1);
      }
    }
    
    // Final fallback - try most basic constraints
    if (retryCount === 0) {
      console.log('🔄 Trying basic fallback constraints...');
      try {
        const basicConstraints = {
          audio: true,
          video: callType === 'video' ? { width: 320, height: 240 } : false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        this.localStream = stream;
        this.setupStreamMonitoring(stream);
        
        console.log('✅ Fallback media acquired');
        this.emit('localStreamAcquired', stream);
        return stream;
      } catch (fallbackError) {
        console.error('❌ Final fallback also failed:', fallbackError);
      }
    }
    
    throw error;
  }

  /**
   * Get optimal media constraints with progressive fallback
   */
  getOptimalConstraints(callType, retryCount) {
    const baseConstraints = MEDIA_CONSTRAINTS[callType];
    
    if (!baseConstraints) {
      return MEDIA_CONSTRAINTS.voice;
    }
    
    switch (retryCount) {
      case 0:
        return baseConstraints; // Use ideal constraints
      case 1:
        // Reduce video quality
        return {
          audio: baseConstraints.audio,
          video: callType === 'video' ? {
            width: { min: 320, ideal: 640 },
            height: { min: 240, ideal: 480 },
            frameRate: { min: 15, ideal: 24 }
          } : baseConstraints.video
        };
      case 2:
        // Further reduce quality
        return {
          audio: true,
          video: callType === 'video' ? { width: 320, height: 240 } : false
        };
      default:
        // Most basic constraints
        return {
          audio: true,
          video: callType === 'video'
        };
    }
  }

  /**
   * Validate media stream
   */
  validateStream(stream, expectedType) {
    if (!stream || !(stream instanceof MediaStream)) {
      return false;
    }
    
    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();
    
    // Must have at least audio for voice/video calls
    if (audioTracks.length === 0 && expectedType !== 'screen') {
      console.warn('⚠️ Stream validation failed: No audio tracks');
      return false;
    }
    
    return true;
  }

  /**
   * Setup stream monitoring for track changes
   */
  setupStreamMonitoring(stream) {
    if (!stream) return;
    
    stream.getTracks().forEach(track => {
      track.onended = () => {
        console.warn(`⚠️ ${track.kind} track ended:`, track.label);
        this.emit('trackEnded', { track, kind: track.kind });
        this.handleTrackEnded(track);
      };
      
      track.onmute = () => {
        console.warn(`🔇 ${track.kind} track muted`);
        this.emit('trackMuted', { track, kind: track.kind });
      };
      
      track.onunmute = () => {
        console.log(`🔊 ${track.kind} track unmuted`);
        this.emit('trackUnmuted', { track, kind: track.kind });
      };
    });
  }

  /**
   * Handle track ended event with restart attempt
   */
  async handleTrackEnded(endedTrack) {
    try {
      console.log('🔄 Attempting to restart ended track:', endedTrack.kind);
      
      const isVideo = endedTrack.kind === 'video';
      const constraints = {
        audio: !isVideo,
        video: isVideo
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = isVideo ? newStream.getVideoTracks()[0] : newStream.getAudioTracks()[0];
      
      if (newTrack && this.peerConnection) {
        // Replace track in peer connection
        const sender = this.peerConnection.getSenders()
          .find(s => s.track && s.track.kind === endedTrack.kind);
        
        if (sender) {
          await sender.replaceTrack(newTrack);
          console.log(`✅ ${endedTrack.kind} track restarted successfully`);
          
          // Update local stream
          this.localStream.removeTrack(endedTrack);
          this.localStream.addTrack(newTrack);
          
          this.setupStreamMonitoring(newStream);
          this.emit('trackRestarted', { newTrack, kind: newTrack.kind });
        }
      }
    } catch (error) {
      console.error(`❌ Failed to restart ${endedTrack.kind} track:`, error);
      this.emit('trackRestartFailed', { track: endedTrack, error });
    }
  }

  /**
   * Create peer connection with comprehensive event handling
   */
  async createPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);
      
      // Setup event handlers
      this.peerConnection.onicecandidate = this.handleIceCandidate;
      this.peerConnection.ontrack = this.handleTrack;
      this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange;
      this.peerConnection.oniceconnectionstatechange = this.handleIceConnectionStateChange;
      this.peerConnection.onicegatheringstatechange = this.handleIceGatheringStateChange.bind(this);
      this.peerConnection.ondatachannel = this.handleDataChannel;
      
      console.log('✅ Peer connection created successfully');
      this.emit('peerConnectionCreated', this.peerConnection);
      
    } catch (error) {
      console.error('❌ Error creating peer connection:', error);
      throw new Error('Failed to create WebRTC peer connection');
    }
  }

  /**
   * Handle ICE candidate events
   */
  handleIceCandidate(event) {
    if (event.candidate && this.currentCall) {
      console.log('🧊 Sending ICE candidate:', event.candidate.type);
      
      this.sendSignalingMessage('webrtc_ice_candidate', {
        candidate: event.candidate,
        callId: this.currentCall.callId,
        chatId: this.currentCall.chatId
      });
    } else {
      console.log('🧊 ICE candidate gathering complete');
      this.emit('iceGatheringComplete');
    }
  }

  /**
   * Handle remote track events
   */
  handleTrack(event) {
    console.log('📺 Received remote track:', event.track.kind);
    
    if (event.streams && event.streams[0]) {
      this.remoteStream = event.streams[0];
      this.emit('remoteStreamReceived', this.remoteStream);
    }
    
    this.emit('remoteTrackReceived', {
      track: event.track,
      streams: event.streams
    });
  }

  /**
   * Handle connection state changes
   */
  handleConnectionStateChange() {
    if (!this.peerConnection) return;
    
    const state = this.peerConnection.connectionState;
    console.log('🔗 Connection state changed:', state);
    
    this.emit('connectionStateChanged', state);
    
    switch (state) {
      case 'connecting':
        this.setCallState(CALL_STATES.CONNECTING);
        break;
      case 'connected':
        console.log('✅ WebRTC connection established');
        this.setCallState(CALL_STATES.CONNECTED);
        this.startStatsCollection();
        this.emit('callConnected');
        break;
      case 'disconnected':
        console.warn('⚠️ WebRTC connection disconnected');
        this.handleConnectionDisconnected();
        break;
      case 'failed':
        console.error('❌ WebRTC connection failed');
        this.setCallState(CALL_STATES.FAILED);
        this.emit('callFailed', { reason: 'connection_failed' });
        break;
      case 'closed':
        console.log('🔚 WebRTC connection closed');
        this.emit('connectionClosed');
        break;
    }
  }

  /**
   * Handle ICE connection state changes
   */
  handleIceConnectionStateChange() {
    if (!this.peerConnection) return;
    
    const iceState = this.peerConnection.iceConnectionState;
    console.log('🧊 ICE connection state:', iceState);
    
    this.emit('iceConnectionStateChanged', iceState);
    
    switch (iceState) {
      case 'checking':
        console.log('🔍 ICE connectivity checks in progress');
        break;
      case 'connected':
      case 'completed':
        console.log('✅ ICE connectivity established');
        break;
      case 'failed':
        console.error('❌ ICE connectivity failed');
        this.handleIceConnectionFailure();
        break;
      case 'disconnected':
        console.warn('⚠️ ICE connection disconnected');
        this.handleIceDisconnected();
        break;
    }
  }

  /**
   * Handle ICE gathering state changes
   */
  handleIceGatheringStateChange() {
    const gatheringState = this.peerConnection.iceGatheringState;
    console.log('🧊 ICE gathering state:', gatheringState);
    this.emit('iceGatheringStateChanged', gatheringState);
  }

  /**
   * Handle data channel events
   */
  handleDataChannel(event) {
    console.log('📡 Data channel received:', event.channel.label);
    this.emit('dataChannelReceived', event.channel);
  }

  /**
   * Media control methods
   */
  toggleMute() {
    if (!this.localStream) return false;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMuted = !audioTrack.enabled;
      
      // Notify remote peer
      if (this.currentCall) {
        this.sendSignalingMessage('toggle_mute', {
          callId: this.currentCall.callId,
          chatId: this.currentCall.chatId,
          muted: this.isMuted
        });
      }
      
      this.emit('muteToggled', this.isMuted);
      return this.isMuted;
    }
    return false;
  }

  toggleVideo() {
    if (!this.localStream) return false;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isVideoEnabled = videoTrack.enabled;
      
      // Notify remote peer
      if (this.currentCall) {
        this.sendSignalingMessage('toggle_video', {
          callId: this.currentCall.callId,
          chatId: this.currentCall.chatId,
          videoEnabled: this.isVideoEnabled
        });
      }
      
      this.emit('videoToggled', this.isVideoEnabled);
      return this.isVideoEnabled;
    }
    return false;
  }

  async switchCamera() {
    if (!this.localStream || this.currentCall?.callType !== 'video') return;
    
    try {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
        
        // Stop current video track
        videoTrack.stop();
        
        // Get new video stream
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: newFacingMode }
        });
        
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        // Replace track in peer connection
        if (this.peerConnection) {
          const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
          }
        }
        
        // Update local stream
        this.localStream.removeTrack(videoTrack);
        this.localStream.addTrack(newVideoTrack);
        
        this.currentFacingMode = newFacingMode;
        this.emit('cameraSwitch', newFacingMode);
      }
    } catch (error) {
      console.error('❌ Error switching camera:', error);
      this.emit('cameraSwitchFailed', error);
    }
  }

  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      const videoTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track if in a call
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }
      
      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };
      
      this.isScreenSharing = true;
      this.emit('screenShareStarted');
      
      // Notify remote peer
      if (this.currentCall) {
        this.sendSignalingMessage('toggle_screen_share', {
          callId: this.currentCall.callId,
          chatId: this.currentCall.chatId,
          sharing: true
        });
      }
      
    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      this.emit('screenShareFailed', error);
    }
  }

  async stopScreenShare() {
    try {
      if (!this.isScreenSharing) return;
      
      // Get camera stream again
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: this.currentCall?.callType === 'video',
        audio: false
      });
      
      if (this.currentCall?.callType === 'video') {
        const videoTrack = cameraStream.getVideoTracks()[0];
        
        // Replace track in peer connection
        if (this.peerConnection) {
          const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }
      
      this.isScreenSharing = false;
      this.emit('screenShareStopped');
      
      // Notify remote peer
      if (this.currentCall) {
        this.sendSignalingMessage('toggle_screen_share', {
          callId: this.currentCall.callId,
          chatId: this.currentCall.chatId,
          sharing: false
        });
      }
      
    } catch (error) {
      console.error('❌ Error stopping screen share:', error);
      this.emit('screenShareFailed', error);
    }
  }

  /**
   * Signaling event handlers
   */
  async handleRemoteOffer(data) {
    try {
      console.log('📞 Received remote offer');
      
      // Store call information
      this.currentCall = {
        callId: data.callId,
        chatId: data.chatId,
        callType: data.callType,
        caller: data.caller,
        isInitiator: false
      };
      
      this.isInitiator = false;
      this.setCallState(CALL_STATES.RINGING);
      
      // Create peer connection if not exists
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }
      
      // Set remote description
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      
      this.emit('incomingCall', this.currentCall);
      
    } catch (error) {
      console.error('❌ Error handling remote offer:', error);
      this.emit('callError', { error, phase: 'offer_handling' });
    }
  }

  async handleRemoteAnswer(data) {
    try {
      console.log('📞 Received remote answer');
      
      if (this.peerConnection && data.answer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        this.setCallState(CALL_STATES.CONNECTED);
      }
    } catch (error) {
      console.error('❌ Error handling remote answer:', error);
      this.emit('callError', { error, phase: 'answer_handling' });
    }
  }

  async handleRemoteIceCandidate(data) {
    try {
      if (this.peerConnection && data.candidate) {
        if (this.isValidIceCandidate(data.candidate)) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('✅ ICE candidate added successfully:', data.candidate.type);
        } else {
          console.warn('⚠️ Invalid ICE candidate received:', data.candidate);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to add ICE candidate (non-fatal):', error.message);
    }
  }

  handleIncomingCall(data) {
    this.currentCall = {
      ...data,
      isInitiator: false
    };
    this.setCallState(CALL_STATES.RINGING);
    this.emit('incomingCall', this.currentCall);
  }

  handleCallAnswered(data) {
    this.setCallState(CALL_STATES.CONNECTED);
    this.emit('callAnswered', data);
  }

  handleCallDeclined(data) {
    this.setCallState(CALL_STATES.DECLINED);
    this.emit('callDeclined', data);
    this.cleanup();
  }

  handleCallEnded(data) {
    this.setCallState(CALL_STATES.ENDED);
    this.emit('callEnded', data);
    this.cleanup();
  }

  handleCallFailed(data) {
    this.setCallState(CALL_STATES.FAILED);
    this.emit('callFailed', data);
    this.cleanup();
  }

  /**
   * Connection recovery methods
   */
  handleConnectionDisconnected() {
    this.setCallState(CALL_STATES.RECONNECTING);
    this.emit('connectionDisconnected');
    this.attemptReconnection();
  }

  handleIceDisconnected() {
    setTimeout(() => {
      if (this.peerConnection?.iceConnectionState === 'disconnected') {
        console.warn('🔄 ICE still disconnected, attempting restart');
        this.restartIce();
      }
    }, 5000);
  }

  handleIceConnectionFailure() {
    this.emit('connectionTrouble', { type: 'ice_failure' });
    
    setTimeout(() => {
      if (this.peerConnection && this.peerConnection.iceConnectionState === 'failed') {
        this.restartIce();
      }
    }, 2000);
  }

  async restartIce() {
    if (!this.peerConnection || !this.currentCall) return;
    
    try {
      console.log('🔄 Restarting ICE connection');
      
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);
      
      this.sendSignalingMessage('webrtc_offer', {
        offer,
        callId: this.currentCall.callId,
        chatId: this.currentCall.chatId,
        callType: this.currentCall.callType,
        isRestart: true
      });
      
      this.emit('iceRestart');
      
    } catch (error) {
      console.error('❌ Error restarting ICE:', error);
    }
  }

  async attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      this.emit('reconnectionFailed');
      await this.endCall('connection_failed');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`🔄 Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      if (this.peerConnection?.connectionState === 'disconnected') {
        try {
          await this.restartIce();
          
          // If ICE restart doesn't work after 10 seconds, try full reconnection
          setTimeout(() => {
            if (this.peerConnection?.connectionState === 'disconnected') {
              console.log('🔄 ICE restart failed, attempting full reconnection');
              this.emit('reconnectionNeeded');
            }
          }, 10000);
        } catch (error) {
          console.error('❌ Error during reconnection attempt:', error);
          this.attemptReconnection();
        }
      }
    }, 3000 * this.reconnectAttempts); // Exponential backoff
  }

  /**
   * Statistics collection
   */
  startStatsCollection() {
    if (!this.peerConnection) return;
    
    this.statsInterval = setInterval(async () => {
      try {
        const stats = await this.peerConnection.getStats();
        this.processStats(stats);
      } catch (error) {
        console.error('❌ Error collecting stats:', error);
      }
    }, 5000);
  }

  processStats(stats) {
    let audioQuality = 'unknown';
    let videoQuality = 'unknown';
    
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        if (report.jitter !== undefined) {
          audioQuality = report.jitter < 0.03 ? 'excellent' : 
                        report.jitter < 0.05 ? 'good' : 
                        report.jitter < 0.1 ? 'fair' : 'poor';
        }
        
        this.callStats.packetsLost += report.packetsLost || 0;
        this.callStats.bytesReceived += report.bytesReceived || 0;
      }
      
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        if (report.framesPerSecond !== undefined) {
          videoQuality = report.framesPerSecond > 25 ? 'excellent' :
                        report.framesPerSecond > 20 ? 'good' :
                        report.framesPerSecond > 15 ? 'fair' : 'poor';
        }
      }
      
      if (report.type === 'outbound-rtp') {
        this.callStats.bytesSent += report.bytesSent || 0;
      }
    });
    
    this.callStats.quality = this.currentCall?.callType === 'video' ? videoQuality : audioQuality;
    this.emit('statsUpdated', this.callStats);
  }

  /**
   * Device management
   */
  async refreshAvailableDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      this.availableDevices = {
        audioInputs: devices.filter(d => d.kind === 'audioinput'),
        audioOutputs: devices.filter(d => d.kind === 'audiooutput'),
        videoInputs: devices.filter(d => d.kind === 'videoinput')
      };
      
      this.emit('devicesUpdated', this.availableDevices);
      
    } catch (error) {
      console.error('❌ Error enumerating devices:', error);
      this.availableDevices = {
        audioInputs: [],
        audioOutputs: [],
        videoInputs: []
      };
    }
  }

  setupDeviceChangeMonitoring() {
    if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
      navigator.mediaDevices.ondevicechange = async () => {
        console.log('🔄 Media devices changed');
        await this.refreshAvailableDevices();
        
        // Handle device changes during active call
        if (this.localStream && this.peerConnection) {
          await this.handleDeviceChangeInCall();
        }
      };
    }
  }

  async handleDeviceChangeInCall() {
    if (!this.localStream) return;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    const videoTrack = this.localStream.getVideoTracks()[0];
    
    // Check if current devices are still available
    if (audioTrack) {
      const currentAudioDevice = audioTrack.getSettings().deviceId;
      const isAudioDeviceAvailable = this.availableDevices.audioInputs
        .some(device => device.deviceId === currentAudioDevice);
      
      if (!isAudioDeviceAvailable && this.availableDevices.audioInputs.length > 0) {
        console.log('🔄 Current audio device disconnected, switching to default');
        await this.switchToDefaultDevice('audio');
      }
    }
    
    if (videoTrack) {
      const currentVideoDevice = videoTrack.getSettings().deviceId;
      const isVideoDeviceAvailable = this.availableDevices.videoInputs
        .some(device => device.deviceId === currentVideoDevice);
      
      if (!isVideoDeviceAvailable && this.availableDevices.videoInputs.length > 0) {
        console.log('🔄 Current video device disconnected, switching to default');
        await this.switchToDefaultDevice('video');
      }
    }
  }

  async switchToDefaultDevice(deviceType) {
    try {
      const constraints = {
        audio: deviceType === 'audio',
        video: deviceType === 'video'
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const newTrack = deviceType === 'video' 
        ? newStream.getVideoTracks()[0] 
        : newStream.getAudioTracks()[0];
      
      if (newTrack && this.peerConnection) {
        const sender = this.peerConnection.getSenders()
          .find(s => s.track && s.track.kind === deviceType);
        
        if (sender) {
          await sender.replaceTrack(newTrack);
          
          // Update local stream
          const oldTrack = deviceType === 'video'
            ? this.localStream.getVideoTracks()[0]
            : this.localStream.getAudioTracks()[0];
          
          if (oldTrack) {
            oldTrack.stop();
            this.localStream.removeTrack(oldTrack);
          }
          
          this.localStream.addTrack(newTrack);
          this.setupStreamMonitoring(newStream);
          
          console.log(`✅ Switched to default ${deviceType} device`);
          this.emit('deviceSwitched', { deviceType, newTrack });
        }
      }
    } catch (error) {
      console.error(`❌ Failed to switch to default ${deviceType} device:`, error);
      this.emit('deviceSwitchFailed', { deviceType, error });
    }
  }

  /**
   * Utility methods
   */
  setCallState(newState) {
    if (this.callState !== newState) {
      const previousState = this.callState;
      this.callState = newState;
      
      console.log(`📞 Call state changed: ${previousState} → ${newState}`);
      this.emit('callStateChanged', {
        previousState,
        currentState: newState,
        call: this.currentCall
      });
    }
  }

  startCallTimer() {
    this.callStartTime = Date.now();
    this.callStats.startTime = this.callStartTime;
    
    this.callTimer = setInterval(() => {
      const duration = Math.floor((Date.now() - this.callStartTime) / 1000);
      this.callStats.duration = duration;
      this.emit('callDurationUpdated', duration);
    }, 1000);
  }

  stopCallTimer() {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
    
    return this.callStartTime ? Math.floor((Date.now() - this.callStartTime) / 1000) : 0;
  }

  setCallTimeout(timeout) {
    setTimeout(() => {
      if (this.callState === CALL_STATES.CALLING || this.callState === CALL_STATES.RINGING) {
        this.emit('callTimeout');
        this.endCall('timeout');
      }
    }, timeout);
  }

  sendSignalingMessage(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Cannot send signaling message - socket not connected');
    }
  }

  isValidIceCandidate(candidate) {
    return candidate && 
           typeof candidate === 'object' &&
           typeof candidate.candidate === 'string' &&
           typeof candidate.sdpMLineIndex === 'number' &&
           candidate.candidate.trim().length > 0;
  }

  getCurrentUserInfo() {
    // Get user from context or local storage if needed
    return {
      profileid: 'user_' + Date.now(),
      username: 'WebRTC User'
    };
  }

  handleSocketDisconnect() {
    console.log('🔌 Socket disconnected');
    this.emit('socketDisconnected');
  }

  handleSocketReconnect() {
    console.log('🔌 Socket reconnected');
    this.emit('socketReconnected');
  }

  /**
   * Remote event handlers
   */
  handleRemoteMuteToggle(data) {
    this.emit('remoteMuteToggled', data);
  }

  handleRemoteVideoToggle(data) {
    this.emit('remoteVideoToggled', data);
  }

  handleRemoteScreenShareToggle(data) {
    this.emit('remoteScreenShareToggled', data);
  }

  /**
   * Cleanup and resource management
   */
  async cleanup() {
    console.log('🧹 Cleaning up WebRTC resources');
    
    // Stop timers
    this.stopCallTimer();
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor);
      this.connectionMonitor = null;
    }
    
    // Cleanup media streams
    this.cleanupMediaStreams();
    
    // Close peer connection
    if (this.peerConnection) {
      try {
        // Remove event listeners
        this.peerConnection.onicecandidate = null;
        this.peerConnection.ontrack = null;
        this.peerConnection.onconnectionstatechange = null;
        this.peerConnection.oniceconnectionstatechange = null;
        this.peerConnection.onicegatheringstatechange = null;
        this.peerConnection.ondatachannel = null;
        
        this.peerConnection.close();
        this.peerConnection = null;
        
        console.log('✅ Peer connection closed successfully');
      } catch (error) {
        console.error('❌ Error closing peer connection:', error);
      }
    }
    
    // Reset state
    this.remoteStream = null;
    this.currentCall = null;
    this.isInitiator = false;
    this.callState = CALL_STATES.IDLE;
    this.isMuted = false;
    this.isVideoEnabled = true;
    this.isScreenSharing = false;
    this.callStartTime = null;
    this.reconnectAttempts = 0;
    
    // Reset stats
    this.callStats = {
      startTime: null,
      duration: 0,
      quality: 'unknown',
      bytesReceived: 0,
      bytesSent: 0,
      packetsLost: 0
    };
    
    this.emit('cleaned');
    console.log('✅ WebRTC cleanup completed');
  }

  cleanupMediaStreams() {
    if (this.localStream) {
      console.log('📹 Stopping local stream tracks');
      
      this.localStream.getTracks().forEach(track => {
        try {
          console.log(`Stopping ${track.kind} track:`, track.label);
          track.stop();
          
          // Remove event listeners
          track.onended = null;
          track.onmute = null;
          track.onunmute = null;
        } catch (error) {
          console.error(`Error stopping ${track.kind} track:`, error);
        }
      });
      
      this.localStream = null;
    }
    
    if (this.remoteStream) {
      console.log('📺 Cleaning up remote stream references');
      this.remoteStream = null;
    }
  }

  /**
   * Public API methods
   */
  getCallState() {
    return {
      state: this.callState,
      currentCall: this.currentCall,
      isInitiator: this.isInitiator,
      isMuted: this.isMuted,
      isVideoEnabled: this.isVideoEnabled,
      isScreenSharing: this.isScreenSharing,
      duration: this.callStartTime ? Math.floor((Date.now() - this.callStartTime) / 1000) : 0,
      connectionState: this.peerConnection?.connectionState,
      iceConnectionState: this.peerConnection?.iceConnectionState,
      stats: this.callStats
    };
  }

  getAvailableDevices() {
    return this.availableDevices;
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  isInCall() {
    return this.callState !== CALL_STATES.IDLE && this.callState !== CALL_STATES.ENDED;
  }

  destroy() {
    this.cleanup();
    this.removeAllListeners();
    
    if (navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = null;
    }
  }
}

// Create singleton instance
const webrtcService = new UnifiedWebRTCService();

export default webrtcService;
export { CALL_STATES, MEDIA_CONSTRAINTS, WEBRTC_CONFIG };