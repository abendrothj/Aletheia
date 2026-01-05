# Icons

This directory should contain the extension icons in three sizes:

- `icon16.png` - 16x16 pixels (toolbar)
- `icon48.png` - 48x48 pixels (extension management)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Design Concept

The icon should represent:
- Truth / Verification (checkmark, shield)
- Image analysis (camera, photo frame)
- Greek letter Alpha (Α) for "Aletheia"

## Placeholder Icons

Until custom icons are created, you can:

1. Use a simple SVG-to-PNG converter with this design
2. Generate icons using online tools like [favicon.io](https://favicon.io)
3. Temporarily use Unicode symbols in PNG format

## Quick Generation

Use ImageMagick to create placeholder icons:

```bash
# Requires ImageMagick installed
convert -size 128x128 xc:'#667eea' -pointsize 80 -fill white -gravity center -annotate +0+0 'Α' icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```
