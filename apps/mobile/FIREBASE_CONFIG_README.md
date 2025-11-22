# Firebase Configuration Files

This directory contains template files for Firebase configuration. **DO NOT** commit actual Firebase
configuration files to version control.

---

## Configuration Files

### iOS Configuration

**File:** `ios/Runner/GoogleService-Info.plist` **Template:**
`ios/Runner/GoogleService-Info.plist.template`

1. Download your actual `GoogleService-Info.plist` from Firebase Console
2. Place it in `ios/Runner/GoogleService-Info.plist`
3. Ensure it's listed in `.gitignore`

### Android Configuration

**File:** `android/app/google-services.json` **Template:**
`android/app/google-services.json.template`

1. Download your actual `google-services.json` from Firebase Console
2. Place it in `android/app/google-services.json`
3. Ensure it's listed in `.gitignore`

---

## Setup Instructions

### For Development

1. Create a Firebase project for development (e.g., `upcoach-dev`)
2. Register iOS and Android apps
3. Download configuration files
4. Place in respective directories
5. Run the app

### For Production

1. Create a Firebase project for production (e.g., `upcoach-production`)
2. Follow the [Firebase Production Setup Guide](../../docs/deployment/FIREBASE_PRODUCTION_SETUP.md)
3. Download production configuration files
4. **For CI/CD:** Store as secrets in GitHub Actions
5. **For local builds:** Store locally (not in git)

---

## Security

### ✅ DO

- Keep actual config files out of version control
- Use different Firebase projects for dev/staging/production
- Store production configs as CI/CD secrets
- Restrict Firebase API keys to specific platforms

### ❌ DON'T

- Commit actual `GoogleService-Info.plist` or `google-services.json`
- Share Firebase admin keys publicly
- Use production Firebase in development
- Commit `.env` files with sensitive data

---

## .gitignore Configuration

Ensure your `.gitignore` includes:

```gitignore
# Firebase configuration files
ios/Runner/GoogleService-Info.plist
android/app/google-services.json

# Keep templates
!ios/Runner/GoogleService-Info.plist.template
!android/app/google-services.json.template

# Environment files
.env
.env.local
.env.production
.env.*.local

# Firebase admin keys
firebase-admin-key.json
**/config/firebase-admin-key.json
```

---

## CI/CD Configuration

### GitHub Actions Secrets

Add these secrets to your GitHub repository:

1. `FIREBASE_IOS_CONFIG` - Base64 encoded `GoogleService-Info.plist`
2. `FIREBASE_ANDROID_CONFIG` - Base64 encoded `google-services.json`

Encode files:

```bash
# iOS
cat ios/Runner/GoogleService-Info.plist | base64

# Android
cat android/app/google-services.json | base64
```

### Decode in CI/CD

```yaml
- name: Setup Firebase Config (iOS)
  run:
    echo "${{ secrets.FIREBASE_IOS_CONFIG }}" | base64 --decode >
    ios/Runner/GoogleService-Info.plist

- name: Setup Firebase Config (Android)
  run:
    echo "${{ secrets.FIREBASE_ANDROID_CONFIG }}" | base64 --decode >
    android/app/google-services.json
```

---

## Troubleshooting

### "GoogleService-Info.plist not found"

- Ensure file is in `ios/Runner/` directory
- Check file name matches exactly
- Verify it's added to Runner target in Xcode

### "google-services.json not found"

- Ensure file is in `android/app/` directory
- Check package name matches
- Run `flutter clean` and rebuild

### Firebase initialization failed

- Verify bundle ID (iOS) matches Firebase Console
- Verify package name (Android) matches Firebase Console
- Check API keys are valid
- Ensure Firebase project is active

---

## Need Help?

See the complete setup guide:
[Firebase Production Setup Guide](../../docs/deployment/FIREBASE_PRODUCTION_SETUP.md)
