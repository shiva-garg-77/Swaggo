/**
 * Call Management Service
 * Comprehensive call state management, media stream handling, and real-time signaling
 */

import { EventEmitter } from 'events';
import socketService from './SocketService';
import authService from './AuthService';
import errorHandlingService, { ERROR_TYPES } from './ErrorHandlingService';
import notificationService from './NotificationService';
import cacheService from './CacheService';

/**
 * Call States
 */
export const CALL_STATES = {
  IDLE: 'idle',
  INITIATING: 'initiating',
  CALLING: 'calling',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ON_HOLD: 'on_hold',
  MUTED: 'muted',
  RECONNECTING: 'reconnecting',
  ENDING: 'ending',
  ENDED: 'ended',
  FAILED: 'failed',
  REJECTED: 'rejected',
  MISSED: 'missed',
  BUSY: 'busy',
  NO_ANSWER: 'no_answer'
};

/**
 * Call Types
 */
export const CALL_TYPES = {
  VOICE: 'voice',
  VIDEO: 'video',
  SCREEN_SHARE: 'screen_share',
  CONFERENCE: 'conference'
};

/**
 * Media States
 */
export const MEDIA_STATES = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  MUTED: 'muted',
  UNAVAILABLE: 'unavailable',
  REQUESTING: 'requesting',
  DENIED: 'denied'
};

/**
 * Call Events
 */
export const CALL_EVENTS = {
  // Call lifecycle
  CALL_INITIATED: 'call_initiated',
  CALL_RECEIVED: 'call_received',
  CALL_ACCEPTED: 'call_accepted',
  CALL_REJECTED: 'call_rejected',
  CALL_ENDED: 'call_ended',
  CALL_FAILED: 'call_failed',
  
  // Call state changes
  STATE_CHANGED: 'state_changed',
  PARTICIPANT_JOINED: 'participant_joined',
  PARTICIPANT_LEFT: 'participant_left',
  
  // Media events
  MEDIA_STATE_CHANGED: 'media_state_changed',
  STREAM_ADDED: 'stream_added',
  STREAM_REMOVED: 'stream_removed',
  STREAM_ERROR: 'stream_error',
  
  // Connection events
  CONNECTION_QUALITY_CHANGED: 'connection_quality_changed',
  ICE_CONNECTION_STATE_CHANGED: 'ice_connection_state_changed',
  
  // UI events
  UI_STATE_CHANGED: 'ui_state_changed'
};

/**
 * Connection Quality Levels
 */
export const CONNECTION_QUALITY = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  FAILED: 'failed'
};

/**
 * Call Management Service Class
 */
