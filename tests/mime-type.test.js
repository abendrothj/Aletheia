// Tests for MIME type detection from service-worker.js

/**
 * Detect image MIME type from magic bytes
 * Extracted from service-worker.js for testing
 */
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

describe('detectMimeType', () => {
  describe('magic byte detection', () => {
    test('detects JPEG from magic bytes', () => {
      // JPEG magic bytes: FF D8 FF
      const jpegBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]).buffer;
      expect(detectMimeType(jpegBuffer, 'https://example.com/image')).toBe('image/jpeg');
    });

    test('detects PNG from magic bytes', () => {
      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const pngBuffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]).buffer;
      expect(detectMimeType(pngBuffer, 'https://example.com/image')).toBe('image/png');
    });

    test('detects WebP from magic bytes', () => {
      // WebP: RIFF....WEBP
      const webpBuffer = new Uint8Array([
        0x52, 0x49, 0x46, 0x46,  // RIFF
        0x00, 0x00, 0x00, 0x00,  // file size (placeholder)
        0x57, 0x45, 0x42, 0x50   // WEBP
      ]).buffer;
      expect(detectMimeType(webpBuffer, 'https://example.com/image')).toBe('image/webp');
    });
  });

  describe('URL extension fallback', () => {
    test('falls back to .jpg extension', () => {
      const emptyBuffer = new Uint8Array(12).buffer;
      expect(detectMimeType(emptyBuffer, 'https://example.com/photo.jpg')).toBe('image/jpeg');
    });

    test('falls back to .jpeg extension', () => {
      const emptyBuffer = new Uint8Array(12).buffer;
      expect(detectMimeType(emptyBuffer, 'https://example.com/photo.jpeg')).toBe('image/jpeg');
    });

    test('falls back to .png extension', () => {
      const emptyBuffer = new Uint8Array(12).buffer;
      expect(detectMimeType(emptyBuffer, 'https://example.com/photo.png')).toBe('image/png');
    });

    test('falls back to .webp extension', () => {
      const emptyBuffer = new Uint8Array(12).buffer;
      expect(detectMimeType(emptyBuffer, 'https://example.com/photo.webp')).toBe('image/webp');
    });

    test('handles uppercase extensions', () => {
      const emptyBuffer = new Uint8Array(12).buffer;
      expect(detectMimeType(emptyBuffer, 'https://example.com/PHOTO.JPG')).toBe('image/jpeg');
      expect(detectMimeType(emptyBuffer, 'https://example.com/PHOTO.PNG')).toBe('image/png');
    });

    test('handles mixed case extensions', () => {
      const emptyBuffer = new Uint8Array(12).buffer;
      expect(detectMimeType(emptyBuffer, 'https://example.com/Photo.Jpeg')).toBe('image/jpeg');
    });
  });

  describe('default fallback', () => {
    test('defaults to image/jpeg for unknown types', () => {
      const emptyBuffer = new Uint8Array(12).buffer;
      expect(detectMimeType(emptyBuffer, 'https://example.com/image')).toBe('image/jpeg');
    });

    test('defaults to image/jpeg for URLs with query strings', () => {
      const emptyBuffer = new Uint8Array(12).buffer;
      expect(detectMimeType(emptyBuffer, 'https://example.com/image?size=large')).toBe('image/jpeg');
    });

    test('defaults to image/jpeg for unknown extensions', () => {
      const emptyBuffer = new Uint8Array(12).buffer;
      expect(detectMimeType(emptyBuffer, 'https://example.com/photo.bmp')).toBe('image/jpeg');
    });
  });

  describe('magic bytes take priority over URL', () => {
    test('JPEG magic bytes override .png URL', () => {
      const jpegBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]).buffer;
      expect(detectMimeType(jpegBuffer, 'https://example.com/image.png')).toBe('image/jpeg');
    });

    test('PNG magic bytes override .jpg URL', () => {
      const pngBuffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]).buffer;
      expect(detectMimeType(pngBuffer, 'https://example.com/image.jpg')).toBe('image/png');
    });
  });

  describe('edge cases', () => {
    test('handles small buffers gracefully', () => {
      const smallBuffer = new Uint8Array([0xFF, 0xD8]).buffer;
      // Should not throw, but may not detect correctly
      expect(() => detectMimeType(smallBuffer, 'https://example.com/image.jpg')).not.toThrow();
    });

    test('handles empty URLs', () => {
      const jpegBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]).buffer;
      expect(detectMimeType(jpegBuffer, '')).toBe('image/jpeg');
    });
  });
});
