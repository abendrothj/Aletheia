// Service Worker for Aletheia
// Handles context menu, image fetching, and WASM C2PA verification

let wasmModule = null;
let wasmInitPromise = null;

// Initialize context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'verifyImage',
    title: 'Verify with Aletheia',
    contexts: ['image']
  });

  console.log('Aletheia installed successfully');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'verifyImage') {
    const imageUrl = info.srcUrl;
    console.log('Verifying image:', imageUrl);

    try {
      // Fetch image with extension privileges (bypasses CORS)
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log(`Image fetched: ${arrayBuffer.byteLength} bytes`);

      // Verify with WASM
      const result = await verifyImageWithWASM(arrayBuffer, imageUrl);
      console.log('Verification result:', result);

      // Send result to content script for UI display
      chrome.tabs.sendMessage(tab.id, {
        action: 'showVerificationResult',
        imageUrl,
        result
      });
    } catch (error) {
      console.error('Verification error:', error);
      chrome.tabs.sendMessage(tab.id, {
        action: 'showVerificationError',
        imageUrl,
        error: error.message
      });
    }
  }
});

// WASM initialization with lazy loading
async function initWASM() {
  if (wasmModule) return wasmModule;

  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    try {
      const wasmUrl = chrome.runtime.getURL('wasm/veritas_core_bg.wasm');
      const glueUrl = chrome.runtime.getURL('wasm/veritas_core.js');

      console.log('Loading WASM from:', glueUrl);

      // Dynamic import of WASM glue
      const wasm = await import(glueUrl);
      await wasm.default(wasmUrl);

      // Initialize panic hook for better error messages
      wasm.init_panic_hook();

      wasmModule = wasm;
      console.log('Aletheia WASM initialized successfully');
      return wasm;
    } catch (error) {
      console.error('WASM initialization failed:', error);
      wasmInitPromise = null; // Reset so we can retry
      throw error;
    }
  })();

  return wasmInitPromise;
}

// Verify image with WASM
async function verifyImageWithWASM(arrayBuffer, imageUrl) {
  const wasm = await initWASM();

  // Detect MIME type from URL or magic bytes
  const mimeType = detectMimeType(arrayBuffer, imageUrl);
  console.log('Detected MIME type:', mimeType);

  const uint8Array = new Uint8Array(arrayBuffer);
  const resultJson = wasm.verify_c2pa(uint8Array, mimeType);

  return JSON.parse(resultJson);
}

// Detect image MIME type from magic bytes
function detectMimeType(buffer, url) {
  const bytes = new Uint8Array(buffer.slice(0, 12));

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }

  // WebP: RIFF ... WEBP
  if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }

  // Fallback to URL extension
  const urlLower = url.toLowerCase();
  if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) return 'image/jpeg';
  if (urlLower.endsWith('.png')) return 'image/png';
  if (urlLower.endsWith('.webp')) return 'image/webp';

  // Default to JPEG
  return 'image/jpeg';
}
