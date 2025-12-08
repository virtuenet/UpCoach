#!/bin/bash

# UpCoach App Icon Generation Script
# This script generates app icons for iOS and Android using flutter_launcher_icons

echo "================================================"
echo "UpCoach App Icon Generator"
echo "================================================"

# Navigate to mobile app directory
cd "$(dirname "$0")/.." || exit 1

# Check if flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "Error: Flutter is not installed or not in PATH"
    exit 1
fi

# Check if source icon exists
ICON_PATH="assets/icons/app_icon.png"
FOREGROUND_PATH="assets/icons/app_icon_foreground.png"

if [ ! -f "$ICON_PATH" ]; then
    echo "Warning: App icon not found at $ICON_PATH"
    echo "Creating placeholder icon..."

    # Create a simple placeholder (requires ImageMagick)
    if command -v convert &> /dev/null; then
        # Create a 1024x1024 icon with gradient background
        convert -size 1024x1024 \
            -define gradient:angle=135 \
            gradient:#6366F1-#8B5CF6 \
            -font Arial-Bold -pointsize 400 \
            -fill white -gravity center \
            -annotate 0 "U" \
            "$ICON_PATH"

        # Create foreground for adaptive icon
        convert -size 1024x1024 \
            xc:transparent \
            -font Arial-Bold -pointsize 400 \
            -fill '#6366F1' -gravity center \
            -annotate 0 "U" \
            "$FOREGROUND_PATH"

        echo "Placeholder icons created successfully!"
    else
        echo "ImageMagick (convert) not found. Please create the icon manually:"
        echo "  - Create a 1024x1024 PNG file at: $ICON_PATH"
        echo "  - Create a 1024x1024 PNG with transparent background at: $FOREGROUND_PATH"
        exit 1
    fi
fi

echo ""
echo "Generating app icons for all platforms..."
echo ""

# Run flutter_launcher_icons
flutter pub get
flutter pub run flutter_launcher_icons

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "App icons generated successfully!"
    echo "================================================"
    echo ""
    echo "Generated icons:"
    echo "  - iOS: ios/Runner/Assets.xcassets/AppIcon.appiconset/"
    echo "  - Android: android/app/src/main/res/mipmap-*/"
    echo ""
    echo "Adaptive Icon (Android):"
    echo "  - Background: White (#FFFFFF)"
    echo "  - Foreground: $FOREGROUND_PATH"
else
    echo ""
    echo "Error: Failed to generate icons"
    exit 1
fi
