# Development Setup

Comprehensive guide for setting up the UpCoach development environment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Database Configuration](#database-configuration)
- [Environment Variables](#environment-variables)
- [Frontend Applications](#frontend-applications)
- [Mobile Development](#mobile-development)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

Install the following before proceeding:

#### 1. Node.js (v20.x or higher)

```bash
# macOS (using Homebrew)
brew install node@20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

#### 2. PostgreSQL (v14 or higher)

```bash
# macOS (using Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Linux (Ubuntu/Debian)
sudo apt install postgresql-14 postgresql-contrib
sudo systemctl start postgresql

# Verify installation
psql --version  # Should show 14.x or higher
```

#### 3. Redis (v7 or higher)

```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt install redis-server
sudo systemctl start redis

# Verify installation
redis-cli ping  # Should return "PONG"
```

#### 4. Git

```bash
# macOS (using Homebrew)
brew install git

# Linux (Ubuntu/Debian)
sudo apt install git

# Verify installation
git --version
```

### Optional Software

#### For Mobile Development

```bash
# Flutter SDK
# Follow official guide: https://docs.flutter.dev/get-started/install

# Android Studio (for Android development)
# Download from: https://developer.android.com/studio

# Xcode (for iOS development - macOS only)
# Install from Mac App Store
```

## Initial Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/virtuenet/UpCoach.git
cd UpCoach

# Navigate to main project
cd UpCoach
```

### 2. Install Dependencies

```bash
# Install API dependencies
cd services/api
npm install

# Install admin panel dependencies
cd ../../apps/admin-panel
npm install

# Install CMS panel dependencies
cd ../cms-panel
npm install

# Install landing page dependencies
cd ../landing-page
npm install

# Return to API directory for remaining setup
cd ../../services/api
```

## Database Configuration

### 1. Create Development Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE upcoach_dev;
CREATE USER upcoach_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE upcoach_dev TO upcoach_user;

# Exit psql
\q
```

### 2. Create Test Database

```bash
# Connect to PostgreSQL
psql postgres

# Create test database
CREATE DATABASE upcoach_test;
GRANT ALL PRIVILEGES ON DATABASE upcoach_test TO upcoach_user;

# Exit psql
\q
```

### 3. Run Migrations

```bash
# From services/api directory
npx prisma migrate deploy

# Verify migrations
npx prisma studio
# This opens a GUI at http://localhost:5555
```

### 4. (Optional) Seed Database

```bash
# Seed with sample data
npm run seed

# This creates:
# - Sample users
# - Demo goals and habits
# - Test content
# - Mock analytics data
```

## Environment Variables

### 1. Create Environment File

```bash
# From services/api directory
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your preferred editor:

```env
# ======================
# Application
# ======================
NODE_ENV=development
PORT=3000
API_VERSION=v1

# ======================
# Database
# ======================
DATABASE_URL="postgresql://upcoach_user:your_password_here@localhost:5432/upcoach_dev"
TEST_DATABASE_URL="postgresql://upcoach_user:your_password_here@localhost:5432/upcoach_test"

# Connection pool
DB_POOL_MIN=2
DB_POOL_MAX=10

# ======================
# Redis
# ======================
REDIS_URL="redis://localhost:6379"
REDIS_TTL=86400  # 24 hours in seconds

# ======================
# Authentication
# ======================
# Generate secure random strings for these:
JWT_SECRET="your-super-secret-jwt-key-change-this-to-random-string"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-to-random-string"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="30d"

# Session
SESSION_SECRET="your-super-secret-session-key-change-this"
SESSION_COOKIE_MAX_AGE=2592000000  # 30 days in milliseconds

# ======================
# OAuth Providers
# ======================
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"

# Apple OAuth (optional)
APPLE_CLIENT_ID="your-apple-client-id"
APPLE_TEAM_ID="your-apple-team-id"
APPLE_KEY_ID="your-apple-key-id"
APPLE_PRIVATE_KEY="your-apple-private-key"

# Facebook OAuth (optional)
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# ======================
# AI Services
# ======================
# OpenAI
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-4"
OPENAI_MAX_TOKENS=1000

# Anthropic Claude (optional)
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Hugging Face (optional)
HUGGINGFACE_API_KEY="your-huggingface-api-key"

# ======================
# Payment Processing
# ======================
# Stripe
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# ======================
# Email Service
# ======================
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="UpCoach <noreply@upcoach.com>"

# ======================
# File Upload
# ======================
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf"
UPLOAD_PATH="./uploads"

# ======================
# Monitoring & Logging
# ======================
LOG_LEVEL=debug
SENTRY_DSN="your-sentry-dsn" # Optional
DATADOG_API_KEY="your-datadog-api-key"  # Optional

# ======================
# CORS
# ======================
CORS_ORIGIN="http://localhost:3000,http://localhost:5173,http://localhost:3001"

# ======================
# Rate Limiting
# ======================
RATE_LIMIT_WINDOW_MS=60000  # 1 minute
RATE_LIMIT_MAX_REQUESTS=100

# ======================
# WebSocket
# ======================
WEBSOCKET_PORT=3001
WEBSOCKET_PATH="/ws"
```

### 3. Generate Secrets

```bash
# Generate random secrets for JWT and sessions
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Run this 3 times and use the output for:
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - SESSION_SECRET
```

## Frontend Applications

### Admin Panel

```bash
# From apps/admin-panel directory
cd apps/admin-panel

# Create .env file
cp .env.example .env

# Edit .env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3001

# Start development server
npm run dev

# Access at http://localhost:5173
```

### CMS Panel

```bash
# From apps/cms-panel directory
cd apps/cms-panel

# Create .env file
cp .env.example .env

# Edit .env
VITE_API_URL=http://localhost:3000/api/v1

# Start development server
npm run dev

# Access at http://localhost:5174
```

### Landing Page

```bash
# From apps/landing-page directory
cd apps/landing-page

# Create .env.local file
cp .env.example .env.local

# Edit .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Start development server
npm run dev

# Access at http://localhost:3002
```

## Mobile Development

### Setup Flutter Environment

```bash
# Install Flutter dependencies
cd mobile-app
flutter pub get

# Run code generation
flutter pub run build_runner build --delete-conflicting-outputs
```

### iOS Setup (macOS only)

```bash
# Install iOS dependencies
cd ios
pod install
cd ..

# Run on iOS simulator
flutter run -d ios
```

### Android Setup

```bash
# Ensure Android SDK is installed via Android Studio
# Set ANDROID_HOME environment variable

# Run on Android emulator
flutter run -d android
```

### Configure API Endpoint

Edit `mobile-app/lib/core/config/api_config.dart`:

```dart
class ApiConfig {
  static const String baseUrl = 'http://localhost:3000/api/v1';
  static const String wsUrl = 'ws://localhost:3001';

  // For Android emulator, use:
  // static const String baseUrl = 'http://10.0.2.2:3000/api/v1';

  // For iOS simulator, use:
  // static const String baseUrl = 'http://localhost:3000/api/v1';
}
```

## Verification

### 1. Start All Services

```bash
# Terminal 1: Start API
cd services/api
npm run dev

# Terminal 2: Start Admin Panel
cd apps/admin-panel
npm run dev

# Terminal 3: Start Landing Page
cd apps/landing-page
npm run dev

# Terminal 4: Start Mobile App (optional)
cd mobile-app
flutter run
```

### 2. Test Endpoints

```bash
# Health check
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"..."}

# API version
curl http://localhost:3000/api/v1
# Expected: {"message":"UpCoach API v1","version":"1.0.0"}

# Test authentication (should fail without credentials)
curl http://localhost:3000/api/v1/users/me
# Expected: {"success":false,"message":"Access token required"}
```

### 3. Run Tests

```bash
# From services/api directory

# Run all tests
npm test

# Expected output:
# Test Suites: 54 passed, 54 total
# Tests:       1023 passed, 1026 total
# Coverage:    99.7%

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e            # E2E tests only
```

### 4. Access Applications

- **API**: http://localhost:3000
- **Admin Panel**: http://localhost:5173
- **CMS Panel**: http://localhost:5174
- **Landing Page**: http://localhost:3002
- **Prisma Studio**: http://localhost:5555 (when running `npx prisma studio`)

## Troubleshooting

### PostgreSQL Connection Issues

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions:**

```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql@14  # macOS
sudo systemctl start postgresql    # Linux

# Check PostgreSQL logs
tail -f /usr/local/var/log/postgresql@14.log  # macOS
sudo journalctl -u postgresql                  # Linux

# Test connection
psql -U upcoach_user -d upcoach_dev -h localhost
```

### Redis Connection Issues

**Problem:** `Error: Redis connection failed`

**Solutions:**

```bash
# Check if Redis is running
redis-cli ping

# Start Redis
brew services start redis      # macOS
sudo systemctl start redis     # Linux

# Check Redis logs
tail -f /usr/local/var/log/redis.log  # macOS
sudo journalctl -u redis              # Linux
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port in .env
PORT=3001
```

### Migration Errors

**Problem:** `Error: Migration failed`

**Solutions:**

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually drop and recreate
dropdb upcoach_dev
createdb upcoach_dev
npx prisma migrate deploy
```

### npm Install Errors

**Problem:** `Error: Cannot find module`

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use fresh install
npm ci
```

### Test Failures

**Problem:** Tests failing on first run

**Solutions:**

```bash
# Ensure test database exists
createdb upcoach_test

# Set test environment variable
export NODE_ENV=test

# Run with explicit test database
TEST_DATABASE_URL="postgresql://localhost:5432/upcoach_test" npm test

# Clear Jest cache
npx jest --clearCache
npm test
```

## Next Steps

Now that your environment is set up:

1. **[Development Guide](../development/DEVELOPMENT_GUIDE.md)** - Learn development workflows
2. **[Testing Overview](../testing/TESTING_OVERVIEW.md)** - Understand the test suite
3. **[Project Structure](../setup/Project_Structure.md)** - Explore the codebase

## Additional Resources

- **[Quick Start](QUICK_START.md)** - 5-minute setup guide
- **[Project Overview](PROJECT_OVERVIEW.md)** - Architecture overview
- **[SECURITY.md](../SECURITY.md)** - Security best practices
- **[Documentation Index](../INDEX.md)** - Complete documentation

---

**Previous:** [← Project Overview](PROJECT_OVERVIEW.md) | **Next:**
[Development Guide →](../development/DEVELOPMENT_GUIDE.md)
