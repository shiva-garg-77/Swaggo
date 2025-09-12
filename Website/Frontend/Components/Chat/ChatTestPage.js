'use client';

import React, { useState, useEffect } from 'react';
import ComprehensiveChatInterface from './ComprehensiveChatInterface';
import VideoCallModal from './VideoCallModal';
import VoiceCallModal from './VoiceCallModal';
import SocketClient from './SocketClient';
import ThemeProvider from '../Helper/ThemeProvider';

// Mock user data for testing
const mockUsers = [
  {
    profileid: 'user_1',
    username: 'John Doe',
    profilePic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
  },
  {
    profileid: 'user_2', 
    username: 'Jane Smith',
    profilePic: 'https://images.unsplash.com/photo-1494790108755-2616b612b742?w=40&h=40&fit=crop&crop=face'
  }
];

// Mock chat data
const mockChats = [
  {
    chatid: 'chat_demo_123',
    chatType: 'direct',
    chatName: 'Jane Smith',
    participants: ['user_1', 'user_2'],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b742?w=40&h=40&fit=crop&crop=face',
    name: 'Jane Smith' // Add name property for compatibility
  }
];

export default function ChatTestPage() {
  const [currentUser, setCurrentUser] = useState(mockUsers[0]);
  const [selectedChat, setSelectedChat] = useState(mockChats[0]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  
  // Test server connectivity
  const testServerConnection = async () => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:45799';
      console.log('🔍 Testing server connection to:', serverUrl);
      
      const response = await fetch(`${serverUrl}/health`);
      const data = await response.json();
      
      console.log('✅ Server health check:', data);
      setServerStatus('online');
      return true;
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      setServerStatus('offline');
      setConnectionError(`Server unreachable: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    console.log('🚀 Initializing chat system...');
    
    // Initialize socket connection
    const connectSocket = async () => {
      // First test server connectivity
      const serverOnline = await testServerConnection();
      if (!serverOnline) {
        console.error('❌ Cannot connect to Socket.io: Server is offline');
        return;
      }
      
      try {
        const mockToken = `demo_token_${currentUser.profileid}`;
        console.log('🔑 Connecting with token for user:', currentUser.username);
        
        const socketInstance = SocketClient.connect(mockToken);
        setSocket(socketInstance);
        
        socketInstance.on('connect', () => {
          console.log('✅ Connected to chat server with ID:', socketInstance.id);
          setIsConnected(true);
          setConnectionError(null);
        });
        
        socketInstance.on('disconnect', (reason) => {
          console.log('❌ Disconnected from chat server. Reason:', reason);
          setIsConnected(false);
        });
        
        socketInstance.on('connect_error', (error) => {
          console.error('🔥 Socket connection error:', error);
          setConnectionError(`Connection failed: ${error.message}`);
          setIsConnected(false);
        });
        
        socketInstance.on('error', (error) => {
          console.error('🔥 Socket error:', error);
          setConnectionError(`Socket error: ${error}`);
        });
        
      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        setConnectionError(`Failed to initialize: ${error.message}`);
      }
    };

    connectSocket();

    return () => {
      console.log('🧹 Cleaning up socket connection...');
      if (socket) {
        SocketClient.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [currentUser]);

  const handleStartCall = (type) => {
    console.log(`Starting ${type} call...`);
    setCallType(type);
    setIsCallActive(true);
    
    if (type === 'video') {
      setShowVideoCall(true);
    } else {
      setShowVoiceCall(true);
    }
  };

  const handleEndCall = () => {
    console.log('Ending call...');
    setIsCallActive(false);
    setCallType(null);
    setShowVideoCall(false);
    setShowVoiceCall(false);
  };

  const switchUser = () => {
    const newUser = currentUser.profileid === 'user_1' ? mockUsers[1] : mockUsers[0];
    setCurrentUser(newUser);
    
    // Reconnect socket with new user
    if (socket) {
      SocketClient.disconnect();
      setTimeout(() => {
        const socketInstance = SocketClient.connect('new_token_for_user');
        setSocket(socketInstance);
      }, 500);
    }
  };

  return (
    <ThemeProvider>
      <div className="h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header with user switcher */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            SwagGo Chat Test
          </h1>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {connectionError && (
                <span className="text-xs text-red-500" title={connectionError}>
                  Error
                </span>
              )}
            </div>
            
            {/* Current User */}
            <div className="flex items-center space-x-2">
              <img
                src={currentUser.profilePic}
                alt={currentUser.username}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentUser.username}
              </span>
            </div>
            
            {/* User Switcher */}
            <button
              onClick={switchUser}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Switch User
            </button>
          </div>
        </div>
      </div>
      
      {/* Chat Interface */}
      <div className="flex h-full">
        <ComprehensiveChatInterface
          selectedChat={selectedChat}
          user={currentUser}
          socket={socket}
          isConnected={isConnected}
          onStartCall={handleStartCall}
          isCallActive={isCallActive}
          callType={callType}
          onEndCall={handleEndCall}
        />
      </div>
      
      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={showVideoCall}
        onClose={handleEndCall}
        chat={selectedChat}
        user={currentUser}
        socket={socket}
      />
      
      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={showVoiceCall}
        onClose={handleEndCall}
        chat={selectedChat}
        user={currentUser}
        socket={socket}
      />
      
      {/* Debug Panel */}
      <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Debug Info
        </h3>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div>Server: {serverStatus === 'online' ? '✅ Online' : serverStatus === 'offline' ? '❌ Offline' : '🔄 Checking'}</div>
          <div>Socket: {socket ? '✅ Created' : '❌ Not created'}</div>
          <div>Connected: {isConnected ? '✅ Yes' : '❌ No'}</div>
          <div>Socket ID: {socket?.id || 'N/A'}</div>
          <div>User: {currentUser.username}</div>
          <div>Chat: {selectedChat.chatid}</div>
          {connectionError && (
            <div className="text-red-500 mt-2 p-2 bg-red-50 rounded text-xs">
              Error: {connectionError}
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Testing Instructions
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Wait for connection (green dot)</li>
            <li>• Type messages to test real-time chat</li>
            <li>• Click phone/video icons to test calls</li>
            <li>• Switch users to simulate accounts</li>
            <li>• Open multiple tabs for full testing</li>
          </ul>
        </div>
        
        {/* Test Buttons */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={testServerConnection}
            className="w-full px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Server
          </button>
          
          <button
            onClick={() => {
              if (socket && isConnected) {
                socket.emit('join_chat', selectedChat.chatid);
                console.log('Manually joining chat:', selectedChat.chatid);
              }
            }}
            className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!socket || !isConnected}
          >
            Join Chat
          </button>
          
          <button
            onClick={() => {
              if (socket && isConnected) {
                socket.emit('send_message', {
                  chatid: selectedChat.chatid,
                  content: 'Test message from debug panel',
                  messageType: 'text'
                });
                console.log('Test message sent');
              }
            }}
            className="w-full px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            disabled={!socket || !isConnected}
          >
            Send Test Message
          </button>
        </div>
      </div>
    </div>
    </ThemeProvider>
  );
}
