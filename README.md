# Font Consistency Checker Chrome Extension

A Chrome extension that helps developers and designers maintain consistent typography across web pages. The extension provides real-time font analysis and inspection capabilities.

## Features

- 🔍 Automatic font analysis of all text elements on the page
- 🖱️ Hover-to-inspect functionality for font properties
- 📊 Detailed font information display including:
  - Font Family
  - Font Size
  - Font Weight
  - Line Height
  - Color
- 🎯 Support for both static and dynamically loaded content
- 🧹 Clean, non-intrusive interface

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/font-checker.git
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked" and select the `src` directory from this repository

## Usage

1. Click the extension icon in your Chrome toolbar to activate font inspection
2. Hover over any text element on the page to see its font properties
3. The tooltip will show detailed font information
4. Click the extension icon again to deactivate inspection

## Development

The extension is built with vanilla JavaScript and uses:
- Event delegation for efficient event handling
- MutationObserver for dynamic content detection
- Chrome Extension APIs for integration

## Project Structure

```
font-checker/
├── src/
│   ├── manifest.json
│   ├── popup.html
│   ├── css/
│   │   └── content.css
│   ├── js/
│   │   ├── content.js
│   │   └── popup.js
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 