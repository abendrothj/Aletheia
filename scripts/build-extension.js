#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targetBrowser = process.argv[2]; // 'chrome' or 'firefox'

if (!targetBrowser || !['chrome', 'firefox'].includes(targetBrowser)) {
  console.error('Usage: node build-extension.js <chrome|firefox>');
  process.exit(1);
}

console.log(`Building extension for ${targetBrowser}...`);

// Load base manifest
const manifestPath = path.join(__dirname, '../extension/src/manifest.json');
const baseManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Browser-specific overrides
const overrides = {
  firefox: {
    browser_specific_settings: {
      gecko: {
        id: 'aletheia@truthverify.org',
        strict_min_version: '109.0'
      }
    }
  },
  chrome: {
    // Chrome-specific settings (if any)
    minimum_chrome_version: '109'
  }
};

// Merge manifests
const finalManifest = { ...baseManifest, ...overrides[targetBrowser] };

// Create dist directory
const distDir = path.join(__dirname, `../extension/dist-${targetBrowser}`);
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy all files from src to dist
const srcDir = path.join(__dirname, '../extension/src');
copyDir(srcDir, distDir);

// Write merged manifest
fs.writeFileSync(
  path.join(distDir, 'manifest.json'),
  JSON.stringify(finalManifest, null, 2)
);

// Remove firefox-specific manifest from dist
const firefoxManifestPath = path.join(distDir, 'manifest.firefox.json');
if (fs.existsSync(firefoxManifestPath)) {
  fs.unlinkSync(firefoxManifestPath);
}

console.log(`✓ Built ${targetBrowser} extension in ${distDir}`);

// Helper function to recursively copy directory
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
