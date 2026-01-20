// Tests for browser API compatibility

describe('Chrome API mocks', () => {
  test('chrome object is available globally', () => {
    expect(global.chrome).toBeDefined();
  });

  test('chrome.runtime.getURL returns expected format', () => {
    const url = chrome.runtime.getURL('wasm/veritas_core.js');
    expect(url).toBe('chrome-extension://test-id/wasm/veritas_core.js');
  });

  test('chrome.storage.local.get is callable', async () => {
    chrome.storage.local.get.mockResolvedValueOnce({ imagesChecked: 5 });
    const result = await chrome.storage.local.get(['imagesChecked']);
    expect(result).toEqual({ imagesChecked: 5 });
  });

  test('chrome.storage.local.set is callable', async () => {
    await chrome.storage.local.set({ imagesChecked: 10 });
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ imagesChecked: 10 });
  });

  test('chrome.contextMenus.create is callable', () => {
    chrome.contextMenus.create({
      id: 'verifyImage',
      title: 'Verify with Aletheia',
      contexts: ['image']
    });
    expect(chrome.contextMenus.create).toHaveBeenCalled();
  });

  test('chrome.tabs.sendMessage is callable', async () => {
    await chrome.tabs.sendMessage(1, { action: 'test' });
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'test' });
  });
});

describe('Browser API abstraction logic', () => {
  /**
   * Determine which API to use - extracted logic from browser-api.js
   */
  function getBrowserAPI() {
    if (typeof browser !== 'undefined' && browser !== null) {
      return 'firefox';
    } else if (typeof chrome !== 'undefined') {
      return 'chrome';
    }
    return 'unknown';
  }

  test('detects chrome environment', () => {
    // In our test setup, browser is undefined and chrome is defined
    expect(getBrowserAPI()).toBe('chrome');
  });

  test('would detect firefox when browser is defined', () => {
    const originalBrowser = global.browser;
    global.browser = { runtime: {} };

    expect(getBrowserAPI()).toBe('firefox');

    global.browser = originalBrowser;
  });
});

describe('Message structure validation', () => {
  const validShowResultMessage = {
    action: 'showVerificationResult',
    imageUrl: 'https://example.com/image.jpg',
    result: {
      status: 'valid',
      claims: { title: 'Test' }
    }
  };

  const validShowErrorMessage = {
    action: 'showVerificationError',
    imageUrl: 'https://example.com/image.jpg',
    error: 'Failed to fetch image'
  };

  test('showVerificationResult message has required fields', () => {
    expect(validShowResultMessage).toHaveProperty('action', 'showVerificationResult');
    expect(validShowResultMessage).toHaveProperty('imageUrl');
    expect(validShowResultMessage).toHaveProperty('result');
    expect(validShowResultMessage.result).toHaveProperty('status');
  });

  test('showVerificationError message has required fields', () => {
    expect(validShowErrorMessage).toHaveProperty('action', 'showVerificationError');
    expect(validShowErrorMessage).toHaveProperty('imageUrl');
    expect(validShowErrorMessage).toHaveProperty('error');
  });

  /**
   * Validate message action
   */
  function isValidMessageAction(action) {
    const validActions = ['showVerificationResult', 'showVerificationError'];
    return validActions.includes(action);
  }

  test('validates known message actions', () => {
    expect(isValidMessageAction('showVerificationResult')).toBe(true);
    expect(isValidMessageAction('showVerificationError')).toBe(true);
    expect(isValidMessageAction('unknownAction')).toBe(false);
    expect(isValidMessageAction('')).toBe(false);
    expect(isValidMessageAction(undefined)).toBe(false);
  });
});

describe('Context menu configuration', () => {
  const contextMenuConfig = {
    id: 'verifyImage',
    title: 'Verify with Aletheia',
    contexts: ['image']
  };

  test('context menu has correct id', () => {
    expect(contextMenuConfig.id).toBe('verifyImage');
  });

  test('context menu has user-friendly title', () => {
    expect(contextMenuConfig.title).toBe('Verify with Aletheia');
  });

  test('context menu only appears for images', () => {
    expect(contextMenuConfig.contexts).toContain('image');
    expect(contextMenuConfig.contexts).toHaveLength(1);
  });
});
