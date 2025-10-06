import React, { useState, useEffect } from 'react';
import { useSocket } from '../Helper/SocketProvider';
import notificationService from '../../services/UnifiedNotificationService.js';

const ConnectionDebug = () => {
  const { socket, isConnected, connectionStatus, reconnect, onlineUsers, messageQueue } = useSocket();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionHistory, setConnectionHistory] = useState([]);
  const [notificationReady, setNotificationReady] = useState(false);

  useEffect(() => {
    // Track connection status changes
    const updateHistory = (status, details = '') => {
      const timestamp = new Date().toLocaleTimeString();
      setLastUpdate(new Date());
      
      setConnectionHistory(prev => [
        `[${timestamp}] ${status} ${details}`,
        ...prev.slice(0, 9) // Keep last 10 entries
      ]);
    };

    // Update history when connection status changes
    let statusText = connectionStatus;
    switch (connectionStatus) {
      case 'connected':
        statusText = '✅ CONNECTED';
        updateHistory(statusText, '- Socket.IO connected successfully');
        break;
      case 'disconnected':
        statusText = '❌ DISCONNECTED';
        updateHistory(statusText, '- Connection lost');
        break;
      case 'connecting':
        statusText = '🔄 CONNECTING';
        updateHistory(statusText, '- Attempting connection...');
        break;
      case 'reconnecting':
        statusText = '🔄 RECONNECTING';
        updateHistory(statusText, '- Attempting reconnection...');
        break;
      case 'failed':
        statusText = '💥 FAILED';
        updateHistory(statusText, '- Max retry attempts reached');
        break;
      case 'auth_failed':
        statusText = '🔐 AUTH FAILED';
        updateHistory(statusText, '- Authentication failed');
        break;
      case 'not_authenticated':
        statusText = '🔑 NOT AUTHENTICATED';
        updateHistory(statusText, '- User not authenticated');
        break;
      case 'server_unreachable':
        statusText = '🚫 SERVER OFFLINE';
        updateHistory(statusText, '- Cannot reach server');
        break;
      case 'connection_error':
        statusText = '❌ CONNECTION ERROR';
        updateHistory(statusText, '- Network error occurred');
        break;
      default:
        statusText = `❓ ${(connectionStatus || 'UNKNOWN').toUpperCase()}`;
        updateHistory(statusText, '- Status unknown');
    }

    // Check notification service
    setNotificationReady(!!notificationService.isReady);
  }, [connectionStatus]);

  const handleReconnect = () => {
    if (reconnect) {
      reconnect();
    }
  };

  const testNotification = () => {
    notificationService.show({
      type: 'info',
      title: 'Test Notification',
      message: 'Connection debug test'
    });
  };

  const getDisplayStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return '✅ CONNECTED';
      case 'disconnected':
        return '❌ DISCONNECTED';
      case 'connecting':
        return '🔄 CONNECTING';
      case 'reconnecting':
        return '🔄 RECONNECTING';
      case 'failed':
        return '💥 FAILED';
      case 'auth_failed':
        return '🔐 AUTH FAILED';
      case 'not_authenticated':
        return '🔑 NOT AUTHENTICATED';
      case 'server_unreachable':
        return '🚫 SERVER OFFLINE';
      case 'connection_error':
        return '❌ CONNECTION ERROR';
      default:
        return `❓ ${(connectionStatus || 'UNKNOWN').toUpperCase()}`;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
        🔧 Connection Debug
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Socket Status:</strong> {getDisplayStatus()}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Last Update:</strong> {lastUpdate.toLocaleTimeString()}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Notifications:</strong> {notificationReady ? '✅ Ready' : '❌ Not Ready'}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Stats:</strong>
        <div>Connected: {isConnected ? '✅' : '❌'}</div>
        <div>Status: {connectionStatus}</div>
        <div>Online Users: {onlineUsers?.size || 0}</div>
        <div>Queued: {messageQueue?.length || 0}</div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={handleReconnect}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '3px',
            marginRight: '5px',
            cursor: 'pointer'
          }}
        >
          Reconnect
        </button>
        <button
          onClick={testNotification}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Test Notify
        </button>
      </div>

      <div>
        <strong>History:</strong>
        <div style={{ maxHeight: '100px', overflow: 'auto', fontSize: '10px' }}>
          {connectionHistory.map((entry, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectionDebug;