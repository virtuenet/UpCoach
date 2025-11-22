# Secret Rotation Checklist

**Date Started:** _____________
**Completed By:** _____________
**Incident:** .env files exposed in git repository

---

## Priority Level Guide

- 🔴 **P0 - CRITICAL:** Rotate immediately (direct access to production data/systems)
- 🟠 **P1 - HIGH:** Rotate within 24 hours (financial or sensitive data)
- 🟡 **P2 - MEDIUM:** Rotate within 1 week (limited access or non-production)
- 🟢 **P3 - LOW:** Rotate at next scheduled rotation (development/testing only)

---

## 1. Database Credentials 🔴 P0

### PostgreSQL Database
- [ ] Generate new password for production database user
- [ ] Update password in hosting provider (e.g., Heroku, AWS RDS, DigitalOcean)
- [ ] Update `DATABASE_URL` in production environment variables
- [ ] Update `DATABASE_URL` in staging environment
- [ ] Test database connection from application
- [ ] Update backup scripts with new credentials
- [ ] Update monitoring tools (DataDog, Sentry) with new connection string
- [ ] Document new credential location in password manager

**Old Value Location:** `.env.production`, `.env.secure`
**New Value:** `postgresql://user:NEW_PASSWORD@host:5432/dbname`
**Updated In:** [ ] Heroku [ ] AWS [ ] DigitalOcean [ ] Other: ____________

### Redis Cache
- [ ] Generate new Redis password
- [ ] Update `REDIS_URL` or `REDIS_PASSWORD` in production
- [ ] Update `REDIS_URL` in staging environment
- [ ] Test Redis connection
- [ ] Flush Redis cache after rotation (if needed)
- [ ] Update monitoring with new credentials

**Old Value Location:** `.env.production`
**New Value:** `redis://:NEW_PASSWORD@host:6379`
**Updated In:** [ ] Heroku [ ] AWS [ ] DigitalOcean [ ] Other: ____________

---

## 2. Authentication & Security 🔴 P0

### JWT Secrets
- [ ] Generate new `JWT_SECRET` (minimum 32 characters, cryptographically random)
- [ ] Generate new `JWT_REFRESH_SECRET`
- [ ] Plan maintenance window (will invalidate all user sessions)
- [ ] Update production environment variables
- [ ] Update staging environment
- [ ] Deploy application with new secrets
- [ ] Monitor for authentication errors
- [ ] Notify users of forced logout (if customer-facing)

**Generation Command:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Old Value Location:** `.env.production`, `.env.secure`
**Updated In:** [ ] Production [ ] Staging [ ] Development
**Deployed:** [ ] Backend [ ] Tested [ ] Monitoring

### Session Secrets
- [ ] Generate new `SESSION_SECRET`
- [ ] Update `COOKIE_SECRET` (if separate)
- [ ] Update production environment
- [ ] Test session functionality
- [ ] Clear existing sessions (if needed)

**Old Value Location:** `.env.production`
**Updated In:** [ ] Production [ ] Staging

### CSRF Secrets
- [ ] Generate new `CSRF_SECRET` (if separate from session)
- [ ] Update environment variables
- [ ] Test CSRF protection
- [ ] Monitor for CSRF validation errors

---

## 3. AI / ML API Keys 🟠 P1

### OpenAI API Keys
- [ ] Log into OpenAI dashboard: https://platform.openai.com/api-keys
- [ ] Revoke old API key: `OPENAI_API_KEY`
- [ ] Generate new API key
- [ ] Update production environment variable
- [ ] Update staging environment
- [ ] Test AI features (chat, recommendations, insights)
- [ ] Monitor API usage for anomalies
- [ ] Update billing alerts if key had spending limits

**Old Key Format:** `sk-...`
**New Key:** `sk-...` (first 10 chars for reference)
**Updated In:** [ ] Production [ ] Staging
**Tested:** [ ] AI Coach [ ] Recommendations [ ] Voice AI

### Anthropic Claude API Keys
- [ ] Log into Anthropic console
- [ ] Revoke old API key: `ANTHROPIC_API_KEY`
- [ ] Generate new API key
- [ ] Update environment variables
- [ ] Test Claude-powered features
- [ ] Monitor usage

**Old Key Format:** `sk-ant-...`
**Updated In:** [ ] Production [ ] Staging
**Tested:** [ ] Yes [ ] No

### Hugging Face API Keys
- [ ] Log into Hugging Face: https://huggingface.co/settings/tokens
- [ ] Revoke old token: `HUGGINGFACE_API_KEY`
- [ ] Generate new token
- [ ] Update environment variables
- [ ] Test ML models
- [ ] Verify model downloads work

**Updated In:** [ ] Production [ ] Staging

---

## 4. Payment Processing 🟠 P1

### Stripe Keys
- [ ] Log into Stripe Dashboard: https://dashboard.stripe.com/apikeys
- [ ] **SECRET KEY:**
  - [ ] Roll secret key for production (creates new, keeps old active temporarily)
  - [ ] Update `STRIPE_SECRET_KEY` in production environment
  - [ ] Test payment processing
  - [ ] Monitor for errors
  - [ ] Delete old key after 24 hours of successful operation

- [ ] **WEBHOOK SECRET:**
  - [ ] Navigate to Webhooks in Stripe Dashboard
  - [ ] Create new webhook endpoint with same URL
  - [ ] Copy new webhook signing secret
  - [ ] Update `STRIPE_WEBHOOK_SECRET` in production
  - [ ] Test webhook delivery
  - [ ] Disable old webhook endpoint
  - [ ] Monitor webhook events

- [ ] **PUBLISHABLE KEY:**
  - [ ] Update frontend `STRIPE_PUBLISHABLE_KEY` (if exposed)
  - [ ] Deploy frontend with new key
  - [ ] Test checkout flow

**Old Secret Key:** `sk_live_...` (first 10 chars for reference)
**Old Webhook Secret:** `whsec_...`
**Updated In:** [ ] Backend [ ] Frontend [ ] Mobile App
**Tested:** [ ] Checkout [ ] Subscriptions [ ] Webhooks [ ] Refunds

### RevenueCat API Keys
- [ ] Log into RevenueCat Dashboard: https://app.revenuecat.com/
- [ ] Navigate to API Keys
- [ ] Revoke old public SDK keys
- [ ] Generate new public SDK key for iOS
- [ ] Generate new public SDK key for Android
- [ ] Update mobile app configuration
- [ ] Revoke old secret API key (for backend)
- [ ] Generate new secret API key
- [ ] Update `REVENUECAT_SECRET_KEY` in backend
- [ ] Update `REVENUECAT_WEBHOOK_SECRET` for webhook signature verification
- [ ] Test subscription verification
- [ ] Test webhook processing
- [ ] Deploy mobile app updates

**Updated In:** [ ] iOS App [ ] Android App [ ] Backend Webhook
**Tested:** [ ] Purchase Flow [ ] Entitlement Check [ ] Webhook
**Deployed:** [ ] Yes [ ] No (Date: __________)

---

## 5. OAuth Provider Secrets 🟠 P1

### Google OAuth
- [ ] Log into Google Cloud Console: https://console.cloud.google.com/
- [ ] Navigate to APIs & Services > Credentials
- [ ] Find OAuth 2.0 Client IDs for "UpCoach"
- [ ] Delete old client secret or create new one
- [ ] Update `GOOGLE_CLIENT_ID` (if changed)
- [ ] Update `GOOGLE_CLIENT_SECRET` in production
- [ ] Update redirect URIs if needed
- [ ] Test Google Sign-In flow
- [ ] Test Google Calendar integration (if applicable)
- [ ] Monitor OAuth errors

