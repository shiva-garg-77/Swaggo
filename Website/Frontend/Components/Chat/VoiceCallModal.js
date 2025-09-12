'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../Helper/ThemeProvider';

export default function VoiceCallModal({ isOpen, onClose, chat, user, socket }) {
  const { theme } = useTheme();
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState([]);
  
  const callStartTime = useRef(null);
  const durationInterval = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCallStatus('connecting');
      callStartTime.current = Date.now();
      
      // Simulate connection after 2 seconds
      setTimeout(() => {
        setCallStatus('connected');
        startDurationTimer();
      }, 2000);
      
      // Set participants
      if (chat?.participants) {
        setParticipants(chat.participants.filter(p => p.profileid !== user.profileid));
      }
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isOpen, chat, user]);

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
    // Emit mute status to other participants
    if (socket) {
      socket.emit('toggle_mute', { chatid: chat.chatid, muted: !isMuted });
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  if (!isOpen) return null;

  const otherParticipant = participants[0] || {};
  const displayName = chat?.chatType === 'group' 
    ? (chat.chatName || 'Group Call') 
    : (otherParticipant?.name || otherParticipant?.username || 'Unknown User');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className={`w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        
        {/* Call Status Header */}
        <div className="p-8 text-center">
          <div className="relative">
            {/* Avatar with pulse animation */}
            <div className={`w-32 h-32 mx-auto mb-6 rounded-full p-1 ${
              callStatus === 'connecting' ? 'animate-pulse' : ''
            } ${callStatus === 'connected' ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'}`}>
              <img
                src={chat?.chatType === 'group' ? chat.chatAvatar : otherParticipant?.profilePic || '/default-avatar.png'}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            
            {/* Call status indicator */}
            {callStatus === 'connected' && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-500 text-white rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Connected</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Call Info */}
          <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {displayName}
          </h3>
          
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {callStatus === 'connecting' && 'Calling...'}
            {callStatus === 'connected' && (
              <div className="space-y-1">
                <div>Voice Call • {formatDuration(callDuration)}</div>
                {chat?.chatType === 'group' && (
                  <div>{participants.length + 1} participants</div>
                )}
              </div>
            )}
            {callStatus === 'ended' && 'Call Ended'}
          </div>
        </div>

        {/* Group Participants (if group call) */}
        {chat?.chatType === 'group' && participants.length > 1 && callStatus === 'connected' && (
          <div className="px-8 pb-4">
            <div className="text-center">
              <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Also on call
              </p>
              <div className="flex justify-center space-x-4">
                {participants.slice(1, 4).map((participant) => (
                  <div key={participant.profileid} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 p-0.5 mb-1">
                      <img
                        src={participant.profilePic || '/default-avatar.png'}
                        alt={participant.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {participant.name?.split(' ')[0] || participant.username}
                    </p>
                  </div>
                ))}
                {participants.length > 4 && (
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-semibold ${
                      theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      +{participants.length - 3}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="p-8">
          <div className="flex justify-center space-x-6">
            
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                isMuted 
                  ? 'bg-red-500 text-white' 
                  : theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipPath="url(#clip)" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors transform hover:scale-105"
              title="End Call"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>

            {/* Speaker Button */}
            <button
              onClick={toggleSpeaker}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                isSpeakerOn 
                  ? 'bg-blue-500 text-white' 
                  : theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

          </div>

          {/* Additional Controls */}
          <div className="flex justify-center space-x-4 mt-6">
            
            {/* Add Person (for group calls) */}
            {chat?.chatType === 'group' && (
              <button
                className={`p-3 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Add person"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </button>
            )}

            {/* Switch to Video */}
            <button
              className={`p-3 rounded-full transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Switch to video call"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Chat Messages */}
            <button
              className={`p-3 rounded-full transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Open chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
