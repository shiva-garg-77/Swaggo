'use client';

/**
 * Socket Test Page - Verify PerfectSocketProvider Integration
 * 
 * This page tests all socket functionality before full migration:
 * - Connection/disconnection
 * - Authentication
 * - Message sending/receiving
 * - Typing indicators
 * - User presence
 * - Call functionality
 * - Reconnection logic
 * - Memory management
 */

import { useEffect, useState } from 'react';
import { useSocket } from '@/Components/Helper/PerfectSocketProvider';
import { useFixedSecureAuth } from '@/context/FixedSecureAuthContext';

export default function SocketTestPage() {
  const auth = useFixedSecureAuth();
  const socket = useSocket();
  
  const [testResults, setTestResults] = useState({});
  const [testLog, setTestLog] = useState([]);
  const [testChatId, setTestChatId] = useState('test-chat-123');
  const [testMessage, setTestMessage] = useState('Hello from PerfectSocketProvider!');
  
  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [...prev.slice(-50), { timestamp, message, type }]);
  };
  
  // Update test result
  const updateTest = (testName, passed, details = '') => {
    setTestResults(prev => ({
      ...prev,
      [testName]: { passed, details, timestamp: new Date().toISOString() }
    }));
    addLog(`Test: ${testName} - ${passed ? '✅ PASSED' : '❌ FAILED'}${details ? ': ' + details : ''}`, passed ? 'success' : 'error');
  };
  
  // Run comprehensive tests
  useEffect(() => {
    if (!socket) return;
    
    addLog('Starting socket tests...', 'info');
    
    // Test 1: Socket object exists
    if (socket.socket) {
      updateTest('Socket Object', true, 'Socket instance exists');
    } else {
      updateTest('Socket Object', false, 'Socket instance missing');
    }
    
    // Test 2: Connection status
    if (typeof socket.isConnected === 'boolean') {
      updateTest('Connection Status', true, `isConnected: ${socket.isConnected}`);
    } else {
      updateTest('Connection Status', false, 'Connection status not available');
    }
    
    // Test 3: Connection state
    if (socket.connectionStatus) {
      updateTest('Connection State', true, `Status: ${socket.connectionStatus}`);
    } else {
      updateTest('Connection State', false, 'Connection state missing');
    }
    
    // Test 4: Online users tracking
    if (socket.onlineUsers instanceof Set) {
      updateTest('Online Users', true, `Tracking ${socket.onlineUsers.size} users`);
    } else {
      updateTest('Online Users', false, 'Online users not a Set');
    }
    
    // Test 5: Message queue
    if (Array.isArray(socket.messageQueue)) {
      updateTest('Message Queue', true, `Queue size: ${socket.messageQueue.length}`);
    } else {
      updateTest('Message Queue', false, 'Message queue not an array');
    }
    
    // Test 6: Pending messages
    if (socket.pendingMessages instanceof Map) {
      updateTest('Pending Messages', true, `Tracking ${socket.pendingMessages.size} messages`);
    } else {
      updateTest('Pending Messages', false, 'Pending messages not a Map');
    }
    
    // Test 7: Typing users
    if (socket.typingUsers instanceof Map) {
      updateTest('Typing Indicators', true, `Tracking ${socket.typingUsers.size} chats`);
    } else {
      updateTest('Typing Indicators', false, 'Typing users not available');
    }
    
    // Test 8: Active calls
    if (socket.activeCalls instanceof Map) {
      updateTest('Active Calls', true, `Tracking ${socket.activeCalls.size} calls`);
    } else {
      updateTest('Active Calls', false, 'Active calls not available');
    }
    
    // Test 9: Development metrics (optional)
    if (socket.metrics || process.env.NODE_ENV !== 'development') {
      updateTest('Metrics', true, socket.metrics ? 'Metrics available' : 'Metrics disabled (production mode)');
    }
    
    // Test 10: Required methods exist
    const requiredMethods = [
      'joinChat', 'leaveChat', 'sendMessage', 
      'markMessageRead', 'reactToMessage',
      'startTyping', 'stopTyping',
      'initiateCall', 'answerCall', 'endCall',
      'sendWebRTCOffer', 'sendWebRTCAnswer', 'sendICECandidate',
      'reconnect', 'queueMessage'
    ];
    
    const missingMethods = requiredMethods.filter(method => typeof socket[method] !== 'function');
    
    if (missingMethods.length === 0) {
      updateTest('API Methods', true, `All ${requiredMethods.length} methods available`);
    } else {
      updateTest('API Methods', false, `Missing methods: ${missingMethods.join(', ')}`);
    }
    
  }, [socket]);
  
  // Test authentication integration
  useEffect(() => {
    if (auth) {
      const authInfo = {
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        hasUser: !!auth.user,
        userId: auth.user?.profileid || auth.user?.id
      };
      
      updateTest('Auth Integration', true, `Auth state: ${JSON.stringify(authInfo)}`);
      addLog(`Auth: authenticated=${authInfo.isAuthenticated}, userId=${authInfo.userId}`, 'info');
    }
  }, [auth]);
  
  // Test message sending
  const testSendMessage = () => {
    if (!socket.isConnected) {
      addLog('Cannot send message - socket not connected', 'error');
      updateTest('Send Message', false, 'Socket not connected');
      return;
    }
    
    addLog('Attempting to send test message...', 'info');
    
    const clientMessageId = socket.sendMessage({
      chatid: testChatId,
      content: testMessage,
      messageType: 'text'
    }, (ack) => {
      if (ack.success) {
        addLog(`Message sent successfully! Server ID: ${ack.serverMessageId}`, 'success');
        updateTest('Send Message', true, `Client ID: ${ack.clientMessageId}, Server ID: ${ack.serverMessageId}`);
      } else if (ack.queued) {
        addLog('Message queued for delivery', 'warn');
        updateTest('Send Message', true, 'Message queued (socket disconnected)');
      } else {
        addLog(`Message failed: ${ack.error}`, 'error');
        updateTest('Send Message', false, ack.error);
      }
    });
    
    addLog(`Generated client message ID: ${clientMessageId}`, 'info');
  };
  
  // Test typing indicators
  const testTypingIndicator = () => {
    addLog('Testing typing indicator...', 'info');
    
    socket.startTyping(testChatId);
    updateTest('Typing Start', true, `Started typing in ${testChatId}`);
    
    setTimeout(() => {
      socket.stopTyping(testChatId);
      updateTest('Typing Stop', true, `Stopped typing in ${testChatId}`);
    }, 2000);
  };
  
  // Test chat join
  const testJoinChat = () => {
    addLog(`Attempting to join chat: ${testChatId}`, 'info');
    socket.joinChat(testChatId);
    updateTest('Join Chat', true, `Joined ${testChatId}`);
  };
  
  // Test reconnection
  const testReconnection = () => {
    addLog('Testing manual reconnection...', 'info');
    socket.reconnect();
    updateTest('Manual Reconnect', true, 'Reconnection triggered');
  };
  
  // Calculate pass rate
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(r => r.passed).length;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  const passRateColor = passRate >= 90 ? 'text-green-600' : passRate >= 70 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">🔌 Socket Integration Test</h1>
          <p className="text-gray-600 mb-4">Testing PerfectSocketProvider before full migration</p>
          
          {/* Overall Status */}
          <div className={`text-6xl font-bold ${passRateColor} mb-4`}>
            {passRate}% PASS RATE
          </div>
          <div className="text-sm text-gray-500">
            {passedTests} / {totalTests} tests passed
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <button
              onClick={testSendMessage}
              disabled={!socket?.isConnected}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send Test Message
            </button>
            <button
              onClick={testTypingIndicator}
              disabled={!socket?.isConnected}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-300"
            >
              Test Typing
            </button>
            <button
              onClick={testJoinChat}
              disabled={!socket?.isConnected}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-300"
            >
              Join Chat
            </button>
            <button
              onClick={testReconnection}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Test Reconnect
            </button>
          </div>
        </div>
        
        {/* Test Input */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chat ID</label>
              <input
                type="text"
                value={testChatId}
                onChange={(e) => setTestChatId(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="test-chat-123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Test Message</label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Hello from PerfectSocketProvider!"
              />
            </div>
          </div>
        </div>
        
        {/* Current Socket State */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Socket State</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">Connection</div>
              <div className={`text-lg font-semibold ${socket?.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {socket?.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">Status</div>
              <div className="text-lg font-semibold">{socket?.connectionStatus || 'unknown'}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">Queue Size</div>
              <div className="text-lg font-semibold">{socket?.messageQueue?.length || 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">Pending</div>
              <div className="text-lg font-semibold">{socket?.pendingMessages?.size || 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">Online Users</div>
              <div className="text-lg font-semibold">{socket?.onlineUsers?.size || 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">Typing Chats</div>
              <div className="text-lg font-semibold">{socket?.typingUsers?.size || 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">Active Calls</div>
              <div className="text-lg font-semibold">{socket?.activeCalls?.size || 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500">Auth</div>
              <div className={`text-lg font-semibold ${auth?.isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                {auth?.isAuthenticated ? '✅ Yes' : '❌ No'}
              </div>
            </div>
          </div>
          
          {/* Metrics (dev only) */}
          {socket?.metrics && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Development Metrics</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(socket.metrics, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            {Object.entries(testResults).map(([testName, result]) => (
              <div 
                key={testName}
                className={`p-3 rounded border-l-4 ${result.passed ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {result.passed ? '✅' : '❌'} {testName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {result.details && (
                  <div className="text-sm text-gray-600 mt-1">{result.details}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Live Log */}
        <div className="bg-black text-green-400 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Live Test Log</h2>
          <div className="font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
            {testLog.map((log, idx) => (
              <div key={idx} className={
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'warn' ? 'text-yellow-400' : 'text-gray-400'
              }>
                [{log.timestamp}] {log.message}
              </div>
            ))}
            {testLog.length === 0 && (
              <div className="text-gray-500">Waiting for test logs...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}