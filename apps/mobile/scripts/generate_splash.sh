#!/bin/bash

# UpCoach Splash Screen Generation Script
# This script generates splash screens for iOS and Android using flutter_native_splash

echo "================================================"
echo "UpCoach Splash Screen Generator"
echo "================================================"

# Navigate to mobile app directory
cd "$(dirname "$0")/.." || exit 1

# Check if flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "Error: Flutter is not installed or not in PATH"
    exit 1
fi

# Check if required images exist
SPLASH_LOGO="assets/images/splash_logo.png"
SPLASH_LOGO_DARK="assets/images/splash_logo_dark.png"
BRANDING="assets/images/branding.png"
BRANDING_DARK="assets/images/branding_dark.png"
SPLASH_ANDROID12="assets/images/splash_logo_android12.png"
SPLASH_ANDROID12_DARK="assets/images/splash_logo_android12_dark.png"

create_placeholder() {
    local path=$1
    local text=$2
    local bg_color=$3
    local text_color=$4
    local width=$5
    local height=$6

    if command -v convert &> /dev/null; then
        convert -size ${width}x${height} \
            xc:$bg_color \
            -font Arial-Bold -pointsize 80 \
            -fill $text_color -gravity center \
            -annotate 0 "$text" \
            "$path"
        echo "Created: $path"
    fi
}

echo ""
echo "Checking splash screen assets..."

# Create placeholders if needed
if [ ! -f "$SPLASH_LOGO" ]; then
    echo "Creating placeholder splash logo..."
    if command -v convert &> /dev/null; then
        convert -size 300x300 xc:transparent \
            -font Arial-Bold -pointsize 120 \
            -fill '#6366F1' -gravity center \
            -annotate 0 "U" \
            "$SPLASH_LOGO"
    fi
fi

if [ ! -f "$SPLASH_LOGO_DARK" ]; then
    echo "Creating placeholder splash logo (dark)..."
    if command -v convert &> /dev/null; then
        convert -size 300x300 xc:transparent \
            -font Arial-Bold -pointsize 120 \
            -fill white -gravity center \
            -annotate 0 "U" \
            "$SPLASH_LOGO_DARK"
    fi
fi

if [ ! -f "$BRANDING" ]; then
    echo "Creating placeholder branding..."
    if command -v convert &> /dev/null; then
        convert -size 200x50 xc:transparent \
            -font Arial -pointsize 30 \
            -fill '#6366F1' -gravity center \
            -annotate 0 "UpCoach" \
            "$BRANDING"
    fi
fi

if [ ! -f "$BRANDING_DARK" ]; then
    echo "Creating placeholder branding (dark)..."
    if command -v convert &> /dev/null; then
        convert -size 200x50 xc:transparent \
            -font Arial -pointsize 30 \
            -fill white -gravity center \
            -annotate 0 "UpCoach" \
            "$BRANDING_DARK"
    fi
fi

if [ ! -f "$SPLASH_ANDROID12" ]; then
    echo "Creating placeholder Android 12 splash..."
    if command -v convert &> /dev/null; then
        convert -size 288x288 xc:transparent \
            -font Arial-Bold -pointsize 100 \
            -fill '#6366F1' -gravity center \
            -annotate 0 "U" \
            "$SPLASH_ANDROID12"
    fi
fi

if [ ! -f "$SPLASH_ANDROID12_DARK" ]; then
    echo "Creating placeholder Android 12 splash (dark)..."
    if command -v convert &> /dev/null; then
        convert -size 288x288 xc:transparent \
            -font Arial-Bold -pointsize 100 \
            -fill white -gravity center \
            -annotate 0 "U" \
            "$SPLASH_ANDROID12_DARK"
    fi
fi

echo ""
echo "Generating splash screens for all platforms..."
echo ""

# Run flutter_native_splash
flutter pub get
dart run flutter_native_splash:create

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "Splash screens generated successfully!"
    echo "================================================"
    echo ""
    echo "Generated splash screens:"
    echo "  - iOS: ios/Runner/Assets.xcassets/LaunchImage.imageset/"
    echo "  - Android: android/app/src/main/res/drawable*/"
    echo ""
    echo "Configuration:"
    echo "  - Light mode background: #FFFFFF"
    echo "  - Dark mode background: #1A1A2E"
    echo "  - Branding position: bottom"
    echo "  - Fullscreen: enabled"
else
    echo ""
    echo "Error: Failed to generate splash screens"
    exit 1
fi
