# Aletheia - C2PA Image Verification Extension

**Aletheia** (Greek: ἀλήθεια - "truth, disclosure") is a browser extension that verifies Content Credentials (C2PA) in images using cryptographic verification.

## Features

- **Right-click verification**: Check any image for C2PA credentials
- **Comprehensive provenance display**: View creator info, edit history, and original thumbnails
- **Cross-browser**: Works on Chrome and Firefox
- **Privacy-first**: All verification happens locally using WASM
- **Fast**: Rust-powered binary parsing for performance

## Architecture

- **Rust WASM Core**: Binary C2PA parsing and cryptographic validation
- **Extension**: Context menu integration and UI overlay
- **Cross-browser compatible**: Unified codebase for Chrome/Firefox

## Quick Start

See [SETUP.md](SETUP.md) for detailed build instructions.

### Prerequisites

- Rust + wasm-pack (`cargo install wasm-pack`)
- Node.js + npm
- Icon files (see SETUP.md)

### Build

```bash
npm install
npm run build:wasm   # Build Rust WASM core
npm run build:all     # Build Chrome + Firefox extensions
```

### Load in Browser

**Chrome:**
1. Open [chrome://extensions](chrome://extensions)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist-chrome/`

**Firefox:**
```bash
npm run test:firefox
```

Or manually at [about:debugging](about:debugging#/runtime/this-firefox) → Load Temporary Add-on

## Testing C2PA Images

Find test images at:
- https://contentcredentials.org/verify
- Adobe Stock (search "content credentials")
- Generate in Adobe Photoshop or DALL-E 3

## License

MIT
