// Jest test setup
require('@testing-library/jest-dom');

// Mock chrome API for extension testing
global.chrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`)
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined)
    }
  },
  tabs: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([])
  }
};

// Mock browser API (Firefox)
global.browser = undefined;

// Mock fetch for image fetching tests
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
// };
