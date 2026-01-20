# Aletheia Testing Guide

## ✅ Build Complete!

The extension is **built and ready to test**. Here's how to load and test it.

---

## Load in Chrome

1. Open Chrome and navigate to: [chrome://extensions](chrome://extensions)
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Navigate to and select: `/Users/ja/Desktop/projects/Aletheia/extension/dist-chrome/`
5. The Aletheia extension should now appear in your extensions list

**Verification:**
- Look for the purple shield icon in your browser toolbar
- Check that no errors appear in the extension card

---

## Load in Firefox

1. Open Firefox and navigate to: [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox)
2. Click **"Load Temporary Add-on..."**
3. Navigate to `/Users/ja/Desktop/projects/Aletheia/extension/dist-firefox/`
4. Select the `manifest.json` file
5. The extension loads temporarily (until browser restart)

**Alternative (CLI):**
```bash
cd /Users/ja/Desktop/projects/Aletheia
npm run test:firefox
```

---

## How to Test

### Quick Test (Any Image)

1. **Right-click** any image on any webpage
2. Select **"Verify with Aletheia"** from the context menu
3. Wait ~1 second for verification
4. A modal should appear with results

**Expected Result:**
- Most images will show: **"No Content Credentials Found"** (gray status)
- This is normal! 95%+ of web images lack C2PA data

### Test with C2PA Images

Visit sites with actual C2PA credentials:

#### 1. Official C2PA Test Site (Recommended)
**URL:** https://contentcredentials.org/verify

**Steps:**
1. Visit the site
2. Click "Sample Images" or upload a test image
3. Download one of the sample images to your computer
4. Open the downloaded image in a new tab
5. Right-click → "Verify with Aletheia"

**Expected Result:**
- ✅ Status: **Valid** (green)
- Shows creator information
- Shows edit history timeline
- May show thumbnail comparison

#### 2. Adobe Stock
**URL:** https://stock.adobe.com

**Steps:**
1. Search for: `"content credentials"`
2. Open an image preview
3. Right-click the image → "Verify with Aletheia"

**Expected Result:**
- Should find C2PA credentials in some images
- Shows Adobe as the tool
- May show photographer name

#### 3. AI-Generated Images
**URL:** https://chatgpt.com (with DALL-E 3)

**Steps:**
1. Generate an image using ChatGPT
2. Download the generated image
3. Open in browser and verify

**Expected Result:**
- Should show C2PA credentials
- Tool: OpenAI DALL-E
- Status: Valid

---

## Testing Checklist

### Functionality Tests

- [ ] **Context menu appears** when right-clicking images
- [ ] **Verification completes** without errors (check browser console F12)
- [ ] **Modal displays** with color-coded status
- [ ] **Modal closes** when clicking X or pressing ESC
- [ ] **Modal closes** when clicking outside the panel
- [ ] **Statistics update** in popup (click extension icon)

### UI Tests

- [ ] **Green header** for valid credentials
- [ ] **Gray header** for no credentials
- [ ] **Red header** for invalid credentials
- [ ] **Creator section** displays when present
- [ ] **History timeline** shows edit events
- [ ] **Raw manifest** is collapsible
- [ ] **Educational message** appears for images without credentials

### Performance Tests

- [ ] **Small images** (< 1MB) verify in < 500ms
- [ ] **Large images** (> 10MB) don't crash browser
- [ ] **Multiple verifications** don't slow down browser
- [ ] **Statistics** persist after closing browser

### Browser Compatibility

- [ ] **Chrome**: Extension loads without errors
- [ ] **Firefox**: Extension loads without errors
- [ ] **Service Worker**: Check console for "Aletheia WASM initialized"

---

## Troubleshooting

### Extension Won't Load

**Error:** "Manifest file is missing or unreadable"
- **Fix:** Make sure you selected the `dist-chrome` or `dist-firefox` folder, not `src`

**Error:** "Manifest version 3 is required"
- **Fix:** Update Chrome to version 109+ or Firefox to 109+

### WASM Not Loading

**Symptom:** Right-click works but verification shows error

**Check:**
1. Open browser console (F12)
2. Look for WASM errors
3. Verify files exist: `dist-chrome/wasm/veritas_core_bg.wasm`

**Fix:**
```bash
npm run build:wasm
npm run build:chrome
```

### No Images Have Credentials

**This is normal!** Most images lack C2PA data.

**Solution:** Test with known C2PA images from:
- https://contentcredentials.org/verify
- Adobe Stock (search "content credentials")
- AI generators (DALL-E 3, Adobe Firefly)

### Icons Missing

**Symptom:** Extension shows default icon

**Fix:**
```bash
node scripts/generate-icons.js
sips -s format png -z 128 128 extension/src/icons/icon128.svg --out extension/src/icons/icon128.png
sips -s format png -z 48 48 extension/src/icons/icon48.svg --out extension/src/icons/icon48.png
sips -s format png -z 16 16 extension/src/icons/icon16.svg --out extension/src/icons/icon16.png
npm run build:all
```

---

## Debugging

### Check Service Worker Logs

**Chrome:**
1. Go to `chrome://extensions`
2. Click "service worker" link under Aletheia
3. View console logs

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Inspect" next to Aletheia
3. View console logs

### Check Content Script Logs

1. Open any webpage
2. Open DevTools (F12)
3. Look for "Aletheia content script loaded" in console

### Verify WASM is Working

Look for these console messages:
```
Aletheia WASM initialized successfully
Verifying image: [URL]
Verification result: [Object]
```

---

## Known Limitations

1. **Social Media Images:** Most platforms strip C2PA metadata
2. **Large Images:** 50MB+ images may timeout or cause memory issues
3. **Thumbnail Extraction:** Currently doesn't resolve URI references
4. **Performance:** First verification loads WASM (~100ms delay)

---

## Next Steps

After successful testing:

1. **Test on Real C2PA Images**
   - Use contentcredentials.org samples
   - Generate your own in Photoshop

2. **Check Edge Cases**
   - Very large images (20MB+)
   - Corrupted image files
   - Non-image files

3. **Performance Benchmark**
   - Time multiple verifications
   - Check memory usage
   - Test on image-heavy sites

4. **Report Issues**
   - Note any crashes or errors
   - Document unexpected behavior
   - Suggest UX improvements

---

## Success Criteria

✅ Extension loads without errors
✅ Context menu appears on images
✅ Verification completes successfully
✅ UI displays correctly
✅ Statistics track properly
✅ Works in both Chrome and Firefox

**Status:** READY FOR PRODUCTION TESTING! 🚀
