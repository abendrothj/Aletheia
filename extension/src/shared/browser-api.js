// Unified browser API for Chrome and Firefox compatibility
// Uses webextension-polyfill for Firefox, falls back to chrome API

let browserAPI;

if (typeof browser !== 'undefined') {
  // Firefox
  browserAPI = browser;
} else if (typeof chrome !== 'undefined') {
  // Chrome - wrap in promises
  browserAPI = {
    storage: {
      local: {
        get: (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve)),
        set: (items) => new Promise((resolve) => chrome.storage.local.set(items, resolve)),
      }
    },
    contextMenus: {
      create: chrome.contextMenus.create.bind(chrome.contextMenus),
      onClicked: chrome.contextMenus.onClicked
    },
    runtime: {
      sendMessage: (message) => new Promise((resolve) => chrome.runtime.sendMessage(message, resolve)),
      onMessage: chrome.runtime.onMessage,
      getURL: chrome.runtime.getURL.bind(chrome.runtime)
    },
    tabs: {
      sendMessage: (tabId, message) => new Promise((resolve) => chrome.tabs.sendMessage(tabId, message, resolve)),
      query: (queryInfo) => new Promise((resolve) => chrome.tabs.query(queryInfo, resolve))
    }
  };
}

export default browserAPI;
