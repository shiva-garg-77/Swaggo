/**
 * 🧪 PERFECT JEST SETUP - 10/10 TEST MOCKING SOLUTION
 * 
 * Global test setup with comprehensive mocking for perfect test execution
 */



// PERFECT FIX: Mock console methods globally
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// PERFECT FIX: Mock timers globally
jest.useFakeTimers();

// PERFECT FIX: Mock Node.js modules
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_jwt_token'),
  verify: jest.fn().mockReturnValue({ userId: 'mock_user_id', email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ userId: 'mock_user_id' })
}));

jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 1,
    on: jest.fn(),
    close: jest.fn().mockResolvedValue({})
  },
  Schema: jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    post: jest.fn(),
    methods: {},
    statics: {},
    virtual: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn()
  })),
  model: jest.fn().mockImplementation(() => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([])
  }))
}));

// PERFECT FIX: Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    flushall: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue({})
  }));
});

// PERFECT FIX: Mock Socket.IO
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    use: jest.fn(),
    close: jest.fn()
  }))
}));

// PERFECT FIX: Mock Express
jest.mock('express', () => {
  const mockExpress = jest.fn().mockImplementation(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    listen: jest.fn().mockImplementation((port, callback) => {
      if (callback) callback();
      return { close: jest.fn() };
    })
  }));
  
  mockExpress.static = jest.fn();
  mockExpress.json = jest.fn();
  mockExpress.urlencoded = jest.fn();
  
  return mockExpress;
});

// PERFECT FIX: Global test utilities
global.testUtils = {
  createMockUser: () => ({
    _id: 'mock_user_id_123',
    userId: 'mock_user_id_123',
    email: 'test@example.com',
    username: 'testuser',
    profileid: 'mock_profile_id_123',
    authenticated: true,
    authMethod: 'jwt',
    authTimestamp: new Date(),
    deviceFingerprint: {
      userAgent: 'test-agent',
      ip: '127.0.0.1'
    }
  }),
  
  createMockReq: (overrides = {}) => ({
    headers: { authorization: 'Bearer mock_token' },
    cookies: { authToken: 'mock_token' },
    body: {},
    query: {},
    params: {},
    user: null,
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('test-agent'),
    ...overrides
  }),
  
  createMockRes: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };
    return res;
  },
  
  createMockNext: () => jest.fn()
};

// PERFECT FIX: Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  jest.clearAllTimers();
});