**Old Client ID:** (first 20 chars for reference)
**Updated In:** [ ] Production [ ] Staging [ ] Mobile App
**Tested:** [ ] Web Login [ ] Mobile Login [ ] API Access

### Apple Sign In
- [ ] Log into Apple Developer: https://developer.apple.com/account/
- [ ] Navigate to Certificates, Identifiers & Profiles
- [ ] Revoke old Sign in with Apple keys
- [ ] Generate new private key
- [ ] Download new .p8 key file
- [ ] Update `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
- [ ] Update mobile app configuration
- [ ] Test Apple Sign-In flow
- [ ] Verify token validation

**Updated In:** [ ] iOS App [ ] Backend [ ] Web
**Tested:** [ ] Yes [ ] No

### Facebook App Secret
- [ ] Log into Facebook Developers: https://developers.facebook.com/
- [ ] Navigate to App Settings > Basic
- [ ] Reset App Secret
- [ ] Update `FACEBOOK_APP_SECRET` in backend
- [ ] Update `FACEBOOK_APP_ID` (if changed)
- [ ] Test Facebook Login
- [ ] Monitor auth errors

**Updated In:** [ ] Production [ ] Staging
**Tested:** [ ] Yes [ ] No

---

## 6. Third-Party Service Keys 🟡 P2

### SendGrid / Email Service
- [ ] Log into SendGrid: https://app.sendgrid.com/
- [ ] Navigate to Settings > API Keys
- [ ] Revoke old API key
- [ ] Generate new API key with same permissions
- [ ] Update `SENDGRID_API_KEY` or `SMTP_PASSWORD`
- [ ] Update `SMTP_USER` if needed
- [ ] Test email sending
- [ ] Send test email to verify
- [ ] Monitor email delivery rates

**Updated In:** [ ] Production [ ] Staging
**Tested:** [ ] Welcome Email [ ] Password Reset [ ] Notifications

### Twilio (SMS Service)
- [ ] Log into Twilio Console: https://console.twilio.com/
- [ ] Navigate to Account > API Keys & Tokens
- [ ] Create new API Key
- [ ] Update `TWILIO_ACCOUNT_SID`
- [ ] Update `TWILIO_AUTH_TOKEN`
- [ ] Update `TWILIO_API_KEY`
- [ ] Update `TWILIO_API_SECRET`
- [ ] Test SMS sending
- [ ] Test 2FA code delivery
- [ ] Monitor SMS delivery

**Updated In:** [ ] Production [ ] Staging
**Tested:** [ ] SMS Send [ ] 2FA [ ] Notifications

### Sentry DSN
- [ ] Log into Sentry: https://sentry.io/
- [ ] Navigate to Project Settings > Client Keys (DSN)
- [ ] Regenerate DSN or create new project
- [ ] Update `SENTRY_DSN` in all environments
- [ ] Update frontend Sentry configuration
- [ ] Update mobile app Sentry configuration
- [ ] Test error reporting
- [ ] Verify error capture works

**Old DSN:** (first 30 chars for reference)
**Updated In:** [ ] Backend [ ] Frontend [ ] Mobile [ ] Production [ ] Staging

### DataDog API Keys
- [ ] Log into DataDog: https://app.datadoghq.com/
- [ ] Navigate to Organization Settings > API Keys
- [ ] Revoke old API key
- [ ] Generate new API key
- [ ] Update `DATADOG_API_KEY`
- [ ] Update `DATADOG_APP_KEY` (if separate)
- [ ] Test metric reporting
- [ ] Verify APM data flowing
- [ ] Check dashboard updates

**Updated In:** [ ] Production [ ] Staging
**Tested:** [ ] Metrics [ ] APM [ ] Logs

---

## 7. Cloud Service Credentials 🔴 P0

### AWS Credentials (if used)
- [ ] Log into AWS IAM: https://console.aws.amazon.com/iam/
- [ ] Find service user/role for UpCoach
- [ ] Deactivate old access keys
- [ ] Generate new access key pair
- [ ] Update `AWS_ACCESS_KEY_ID`
- [ ] Update `AWS_SECRET_ACCESS_KEY`
- [ ] Update S3 bucket policies if needed
- [ ] Test S3 file uploads
- [ ] Test CloudFront CDN access
- [ ] Delete old access keys after 24 hours

**Services Using AWS:** [ ] S3 [ ] CloudFront [ ] SES [ ] Other: __________
**Updated In:** [ ] Production [ ] Staging
**Tested:** [ ] File Upload [ ] File Download [ ] CDN

### Firebase / Supabase Keys
- [ ] Log into Firebase Console
- [ ] Navigate to Project Settings
- [ ] Regenerate service account keys
- [ ] Update `FIREBASE_ADMIN_SDK_KEY`
- [ ] Update `FIREBASE_API_KEY` (if client-side)
- [ ] Update `SUPABASE_URL` and `SUPABASE_KEY` (if using Supabase)
- [ ] Test authentication
- [ ] Test Firestore/database access
- [ ] Test push notifications
- [ ] Test file storage

**Updated In:** [ ] Backend [ ] Frontend [ ] Mobile
**Tested:** [ ] Auth [ ] Database [ ] Storage [ ] Notifications

---

## 8. Mobile App Secrets 🟡 P2

### iOS Push Notification Certificates
- [ ] Log into Apple Developer
- [ ] Revoke old push notification certificates
- [ ] Generate new certificates
- [ ] Update in Firebase Console
- [ ] Test push notifications on iOS

### Android Push Notification Keys
- [ ] Log into Firebase Console
- [ ] Regenerate server key (if not using FCM)
- [ ] Update in backend configuration
- [ ] Test push notifications on Android

### Mobile App Signing Keys
- [ ] **iOS:**
  - [ ] Review if distribution certificates need rotation
  - [ ] Update provisioning profiles if needed

- [ ] **Android:**
  - [ ] Review if keystore needs rotation
  - [ ] Update signing configuration if changed

**Note:** These typically don't need immediate rotation unless directly exposed

---

## 9. Internal Services 🟡 P2

### API Gateway / Load Balancer Secrets
- [ ] Update load balancer authentication tokens
- [ ] Update API gateway keys
- [ ] Update service mesh certificates (if applicable)
- [ ] Test service-to-service communication

### Docker Registry Credentials
- [ ] Update Docker Hub / private registry credentials
- [ ] Update CI/CD with new credentials
- [ ] Test image push/pull

### CI/CD Secrets
- [ ] Update GitHub Actions secrets
- [ ] Update environment variables in CI/CD platform
- [ ] Test deployment pipeline

---

## 10. Encryption Keys 🔴 P0

### Application Encryption Keys
- [ ] Generate new `ENCRYPTION_KEY` for application data
- [ ] Plan data re-encryption strategy
- [ ] **WARNING:** Rotating encryption keys requires re-encrypting data
- [ ] Document re-encryption procedure
- [ ] Test encryption/decryption with new key

**Status:** [ ] Not Applicable [ ] Requires Planning [ ] Completed

### Certificate Private Keys
- [ ] Review SSL/TLS certificates
- [ ] Check if private keys were exposed
- [ ] Regenerate certificates if needed
- [ ] Update load balancer / CDN with new certs

**Status:** [ ] Not Applicable [ ] Reviewed [ ] Rotated

---

## 11. Verification & Testing 🟢

### Post-Rotation Testing Checklist
- [ ] **Authentication Flows:**
  - [ ] User login (email/password)
  - [ ] OAuth login (Google, Apple, Facebook)
  - [ ] Password reset
  - [ ] 2FA/MFA
  - [ ] Session management

- [ ] **Payment Processing:**
  - [ ] Checkout flow
  - [ ] Subscription creation
  - [ ] Webhook processing
  - [ ] Refund processing

- [ ] **AI Features:**
  - [ ] AI coaching responses
  - [ ] Recommendations
  - [ ] Content generation

- [ ] **Third-Party Integrations:**
  - [ ] Email sending
  - [ ] SMS sending
  - [ ] Push notifications
  - [ ] File uploads/downloads

- [ ] **Monitoring:**
  - [ ] Error tracking (Sentry)
  - [ ] APM metrics (DataDog)
  - [ ] Log aggregation
  - [ ] Alerts functioning

### Production Monitoring (24-48 hours)
- [ ] Monitor error rates for spikes
- [ ] Check authentication success rates
- [ ] Verify payment processing rates
- [ ] Review API response times
- [ ] Check for increased support tickets
- [ ] Monitor user complaints/feedback

---

## 12. Documentation & Compliance 📝

### Update Documentation
- [ ] Update password manager with all new secrets
- [ ] Document rotation date in security log
- [ ] Update runbooks with new credential locations
- [ ] Update disaster recovery procedures
- [ ] Update onboarding documentation for new developers

### Compliance Requirements
- [ ] **GDPR:** Document potential data breach (if personal data accessed)
- [ ] **HIPAA:** Notify compliance officer (if PHI potentially accessed)
- [ ] **SOC2:** Document incident in audit trail
- [ ] Update security control documentation
- [ ] Prepare incident response report

### Team Communication
- [ ] Notify security team of completion
- [ ] Notify development team of new credentials
- [ ] Update team on any required actions
- [ ] Schedule post-mortem meeting
- [ ] Document lessons learned

---

## 13. Post-Rotation Cleanup 🧹

### Old Credential Cleanup (After 48 hours of stable operation)
- [ ] Delete old database credentials from provider
- [ ] Remove old API keys from third-party services
- [ ] Revoke old OAuth client secrets
- [ ] Delete old service account keys
- [ ] Clean up old entries in password manager
- [ ] Remove old secrets from CI/CD (if any remain)

### Preventive Measures
- [ ] Install git-secrets on all developer machines
- [ ] Add pre-commit hooks for secret detection
- [ ] Set up secret scanning in CI/CD (Trufflehog, etc.)
- [ ] Schedule regular secret rotation (quarterly)
- [ ] Implement secret management system (Vault, AWS Secrets Manager)
- [ ] Conduct security awareness training for team

---

## Completion Sign-Off

**Rotation Started:** _______________ (Date/Time)
**Rotation Completed:** _______________ (Date/Time)
**Total Duration:** _______________ (Hours)

**Rotated By:**
- Name: _______________
- Title: _______________
- Signature: _______________
- Date: _______________

**Verified By:**
- Name: _______________
- Title: _______________
- Signature: _______________
- Date: _______________

**Production Monitoring Period:**
- Start: _______________
- End: _______________
- Issues Detected: [ ] None [ ] Minor [ ] Major (describe): _______________

**Incident Closed:** [ ] Yes [ ] No
**Date Closed:** _______________

---

## Quick Reference: Secret Generation Commands

```bash
# Generate strong random secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate UUID
node -e "console.log(require('crypto').randomUUID())"

# Generate base64 encoded secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate password (alphanumeric + special chars)
openssl rand -base64 32

# Generate API key format (hex)
openssl rand -hex 32
```

---

## Emergency Contacts

**Security Team:**
- Email: security@upcoach.com
- On-Call: [Phone Number]
- Slack: #security-incidents

**DevOps Team:**
- Email: devops@upcoach.com
- On-Call: [Phone Number]
- Slack: #devops

**Compliance Officer:**
- Name: [Name]
- Email: [Email]
- Phone: [Phone Number]

---

**Document Version:** 1.0
**Last Updated:** 2025-10-28
**Next Review:** 2026-01-28 (Quarterly)
