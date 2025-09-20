# Android Release Signing Configuration

This document outlines the setup for Android release signing for the UpCoach mobile application.

## Overview

The Android application now supports production-ready signing configuration that securely manages keystores and signing credentials.

## Keystore Setup

### 1. Generate Release Keystore

```bash
# Navigate to the android directory
cd mobile-app/android

# Create key directory
mkdir -p key

# Generate release keystore (DO NOT commit this file)
keytool -genkey -v -keystore key/release.keystore -alias upcoach-release -keyalg RSA -keysize 2048 -validity 10000

# Follow the prompts to set:
# - Keystore password
# - Key password
# - Certificate details (organization, location, etc.)
```

### 2. Secure Credential Management

#### Option A: Environment Variables (Recommended for CI/CD)

Set these environment variables in your deployment environment:

```bash
export ANDROID_KEYSTORE_PASSWORD="your_keystore_password"
export ANDROID_KEY_ALIAS="upcoach-release"
export ANDROID_KEY_PASSWORD="your_key_password"
```

#### Option B: Local Properties (Development)

Create `android/local.properties` with:

```properties
# Flutter SDK path
flutter.sdk=/path/to/flutter

# Signing configuration (NEVER commit these values)
storePassword=your_keystore_password
keyAlias=upcoach-release
keyPassword=your_key_password
```

## Security Considerations

### Critical Security Requirements:

1. **NEVER commit the keystore file** - Add `key/` to `.gitignore`
2. **NEVER commit passwords** - Use environment variables or local.properties
3. **Backup the keystore securely** - Store in encrypted cloud storage
4. **Use strong passwords** - Minimum 12 characters with mixed case, numbers, symbols
5. **Restrict access** - Only authorized team members should have keystore access

### Keystore Backup Strategy:

1. **Primary Backup**: Encrypted cloud storage (Google Drive, Dropbox, etc.)
2. **Secondary Backup**: Offline secure storage (encrypted USB drive)
3. **Access Documentation**: Maintain secure record of:
   - Keystore location
   - Passwords (in password manager)
   - Certificate details
   - Key alias information

## Build Configuration

### Debug Builds
- Uses debug signing automatically
- Application ID: `com.upcoach.mobile.debug`
- Allows installation alongside release version

### Release Builds
- Requires proper keystore configuration
- Application ID: `com.upcoach.mobile`
- Optimized with ProGuard, shrinking, and zip alignment

## Build Commands

### Local Development
```bash
# Debug build (default)
flutter build apk --debug

# Release build (requires keystore setup)
flutter build apk --release
flutter build appbundle --release  # For Play Store
```

### CI/CD Pipeline
Ensure environment variables are set in your CI/CD system:

```yaml
# Example for GitHub Actions
env:
  ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
  ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
  ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
```

## Troubleshooting

### Common Issues:

1. **Missing keystore file**
   - Ensure `key/release.keystore` exists
   - Check file permissions

2. **Invalid credentials**
   - Verify environment variables or local.properties
   - Test keystore with keytool: `keytool -list -v -keystore key/release.keystore`

3. **Build failures**
   - Check Gradle build logs
   - Verify signing configuration in `app/build.gradle`

### Verification Commands:

```bash
# List keystore contents
keytool -list -v -keystore key/release.keystore

# Verify APK signing
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk
```

## Play Store Upload

When uploading to Google Play Store:

1. Use `flutter build appbundle --release` for App Bundle format
2. Enable App Signing by Google Play for additional security
3. Upload the App Bundle (`.aab` file) instead of APK for optimized delivery

## Emergency Recovery

If keystore is lost:

1. **For existing apps**: Contact Google Play support for key reset (LAST RESORT)
2. **For new apps**: Generate new keystore and update configuration
3. **Important**: Losing the keystore means you cannot update the existing app

## Team Access Protocol

1. Keystore access limited to Release Manager and DevOps Lead
2. Passwords stored in team password manager (1Password, LastPass, etc.)
3. Keystore backup verification monthly
4. Access audit quarterly

---

**CRITICAL WARNING**: The release keystore is the only way to sign updates for your published app. Losing it means you cannot update your app on the Play Store. Treat it with the same security as production database credentials.