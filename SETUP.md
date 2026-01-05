# Aletheia Setup Guide

This guide will help you build and run the Aletheia extension.

## Prerequisites

### 1. Install Rust and wasm-pack

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Create Icon Files

The extension needs icon files. You have two options:

**Option A: Use placeholder icons (quick start)**

Create simple 128x128, 48x48, and 16x16 PNG files and place them in `extension/src/icons/`:
- `icon16.png`
- `icon48.png`
- `icon128.png`

**Option B: Generate with ImageMagick (recommended)**

```bash
cd extension/src/icons
convert -size 128x128 xc:'#667eea' -pointsize 80 -fill white -gravity center -annotate +0+0 'Α' icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

**Option C: Use an online icon generator**

Visit [favicon.io](https://favicon.io) or similar tool to create icons.

## Build Instructions

### Step 1: Build the Rust WASM Core

```bash
npm run build:wasm
```

This compiles the Rust code to WebAssembly and places the output in `extension/src/wasm/`.

### Step 2: Build the Extension

**For Chrome:**
```bash
npm run build:chrome
```

**For Firefox:**
```bash
npm run build:firefox
```

**For both:**
```bash
npm run build:all
```

The built extensions will be in:
- `extension/dist-chrome/` (Chrome)
- `extension/dist-firefox/` (Firefox)

## Testing

### Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension/dist-chrome` directory
5. Right-click any image and select "Verify with Aletheia"

### Firefox

```bash
npm run test:firefox
```

Or manually:
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in `extension/dist-firefox/`
4. Right-click any image and select "Verify with Aletheia"

## Testing with C2PA Images

Test the extension on sites with Content Credentials:

1. **Official Test Site**: https://contentcredentials.org/verify
   - Download sample images
   - Right-click and verify

2. **Adobe Stock**: https://stock.adobe.com
   - Search for "content credentials"
   - View images with C2PA data

3. **Generate Your Own**:
   - Download Adobe Photoshop (free 7-day trial)
   - Edit any image
   - Export with "Include Content Credentials" enabled
   - Test the exported image

4. **AI Generated**:
   - Generate an image in DALL-E 3 (OpenAI)
   - Download and verify (should have C2PA)

## Troubleshooting

### WASM Build Fails

**Error: `wasm-pack: command not found`**
```bash
cargo install wasm-pack
```

**Error: `failed to select a version for c2pa`**

Update dependencies:
```bash
cd veritas-core
cargo update
```

### Extension Won't Load

**Chrome: "Manifest version 3 is required"**
- Ensure you're using Chrome 109 or later

**Firefox: "Reading manifest failed"**
- Ensure you built with `npm run build:firefox`

### WASM Doesn't Load

Check the browser console (F12) for errors. Common issues:

1. **CSP Error**: Content Security Policy blocking WASM
   - Verify `manifest.json` has `'wasm-unsafe-eval'` in CSP

2. **Module Import Error**:
   - Ensure WASM files are in `wasm/` directory
   - Check `web_accessible_resources` in manifest

### No Images Have Credentials

This is normal! Most web images (95%+) don't have C2PA data yet. Test on the sites listed above to see it working.

## Development Workflow

### Watch Mode (Coming Soon)

For development with auto-rebuild:
```bash
npm run watch
```

### Clean Build

```bash
rm -rf extension/dist-chrome extension/dist-firefox extension/src/wasm
npm run build:all
```

## Next Steps

After successful build:

1. Test on known C2PA images
2. Customize icons in `extension/src/icons/`
3. Adjust UI styling in `verification-panel.js`
4. Enhance Rust parsing in `veritas-core/src/lib.rs`

## Additional Resources

- [C2PA Specification](https://c2pa.org/specifications/specifications/1.0/specs/C2PA_Specification.html)
- [Content Credentials](https://contentcredentials.org)
- [WebExtension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [wasm-pack Documentation](https://rustwasm.github.io/wasm-pack/)
