# CI/CD Setup Guide

Complete guide for setting up automated continuous integration and deployment workflows for the
UpCoach platform.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Vercel Setup](#vercel-setup)
- [Railway Setup](#railway-setup)
- [Mobile App Store Setup](#mobile-app-store-setup)
- [Monitoring & Notifications](#monitoring--notifications)
- [Troubleshooting](#troubleshooting)

---

## Overview

The UpCoach platform uses GitHub Actions for automated CI/CD with three main workflows:

1. **Backend API Workflow** (`api-deploy.yml`)
   - Lint, type check, and test on every push/PR
   - Deploy to staging (develop branch)
   - Deploy to production (main branch)
   - Database migrations
   - Health checks and smoke tests

2. **Frontend Workflow** (`frontend-deploy.yml`)
   - Build and test admin panel, CMS, and landing page
   - Deploy to Vercel staging/production
   - Preview deployments for PRs
   - Lighthouse CI performance checks

3. **Mobile App Workflow** (`mobile-build.yml`)
   - Flutter analyze and tests
   - Build iOS and Android apps
   - Deploy to TestFlight and Firebase App Distribution (beta)
   - Deploy to App Store and Google Play (production)
   - Automated version bumping

---

## Workflows

### Backend API Workflow

**File:** `.github/workflows/api-deploy.yml`

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Only runs when files in `services/api/**` change

**Jobs:**

1. **Lint & Type Check** - ESLint and TypeScript validation
2. **Unit Tests** - Run with coverage, upload to Codecov
3. **Integration Tests** - Test API endpoints with PostgreSQL/Redis
4. **E2E Tests** - Full end-to-end testing
5. **Security Audit** - npm audit and Snyk scanning
6. **Build** - Compile TypeScript to JavaScript
7. **Deploy to Staging** - Auto-deploy `develop` to staging
8. **Deploy to Production** - Auto-deploy `main` to production

**Health Checks:**

- POST-deployment health endpoint verification
- Database migration execution
- Smoke tests
- Sentry deployment notifications
- Slack notifications

### Frontend Workflow

**File:** `.github/workflows/frontend-deploy.yml`

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Only runs when files in `apps/**` change

**Jobs:**

**For each app (admin-panel, cms-panel, landing-page):**

1. **Build & Test** - Lint, type check, Next.js build
2. **Deploy to Staging** - Auto-deploy `develop` to Vercel
3. **Deploy to Production** - Auto-deploy `main` to Vercel
4. **Preview Deployments** - Deploy PRs to preview URLs

**Additional:**

- Lighthouse CI performance checks on staging
- Automatic PR comments with preview URLs
- Slack notifications on production deploys

### Mobile App Workflow

**File:** `.github/workflows/mobile-build.yml`

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Only runs when files in `apps/mobile/**` change

**Jobs:**

1. **Analyze** - Flutter format and analyze
2. **Unit Tests** - Run with coverage
3. **Widget Tests** - Test Flutter widgets
4. **Integration Tests** - Run on iOS simulator
5. **Build Android** - APK (debug) or AAB (release)
6. **Build iOS** - IPA with code signing
7. **Deploy Android Beta** - Firebase App Distribution
8. **Deploy iOS Beta** - TestFlight
9. **Deploy Android Production** - Google Play Internal Testing
10. **Deploy iOS Production** - App Store Connect
11. **Version Bump** - Auto-increment build number

---

## GitHub Secrets Configuration

### Required Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions → New repository
secret

#### Backend API Secrets

```bash
# Railway Deployment
RAILWAY_TOKEN_STAGING        # Railway API token for staging environment
RAILWAY_TOKEN_PRODUCTION     # Railway API token for production environment

# Database (Production)
DATABASE_URL_PRODUCTION      # PostgreSQL connection string for production

# Sentry
SENTRY_AUTH_TOKEN            # Sentry authentication token for deployment tracking

# Slack
SLACK_WEBHOOK                # Slack webhook URL for notifications

# Snyk (Optional)
SNYK_TOKEN                   # Snyk token for security scanning
```

#### Frontend Secrets

```bash
# Vercel
VERCEL_TOKEN                 # Vercel API token
VERCEL_ORG_ID                # Vercel organization ID
VERCEL_PROJECT_ID_ADMIN      # Project ID for admin panel
VERCEL_PROJECT_ID_CMS        # Project ID for CMS panel
VERCEL_PROJECT_ID_LANDING    # Project ID for landing page

# Environment Variables
NEXT_PUBLIC_API_URL          # API URL (e.g., https://api.upcoach.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Stripe public key
```

#### Mobile App Secrets

```bash
# Android
ANDROID_KEYSTORE_BASE64      # Base64-encoded upload keystore
ANDROID_KEYSTORE_PASSWORD    # Keystore password
ANDROID_KEY_PASSWORD         # Key password
ANDROID_KEY_ALIAS            # Key alias (usually "upload")
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64  # Base64-encoded service account JSON

# iOS
IOS_PROVISIONING_PROFILE_BASE64  # Base64-encoded provisioning profile
IOS_P12_BASE64               # Base64-encoded P12 certificate
IOS_P12_PASSWORD             # P12 certificate password
APP_STORE_CONNECT_API_KEY    # App Store Connect API key
APP_STORE_CONNECT_KEY_ID     # API key ID
APP_STORE_CONNECT_ISSUER_ID  # API issuer ID

# Firebase
FIREBASE_TOKEN               # Firebase CI token
FIREBASE_ANDROID_APP_ID      # Firebase Android app ID
FIREBASE_IOS_APP_ID          # Firebase iOS app ID
```

---

## Vercel Setup

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Projects

For each frontend app (admin-panel, cms-panel, landing-page):

```bash
cd apps/admin-panel
vercel link
# Follow prompts to link to existing project or create new one
```

### 4. Get Vercel Secrets

```bash
# Get your Vercel token
vercel whoami
# Follow instructions to create a token at https://vercel.com/account/tokens

# Get organization ID
vercel teams ls
# Copy the team/org ID

# Get project IDs
vercel projects ls
# Copy project IDs for each app
```

### 5. Add Secrets to GitHub

Add the following secrets to your GitHub repository:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_ADMIN`
- `VERCEL_PROJECT_ID_CMS`
- `VERCEL_PROJECT_ID_LANDING`

### 6. Configure Environment Variables in Vercel

For each project in Vercel dashboard:

1. Go to project Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_API_URL` (production, preview, development)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Any other app-specific variables

---

## Railway Setup

### 1. Create Railway Account

Visit [railway.app](https://railway.app) and sign up.

### 2. Create Projects

Create two projects:

1. `upcoach-api-staging` - For staging environment
2. `upcoach-api-production` - For production environment

### 3. Add PostgreSQL and Redis

For each project:

1. Click "New" → "Database" → "Add PostgreSQL"
2. Click "New" → "Database" → "Add Redis"

Railway will automatically create `DATABASE_URL` and `REDIS_URL` environment variables.

### 4. Configure Environment Variables

Add to each project:

```bash
NODE_ENV=production  # or staging
PORT=8080
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
STRIPE_SECRET_KEY=<your-stripe-key>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
OPENAI_API_KEY=<your-openai-key>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
# ... add all other environment variables
```

### 5. Get Railway Tokens

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Get token
railway tokens
```

Add tokens to GitHub secrets:

- `RAILWAY_TOKEN_STAGING`
- `RAILWAY_TOKEN_PRODUCTION`

### 6. Link Railway Service

In your Railway project settings, note the service name. Update the workflow file if needed:

```yaml
- name: Deploy to Railway (Production)
  uses: bervProject/railway-deploy@main
  with:
    railway_token: ${{ secrets.RAILWAY_TOKEN_PRODUCTION }}
    service: upcoach-api-production # Match your Railway service name
```

---

## Mobile App Store Setup

### Android (Google Play)

#### 1. Create Upload Keystore

```bash
keytool -genkey -v \
  -keystore upload-keystore.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload \
  -storetype JKS
```

Save the keystore password, key password, and alias.

#### 2. Convert Keystore to Base64

```bash
base64 -i upload-keystore.jks -o keystore.txt
```

Copy the contents of `keystore.txt` and add to GitHub secrets as `ANDROID_KEYSTORE_BASE64`.

#### 3. Create Service Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Setup → API access → Create new service account
3. Follow link to Google Cloud Console
4. Create service account with "Service Account User" role
5. Create JSON key
6. Convert to base64:

```bash
base64 -i service-account.json -o service-account-base64.txt
```

Add to GitHub secrets as `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64`.

#### 4. Add GitHub Secrets

```bash
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_PASSWORD
ANDROID_KEY_ALIAS
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64
```

### iOS (App Store)

#### 1. Create Distribution Certificate

1. Open Xcode → Preferences → Accounts
2. Select your Apple ID → Manage Certificates
3. Click "+" → "Apple Distribution"
4. Export certificate as P12:
   - Open Keychain Access
   - Find certificate under "My Certificates"
   - Right-click → Export
   - Save as `Certificates.p12`

#### 2. Create Provisioning Profile

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Certificates, Identifiers & Profiles → Profiles
3. Create new "App Store" provisioning profile
4. Download the profile

#### 3. Convert to Base64

```bash
# Convert P12 certificate
base64 -i Certificates.p12 -o p12-base64.txt

# Convert provisioning profile
base64 -i YourProfile.mobileprovision -o profile-base64.txt
```

Add to GitHub secrets:

- `IOS_P12_BASE64`
- `IOS_P12_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`

#### 4. Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Users and Access → Keys → App Store Connect API
3. Generate new API key with "Developer" access
4. Download the private key (.p8 file)

Add to GitHub secrets:

- `APP_STORE_CONNECT_API_KEY` (contents of .p8 file)
- `APP_STORE_CONNECT_KEY_ID` (Key ID shown in portal)
- `APP_STORE_CONNECT_ISSUER_ID` (Issuer ID at top of Keys page)

#### 5. Create exportOptions.plist

Create `apps/mobile/ios/exportOptions.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

### Firebase App Distribution

#### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 2. Login and Get Token

```bash
firebase login:ci
```

Copy the token and add to GitHub secrets as `FIREBASE_TOKEN`.

#### 3. Get App IDs

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Project Settings → General
4. Copy "App ID" for Android and iOS apps

Add to GitHub secrets:

- `FIREBASE_ANDROID_APP_ID`
- `FIREBASE_IOS_APP_ID`

---

## Monitoring & Notifications

### Codecov (Code Coverage)

1. Sign up at [codecov.io](https://codecov.io)
2. Link your GitHub repository
3. Add Codecov GitHub App to your repository
4. Coverage reports will be automatically uploaded

### Sentry (Error Tracking)

1. Create account at [sentry.io](https://sentry.io)
2. Create projects:
   - `backend-api`
   - `admin-panel`
   - `cms-panel`
   - `landing-page`
   - `mobile-app`
3. Go to Settings → Account → API → Auth Tokens
4. Create new token with `project:releases` scope
5. Add to GitHub secrets as `SENTRY_AUTH_TOKEN`

### Slack Notifications

1. Create a Slack workspace or use existing
2. Create a channel for deployment notifications (e.g., `#deployments`)
3. Create Incoming Webhook:
   - Go to Slack App Directory
   - Search "Incoming Webhooks"
   - Add to Slack → Choose channel
   - Copy webhook URL
4. Add to GitHub secrets as `SLACK_WEBHOOK`

Notifications will be sent for:

- Production deployments
- Failed deployments
- Rollback executions

### Lighthouse CI (Performance)

Lighthouse CI automatically runs on staging deployments and provides:

- Performance metrics
- Accessibility scores
- Best practices validation
- SEO analysis

Results are uploaded to temporary public storage and linked in workflow logs.

---

## Troubleshooting

### Common Issues

#### 1. Workflow Not Triggering

**Problem:** Workflow doesn't run after push

**Solutions:**

- Check if files changed match the `paths` filter
- Ensure branch name matches trigger (`main` or `develop`)
- Check GitHub Actions is enabled in repository settings

#### 2. Build Failures

**Problem:** TypeScript or build errors

**Solutions:**

```bash
# Test locally first
cd services/api
npm ci
npm run build
npm test

# Check TypeScript
npx tsc --noEmit
```

#### 3. Test Failures

**Problem:** Tests pass locally but fail in CI

**Solutions:**

- Check database connection (PostgreSQL/Redis services)
- Verify environment variables are set correctly
- Check test timeouts (CI may be slower)
- Review test logs in Actions tab

#### 4. Deployment Failures

**Problem:** Deployment succeeds but health check fails

**Solutions:**

- Check Railway/Vercel logs
- Verify environment variables in deployment platform
- Test health endpoint manually: `curl https://api.upcoach.com/health`
- Check database migrations ran successfully

#### 5. Mobile Build Failures

**Problem:** iOS/Android build fails

**Solutions:**

**Android:**

```bash
# Verify keystore locally
keytool -list -v -keystore upload-keystore.jks

# Test build
cd apps/mobile
flutter clean
flutter pub get
flutter build appbundle --release
```

**iOS:**

```bash
# Verify certificate
security find-identity -v -p codesigning

# Test build
cd apps/mobile
flutter clean
flutter pub get
flutter build ios --release
```

#### 6. Secret Decoding Issues

**Problem:** Base64 secrets fail to decode

**Solutions:**

```bash
# Verify encoding (should produce valid output)
echo $ANDROID_KEYSTORE_BASE64 | base64 -d > test.jks

# Re-encode if necessary
base64 -i original-file.jks | tr -d '\n' > encoded.txt
```

#### 7. Permission Issues

**Problem:** GitHub Actions cannot push commits (version bump)

**Solutions:**

- Use a Personal Access Token (PAT) instead of `GITHUB_TOKEN`
- Go to Settings → Developer settings → Personal access tokens
- Create token with `repo` scope
- Add as secret `GH_PAT`
- Update workflow:

```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.GH_PAT }}
```

### Debugging Workflows

#### Enable Debug Logging

Add repository secrets:

- `ACTIONS_STEP_DEBUG` = `true`
- `ACTIONS_RUNNER_DEBUG` = `true`

This provides verbose logging in workflow runs.

#### Manual Workflow Triggers

Add to workflow file:

```yaml
on:
  workflow_dispatch: # Enables manual trigger
```

Then trigger manually from Actions tab → Select workflow → Run workflow.

#### SSH into Runner (Advanced)

Add step to workflow:

```yaml
- name: Setup tmate session
  uses: mxschmitt/action-tmate@v3
  if: failure() # Only on failure
```

This provides SSH access to debug the runner environment.

---

## Workflow Customization

### Modify Deployment Triggers

Change when deployments occur:

```yaml
# Deploy only on version tags
on:
  push:
    tags:
      - 'v*.*.*'

# Deploy with manual approval
deploy-production:
  environment:
    name: production
    # This requires manual approval in GitHub UI
```

### Add Additional Environments

Create new environment:

```yaml
deploy-qa:
  name: Deploy to QA
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/qa'
  environment:
    name: qa
    url: https://api-qa.upcoach.com
```

### Customize Notifications

Add Microsoft Teams:

```yaml
- name: Send Teams notification
  uses: aliencube/microsoft-teams-actions@v0.8.0
  with:
    webhook_uri: ${{ secrets.MS_TEAMS_WEBHOOK }}
    title: Deployment Status
    summary: ${{ job.status }}
```

### Run Workflows in Parallel

For independent workflows:

```yaml
jobs:
  test-unit:
    # ...
  test-integration:
    # Runs in parallel with test-unit (no "needs")
  test-e2e:
    # Runs in parallel with test-unit (no "needs")

  deploy:
    needs: [test-unit, test-integration, test-e2e]
    # Waits for all tests to complete
```

---

## Security Best Practices

### 1. Secret Management

- ✅ Never commit secrets to repository
- ✅ Use GitHub encrypted secrets
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use least-privilege access for service accounts
- ✅ Audit secret access regularly

### 2. Dependency Security

- Enable Dependabot alerts
- Enable Dependabot security updates
- Run `npm audit` in workflows
- Use Snyk or similar tools

### 3. Code Signing

- Never commit keystores or certificates
- Use GitHub secrets for all signing credentials
- Rotate signing keys periodically
- Use separate keys for debug and release builds

### 4. Access Control

- Limit who can approve production deployments
- Use protected branches (main, develop)
- Require PR reviews before merging
- Use CODEOWNERS file

---

## Next Steps

1. **Set up all required secrets** following the configuration sections above
2. **Test workflows** by creating a PR or pushing to develop branch
3. **Monitor first deployments** closely in GitHub Actions tab
4. **Set up monitoring** with Sentry and Codecov
5. **Configure Slack notifications** for team awareness
6. **Document any customizations** specific to your deployment

---

**Last Updated:** November 19, 2025 **Workflows Version:** 1.0 **Maintained by:** DevOps Team

For issues or questions, refer to:

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Flutter CI/CD Guide](https://docs.flutter.dev/deployment/cd)
