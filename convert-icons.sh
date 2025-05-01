#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required. Please install it first."
    exit 1
fi

# Convert SVG to different PNG sizes
convert -background none -size 16x16 src/icons/icon.svg src/icons/icon16.png
convert -background none -size 48x48 src/icons/icon.svg src/icons/icon48.png
convert -background none -size 128x128 src/icons/icon.svg src/icons/icon128.png

echo "Icons generated successfully!" 