class CallService extends EventEmitter {
  constructor() {
    super();
    
    // Call state management
    this.calls = new Map(); // callId -> call object
    this.activeCallId = null;
    this.callHistory = [];
    this.maxHistorySize = 100;
    
    // Media management
    this.localStream = null;
    this.remoteStreams = new Map(); // participantId -> stream
    this.mediaConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000,
        sampleSize: 16
      },
      video: {
        width: { min: 320, ideal: 1280, max: 1920 },
        height: { min: 240, ideal: 720, max: 1080 },
        frameRate: { min: 15, ideal: 30, max: 60 }
      }
    };
    
    // WebRTC configuration
    this.rtcConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'turn:turnserver.example.com:3478',
          username: 'user',
          credential: 'pass'
        }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };
    
    // Peer connections
    this.peerConnections = new Map(); // participantId -> RTCPeerConnection
    this.dataChannels = new Map(); // participantId -> RTCDataChannel
    
    // Service configuration
    this.config = {
      maxCallDuration: 4 * 60 * 60 * 1000, // 4 hours
      connectionTimeout: 30000, // 30 seconds
      offerTimeout: 20000, // 20 seconds
      answerTimeout: 15000, // 15 seconds
      iceTimeout: 10000, // 10 seconds
      reconnectAttempts: 3,
      reconnectDelay: 2000,
      qualityCheckInterval: 5000, // 5 seconds
      statsCollectionInterval: 1000, // 1 second
      enableRecording: false,
      enableScreenShare: true,
      enableFileSharing: true,
      maxParticipants: 8
    };
    
    // Quality monitoring
    this.connectionStats = new Map(); // participantId -> stats
    this.qualityMonitorTimer = null;
    this.statsCollectionTimer = null;
    
    // UI state
    this.uiState = {
      isCallWindowOpen: false,
      isMinimized: false,
      currentView: 'grid', // grid, spotlight, presentation
      showControls: true,
      showChat: false,
      showParticipants: false
    };
    
    // Recording and sharing
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.sharedScreen = null;
    
    // Statistics
    this.stats = {
      totalCalls: 0,
      completedCalls: 0,
      failedCalls: 0,
      averageCallDuration: 0,
      totalCallTime: 0,
      connectionIssues: 0,
      mediaErrors: 0
    };
    
    this.initializeService();
  }

  /**
   * Initialize the service
   */
  initializeService() {
    this.setupSocketListeners();
    this.setupAuthListeners();
    this.checkMediaCapabilities();
  }

  /**
   * Setup socket event listeners
   */
  setupSocketListeners() {
    // Call signaling events
    socketService.on('call_offer', (data) => {
      this.handleCallOffer(data);
    });

    socketService.on('call_answer', (data) => {
      this.handleCallAnswer(data);
    });

    socketService.on('call_reject', (data) => {
      this.handleCallReject(data);
    });

    socketService.on('call_end', (data) => {
      this.handleCallEnd(data);
    });

    socketService.on('ice_candidate', (data) => {
      this.handleIceCandidate(data);
    });

    socketService.on('call_state_change', (data) => {
      this.handleRemoteStateChange(data);
    });

    // Connection events
    socketService.on('disconnected', () => {
      this.handleSocketDisconnection();
    });

    socketService.on('reconnected', () => {
      this.handleSocketReconnection();
    });
  }

  /**
   * Setup authentication listeners
   */
  setupAuthListeners() {
    authService.on('authStateChanged', (state) => {
      if (!state.isAuthenticated) {
        this.endAllCalls('authentication_lost');
      }
    });
  }

  /**
   * Check media capabilities
   */
  async checkMediaCapabilities() {
    try {
      // Check if WebRTC is supported
      if (!window.RTCPeerConnection) {
        throw new Error('WebRTC not supported');
      }

      // Check media device access
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudio = devices.some(device => device.kind === 'audioinput');
      const hasVideo = devices.some(device => device.kind === 'videoinput');

      console.log(`📱 Media capabilities: Audio: ${hasAudio}, Video: ${hasVideo}`);
      
      return { hasAudio, hasVideo, isSupported: true };
    } catch (error) {
      console.error('Media capabilities check failed:', error);
      
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.MEDIA_ERROR,
          'Failed to check media capabilities',
          { error }
        )
      );
      
      return { hasAudio: false, hasVideo: false, isSupported: false };
    }
  }

  /**
   * Initiate a call
   */
  async initiateCall(participants, options = {}) {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      if (!socketService.isConnected()) {
        throw new Error('Not connected to signaling server');
      }

      const {
        type = CALL_TYPES.VOICE,
        video = type === CALL_TYPES.VIDEO,
        audio = true,
        screenShare = false
      } = options;

      // Create call object
      const callId = this.generateCallId();
      const call = {
        id: callId,
        type,
        state: CALL_STATES.INITIATING,
        participants: Array.isArray(participants) ? participants : [participants],
        initiator: authService.getCurrentUser().id,
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        mediaState: {
          audio: audio ? MEDIA_STATES.REQUESTING : MEDIA_STATES.DISABLED,
          video: video ? MEDIA_STATES.REQUESTING : MEDIA_STATES.DISABLED,
          screenShare: screenShare ? MEDIA_STATES.REQUESTING : MEDIA_STATES.DISABLED
        },
        connectionQuality: CONNECTION_QUALITY.GOOD,
        metadata: options.metadata || {}
      };

      // Store call
      this.calls.set(callId, call);
      this.activeCallId = callId;
      this.stats.totalCalls++;

      // Get local media stream
      try {
        this.localStream = await this.getLocalStream({
          audio,
          video,
          screenShare
        });
        
        call.mediaState.audio = audio && this.localStream.getAudioTracks().length > 0 
          ? MEDIA_STATES.ENABLED 
          : MEDIA_STATES.UNAVAILABLE;
        call.mediaState.video = video && this.localStream.getVideoTracks().length > 0 
          ? MEDIA_STATES.ENABLED 
          : MEDIA_STATES.UNAVAILABLE;

      } catch (mediaError) {
        console.error('Failed to get local media:', mediaError);
        call.mediaState.audio = MEDIA_STATES.DENIED;
        call.mediaState.video = MEDIA_STATES.DENIED;
      }

      // Create peer connections for each participant
      for (const participantId of call.participants) {
        await this.createPeerConnection(callId, participantId);
      }

      // Send call offer via socket
      const offerData = {
        callId,
        type,
        participants: call.participants,
        initiator: call.initiator,
        mediaConstraints: {
          audio,
          video,
          screenShare
        }
      };

      socketService.socket.emit('call_offer', offerData);

      // Update call state
      call.state = CALL_STATES.CALLING;
      this.updateCallState(call);

      // Set timeout for no answer
      setTimeout(() => {
        const currentCall = this.calls.get(callId);
        if (currentCall && currentCall.state === CALL_STATES.CALLING) {
          this.endCall(callId, CALL_STATES.NO_ANSWER);
        }
      }, this.config.offerTimeout);

      this.emit(CALL_EVENTS.CALL_INITIATED, { call });
      
      console.log(`📞 Call initiated: ${callId}`);
      return call;

    } catch (error) {
      this.stats.failedCalls++;
      
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CALL_INITIATION_FAILED,
          'Failed to initiate call',
          { participants, options, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Accept an incoming call
   */
  async acceptCall(callId, options = {}) {
    try {
      const call = this.calls.get(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      if (call.state !== CALL_STATES.RINGING) {
        throw new Error('Call not in ringing state');
      }

      const { video = true, audio = true } = options;

      // Get local media stream
      try {
        this.localStream = await this.getLocalStream({ audio, video });
        
        call.mediaState.audio = audio && this.localStream.getAudioTracks().length > 0 
          ? MEDIA_STATES.ENABLED 
          : MEDIA_STATES.UNAVAILABLE;
        call.mediaState.video = video && this.localStream.getVideoTracks().length > 0 
          ? MEDIA_STATES.ENABLED 
          : MEDIA_STATES.UNAVAILABLE;
          
      } catch (mediaError) {
        console.error('Failed to get local media:', mediaError);
        call.mediaState.audio = MEDIA_STATES.DENIED;
        call.mediaState.video = MEDIA_STATES.DENIED;
      }

      // Create peer connection
      const peerConnection = await this.createPeerConnection(callId, call.initiator);
      
      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, this.localStream);
        });
      }

      // Update call state
      call.state = CALL_STATES.CONNECTING;
      this.activeCallId = callId;
      this.updateCallState(call);

      // Send answer via socket
      socketService.socket.emit('call_answer', {
        callId,
        participantId: authService.getCurrentUser().id,
        mediaConstraints: { audio, video }
      });

      this.emit(CALL_EVENTS.CALL_ACCEPTED, { call });
      
      console.log(`✅ Call accepted: ${callId}`);
      return call;

    } catch (error) {
      this.stats.failedCalls++;
      
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CALL_ACCEPT_FAILED,
          'Failed to accept call',
          { callId, options, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Reject a call
   */
  async rejectCall(callId, reason = 'user_declined') {
    try {
      const call = this.calls.get(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      // Update call state
      call.state = CALL_STATES.REJECTED;
      call.endTime = Date.now();
      call.duration = call.endTime - call.startTime;
      this.updateCallState(call);

      // Send rejection via socket
      socketService.socket.emit('call_reject', {
        callId,
        participantId: authService.getCurrentUser().id,
        reason
      });

      // Cleanup
      this.cleanupCall(callId);

      this.emit(CALL_EVENTS.CALL_REJECTED, { call, reason });
      
      console.log(`❌ Call rejected: ${callId}, reason: ${reason}`);
      return true;

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CALL_REJECT_FAILED,
          'Failed to reject call',
          { callId, reason, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * End a call
   */
  async endCall(callId = this.activeCallId, reason = 'user_ended') {
    try {
      const call = this.calls.get(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      // Update call state
      call.state = CALL_STATES.ENDING;
      this.updateCallState(call);

      // Send end call signal
      socketService.socket.emit('call_end', {
        callId,
        participantId: authService.getCurrentUser().id,
        reason
      });

      // Finalize call
      call.state = CALL_STATES.ENDED;
      call.endTime = Date.now();
      call.duration = call.endTime - call.startTime;
      
      // Update statistics
      if (call.state === CALL_STATES.ENDED) {
        this.stats.completedCalls++;
        this.stats.totalCallTime += call.duration;
        this.stats.averageCallDuration = this.stats.totalCallTime / this.stats.completedCalls;
      }

      this.updateCallState(call);

      // Cleanup call resources
      await this.cleanupCall(callId);

      // Add to history
      this.addToHistory(call);

      this.emit(CALL_EVENTS.CALL_ENDED, { call, reason });
      
      console.log(`🔴 Call ended: ${callId}, duration: ${Math.round(call.duration/1000)}s`);
      return true;

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CALL_END_FAILED,
          'Failed to end call',
          { callId, reason, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Handle incoming call offer
   */
  async handleCallOffer(data) {
    try {
      const { callId, type, initiator, participants, mediaConstraints } = data;
      
      const currentUser = authService.getCurrentUser();
      if (!participants.includes(currentUser.id)) {
        console.warn('Received call offer not intended for this user');
        return;
      }

      // Check if user is already in a call
      if (this.activeCallId) {
        // Send busy signal
        socketService.socket.emit('call_reject', {
          callId,
          participantId: currentUser.id,
          reason: 'busy'
        });
        return;
      }

      // Create call object
      const call = {
        id: callId,
        type,
        state: CALL_STATES.RINGING,
        participants,
        initiator,
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        mediaState: {
          audio: MEDIA_STATES.ENABLED,
          video: type === CALL_TYPES.VIDEO ? MEDIA_STATES.ENABLED : MEDIA_STATES.DISABLED,
          screenShare: MEDIA_STATES.DISABLED
        },
        connectionQuality: CONNECTION_QUALITY.GOOD,
        metadata: {}
      };

      // Store call
      this.calls.set(callId, call);
      this.updateCallState(call);

      // Show incoming call notification
      this.showIncomingCallNotification(call);

      this.emit(CALL_EVENTS.CALL_RECEIVED, { call });
      
      console.log(`📞 Incoming call received: ${callId} from ${initiator}`);

      // Auto-reject after timeout
      setTimeout(() => {
        const currentCall = this.calls.get(callId);
        if (currentCall && currentCall.state === CALL_STATES.RINGING) {
          this.rejectCall(callId, 'no_answer');
        }
      }, this.config.answerTimeout);

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CALL_OFFER_HANDLING_FAILED,
          'Failed to handle call offer',
          { data, error }
        )
      );
    }
  }

  /**
   * Handle call answer
   */
  async handleCallAnswer(data) {
    try {
      const { callId, participantId, mediaConstraints } = data;
      const call = this.calls.get(callId);
      
      if (!call || call.state !== CALL_STATES.CALLING) {
        console.warn('Invalid call answer received');
        return;
      }

      // Update call state
      call.state = CALL_STATES.CONNECTING;
      this.updateCallState(call);

      // Create or update peer connection
      const peerConnection = this.peerConnections.get(participantId) || 
                           await this.createPeerConnection(callId, participantId);

      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, this.localStream);
        });
      }

      this.emit(CALL_EVENTS.CALL_ACCEPTED, { call, participantId });
      
      console.log(`✅ Call answered by: ${participantId}`);

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CALL_ANSWER_HANDLING_FAILED,
          'Failed to handle call answer',
          { data, error }
        )
      );
    }
  }

  /**
   * Handle call rejection
   */
  handleCallReject(data) {
    try {
      const { callId, participantId, reason } = data;
      const call = this.calls.get(callId);
      
      if (!call) {
        console.warn('Call rejection for unknown call');
        return;
      }

      // Update call state
      call.state = reason === 'busy' ? CALL_STATES.BUSY : CALL_STATES.REJECTED;
      call.endTime = Date.now();
      call.duration = call.endTime - call.startTime;
      this.updateCallState(call);

      // Cleanup
      this.cleanupCall(callId);
      this.addToHistory(call);

      this.emit(CALL_EVENTS.CALL_REJECTED, { call, participantId, reason });
      
      console.log(`❌ Call rejected by ${participantId}: ${reason}`);

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CALL_REJECT_HANDLING_FAILED,
          'Failed to handle call rejection',
          { data, error }
        )
      );
    }
  }

  /**
   * Handle call end
   */
  handleCallEnd(data) {
    try {
      const { callId, participantId, reason } = data;
      const call = this.calls.get(callId);
      
      if (!call) {
        console.warn('Call end for unknown call');
        return;
      }

      // If this is the active call, end it
      if (callId === this.activeCallId) {
        this.endCall(callId, reason);
      }
      
      console.log(`🔴 Call ended by ${participantId}: ${reason}`);

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CALL_END_HANDLING_FAILED,
          'Failed to handle call end',
          { data, error }
        )
      );
    }
  }

  /**
   * Handle ICE candidate
   */
  async handleIceCandidate(data) {
    try {
      const { callId, participantId, candidate } = data;
      const peerConnection = this.peerConnections.get(participantId);
      
      if (!peerConnection) {
        console.warn('Received ICE candidate for unknown peer connection');
        return;
      }

      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`🧊 ICE candidate added for ${participantId}`);

    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  /**
   * Handle remote state change
   */
  handleRemoteStateChange(data) {
    try {
      const { callId, participantId, state, mediaState } = data;
      const call = this.calls.get(callId);
      
      if (!call) {
        console.warn('State change for unknown call');
        return;
      }

      // Update call state if applicable
      if (state && state !== call.state) {
        call.state = state;
        this.updateCallState(call);
      }

      this.emit(CALL_EVENTS.STATE_CHANGED, { call, participantId, state, mediaState });
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CALL_STATE_CHANGE_FAILED,
          'Failed to handle remote state change',
          { data, error }
        )
      );
    }
  }

  /**
   * Create peer connection
   */
  async createPeerConnection(callId, participantId) {
    try {
      const peerConnection = new RTCPeerConnection(this.rtcConfiguration);
      
      // Store peer connection
      this.peerConnections.set(participantId, peerConnection);

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.socket.emit('ice_candidate', {
            callId,
            participantId: authService.getCurrentUser().id,
            targetId: participantId,
            candidate: event.candidate.toJSON()
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        this.remoteStreams.set(participantId, remoteStream);
        
        this.emit(CALL_EVENTS.STREAM_ADDED, { 
          participantId, 
          stream: remoteStream 
        });
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log(`🔗 Connection state for ${participantId}: ${state}`);
        
        if (state === 'connected') {
          const call = this.calls.get(callId);
          if (call) {
            call.state = CALL_STATES.CONNECTED;
            this.updateCallState(call);
            this.startQualityMonitoring(callId);
          }
        } else if (state === 'failed' || state === 'disconnected') {
          this.handleConnectionFailure(callId, participantId);
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        console.log(`🧊 ICE connection state for ${participantId}: ${state}`);
        
        this.emit(CALL_EVENTS.ICE_CONNECTION_STATE_CHANGED, { 
          participantId, 
          state 
        });
      };

      // Create data channel for additional features
      if (this.config.enableFileSharing) {
        const dataChannel = peerConnection.createDataChannel('fileTransfer', {
          ordered: true
        });
        this.dataChannels.set(participantId, dataChannel);
      }

      return peerConnection;

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.PEER_CONNECTION_FAILED,
          'Failed to create peer connection',
          { callId, participantId, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Get local media stream
   */
  async getLocalStream(constraints = {}) {
    try {
      const { audio = true, video = false, screenShare = false } = constraints;
      
      if (screenShare) {
        // Get screen share stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          this.stopScreenShare();
        });
        
        this.sharedScreen = screenStream;
        return screenStream;
      } else {
        // Get camera/microphone stream
        const mediaConstraints = {
          audio: audio ? this.mediaConstraints.audio : false,
          video: video ? this.mediaConstraints.video : false
        };
        
        return await navigator.mediaDevices.getUserMedia(mediaConstraints);
      }

    } catch (error) {
      this.stats.mediaErrors++;
      
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.MEDIA_ACCESS_DENIED,
          'Failed to get local media stream',
          { constraints, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Toggle mute/unmute audio
   */
  toggleMute(callId = this.activeCallId) {
    try {
      const call = this.calls.get(callId);
      if (!call || !this.localStream) {
        throw new Error('No active call or local stream');
      }

      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available');
      }

      const isCurrentlyMuted = call.mediaState.audio === MEDIA_STATES.MUTED;
      const newMuteState = !isCurrentlyMuted;

      audioTracks.forEach(track => {
        track.enabled = !newMuteState;
      });

      // Update call state
      call.mediaState.audio = newMuteState ? MEDIA_STATES.MUTED : MEDIA_STATES.ENABLED;
      this.updateCallState(call);

      // Notify other participants
      socketService.socket.emit('call_state_change', {
        callId,
        participantId: authService.getCurrentUser().id,
        mediaState: call.mediaState
      });

      this.emit(CALL_EVENTS.MEDIA_STATE_CHANGED, { 
        callId, 
        type: 'audio', 
        state: call.mediaState.audio 
      });

      console.log(`🔇 Audio ${newMuteState ? 'muted' : 'unmuted'}`);
      return newMuteState;

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.MEDIA_TOGGLE_FAILED,
          'Failed to toggle mute',
          { callId, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Toggle video on/off
   */
  toggleVideo(callId = this.activeCallId) {
    try {
      const call = this.calls.get(callId);
      if (!call || !this.localStream) {
        throw new Error('No active call or local stream');
      }

      const videoTracks = this.localStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video tracks available');
      }

      const isCurrentlyDisabled = call.mediaState.video === MEDIA_STATES.DISABLED;
      const newVideoState = !isCurrentlyDisabled;

      videoTracks.forEach(track => {
        track.enabled = newVideoState;
      });

      // Update call state
      call.mediaState.video = newVideoState ? MEDIA_STATES.ENABLED : MEDIA_STATES.DISABLED;
      this.updateCallState(call);

      // Notify other participants
      socketService.socket.emit('call_state_change', {
        callId,
        participantId: authService.getCurrentUser().id,
        mediaState: call.mediaState
      });

      this.emit(CALL_EVENTS.MEDIA_STATE_CHANGED, { 
        callId, 
        type: 'video', 
        state: call.mediaState.video 
      });

      console.log(`📹 Video ${newVideoState ? 'enabled' : 'disabled'}`);
      return newVideoState;

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.MEDIA_TOGGLE_FAILED,
          'Failed to toggle video',
          { callId, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(callId = this.activeCallId) {
    try {
      if (!this.config.enableScreenShare) {
        throw new Error('Screen sharing is disabled');
      }

      const call = this.calls.get(callId);
      if (!call) {
        throw new Error('No active call');
      }

      // Get screen share stream
      const screenStream = await this.getLocalStream({ screenShare: true });
      
      // Replace video track in peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      for (const [participantId, peerConnection] of this.peerConnections) {
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      // Update call state
      call.mediaState.screenShare = MEDIA_STATES.ENABLED;
      this.updateCallState(call);

      this.emit(CALL_EVENTS.MEDIA_STATE_CHANGED, { 
        callId, 
        type: 'screenShare', 
        state: MEDIA_STATES.ENABLED 
      });

      console.log('🖥️ Screen sharing started');
      return true;

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.SCREEN_SHARE_FAILED,
          'Failed to start screen sharing',
          { callId, error }
        )
      );
      
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(callId = this.activeCallId) {
    try {
      const call = this.calls.get(callId);
      if (!call || !this.sharedScreen) {
        return;
      }

      // Stop screen share tracks
      this.sharedScreen.getTracks().forEach(track => track.stop());
      this.sharedScreen = null;

      // Get camera stream back
      if (call.mediaState.video === MEDIA_STATES.ENABLED) {
        const cameraStream = await this.getLocalStream({ video: true });
        const videoTrack = cameraStream.getVideoTracks()[0];
        
        // Replace track in peer connections
        for (const [participantId, peerConnection] of this.peerConnections) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }

      // Update call state
      call.mediaState.screenShare = MEDIA_STATES.DISABLED;
      this.updateCallState(call);

      this.emit(CALL_EVENTS.MEDIA_STATE_CHANGED, { 
        callId, 
        type: 'screenShare', 
        state: MEDIA_STATES.DISABLED 
      });

      console.log('🖥️ Screen sharing stopped');

    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.SCREEN_SHARE_STOP_FAILED,
          'Failed to stop screen sharing',
          { callId, error }
        )
      );
    }
  }

  /**
   * Start quality monitoring
   */
  startQualityMonitoring(callId) {
    if (this.qualityMonitorTimer) {
      clearInterval(this.qualityMonitorTimer);
    }

    this.qualityMonitorTimer = setInterval(async () => {
      await this.checkConnectionQuality(callId);
    }, this.config.qualityCheckInterval);

    // Also start stats collection
    if (this.statsCollectionTimer) {
      clearInterval(this.statsCollectionTimer);
    }

    this.statsCollectionTimer = setInterval(async () => {
      await this.collectConnectionStats(callId);
    }, this.config.statsCollectionInterval);
  }

  /**
   * Check connection quality
   */
  async checkConnectionQuality(callId) {
    try {
      const call = this.calls.get(callId);
      if (!call) return;

      let overallQuality = CONNECTION_QUALITY.EXCELLENT;
      const participantQualities = {};

      for (const [participantId, peerConnection] of this.peerConnections) {
        const stats = await peerConnection.getStats();
        let participantQuality = CONNECTION_QUALITY.EXCELLENT;
        
        stats.forEach(stat => {
          if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
            const packetsLost = stat.packetsLost || 0;
            const packetsReceived = stat.packetsReceived || 0;
            const totalPackets = packetsLost + packetsReceived;
            
            if (totalPackets > 0) {
              const lossRate = packetsLost / totalPackets;
              
              if (lossRate > 0.05) {
                participantQuality = CONNECTION_QUALITY.POOR;
              } else if (lossRate > 0.02) {
                participantQuality = CONNECTION_QUALITY.FAIR;
              } else if (lossRate > 0.01) {
                participantQuality = CONNECTION_QUALITY.GOOD;
              }
            }
          }
        });
        
        participantQualities[participantId] = participantQuality;
        
        // Update overall quality to the worst participant quality
        const qualityLevels = [
          CONNECTION_QUALITY.EXCELLENT,
          CONNECTION_QUALITY.GOOD,
          CONNECTION_QUALITY.FAIR,
          CONNECTION_QUALITY.POOR,
          CONNECTION_QUALITY.FAILED
        ];
        
        const currentIndex = qualityLevels.indexOf(overallQuality);
        const participantIndex = qualityLevels.indexOf(participantQuality);
        
        if (participantIndex > currentIndex) {
          overallQuality = participantQuality;
        }
      }

      // Update call quality
      if (call.connectionQuality !== overallQuality) {
        call.connectionQuality = overallQuality;
        this.updateCallState(call);
        
        this.emit(CALL_EVENTS.CONNECTION_QUALITY_CHANGED, {
          callId,
          quality: overallQuality,
          participantQualities
        });
        
        if (overallQuality === CONNECTION_QUALITY.POOR) {
          this.stats.connectionIssues++;
          notificationService.warning(
            'Connection Quality',
            'Call quality is poor. Check your internet connection.'
          );
        }
      }

    } catch (error) {
      console.error('Failed to check connection quality:', error);
    }
  }

  /**
   * Collect connection statistics
   */
  async collectConnectionStats(callId) {
    try {
      for (const [participantId, peerConnection] of this.peerConnections) {
        const stats = await peerConnection.getStats();
        const participantStats = {
          participantId,
          timestamp: Date.now(),
          audio: {},
          video: {},
          connection: {}
        };

        stats.forEach(stat => {
          switch (stat.type) {
            case 'inbound-rtp':
              if (stat.kind === 'audio') {
                participantStats.audio = {
                  packetsReceived: stat.packetsReceived,
                  packetsLost: stat.packetsLost,
                  jitter: stat.jitter,
                  audioLevel: stat.audioLevel
                };
              } else if (stat.kind === 'video') {
                participantStats.video = {
                  packetsReceived: stat.packetsReceived,
                  packetsLost: stat.packetsLost,
                  framesReceived: stat.framesReceived,
                  framesDropped: stat.framesDropped,
                  frameWidth: stat.frameWidth,
                  frameHeight: stat.frameHeight
                };
              }
              break;
              
            case 'candidate-pair':
              if (stat.state === 'succeeded') {
                participantStats.connection = {
                  currentRoundTripTime: stat.currentRoundTripTime,
                  availableOutgoingBitrate: stat.availableOutgoingBitrate,
                  availableIncomingBitrate: stat.availableIncomingBitrate
                };
              }
              break;
          }
        });

        this.connectionStats.set(participantId, participantStats);
      }

    } catch (error) {
      console.error('Failed to collect connection stats:', error);
    }
  }

  /**
   * Handle socket disconnection
   */
  handleSocketDisconnection() {
    // Notify about connection loss
    if (this.activeCallId) {
      const call = this.calls.get(this.activeCallId);
      if (call && call.state === CALL_STATES.CONNECTED) {
        call.state = CALL_STATES.RECONNECTING;
        this.updateCallState(call);
        
        notificationService.warning(
          'Connection Lost',
          'Attempting to reconnect to the call...'
        );
      }
    }
  }

  /**
   * Handle socket reconnection
   */
  handleSocketReconnection() {
    // Attempt to restore call state
    if (this.activeCallId) {
      const call = this.calls.get(this.activeCallId);
      if (call && call.state === CALL_STATES.RECONNECTING) {
        // Try to restore connection
        this.restoreCallConnection(this.activeCallId);
      }
    }
  }

  /**
   * Handle connection failure
   */
  async handleConnectionFailure(callId, participantId) {
    try {
      const call = this.calls.get(callId);
      if (!call) return;

      console.warn(`Connection failed for ${participantId} in call ${callId}`);
      
      // Try to reconnect
      let attempts = 0;
      while (attempts < this.config.reconnectAttempts) {
        attempts++;
        
        try {
          // Wait before retry
          await new Promise(resolve => 
            setTimeout(resolve, this.config.reconnectDelay * attempts)
          );
          
          // Recreate peer connection
          const peerConnection = await this.createPeerConnection(callId, participantId);
          
          // Success
          console.log(`Reconnected to ${participantId} after ${attempts} attempts`);
          return;
          
        } catch (error) {
          console.error(`Reconnection attempt ${attempts} failed:`, error);
        }
      }
      
      // All reconnection attempts failed
      this.stats.connectionIssues++;
      notificationService.error(
        'Connection Failed',
        `Failed to reconnect to participant. They may have left the call.`
      );
      
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.CONNECTION_RECOVERY_FAILED,
          'Failed to handle connection failure',
          { callId, participantId, error }
        )
      );
    }
  }

  /**
   * Show incoming call notification
   */
  showIncomingCallNotification(call) {
    const notification = notificationService.show({
      title: 'Incoming Call',
      message: `${call.type} call from ${call.initiator}`,
      type: 'info',
      persistent: true,
      actions: [
        {
          label: 'Accept',
          action: () => {
            this.acceptCall(call.id);
            notificationService.hide(notification.id);
          }
        },
        {
          label: 'Reject',
          action: () => {
            this.rejectCall(call.id);
            notificationService.hide(notification.id);
          }
        }
      ]
    });

    // Auto-hide notification after answer timeout
    setTimeout(() => {
      notificationService.hide(notification.id);
    }, this.config.answerTimeout);
  }

  /**
   * Utility methods
   */
  generateCallId() {
    return 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  updateCallState(call) {
    // Cache the call state
    cacheService.set(`call:${call.id}`, call, {
      ttl: 24 * 60 * 60, // 24 hours
      tags: ['call', `user:${authService.getCurrentUser()?.id}`]
    });

    this.emit(CALL_EVENTS.STATE_CHANGED, { call });
  }

  addToHistory(call) {
    this.callHistory.unshift(call);
    
    // Limit history size
    if (this.callHistory.length > this.maxHistorySize) {
      this.callHistory = this.callHistory.slice(0, this.maxHistorySize);
    }

    // Cache history
    cacheService.set(`call_history:${authService.getCurrentUser()?.id}`, this.callHistory, {
      ttl: 7 * 24 * 60 * 60, // 7 days
      tags: ['call_history']
    });
  }

  async cleanupCall(callId) {
    try {
      // Stop media streams
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      if (this.sharedScreen) {
        this.sharedScreen.getTracks().forEach(track => track.stop());
        this.sharedScreen = null;
      }

      // Close peer connections
      for (const [participantId, peerConnection] of this.peerConnections) {
        peerConnection.close();
      }
      this.peerConnections.clear();

      // Close data channels
      this.dataChannels.clear();

      // Clear remote streams
      this.remoteStreams.clear();

      // Stop quality monitoring
      if (this.qualityMonitorTimer) {
        clearInterval(this.qualityMonitorTimer);
        this.qualityMonitorTimer = null;
      }

      if (this.statsCollectionTimer) {
        clearInterval(this.statsCollectionTimer);
        this.statsCollectionTimer = null;
      }

      // Clear stats
      this.connectionStats.clear();

      // Clear active call if this was it
      if (this.activeCallId === callId) {
        this.activeCallId = null;
      }

      console.log(`🧹 Call ${callId} cleaned up`);

    } catch (error) {
      console.error('Failed to cleanup call:', error);
    }
  }

  endAllCalls(reason = 'service_shutdown') {
    const activeCalls = Array.from(this.calls.values()).filter(
      call => call.state === CALL_STATES.CONNECTED || 
              call.state === CALL_STATES.CALLING ||
              call.state === CALL_STATES.RINGING
    );

    activeCalls.forEach(call => {
      this.endCall(call.id, reason);
    });
  }

  /**
   * Public API methods
   */
  getActiveCall() {
    return this.activeCallId ? this.calls.get(this.activeCallId) : null;
  }

  getCall(callId) {
    return this.calls.get(callId);
  }

  getCallHistory(limit = 50) {
    return this.callHistory.slice(0, limit);
  }

  getConnectionStats(participantId) {
    return this.connectionStats.get(participantId);
  }

  getAllConnectionStats() {
    return Object.fromEntries(this.connectionStats);
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream(participantId) {
    return this.remoteStreams.get(participantId);
  }

  getAllRemoteStreams() {
    return Object.fromEntries(this.remoteStreams);
  }

  isInCall() {
    return !!this.activeCallId && this.getActiveCall()?.state === CALL_STATES.CONNECTED;
  }

  getUIState() {
    return { ...this.uiState };
  }

  updateUIState(updates) {
    this.uiState = { ...this.uiState, ...updates };
    this.emit(CALL_EVENTS.UI_STATE_CHANGED, this.uiState);
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeCalls: this.calls.size,
      activeCallId: this.activeCallId,
      peerConnections: this.peerConnections.size,
      hasLocalStream: !!this.localStream,
      remoteStreams: this.remoteStreams.size
    };
  }

  /**
   * Clean up service
   */
  cleanup() {
    // End all active calls
    this.endAllCalls('service_cleanup');

    // Clear timers
    if (this.qualityMonitorTimer) {
      clearInterval(this.qualityMonitorTimer);
    }
    if (this.statsCollectionTimer) {
      clearInterval(this.statsCollectionTimer);
    }

    // Clear all data
    this.calls.clear();
    this.peerConnections.clear();
    this.dataChannels.clear();
    this.remoteStreams.clear();
    this.connectionStats.clear();

    // Remove listeners
    this.removeAllListeners();

    console.log('🧹 CallService cleaned up');
  }
}

// Create singleton instance
const callService = new CallService();

export default callService;