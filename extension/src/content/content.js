// Aletheia Content Script
// Handles message passing and UI injection
// Note: verification-panel.js is loaded before this file via manifest.json

// Listen for verification results from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'verificationStarted') {
    // Find the image and show loading overlay
    const img = findImageByUrl(message.imageUrl);
    if (img) {
      showImageOverlay(img, 'loading');
    }
  }

  if (message.action === 'showVerificationResult') {
    // Find the image and update overlay with result
    const img = findImageByUrl(message.imageUrl);
    if (img) {
      showImageOverlay(img, message.result.status, message.result, message.imageUrl);
    }
  }

  if (message.action === 'showVerificationError') {
    // Find the image and show error overlay
    const img = findImageByUrl(message.imageUrl);
    if (img) {
      showImageOverlay(img, 'error');
    }
    showErrorNotification(message.error);
  }
});

// Helper function to find an image element by its URL
function findImageByUrl(url) {
  const images = document.querySelectorAll('img');
  
  // Normalize the URL for comparison
  const normalizeUrl = (u) => {
    try {
      const parsed = new URL(u, window.location.href);
      return parsed.href;
    } catch {
      return u;
    }
  };
  
  const targetUrl = normalizeUrl(url);
  
  // Try to find by exact src match
  for (const img of images) {
    const imgSrc = normalizeUrl(img.src);
    const imgCurrentSrc = img.currentSrc ? normalizeUrl(img.currentSrc) : null;
    
    if (imgSrc === targetUrl || imgCurrentSrc === targetUrl) {
      return img;
    }
    
    // Also try decoding URLs
    try {
      if (decodeURIComponent(imgSrc) === decodeURIComponent(targetUrl) ||
          (imgCurrentSrc && decodeURIComponent(imgCurrentSrc) === decodeURIComponent(targetUrl))) {
        return img;
      }
    } catch (e) {}
  }
  
  // Try srcset images
  for (const img of images) {
    const srcset = img.srcset;
    if (srcset && (srcset.includes(url) || srcset.includes(decodeURIComponent(url)))) {
      return img;
    }
  }
  
  return null;
}

