# Quick Start Guide

Get the UpCoach platform running on your machine in 5 minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** ([Download](https://nodejs.org/))
- **PostgreSQL 14+** ([Download](https://www.postgresql.org/download/))
- **Redis 7+** ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

Optional (for mobile development):
- **Flutter 3.7+** ([Install Guide](https://docs.flutter.dev/get-started/install))

## 5-Minute Setup

### 1. Clone the Repository

```bash
git clone https://github.com/virtuenet/UpCoach.git
cd UpCoach/upcoach-project
```

### 2. Install Dependencies

```bash
# Install API dependencies
cd services/api
npm install
```

### 3. Set Up Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings (use your preferred editor)
nano .env
```

**Minimum required environment variables:**
```env
# Database
DATABASE_URL="postgresql://localhost:5432/upcoach_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secret (generate a random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this"

# Node Environment
NODE_ENV="development"
```

### 4. Set Up Database

```bash
# Create database
createdb upcoach_dev

# Run migrations
npx prisma migrate deploy

# (Optional) Seed with sample data
npm run seed
```

### 5. Start Development Server

```bash
# Start the API server
npm run dev
```

The API server will start at `http://localhost:3000`

## Verify Installation

### Test the API

```bash
# In a new terminal, test the health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-19T..."}
```

### Run Tests

```bash
# Run all tests
npm test

# Expected: 1023/1026 tests passing (99.7%)
```

## What's Next?

Now that you're up and running:

1. **[Project Overview](PROJECT_OVERVIEW.md)** - Understand the architecture
2. **[Development Setup](DEVELOPMENT_SETUP.md)** - Detailed configuration guide
3. **[Development Guide](../development/DEVELOPMENT_GUIDE.md)** - Learn workflows and best practices

## Common Issues

### Database Connection Error

**Problem:** `Error: connect ECONNREFUSED`

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# If not, start PostgreSQL
# macOS (Homebrew):
brew services start postgresql@14

# Linux (systemd):
sudo systemctl start postgresql
```

### Redis Connection Error

**Problem:** `Error: Redis connection failed`

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis
# macOS (Homebrew):
brew services start redis

# Linux (systemd):
sudo systemctl start redis
```

### Port Already in Use

**Problem:** `Error: Port 3000 is already in use`

**Solution:**
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change the port in .env
PORT=3001
```

## Quick Commands Reference

```bash
# Development
npm run dev              # Start development server
npm run dev:watch        # Start with hot reload

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run with coverage report

# Database
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create and apply migration
npx prisma db seed       # Seed database

# Building
npm run build            # Build for production
npm start                # Start production server
```

## Getting Help

- **Documentation**: [docs/INDEX.md](../INDEX.md)
- **Architecture**: [../setup/Project_Structure.md](../setup/Project_Structure.md)
- **Testing**: [../testing/TESTING_OVERVIEW.md](../testing/TESTING_OVERVIEW.md)
- **Current Status**: [../../CURRENT_STATUS.md](../../CURRENT_STATUS.md)

---

**Next Step:** [Understand the Project Architecture](PROJECT_OVERVIEW.md) →
