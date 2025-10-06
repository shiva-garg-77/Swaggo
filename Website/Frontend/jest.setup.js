// Jest setup file
import '@testing-library/jest-dom';

// Mock the Web APIs that are not available in the test environment
global.crypto = {
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
  subtle: {
    generateKey: jest.fn(() => Promise.resolve({})),
    encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
    decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
    importKey: jest.fn(() => Promise.resolve({})),
    exportKey: jest.fn(() => Promise.resolve(new ArrayBuffer(16))),
    sign: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
    verify: jest.fn(() => Promise.resolve(true)),
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32)))
  }
};

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 500 * 1024 * 1024
  },
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => [])
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock IndexedDB
global.indexedDB = {
  open: jest.fn(() => ({
    addEventListener: jest.fn(),
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          put: jest.fn(),
          get: jest.fn(() => ({ addEventListener: jest.fn() })),
          delete: jest.fn()
        }))
      }))
    }
  })),
  deleteDatabase: jest.fn()
};

// Mock notification API
global.Notification = {
  requestPermission: jest.fn(() => Promise.resolve('granted')),
  permission: 'granted'
};

// Mock MediaDevices for device fingerprinting
global.navigator = {
  ...global.navigator,
  mediaDevices: {
    enumerateDevices: jest.fn(() => Promise.resolve([
      { deviceId: 'test-camera', kind: 'videoinput', label: 'Test Camera' },
      { deviceId: 'test-mic', kind: 'audioinput', label: 'Test Microphone' }
    ]))
  },
  userAgent: 'Mozilla/5.0 (Test Environment)',
  platform: 'Test',
  hardwareConcurrency: 8,
  language: 'en-US',
  languages: ['en-US', 'en'],
  cookieEnabled: true,
  doNotTrack: null,
  maxTouchPoints: 0,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50
  }
};

// Mock console methods for testing
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Mock EventSource for real-time monitoring
global.EventSource = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  readyState: 1
}));

// Mock WebSocket for real-time communication
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1
}));

// Mock MutationObserver for DOM monitoring
global.MutationObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => [])
}));

// Mock PerformanceObserver for performance monitoring
global.PerformanceObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => [])
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock Canvas API for security dashboard charts
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
  transform: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  closePath: jest.fn(),
  measureText: jest.fn(() => ({ width: 10 })),
  fillText: jest.fn(),
  strokeText: jest.fn()
}));

// Mock toDataURL for canvas fingerprinting
HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
);

// Mock Date for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
Date.now = jest.fn(() => mockDate.getTime());

// Suppress console warnings in tests unless explicitly testing them
const originalError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalError;
});

// Global test utilities
global.testUtils = {
  mockSecurityEvent: (type, severity = 'MEDIUM') => ({
    id: 'test-event-' + Math.random().toString(36).substr(2, 9),
    type,
    severity,
    timestamp: Date.now(),
    source: 'test'
  }),
  
  mockAlert: (severity = 'HIGH') => ({
    id: 'test-alert-' + Math.random().toString(36).substr(2, 9),
    severity,
    title: 'Test Alert',
    description: 'Test alert description',
    timestamp: Date.now()
  }),
  
  mockUser: () => ({
    id: 'test-user-123',
    username: 'testuser',
    email: 'test@example.com'
  }),
  
  waitFor: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkCondition = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Condition not met within timeout'));
        } else {
          setTimeout(checkCondition, 100);
        }
      };
      checkCondition();
    });
  }
};