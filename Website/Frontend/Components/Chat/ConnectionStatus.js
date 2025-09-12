'use client';

import React from 'react';
import { useSocket } from '../Helper/SocketProvider';

export default function ConnectionStatus() {
  // Always call hooks at the top level
  const socketData = useSocket();
  
  // If socketData is not available, show fallback
  if (!socketData) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        <span className="text-xs text-white/80 font-medium">Initializing...</span>
      </div>
    );
  }
  
  const { connectionStatus, isConnected, messageQueue, reconnect } = socketData;

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: 'Connected',
          icon: '🟢',
          description: 'Chat is working normally'
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          text: 'Connecting...',
          icon: '🟡',
          description: 'Establishing connection'
        };
      case 'reconnecting':
        return {
          color: 'bg-orange-500',
          text: 'Reconnecting...',
          icon: '🟠',
          description: 'Trying to restore connection'
        };
      case 'disconnected':
        return {
          color: 'bg-red-500',
          text: 'Disconnected',
          icon: '🔴',
          description: 'Chat is offline'
        };
      case 'error':
        return {
          color: 'bg-red-600',
          text: 'Connection Error',
          icon: '❌',
          description: 'Failed to connect'
        };
      case 'failed':
        return {
          color: 'bg-gray-500',
          text: 'Connection Failed',
          icon: '⚫',
          description: 'Unable to establish connection'
        };
      default:
        return {
          color: 'bg-gray-400',
          text: 'Unknown',
          icon: '❓',
          description: 'Connection status unknown'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const hasQueuedMessages = messageQueue.length > 0;

  return (
    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
      <div className={`w-2 h-2 rounded-full ${statusConfig.color} animate-pulse`}></div>
      <span className="text-xs text-white/80 font-medium">{statusConfig.text}</span>
      
      {hasQueuedMessages && (
        <div className="flex items-center space-x-1">
          <span className="text-xs text-yellow-200">•</span>
          <span className="text-xs text-yellow-200">{messageQueue.length} queued</span>
        </div>
      )}
      
      {connectionStatus === 'failed' && (
        <button
          onClick={reconnect}
          className="text-xs text-white/80 hover:text-white underline ml-1"
        >
          Retry
        </button>
      )}
    </div>
  );
}
