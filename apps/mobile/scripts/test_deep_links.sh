#!/bin/bash
#
# UpCoach Deep Link Testing Utility
# Usage: ./scripts/test_deep_links.sh [platform] [link_type]
#
# This script helps test deep links on Android and iOS simulators/devices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
APP_SCHEME="upcoach"
UNIVERSAL_DOMAIN="upcoach.com"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              UpCoach Deep Link Testing Utility                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_usage() {
    echo "Usage: $0 [platform] [link_type] [entity_id]"
    echo ""
    echo "Platforms:"
    echo "  android    Test on Android emulator/device"
    echo "  ios        Test on iOS simulator"
    echo ""
    echo "Link Types:"
    echo "  home                Navigate to home screen"
    echo "  article             Navigate to article (requires entity_id)"
    echo "  coach               Navigate to coach profile (requires entity_id)"
    echo "  session             Navigate to session (requires entity_id)"
    echo "  goals               Navigate to goals screen"
    echo "  habits              Navigate to habits screen"
    echo "  tasks               Navigate to tasks screen"
    echo "  mood                Navigate to mood tracking"
    echo "  gamification        Navigate to gamification"
    echo "  marketplace         Navigate to marketplace"
    echo "  ai-coach            Navigate to AI coach"
    echo "  settings            Navigate to settings"
    echo "  profile             Navigate to profile"
    echo "  chat                Navigate to chat"
    echo "  messages            Navigate to messages"
    echo "  password-reset      Test password reset link"
    echo "  verify-email        Test email verification link"
    echo "  magic-link          Test magic link authentication"
    echo "  invite              Test invite link"
    echo "  video-call          Test video call link"
    echo "  audio-call          Test audio call link"
    echo ""
    echo "Examples:"
    echo "  $0 android home"
    echo "  $0 ios article article-123"
    echo "  $0 android coach coach-456"
    echo "  $0 ios password-reset"
    echo ""
    echo "Additional Commands:"
    echo "  $0 verify android    Verify Android App Links setup"
    echo "  $0 verify ios        Verify iOS Universal Links setup"
    echo "  $0 list              List all supported deep links"
}

# Generate deep link URL based on type
generate_deep_link() {
    local link_type=$1
    local entity_id=$2
    local use_universal=${3:-false}

    local base_url
    if [ "$use_universal" = true ]; then
        base_url="https://$UNIVERSAL_DOMAIN"
    else
        base_url="$APP_SCHEME://"
    fi

    case $link_type in
        home)
            echo "${base_url}home"
            ;;
        article)
            if [ -n "$entity_id" ]; then
                echo "${base_url}article/$entity_id"
            else
                echo "${base_url}article/test-article-123"
            fi
            ;;
        coach)
            if [ -n "$entity_id" ]; then
                echo "${base_url}coach/$entity_id"
            else
                echo "${base_url}coach/test-coach-456"
            fi
            ;;
        session)
            if [ -n "$entity_id" ]; then
                echo "${base_url}session/$entity_id"
            else
                echo "${base_url}session/test-session-789"
            fi
            ;;
        goals)
            echo "${base_url}goals"
            ;;
        habits)
            echo "${base_url}habits"
            ;;
        tasks)
            echo "${base_url}tasks"
            ;;
        mood)
            echo "${base_url}mood"
            ;;
        gamification)
            echo "${base_url}gamification"
            ;;
        marketplace)
            echo "${base_url}marketplace"
            ;;
        ai-coach)
            echo "${base_url}ai-coach"
            ;;
        settings)
            echo "${base_url}settings"
            ;;
        profile)
            if [ -n "$entity_id" ]; then
                echo "${base_url}profile/$entity_id"
            else
                echo "${base_url}profile"
            fi
            ;;
        chat)
            echo "${base_url}chat"
            ;;
        messages)
            echo "${base_url}messages"
            ;;
        conversation)
            if [ -n "$entity_id" ]; then
                echo "${base_url}conversation/$entity_id"
            else
                echo "${base_url}conversation/test-convo-123"
            fi
            ;;
        password-reset)
            echo "${base_url}password-reset?token=test-token-abc123"
            ;;
        verify-email)
            echo "${base_url}verify-email?token=test-verify-token-xyz"
            ;;
        magic-link)
            echo "${base_url}magic-link?token=test-magic-token-def"
            ;;
        invite)
            echo "${base_url}invite?code=TESTINVITE123"
            ;;
        video-call)
            if [ -n "$entity_id" ]; then
                echo "${base_url}call/video/$entity_id?coachName=Test%20Coach"
            else
                echo "${base_url}call/video/test-session-123?coachName=Test%20Coach"
            fi
            ;;
        audio-call)
            if [ -n "$entity_id" ]; then
                echo "${base_url}call/audio/$entity_id?coachName=Test%20Coach"
            else
                echo "${base_url}call/audio/test-session-123?coachName=Test%20Coach"
            fi
            ;;
        *)
            log_error "Unknown link type: $link_type"
            exit 1
            ;;
    esac
}