function showVerificationPanel(imageUrl, result) {
  // Remove any existing panels
  const existing = document.querySelector('aletheia-verification-panel');
  if (existing) {
    existing.remove();
  }

  // Create and show new panel
  const panel = document.createElement('aletheia-verification-panel');
  // Store data as properties that the custom element can access
  panel._imageUrl = imageUrl;
  panel._result = result;
  document.body.appendChild(panel);
  
  // Wait a tick for the element to be fully connected, then call render
  setTimeout(() => {
    if (panel && panel.render && typeof panel.render === 'function') {
      panel.render(imageUrl, result);
    }
  }, 0);
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

function showImageOverlay(imgElement, status, verificationData = null, imageUrl = null) {
  if (!imgElement) return;

  // Remove any existing overlay on THIS specific image only
  const existingOverlay = imgElement._aletheiaOverlay;
  if (existingOverlay && existingOverlay.parentElement) {
    existingOverlay.remove();
  }

  // Create overlay badge (small, top-right corner)
  const badge = document.createElement('div');
  badge.className = 'aletheia-image-overlay';
  badge.dataset.status = status;
  
  // Store reference to badge on the image element
  imgElement._aletheiaOverlay = badge;
  
  // Store verification data for click handler
  if (verificationData && imageUrl) {
    badge._verificationData = verificationData;
    badge._imageUrl = imageUrl;
  }

  // Position badge in top-right corner of image
  const rect = imgElement.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;

  // Badge is small and positioned at top-right of image
  const badgeSize = Math.min(rect.width * 0.3, 120); // Max 120px, or 30% of image width
  const badgePadding = 8;

  // Make badge clickable if it has verification data
  const pointerEvents = (verificationData && imageUrl) ? 'auto' : 'none';
  const cursor = (verificationData && imageUrl) ? 'pointer' : 'default';

  badge.style.cssText = `
    position: absolute;
    top: ${rect.top + scrollY + badgePadding}px;
    left: ${rect.left + scrollX + rect.width - badgeSize - badgePadding}px;
    width: ${badgeSize}px;
    min-height: ${badgeSize * 0.4}px;
    pointer-events: ${pointerEvents};
    cursor: ${cursor};
    z-index: 999998;
    transition: opacity 0.3s ease, transform 0.2s ease;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  `;

  // Create badge content based on status
  let badgeColor = '';
  let badgeText = '';
  let badgeIcon = '';

  if (status === 'loading') {
    badgeColor = '#3b82f6'; // blue
    badgeText = 'Verifying...';
    badgeIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke="white" stroke-width="3" stroke-opacity="0.3" />
        <path d="M12 2 A 10 10 0 0 1 22 12" stroke="white" stroke-width="3" stroke-linecap="round" />
      </svg>
    `;
  } else if (status === 'valid') {
    badgeColor = '#10b981'; // green
    badgeText = 'C2PA Found';
    badgeIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17L4 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  } else if (status === 'invalid') {
    badgeColor = '#ef4444'; // red
    badgeText = 'C2PA Invalid';
    badgeIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 18L18 6M6 6L18 18" stroke="white" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
  } else if (status === 'expired') {
    badgeColor = '#f59e0b'; // amber
    badgeText = 'C2PA Expired';
    badgeIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 8V12L15 15" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="9" stroke="white" stroke-width="2.5"/>
      </svg>
    `;
  } else if (status === 'none') {
    badgeColor = '#6b7280'; // gray
    badgeText = 'No C2PA';
    badgeIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="white" stroke-width="2.5"/>
        <path d="M8 12h8" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `;
  } else if (status === 'error') {
    badgeColor = '#ef4444'; // red
    badgeText = 'Error';
    badgeIcon = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 8v4m0 4h.01" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="9" stroke="white" stroke-width="2.5"/>
      </svg>
    `;
  }

  badge.innerHTML = `
    <style>
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
    <div style="
      width: 100%;
      height: 100%;
      background: ${badgeColor};
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 6px;
      position: relative;
    ">
      ${status !== 'loading' ? `
        <button class="aletheia-close-btn" style="
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid white;
          color: white;
          font-size: 12px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          pointer-events: auto;
          z-index: 1;
        " title="Close">&times;</button>
      ` : ''}
      ${badgeIcon}
      <div style="
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        white-space: nowrap;
      ">${badgeText}</div>
    </div>
  `;

  document.body.appendChild(badge);

  // Add close button handler (if not loading state)
  if (status !== 'loading') {
    const closeBtn = badge.querySelector('.aletheia-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        badge.remove();
        if (imgElement._aletheiaOverlay === badge) {
          imgElement._aletheiaOverlay = null;
        }
      });
    }
  }

  // Add click handler to open panel (only if not loading state)
  if (status !== 'loading' && verificationData && imageUrl) {
    badge.addEventListener('click', (e) => {
      // Don't trigger if clicking close button
      if (e.target.classList.contains('aletheia-close-btn')) {
        return;
      }
      e.stopPropagation();
      try {
        showVerificationPanel(imageUrl, verificationData);
      } catch (err) {
        console.error('Failed to open verification panel:', err);
      }
    });
    
    // Add hover effect
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'scale(1.05)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.style.transform = 'scale(1)';
    });
  }

  // Don't auto-remove - keep badge persistent to show verification status
  // Only remove when a new verification starts (handled at top of function)

  // Update badge position on scroll/resize
  const updatePosition = () => {
    const newRect = imgElement.getBoundingClientRect();
    const newScrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const newScrollY = window.pageYOffset || document.documentElement.scrollTop;
    const newBadgeSize = Math.min(newRect.width * 0.3, 120);
    badge.style.top = `${newRect.top + newScrollY + badgePadding}px`;
    badge.style.left = `${newRect.left + newScrollX + newRect.width - newBadgeSize - badgePadding}px`;
    badge.style.width = `${newBadgeSize}px`;
  };

  window.addEventListener('scroll', updatePosition, { passive: true });
  window.addEventListener('resize', updatePosition, { passive: true });

  // Clean up listeners when badge is removed
  const observer = new MutationObserver((mutations) => {
    if (!document.body.contains(badge)) {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });
}

// Auto-verify images on page load if enabled
chrome.storage.local.get(['autoVerify'], async (result) => {
  if (result.autoVerify) {
    // Wait a bit for images to load
    setTimeout(() => {
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        if (img.src && img.complete) {
          // Send message to background to verify this image
          chrome.runtime.sendMessage({
            action: 'verifyImageUrl',
            imageUrl: img.src
          });
        }
      });
    }, 1000);
  }
});

// Listen for dynamically added images if auto-verify is enabled
chrome.storage.local.get(['autoVerify'], (result) => {
  if (result.autoVerify) {
    const imgObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'IMG' && node.src && node.complete) {
            chrome.runtime.sendMessage({
              action: 'verifyImageUrl',
              imageUrl: node.src
            });
          } else if (node.querySelectorAll) {
            const images = node.querySelectorAll('img');
            images.forEach((img) => {
              if (img.src && img.complete) {
                chrome.runtime.sendMessage({
                  action: 'verifyImageUrl',
                  imageUrl: img.src
                });
              }
            });
          }
        });
      });
    });
    imgObserver.observe(document.body, { childList: true, subtree: true });
  }
});

console.log('Aletheia content script loaded');
