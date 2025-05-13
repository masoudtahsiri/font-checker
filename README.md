# PeekFont - Font Inspector Chrome Extension

PeekFont is a powerful Chrome extension that helps developers and designers instantly inspect and analyze font styles on any web page. With real-time font analysis, detailed font information display, and easy CSS copying, PeekFont makes font inspection effortless.

## Features

- 🔍 **Real-time Font Inspection**: Hover over any text to instantly see its font details
- 📋 **Detailed Font Information**:
  - Font family with fallback fonts
  - Font size (in px and rem)
  - Font weight
  - Line height
  - Letter spacing
  - Text transform
  - Font style
  - Text alignment
  - Color (with visual swatch)
- 📋 **Easy CSS Copying**: 
  - Double-press Shift (⇧⇧) to copy the font CSS
  - Or use ⌘+C (Mac) / Ctrl+C (Windows/Linux) while hovering
- 🎯 **Smart Element Detection**: Automatically identifies text elements while ignoring non-text elements
- 🎨 **Beautiful UI**: Clean, modern interface with smooth animations
- ⚡ **Performance Optimized**: Lightweight and fast, with minimal impact on page performance

## Installation

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)
2. Click "Add to Chrome"
3. Confirm the installation

## Usage

1. Click the PeekFont icon in your Chrome toolbar to enable font inspection
2. Hover over any text on the page to see its font details
3. Copy the font CSS using either:
   - Double-press Shift (⇧⇧)
   - Or use ⌘+C (Mac) / Ctrl+C (Windows/Linux) while hovering
4. Click the icon again to disable font inspection

## Keyboard Shortcuts

- **⇧⇧** (Double Shift): Copy font CSS of the currently hovered element
- **⌘+C** (Mac) / **Ctrl+C** (Windows/Linux): Copy font CSS while hovering

## Development

### Prerequisites

- Node.js (v14 or higher)
- Chrome browser (v88 or higher)

### Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/masoudtahsiri/font-checker.git
   cd font-checker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

### Project Structure

```
font-checker/
├── src/
│   ├── js/
│   │   ├── background.js    # Background service worker
│   │   └── content.js       # Content script
│   ├── css/
│   │   └── content.css      # Styles for the extension
│   ├── icons/              # Extension icons
│   └── manifest.json       # Extension manifest
├── dist/                   # Built extension
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Copyright © 2025 Refact, LLC. All rights reserved.

## Support

For support, please contact us at:
- Email: [dev@refact.co](mailto:dev@refact.co)
- Website: [refact.co](https://refact.co)
- GitHub: [github.com/masoudtahsiri/font-checker](https://github.com/masoudtahsiri/font-checker)

## Privacy

PeekFont does not collect any user data. All font inspection is performed locally in your browser. For more information, please read our [Privacy Policy](PRIVACY.md). 