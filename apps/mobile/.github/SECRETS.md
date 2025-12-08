# GitHub Secrets Configuration

This document lists all required secrets for the UpCoach Mobile CI/CD pipeline.

## Required Secrets

### Android Secrets

| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore file | `base64 -i upload-keystore.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | Set during keystore creation |
| `ANDROID_KEY_ALIAS` | Key alias name | Set during keystore creation |
| `ANDROID_KEY_PASSWORD` | Key password | Set during keystore creation |
| `PLAY_STORE_JSON_KEY` | Google Play service account JSON | [Google Play Console](https://play.google.com/console) → Setup → API access |

### iOS Secrets

| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API Key ID | [App Store Connect](https://appstoreconnect.apple.com) → Users → Keys |
| `APP_STORE_CONNECT_API_ISSUER_ID` | App Store Connect Issuer ID | Same as above |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | API Key .p8 file content | Downloaded from App Store Connect |
| `MATCH_PASSWORD` | Fastlane Match encryption password | Custom password for Match |
| `MATCH_GIT_AUTH` | Base64 Git auth for Match repo | `echo -n "username:token" \| base64` |

### Notification Secrets (Optional)

| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `SLACK_WEBHOOK_URL` | Slack incoming webhook | [Slack API](https://api.slack.com/messaging/webhooks) |

## Setup Instructions

### 1. Android Keystore Setup

```bash
# Generate keystore (if not exists)
keytool -genkey -v -keystore upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload

# Encode keystore for GitHub
base64 -i upload-keystore.jks | pbcopy
# Paste into ANDROID_KEYSTORE_BASE64 secret
```

### 2. Play Store Service Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Settings → Developer account → API access
3. Create new service account or link existing
4. Grant "Release manager" permissions
5. Download JSON key
6. Paste JSON content into `PLAY_STORE_JSON_KEY` secret

### 3. App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Users and Access → Keys
3. Generate API Key with "App Manager" role
4. Note the Key ID and Issuer ID
5. Download the .p8 file
6. Add secrets:
   - `APP_STORE_CONNECT_API_KEY_ID`: Key ID
   - `APP_STORE_CONNECT_API_ISSUER_ID`: Issuer ID
   - `APP_STORE_CONNECT_API_KEY_CONTENT`: Content of .p8 file

### 4. Fastlane Match Setup

```bash
# Initialize Match (one-time)
cd ios
bundle exec fastlane match init

# Generate certificates
bundle exec fastlane match appstore

# Note the password used - this is MATCH_PASSWORD

# For MATCH_GIT_AUTH:
echo -n "github-username:personal-access-token" | base64
```

### 5. Slack Webhook (Optional)

1. Go to [Slack API](https://api.slack.com/apps)
2. Create new app or use existing
3. Enable Incoming Webhooks
4. Create webhook for desired channel
5. Copy webhook URL to `SLACK_WEBHOOK_URL`

## Environment Configuration

The workflows use different GitHub Environments:

| Environment | Purpose | Required Approvals |
|------------|---------|-------------------|
| `internal` | Internal testing builds | None |
| `beta` | TestFlight / Play Store Beta | Optional |
| `production` | App Store / Play Store Production | Required |

### Setting Up Environments

1. Go to Repository Settings → Environments
2. Create `internal`, `beta`, and `production` environments
3. For `production`:
   - Enable "Required reviewers"
   - Add team members who can approve releases
4. Add environment-specific secrets if needed

## Verification

Run this workflow manually to verify secrets:

```yaml
# .github/workflows/verify-secrets.yml
name: Verify Secrets
on: workflow_dispatch

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Check Android Secrets
        run: |
          [ -n "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" ] && echo "✅ ANDROID_KEYSTORE_BASE64" || echo "❌ ANDROID_KEYSTORE_BASE64"
          [ -n "${{ secrets.ANDROID_KEYSTORE_PASSWORD }}" ] && echo "✅ ANDROID_KEYSTORE_PASSWORD" || echo "❌ ANDROID_KEYSTORE_PASSWORD"
          [ -n "${{ secrets.ANDROID_KEY_ALIAS }}" ] && echo "✅ ANDROID_KEY_ALIAS" || echo "❌ ANDROID_KEY_ALIAS"
          [ -n "${{ secrets.ANDROID_KEY_PASSWORD }}" ] && echo "✅ ANDROID_KEY_PASSWORD" || echo "❌ ANDROID_KEY_PASSWORD"
          [ -n "${{ secrets.PLAY_STORE_JSON_KEY }}" ] && echo "✅ PLAY_STORE_JSON_KEY" || echo "❌ PLAY_STORE_JSON_KEY"

      - name: Check iOS Secrets
        run: |
          [ -n "${{ secrets.APP_STORE_CONNECT_API_KEY_ID }}" ] && echo "✅ APP_STORE_CONNECT_API_KEY_ID" || echo "❌ APP_STORE_CONNECT_API_KEY_ID"
          [ -n "${{ secrets.APP_STORE_CONNECT_API_ISSUER_ID }}" ] && echo "✅ APP_STORE_CONNECT_API_ISSUER_ID" || echo "❌ APP_STORE_CONNECT_API_ISSUER_ID"
          [ -n "${{ secrets.APP_STORE_CONNECT_API_KEY_CONTENT }}" ] && echo "✅ APP_STORE_CONNECT_API_KEY_CONTENT" || echo "❌ APP_STORE_CONNECT_API_KEY_CONTENT"
          [ -n "${{ secrets.MATCH_PASSWORD }}" ] && echo "✅ MATCH_PASSWORD" || echo "❌ MATCH_PASSWORD"
          [ -n "${{ secrets.MATCH_GIT_AUTH }}" ] && echo "✅ MATCH_GIT_AUTH" || echo "❌ MATCH_GIT_AUTH"
```

## Security Notes

- Never commit secrets to the repository
- Rotate secrets periodically
- Use environment protection rules for production
- Limit secret access to required workflows only
- Review audit logs regularly