# Test deep link on Android
test_android() {
    local link=$1

    log_info "Testing deep link on Android: $link"

    # Check if adb is available
    if ! command -v adb &> /dev/null; then
        log_error "adb not found. Please install Android SDK tools."
        exit 1
    fi

    # Check for connected devices
    local devices=$(adb devices | grep -v "List" | grep -v "^$" | wc -l)
    if [ "$devices" -eq 0 ]; then
        log_error "No Android devices/emulators connected."
        log_info "Start an emulator or connect a device, then try again."
        exit 1
    fi

    # Open the deep link
    adb shell am start -a android.intent.action.VIEW -d "$link"

    log_success "Deep link sent to Android device"
}

# Test deep link on iOS
test_ios() {
    local link=$1

    log_info "Testing deep link on iOS: $link"

    # Check if xcrun is available
    if ! command -v xcrun &> /dev/null; then
        log_error "xcrun not found. Please install Xcode."
        exit 1
    fi

    # Get booted simulator
    local booted_sim=$(xcrun simctl list devices | grep "Booted" | head -1)
    if [ -z "$booted_sim" ]; then
        log_error "No iOS simulator is currently booted."
        log_info "Start a simulator first: xcrun simctl boot 'iPhone 15 Pro'"
        exit 1
    fi

    # Open the deep link in simulator
    xcrun simctl openurl booted "$link"

    log_success "Deep link sent to iOS simulator"
}

# Verify Android App Links
verify_android() {
    log_info "Verifying Android App Links configuration..."

    # Check AndroidManifest.xml
    local manifest="android/app/src/main/AndroidManifest.xml"
    if [ -f "$manifest" ]; then
        if grep -q "android:autoVerify" "$manifest"; then
            log_success "autoVerify attribute found in AndroidManifest.xml"
        else
            log_warning "autoVerify attribute not found in intent-filters"
        fi

        if grep -q "https://$UNIVERSAL_DOMAIN" "$manifest"; then
            log_success "Universal link domain configured: $UNIVERSAL_DOMAIN"
        else
            log_warning "Universal link domain not found in manifest"
        fi

        if grep -q "scheme=\"$APP_SCHEME\"" "$manifest"; then
            log_success "Custom scheme configured: $APP_SCHEME"
        else
            log_warning "Custom scheme not found in manifest"
        fi
    else
        log_error "AndroidManifest.xml not found"
    fi

    # Check assetlinks.json
    log_info ""
    log_info "Checking assetlinks.json..."
    local assetlinks="deep_links/assetlinks.json"
    if [ -f "$assetlinks" ]; then
        log_success "assetlinks.json found"
        log_info "Remember to:"
        log_info "  1. Replace SHA256_FINGERPRINT_PLACEHOLDER with your actual certificate fingerprint"
        log_info "  2. Host at: https://$UNIVERSAL_DOMAIN/.well-known/assetlinks.json"
    else
        log_warning "assetlinks.json not found in deep_links/"
    fi

    # Test remote assetlinks
    log_info ""
    log_info "Checking remote assetlinks.json..."
    if curl -sI "https://$UNIVERSAL_DOMAIN/.well-known/assetlinks.json" | grep -q "200"; then
        log_success "assetlinks.json is accessible at https://$UNIVERSAL_DOMAIN/.well-known/assetlinks.json"
    else
        log_warning "assetlinks.json not accessible or domain not configured"
    fi
}

