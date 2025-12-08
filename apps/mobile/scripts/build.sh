#!/bin/bash

# UpCoach Build Script
# Usage: ./scripts/build.sh [environment] [platform] [mode]
# Examples:
#   ./scripts/build.sh dev android debug
#   ./scripts/build.sh staging ios release
#   ./scripts/build.sh prod android appbundle

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-development}"
PLATFORM="${2:-android}"
MODE="${3:-debug}"

# Validate environment
case "$ENVIRONMENT" in
  dev|development)
    FLAVOR="development"
    ENTRY_POINT="lib/main_development.dart"
    ;;
  stg|staging)
    FLAVOR="staging"
    ENTRY_POINT="lib/main_staging.dart"
    ;;
  prod|production)
    FLAVOR="production"
    ENTRY_POINT="lib/main_production.dart"
    ;;
  *)
    echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [dev|staging|prod] [android|ios] [debug|release|profile|appbundle|ipa]"
    exit 1
    ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}UpCoach Build Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${GREEN}$FLAVOR${NC}"
echo -e "Platform:    ${GREEN}$PLATFORM${NC}"
echo -e "Mode:        ${GREEN}$MODE${NC}"
echo -e "${BLUE}========================================${NC}"

# Get dependencies
echo -e "\n${YELLOW}Getting dependencies...${NC}"
flutter pub get

# Build based on platform and mode
case "$PLATFORM" in
  android)
    case "$MODE" in
      debug)
        echo -e "\n${YELLOW}Building Android APK (Debug)...${NC}"
        flutter build apk --debug --flavor "$FLAVOR" -t "$ENTRY_POINT"
        echo -e "\n${GREEN}APK built: build/app/outputs/flutter-apk/app-$FLAVOR-debug.apk${NC}"
        ;;
      release)
        echo -e "\n${YELLOW}Building Android APK (Release)...${NC}"
        flutter build apk --release --flavor "$FLAVOR" -t "$ENTRY_POINT"
        echo -e "\n${GREEN}APK built: build/app/outputs/flutter-apk/app-$FLAVOR-release.apk${NC}"
        ;;
      profile)
        echo -e "\n${YELLOW}Building Android APK (Profile)...${NC}"
        flutter build apk --profile --flavor "$FLAVOR" -t "$ENTRY_POINT"
        echo -e "\n${GREEN}APK built: build/app/outputs/flutter-apk/app-$FLAVOR-profile.apk${NC}"
        ;;
      appbundle|aab)
        echo -e "\n${YELLOW}Building Android App Bundle (Release)...${NC}"
        flutter build appbundle --release --flavor "$FLAVOR" -t "$ENTRY_POINT"
        echo -e "\n${GREEN}Bundle built: build/app/outputs/bundle/${FLAVOR}Release/app-$FLAVOR-release.aab${NC}"
        ;;
      *)
        echo -e "${RED}Invalid mode for Android: $MODE${NC}"
        echo "Valid modes: debug, release, profile, appbundle"
        exit 1
        ;;
    esac
    ;;
  ios)
    case "$MODE" in
      debug)
        echo -e "\n${YELLOW}Building iOS (Debug)...${NC}"
        flutter build ios --debug --no-codesign -t "$ENTRY_POINT"
        echo -e "\n${GREEN}iOS app built (debug, no codesign)${NC}"
        ;;
      release)
        echo -e "\n${YELLOW}Building iOS (Release)...${NC}"
        flutter build ios --release -t "$ENTRY_POINT"
        echo -e "\n${GREEN}iOS app built: build/ios/iphoneos/Runner.app${NC}"
        ;;
      profile)
        echo -e "\n${YELLOW}Building iOS (Profile)...${NC}"
        flutter build ios --profile -t "$ENTRY_POINT"
        echo -e "\n${GREEN}iOS app built (profile)${NC}"
        ;;
      ipa)
        echo -e "\n${YELLOW}Building iOS IPA (Release)...${NC}"
        flutter build ipa --release -t "$ENTRY_POINT" --export-options-plist=ios/ExportOptions.plist
        echo -e "\n${GREEN}IPA built: build/ios/ipa/*.ipa${NC}"
        ;;
      *)
        echo -e "${RED}Invalid mode for iOS: $MODE${NC}"
        echo "Valid modes: debug, release, profile, ipa"
        exit 1
        ;;
    esac
    ;;
  *)
    echo -e "${RED}Invalid platform: $PLATFORM${NC}"
    echo "Valid platforms: android, ios"
    exit 1
    ;;
esac

echo -e "\n${GREEN}Build completed successfully!${NC}"
