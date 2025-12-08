# UpCoach Mobile CI/CD Guide

This guide explains the CI/CD pipeline for the UpCoach mobile application.

## Overview

The pipeline automates building, testing, and deploying the Flutter mobile app to both Android (Google Play Store) and iOS (Apple App Store).

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PR Check  │────▶│    Build    │────▶│    Test     │────▶│   Deploy    │
│  (validate) │     │  (android/  │     │ (unit/e2e)  │     │ (stores)    │
│             │     │    ios)     │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Workflows

### 1. PR Validation (`pr-validation.yml`)

**Triggered:** On every pull request to `main` or `develop`

**Purpose:** Fast feedback on code quality before merge

**Steps:**
1. Code formatting check
2. Static analysis (flutter analyze)
3. Unit tests
4. Android debug build check

**Usage:** Automatic - runs on every PR

---

### 2. CI Pipeline (`ci.yml`)

**Triggered:** On push to `main`, `develop`, or `release/*` branches

**Purpose:** Full build and test pipeline

**Jobs:**
- `analyze`: Code quality checks
- `test`: Unit and widget tests with coverage
- `build-android`: Debug APK (PR) or Release APK/AAB (push)
- `build-ios`: Debug simulator (PR) or Release build (push)
- `deploy-internal`: Deploy to Play Store internal track (develop branch)

**Manual Trigger:**
```bash
gh workflow run ci.yml --field build_android=true --field build_ios=true --field run_tests=true
```

---

### 3. Release Pipeline (`release.yml`)

**Triggered:**
- On version tags (`v*.*.*`, `v*.*.*-beta.*`, `v*.*.*-rc.*`)
- Manual workflow dispatch

**Purpose:** Production releases to app stores

**Jobs:**
- `prepare`: Version extraction and changelog generation
- `test`: Pre-release validation
- `release-android`: Build and upload to Play Store
- `release-ios`: Build and upload to App Store/TestFlight
- `create-release`: Create GitHub release
- `notify`: Slack notifications

**Manual Release:**
```bash
# Beta release
gh workflow run release.yml --field release_type=beta --field version=1.2.3

# Production release
gh workflow run release.yml --field release_type=production --field version=1.2.3
```

---

### 4. E2E Tests (`e2e_tests.yml`)

**Triggered:** Weekly schedule or manual

**Purpose:** End-to-end integration tests on real devices/emulators

**Usage:**
```bash
gh workflow run e2e_tests.yml --field test_suite=smoke --field platform=android
```

## Deployment Tracks

### Android (Google Play Store)

| Track | Branch/Trigger | Auto-Deploy |
|-------|---------------|-------------|
| Internal | `develop` push | Yes |
| Beta | `v*.*.*-beta.*` tag | Yes |
| Production | `v*.*.*` tag | Draft (manual approval) |

### iOS (Apple App Store)

| Track | Branch/Trigger | Auto-Deploy |
|-------|---------------|-------------|
| TestFlight (Internal) | `develop` push | Yes |
| TestFlight (External) | `v*.*.*-beta.*` tag | Yes |
| App Store | `v*.*.*` tag | Draft (manual approval) |

## Version Management

### Automatic Versioning

The CI pipeline automatically:
1. Extracts version from tag (e.g., `v1.2.3` → `1.2.3`)
2. Calculates build number: `(run_number * 10) + run_attempt`
3. Updates `pubspec.yaml` with `version: X.Y.Z+BUILD`

### Manual Version Bump

```bash
# Bump patch version (1.0.0 → 1.0.1)
cd android && bundle exec fastlane release bump_type:patch

# Bump minor version (1.0.0 → 1.1.0)
cd android && bundle exec fastlane release bump_type:minor

# Bump major version (1.0.0 → 2.0.0)
cd android && bundle exec fastlane release bump_type:major
```

## Local Development with Fastlane

### Android Commands

```bash
cd apps/mobile/android

# Run tests
bundle exec fastlane test

# Build debug APK
bundle exec fastlane build_debug

# Build release APK (split by ABI)
bundle exec fastlane build_apk

# Build release App Bundle
bundle exec fastlane build_bundle

# Deploy to internal track
bundle exec fastlane internal

# Deploy to beta track
bundle exec fastlane beta

# Deploy to production (as draft)
bundle exec fastlane release

# Promote internal → beta
bundle exec fastlane promote_to_beta

# Promote beta → production
bundle exec fastlane promote_to_production
```

### iOS Commands

```bash
cd apps/mobile/ios

# Run tests
bundle exec fastlane test

# Build development version
bundle exec fastlane build_dev

# Sync certificates (readonly)
bundle exec fastlane sync_certs

# Create/update certificates
bundle exec fastlane create_certs

# Deploy to TestFlight
bundle exec fastlane beta

# Deploy to App Store (as draft)
bundle exec fastlane release

# Capture screenshots
bundle exec fastlane screenshots
```

## Required Secrets

See [SECRETS.md](./SECRETS.md) for complete setup instructions.

### Quick Reference

| Secret | Platform | Purpose |
|--------|----------|---------|
| `ANDROID_KEYSTORE_BASE64` | Android | Signing keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Android | Keystore password |
| `ANDROID_KEY_ALIAS` | Android | Key alias |
| `ANDROID_KEY_PASSWORD` | Android | Key password |
| `PLAY_STORE_JSON_KEY` | Android | Play Store API access |
| `APP_STORE_CONNECT_API_KEY_ID` | iOS | App Store Connect API |
| `APP_STORE_CONNECT_API_ISSUER_ID` | iOS | App Store Connect API |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | iOS | App Store Connect API |
| `MATCH_PASSWORD` | iOS | Certificate encryption |
| `MATCH_GIT_AUTH` | iOS | Match repo access |
| `SLACK_WEBHOOK_URL` | Both | Notifications |

## Troubleshooting

### Common Issues

**1. Android build fails with signing error**
```
Execution failed for task ':app:signReleaseBundle'
```
**Solution:** Verify `ANDROID_KEYSTORE_BASE64` is correctly encoded:
```bash
base64 -i upload-keystore.jks | pbcopy
```

**2. iOS Match fails to sync certificates**
```
Could not decrypt the repo
```
**Solution:** Ensure `MATCH_PASSWORD` matches the one used to create certificates.

**3. Play Store upload fails**
```
Google Api Error: forbidden
```
**Solution:** Verify service account has "Release manager" permissions in Play Console.

**4. App Store Connect API fails**
```
Invalid issuer_id
```
**Solution:** Double-check `APP_STORE_CONNECT_API_ISSUER_ID` from App Store Connect.

### Debugging Workflows

```bash
# View workflow run logs
gh run view <run_id>

# Download artifacts
gh run download <run_id>

# Re-run failed jobs
gh run rerun <run_id> --failed
```

## Best Practices

1. **Always use tags for releases** - Never deploy directly from branches
2. **Test on internal/beta first** - Validate before production
3. **Keep secrets rotated** - Update credentials periodically
4. **Monitor build times** - Optimize caching if builds get slow
5. **Review changelogs** - Ensure meaningful release notes

## Monitoring

### Build Status Badges

Add to README.md:
```markdown
![CI](https://github.com/your-org/upcoach/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/your-org/upcoach/actions/workflows/release.yml/badge.svg)
```

### Slack Integration

Notifications are sent for:
- ✅ Successful deployments
- ❌ Failed builds
- 🚀 New releases
- ⚠️ Test failures

Configure `SLACK_WEBHOOK_URL` to enable notifications.