# Verify iOS Universal Links
verify_ios() {
    log_info "Verifying iOS Universal Links configuration..."

    # Check Info.plist
    local plist="ios/Runner/Info.plist"
    if [ -f "$plist" ]; then
        if grep -q "CFBundleURLSchemes" "$plist"; then
            log_success "URL Schemes configured in Info.plist"
        else
            log_warning "URL Schemes not found in Info.plist"
        fi

        if grep -q "applinks:$UNIVERSAL_DOMAIN" "$plist"; then
            log_success "Universal link domain configured: $UNIVERSAL_DOMAIN"
        else
            log_warning "Universal link domain not found in Info.plist"
        fi
    else
        log_error "Info.plist not found"
    fi

    # Check entitlements
    log_info ""
    log_info "Checking entitlements..."
    local entitlements="ios/Runner/Runner.entitlements"
    if [ -f "$entitlements" ]; then
        log_success "Runner.entitlements found"
        if grep -q "applinks:" "$entitlements"; then
            log_success "Associated domains configured in entitlements"
        else
            log_warning "Associated domains not found in entitlements"
        fi
    else
        log_warning "Runner.entitlements not found"
    fi

    # Check AASA file
    log_info ""
    log_info "Checking apple-app-site-association..."
    local aasa="deep_links/apple-app-site-association"
    if [ -f "$aasa" ]; then
        log_success "apple-app-site-association found"
        log_info "Remember to:"
        log_info "  1. Replace TEAM_ID with your actual Apple Team ID"
        log_info "  2. Host at: https://$UNIVERSAL_DOMAIN/.well-known/apple-app-site-association"
        log_info "  3. Serve with Content-Type: application/json"
    else
        log_warning "apple-app-site-association not found in deep_links/"
    fi

    # Test remote AASA
    log_info ""
    log_info "Checking remote apple-app-site-association..."
    if curl -sI "https://$UNIVERSAL_DOMAIN/.well-known/apple-app-site-association" | grep -q "200"; then
        log_success "AASA is accessible at https://$UNIVERSAL_DOMAIN/.well-known/apple-app-site-association"
    else
        log_warning "AASA not accessible or domain not configured"
    fi
}

# List all supported deep links
list_links() {
    echo -e "${CYAN}Supported Deep Links:${NC}"
    echo ""
    echo "Custom Scheme ($APP_SCHEME://):"
    echo "  - $APP_SCHEME://home"
    echo "  - $APP_SCHEME://article/{id}"
    echo "  - $APP_SCHEME://coach/{id}"
    echo "  - $APP_SCHEME://session/{id}"
    echo "  - $APP_SCHEME://goals"
    echo "  - $APP_SCHEME://habits"
    echo "  - $APP_SCHEME://tasks"
    echo "  - $APP_SCHEME://mood"
    echo "  - $APP_SCHEME://gamification"
    echo "  - $APP_SCHEME://marketplace"
    echo "  - $APP_SCHEME://ai-coach"
    echo "  - $APP_SCHEME://settings"
    echo "  - $APP_SCHEME://profile/{id?}"
    echo "  - $APP_SCHEME://chat"
    echo "  - $APP_SCHEME://messages"
    echo "  - $APP_SCHEME://conversation/{id}"
    echo "  - $APP_SCHEME://password-reset?token={token}"
    echo "  - $APP_SCHEME://verify-email?token={token}"
    echo "  - $APP_SCHEME://magic-link?token={token}"
    echo "  - $APP_SCHEME://invite?code={code}"
    echo "  - $APP_SCHEME://call/video/{sessionId}"
    echo "  - $APP_SCHEME://call/audio/{sessionId}"
    echo ""
    echo "Universal Links (https://$UNIVERSAL_DOMAIN/):"
    echo "  - https://$UNIVERSAL_DOMAIN/article/{id}"
    echo "  - https://$UNIVERSAL_DOMAIN/coach/{id}"
    echo "  - https://$UNIVERSAL_DOMAIN/session/{id}"
    echo "  - https://$UNIVERSAL_DOMAIN/invite?code={code}"
    echo "  - https://$UNIVERSAL_DOMAIN/share/{content_type}/{id}"
    echo "  - https://$UNIVERSAL_DOMAIN/call/video/{sessionId}"
    echo "  - https://$UNIVERSAL_DOMAIN/password-reset?token={token}"
    echo ""
}

# Main
main() {
    print_banner

    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi

    local command=$1

    case $command in
        verify)
            local platform=$2
            case $platform in
                android)
                    verify_android
                    ;;
                ios)
                    verify_ios
                    ;;
                *)
                    verify_android
                    echo ""
                    verify_ios
                    ;;
            esac
            ;;
        list)
            list_links
            ;;
        android|ios)
            local platform=$1
            local link_type=$2
            local entity_id=$3

            if [ -z "$link_type" ]; then
                log_error "Link type required"
                show_usage
                exit 1
            fi

            # Generate and test deep link
            local deep_link=$(generate_deep_link "$link_type" "$entity_id" false)

            log_info "Generated deep link: $deep_link"

            if [ "$platform" = "android" ]; then
                test_android "$deep_link"
            else
                test_ios "$deep_link"
            fi
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
