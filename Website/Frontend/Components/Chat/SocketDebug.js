'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '../Helper/SocketProvider';
import { useAuth } from '../Helper/AuthProvider';

export default function SocketDebug() {
  const { socket, isConnected, connectionStatus } = useSocket();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (!socket) return;

    const addEvent = (eventType, data) => {
      setEvents(prev => [
        { type: eventType, data, timestamp: new Date().toISOString() },
        ...prev.slice(0, 9) // Keep only last 10 events
      ]);
    };

    // Monitor all socket events
    const eventHandlers = [
      'connect',
      'disconnect',
      'connect_error',
      'new_message',
      'message_received',
      'typing_start',
      'typing_stop',
      'user_typing',
      'message_delivered',
      'message_ack'
    ];

    eventHandlers.forEach(eventType => {
      socket.on(eventType, (data) => {
        console.log(`🔔 Socket event: ${eventType}`, data);
        addEvent(eventType, data);
      });
    });

    return () => {
      eventHandlers.forEach(eventType => {
        socket.off(eventType);
      });
    };
  }, [socket]);

  const sendTestMessage = () => {
    if (socket && testMessage.trim()) {
      const messageData = {
        chatid: 'test-chat',
        messageType: 'text',
        content: testMessage.trim(),
        clientMessageId: Date.now(),
        timestamp: new Date().toISOString()
      };

      console.log('🧪 Sending test message:', messageData);
      socket.emit('send_message', messageData, (ack) => {
        console.log('🧪 Test message acknowledgment:', ack);
        setEvents(prev => [
          { type: 'test_message_ack', data: ack, timestamp: new Date().toISOString() },
          ...prev.slice(0, 9)
        ]);
      });
      setTestMessage('');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      case 'error': return 'text-red-700';
      default: return 'text-gray-600';
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Socket Debug</h3>
        <button
          onClick={() => setEvents([])}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-900 rounded">
        <div className="text-xs">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-medium ${getStatusColor(connectionStatus)}`}>
              {connectionStatus}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Connected:</span>
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Socket ID:</span>
            <span className="text-xs text-gray-500 font-mono">
              {socket?.id || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>User:</span>
            <span className="text-xs text-gray-500">
              {user?.username || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Message */}
      <div className="mb-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Test message..."
            className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
            onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
          />
          <button
            onClick={sendTestMessage}
            disabled={!isConnected || !testMessage.trim()}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </div>

      {/* Events Log */}
      <div>
        <h4 className="text-xs font-medium mb-2">Recent Events:</h4>
        <div className="space-y-1">
          {events.length === 0 ? (
            <p className="text-xs text-gray-500">No events yet...</p>
          ) : (
            events.map((event, index) => (
              <div key={index} className="text-xs p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-blue-600">
                    {event.type}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.data && (
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-hidden">
                    {JSON.stringify(event.data, null, 1).substring(0, 200)}
                    {JSON.stringify(event.data).length > 200 && '...'}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
