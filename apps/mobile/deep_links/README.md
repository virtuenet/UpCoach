# UpCoach Deep Linking Configuration

This directory contains the server-side configuration files required for Android App Links and iOS Universal Links to work properly.

## Overview

Deep linking allows users to navigate directly to specific content within the UpCoach app from:
- Marketing emails
- Push notifications
- Social media shares
- QR codes
- Web pages
- Other apps

## Supported Link Types

### Custom Scheme Links (`upcoach://`)
These work without server configuration but don't bypass the app chooser dialog.

```
upcoach://home
upcoach://article/{articleId}
upcoach://coach/{coachId}
upcoach://session/{sessionId}
upcoach://goals
upcoach://habits
upcoach://tasks
upcoach://mood
upcoach://gamification
upcoach://marketplace
upcoach://ai-coach
upcoach://settings
upcoach://profile/{userId?}
upcoach://chat
upcoach://messages
upcoach://conversation/{conversationId}
upcoach://call/video/{sessionId}
upcoach://call/audio/{sessionId}
upcoach://password-reset?token={token}
upcoach://verify-email?token={token}
upcoach://magic-link?token={token}
upcoach://invite?code={inviteCode}
```

### Universal Links (`https://upcoach.com/`)
These require server configuration but provide a seamless app experience.

```
https://upcoach.com/article/{articleId}
https://upcoach.com/coach/{coachId}
https://upcoach.com/session/{sessionId}
https://upcoach.com/invite?code={inviteCode}
https://upcoach.com/share/{contentType}/{contentId}
https://upcoach.com/call/video/{sessionId}
https://upcoach.com/password-reset?token={token}
https://upcoach.com/verify-email?token={token}
```

## Server Configuration

### 1. Android App Links (assetlinks.json)

Host this file at: `https://upcoach.com/.well-known/assetlinks.json`

**Before deploying:**
1. Get your app's SHA256 certificate fingerprint:
   ```bash
   # Debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256

   # Release keystore
   keytool -list -v -keystore your-release-key.jks -alias your-alias | grep SHA256
   ```

2. Replace `SHA256_FINGERPRINT_PLACEHOLDER` in `assetlinks.json` with your actual fingerprint

3. For Play Store signed apps, get the fingerprint from:
   - Google Play Console → Release → Setup → App signing
   - Use the "SHA-256 certificate fingerprint" under "App signing key certificate"

**Verification:**
```bash
# Test the file is accessible
curl https://upcoach.com/.well-known/assetlinks.json

# Use Google's verification tool
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://upcoach.com&relation=delegate_permission/common.handle_all_urls
```

### 2. iOS Universal Links (apple-app-site-association)

Host this file at: `https://upcoach.com/.well-known/apple-app-site-association`

**Before deploying:**
1. Replace `TEAM_ID` with your Apple Developer Team ID
   - Find it at: https://developer.apple.com/account → Membership → Team ID

2. Ensure the file is served with:
   - Content-Type: `application/json`
   - No file extension
   - Valid SSL certificate

**Verification:**
```bash
# Test the file is accessible
curl -I https://upcoach.com/.well-known/apple-app-site-association

# Apple's validation tool
https://search.developer.apple.com/appsearch-validation-tool
```

### Server Requirements

Both files must be:
- Served over HTTPS with valid SSL
- Accessible without redirects
- Have proper Content-Type headers
- Be at the `.well-known` path

Example Nginx configuration:
```nginx
location /.well-known/apple-app-site-association {
    default_type application/json;
    add_header Content-Type application/json;
}

location /.well-known/assetlinks.json {
    default_type application/json;
    add_header Content-Type application/json;
}
```

## Testing Deep Links

### Using the Test Script

```bash
# Test on Android
./scripts/test_deep_links.sh android home
./scripts/test_deep_links.sh android article article-123
./scripts/test_deep_links.sh android coach coach-456

# Test on iOS
./scripts/test_deep_links.sh ios home
./scripts/test_deep_links.sh ios goals
./scripts/test_deep_links.sh ios password-reset

# Verify configuration
./scripts/test_deep_links.sh verify android
./scripts/test_deep_links.sh verify ios

# List all supported links
./scripts/test_deep_links.sh list
```

### Manual Testing

**Android:**
```bash
# Custom scheme
adb shell am start -a android.intent.action.VIEW -d "upcoach://home"

# Universal link
adb shell am start -a android.intent.action.VIEW -d "https://upcoach.com/article/123"
```

**iOS Simulator:**
```bash
xcrun simctl openurl booted "upcoach://home"
xcrun simctl openurl booted "https://upcoach.com/article/123"
```

## Deferred Deep Linking

For users who don't have the app installed:

1. User clicks a deep link
2. If app not installed, they're redirected to the app store
3. After installation, the app retrieves and processes the original link

The `DeferredDeepLinkService` handles this by:
- Storing the pending link in SharedPreferences
- Processing it on first app launch
- Tracking attribution for analytics

## Integration with Marketing Campaigns

### UTM Parameters

Deep links support UTM tracking:
```
https://upcoach.com/invite?code=ABC123&utm_source=email&utm_medium=newsletter&utm_campaign=summer_promo
```

These are captured and available for analytics.

### QR Codes

Generate QR codes for deep links using the universal link format:
```
https://upcoach.com/coach/coach-123?utm_source=qr&utm_campaign=print_ad
```

## Troubleshooting

### Android App Links Not Working

1. **Check autoVerify:** Ensure `android:autoVerify="true"` in AndroidManifest.xml
2. **Verify assetlinks.json:** Use Google's verification tool
3. **Check package name:** Must match exactly in assetlinks.json
4. **Clear app defaults:** Settings → Apps → UpCoach → Open by default → Clear defaults

### iOS Universal Links Not Working

1. **Check entitlements:** Ensure associated domains are configured
2. **Verify AASA:** Use Apple's validation tool
3. **Check Team ID:** Must match in AASA and entitlements
4. **Test in incognito:** Safari caches AASA files

### Common Issues

- **Links open in browser:** AASA/assetlinks.json not properly configured
- **App not opening:** Intent filters or URL schemes not configured
- **Wrong screen:** Deep link routing not handling the path correctly
- **Parameters missing:** Query string parsing issue

## Security Considerations

1. **Validate tokens:** Always validate password reset/magic link tokens server-side
2. **Sanitize input:** Never trust data from deep links
3. **Rate limiting:** Protect against brute-force token guessing
4. **HTTPS only:** Never use HTTP for sensitive links
5. **Token expiry:** Implement short expiry for auth tokens

## Files in This Directory

- `apple-app-site-association` - iOS Universal Links configuration
- `assetlinks.json` - Android App Links configuration
- `README.md` - This documentation

## Related Files

- `android/app/src/main/AndroidManifest.xml` - Android intent filters
- `ios/Runner/Info.plist` - iOS URL schemes and associated domains
- `ios/Runner/Runner.entitlements` - iOS capabilities
- `lib/core/services/deep_link_service.dart` - Deep link handling logic
- `lib/core/services/deferred_deep_link_service.dart` - Deferred link support
- `scripts/test_deep_links.sh` - Testing utility script
