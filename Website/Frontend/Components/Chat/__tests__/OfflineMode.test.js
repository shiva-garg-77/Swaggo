import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OfflineModeManager from '../OfflineModeManager';
import offlineModeService from '../../../services/OfflineModeService';
import { OFFLINE_MODE_STATES } from '../../../services/OfflineModeService';

// Mock the socket provider
jest.mock('../../Helper/PerfectSocketProvider', () => ({
  useSocket: () => ({
    connectionStatus: 'connected',
    isConnected: true,
    messageQueue: [],
    reconnect: jest.fn()
  })
}));

// Mock notification service
jest.mock('../../../services/NotificationService', () => ({
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  remove: jest.fn()
}));

describe('OfflineModeManager', () => {
  beforeEach(() => {
    // Reset the offline mode service state
    offlineModeService.state = OFFLINE_MODE_STATES.ONLINE;
    offlineModeService.isOnline = true;
    offlineModeService.syncQueue = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders online status correctly', () => {
    render(<OfflineModeManager />);
    
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('🟢')).toBeInTheDocument();
  });

  test('shows offline status when offline', async () => {
    render(<OfflineModeManager />);
    
    // Simulate going offline
    offlineModeService.state = OFFLINE_MODE_STATES.OFFLINE;
    offlineModeService.isOnline = false;
    offlineModeService.emit('state_changed', {
      previousState: OFFLINE_MODE_STATES.ONLINE,
      currentState: OFFLINE_MODE_STATES.OFFLINE
    });
    
    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('🔴')).toBeInTheDocument();
    });
  });

  test('shows sync queue count when items are queued', async () => {
    render(<OfflineModeManager />);
    
    // Simulate items in sync queue
    offlineModeService.syncQueue = [{}, {}, {}]; // 3 items
    offlineModeService.emit('sync_queued');
    
    await waitFor(() => {
      expect(screen.getByText('3 queued')).toBeInTheDocument();
    });
  });

  test('shows retry button when offline', async () => {
    render(<OfflineModeManager />);
    
    // Simulate going offline
    offlineModeService.state = OFFLINE_MODE_STATES.OFFLINE;
    offlineModeService.isOnline = false;
    offlineModeService.emit('state_changed', {
      previousState: OFFLINE_MODE_STATES.ONLINE,
      currentState: OFFLINE_MODE_STATES.OFFLINE
    });
    
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  test('calls reconnect when retry button is clicked', async () => {
    const mockReconnect = jest.fn();
    
    // Mock the socket provider with reconnect function
    jest.mock('../../Helper/PerfectSocketProvider', () => ({
      useSocket: () => ({
        connectionStatus: 'disconnected',
        isConnected: false,
        messageQueue: [],
        reconnect: mockReconnect
      })
    }));
    
    render(<OfflineModeManager />);
    
    // Simulate going offline
    offlineModeService.state = OFFLINE_MODE_STATES.OFFLINE;
    offlineModeService.isOnline = false;
    offlineModeService.emit('state_changed', {
      previousState: OFFLINE_MODE_STATES.ONLINE,
      currentState: OFFLINE_MODE_STATES.OFFLINE
    });
    
    await waitFor(() => {
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      expect(mockReconnect).toHaveBeenCalled();
    });
  });
});

describe('OfflineModeService', () => {
  beforeEach(() => {
    // Reset the offline mode service state
    offlineModeService.state = OFFLINE_MODE_STATES.ONLINE;
    offlineModeService.isOnline = true;
    offlineModeService.syncQueue = [];
    offlineModeService.localData.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with correct default state', () => {
    expect(offlineModeService.state).toBe(OFFLINE_MODE_STATES.ONLINE);
    expect(offlineModeService.isOnline).toBe(true);
    expect(offlineModeService.syncQueue).toEqual([]);
  });

  test('handles network online event', () => {
    const mockCallback = jest.fn();
    offlineModeService.on('network_online', mockCallback);
    
    // Simulate network online event
    window.dispatchEvent(new Event('online'));
    
    expect(offlineModeService.isOnline).toBe(true);
    expect(mockCallback).toHaveBeenCalled();
  });

  test('handles network offline event', () => {
    const mockCallback = jest.fn();
    offlineModeService.on('network_offline', mockCallback);
    
    // Simulate network offline event
    window.dispatchEvent(new Event('offline'));
    
    expect(offlineModeService.isOnline).toBe(false);
    expect(mockCallback).toHaveBeenCalled();
  });

  test('stores and retrieves local data', async () => {
    const key = 'test_key';
    const data = { message: 'Hello, world!', timestamp: Date.now() };
    
    // Store data
    const storeResult = await offlineModeService.storeLocalData(key, data);
    expect(storeResult).toBe(true);
    
    // Retrieve data
    const retrievedData = await offlineModeService.getLocalData(key);
    expect(retrievedData).toEqual(data);
  });

  test('queues data for sync', async () => {
    const operation = {
      type: 'message',
      data: {
        content: 'Test message',
        timestamp: Date.now()
      }
    };
    
    const operationId = await offlineModeService.queueForSync(operation);
    expect(operationId).toBeDefined();
    expect(offlineModeService.syncQueue).toHaveLength(1);
  });

  test('gets statistics correctly', () => {
    const stats = offlineModeService.getStats();
    expect(stats).toHaveProperty('state');
    expect(stats).toHaveProperty('isOnline');
    expect(stats).toHaveProperty('queueSize');
    expect(stats).toHaveProperty('localDataSize');
  });
});