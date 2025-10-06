/**
 * 🧪 Frontend Test Setup & Configuration
 * Jest and Testing Library setup for React components
 * 
 * This file is automatically loaded by Create React App before running tests.
 * It configures global test utilities, mocks, and environment setup.
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { jest } from '@jest/globals';
import 'whatwg-fetch';

// Polyfill for Request constructor
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = options.headers || {};
      this.body = options.body;
      this.credentials = options.credentials;
    }
  };
}

// Polyfill for CSS.supports
if (typeof global.CSS === 'undefined') {
  global.CSS = {
    supports: jest.fn().mockReturnValue(true)
  };
}

// Configure Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true
});

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver for components using lazy loading
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock ResizeObserver for responsive components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock HTMLCanvasElement.getContext for chart components
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Array(4)
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => []),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

// Mock localStorage and sessionStorage
const createStorageMock = () => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => Object.keys(store)[index] || null)
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
});

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
});

// Mock URL.createObjectURL for file upload tests
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: 'https://api.example.com/test',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
  })
);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.REACT_APP_API_URL = 'http://localhost:45799';
process.env.REACT_APP_DS_SERVER_URL = 'http://localhost:5000';

// Test utilities
const testUtils = {
  /**
   * Create a mock user object for testing
   */
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isAuthenticated: true,
    role: 'user',
    preferences: {
      theme: 'light',
      notifications: true,
    },
    ...overrides
  }),

  /**
   * Create mock authentication context
   */
  createMockAuthContext: (user = null) => ({
    user,
    isAuthenticated: !!user,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    updateProfile: jest.fn(),
    refreshToken: jest.fn(),
    error: null,
    clearError: jest.fn(),
  }),

  /**
   * Create mock router context
   */
  createMockRouter: (path = '/') => ({
    pathname: path,
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isReady: true,
    isPreview: false,
    query: {},
    asPath: path,
    basePath: '',
    route: path,
  }),

  /**
   * Create mock API response
   */
  createMockApiResponse: (data = {}, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  }),

  /**
   * Simulate user interactions
   */
  userInteractions: {
    clickButton: async (button) => {
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.click(button);
    },
    
    typeInInput: async (input, value) => {
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.change(input, { target: { value } });
    },
    
    submitForm: async (form) => {
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.submit(form);
    },
  },

  /**
   * Wait for elements to appear/disappear
   */
  waitForElement: async (selector, timeout = 5000) => {
    const { waitFor, screen } = await import('@testing-library/react');
    return await waitFor(() => screen.getByTestId(selector), { timeout });
  },

  /**
   * Clean up after tests
   */
  cleanup: () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear localStorage and sessionStorage
    window.localStorage.clear();
    window.sessionStorage.clear();
    
    // Reset fetch mock
    if (global.fetch.mockClear) {
      global.fetch.mockClear();
    }
  }
};

// Make test utilities available globally
global.testUtils = testUtils;

// Custom matchers for better assertions
expect.extend({
  toBeVisible(received) {
    const pass = received.style.visibility !== 'hidden' && 
                 received.style.display !== 'none' &&
                 !received.hidden;
    
    return {
      message: () => 
        `expected element ${pass ? 'not ' : ''}to be visible`,
      pass,
    };
  },
  
  toHaveLoadingState(received) {
    const hasLoadingClass = received.classList.contains('loading');
    const hasLoadingAttr = received.getAttribute('aria-busy') === 'true';
    const pass = hasLoadingClass || hasLoadingAttr;
    
    return {
      message: () => 
        `expected element ${pass ? 'not ' : ''}to have loading state`,
      pass,
    };
  }
});

// Global test setup
beforeAll(() => {
  console.log('🧪 Frontend test environment initialized');
});

// Clean up after each test
afterEach(() => {
  testUtils.cleanup();
});

// Error boundaries for test isolation
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress React error boundary logs in tests unless they're actual test failures
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};

// Handle uncaught errors in tests
window.addEventListener('error', (event) => {
  console.error('Uncaught error in test:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in test:', event.reason);
});

console.log('✅ Frontend test setup complete with comprehensive mocks and utilities');