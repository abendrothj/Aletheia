// Aletheia Content Script
// Handles message passing and UI injection

// Import the verification panel component
import './verification-panel.js';

// Listen for verification results from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showVerificationResult') {
    showVerificationPanel(message.imageUrl, message.result);
  }

  if (message.action === 'showVerificationError') {
    showErrorNotification(message.error);
  }
});

function showVerificationPanel(imageUrl, result) {
  // Remove any existing panels
  const existing = document.querySelector('aletheia-verification-panel');
  if (existing) {
    existing.remove();
  }

  // Create and show new panel
  const panel = document.createElement('aletheia-verification-panel');
  panel.render(imageUrl, result);
  document.body.appendChild(panel);
}

function showErrorNotification(errorMessage) {
  // Remove any existing notifications
  const existing = document.getElementById('aletheia-error-toast');
  if (existing) {
    existing.remove();
  }

  // Create error toast
  const toast = document.createElement('div');
  toast.id = 'aletheia-error-toast';
  toast.textContent = `Aletheia Error: ${errorMessage}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #ef4444;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    z-index: 999999;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 400px;
  `;
  document.body.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => toast.remove(), 5000);
}

console.log('Aletheia content script loaded');
