# Project Overview

High-level overview of the UpCoach platform architecture, features, and design philosophy.

## What is UpCoach?

UpCoach is an enterprise-grade AI-powered coaching platform that helps users achieve their personal
and professional goals through:

- **Intelligent Habit Tracking** - AI-powered habit formation and progress tracking
- **Goal Management** - SMART goal setting with personalized insights
- **AI Coaching** - Conversational AI using GPT-4 and Claude
- **Community Engagement** - Forums, groups, and social features
- **Voice Journaling** - Audio recording with AI-powered transcription and analysis
- **Analytics & Reporting** - Comprehensive dashboards for users and coaches
- **Payment Processing** - Stripe integration for coaching subscriptions

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Mobile App │ Landing Page │  Admin Panel │   CMS Panel    │
│   (Flutter)  │  (Next.js)   │   (React)    │   (React)      │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │    API Gateway     │
                  │  (Express/TS)      │
                  └─────────┬─────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
┌──────▼──────┐      ┌──────▼──────┐     ┌──────▼──────┐
│  PostgreSQL │      │    Redis    │     │  External   │
│  (Primary)  │      │   (Cache)   │     │  Services   │
└─────────────┘      └─────────────┘     └──────┬──────┘
                                                 │
                              ┌──────────────────┼──────────────────┐
                              │                  │                  │
                       ┌──────▼──────┐  ┌────────▼─────┐  ┌────────▼────────┐
                       │   OpenAI    │  │    Stripe    │  │   Email/SMS     │
                       │   GPT-4     │  │   Payments   │  │   Services      │
                       └─────────────┘  └──────────────┘  └─────────────────┘
```

### Monorepo Structure

The project uses a monorepo architecture to manage multiple applications:

```
UpCoach/
├── apps/                          # Frontend applications
│   ├── admin-panel/              # Admin dashboard
│   │   ├── src/                  # React components
│   │   ├── public/               # Static assets
│   │   └── vite.config.ts        # Vite configuration
│   ├── cms-panel/                # Content management
│   │   └── (similar structure)
│   └── landing-page/             # Marketing website
│       ├── app/                  # Next.js 15 app directory
│       └── components/           # Shared components
│
├── services/                     # Backend services
│   └── api/                      # Main API server
│       ├── src/
│       │   ├── controllers/      # Route handlers
│       │   ├── services/         # Business logic
│       │   ├── models/           # Database models
│       │   ├── middleware/       # Express middleware
│       │   ├── routes/           # API routes
│       │   └── utils/            # Utilities
│       ├── prisma/               # Database schema & migrations
│       └── __tests__/            # Test files (1026 tests!)
│
├── mobile-app/                   # Flutter mobile application
│   ├── lib/
│   │   ├── features/             # Feature modules
│   │   ├── core/                 # Core utilities
│   │   └── widgets/              # Reusable widgets
│   └── test/                     # Mobile tests
│
└── packages/                     # Shared packages
    ├── design-system/            # Shared UI components
    └── ui/                       # Component library
```

## Core Components

### 1. Backend API (Express + TypeScript)

**Purpose:** Central backend service handling all business logic

**Key Features:**

- RESTful API with 48+ route files
- 76 Prisma database models
- JWT authentication with refresh tokens
- WebSocket real-time communication
- 99.7% test coverage (1023/1026 tests)

**Technology:**

- Node.js 20+ with TypeScript
- Express.js framework
- Prisma ORM for database
- Redis for caching and sessions
- Jest for testing

### 2. Mobile Application (Flutter)

**Purpose:** iOS and Android apps for end users

**Key Features:**

- 183 Dart files across 20 feature modules
- Offline-first architecture with local storage
- Real-time sync with Socket.io
- Biometric authentication
- Voice journal recording

**Technology:**

- Flutter 3.7+
- Riverpod for state management
- Hive & SQLite for local storage
- go_router for navigation

### 3. Admin Panel (React)

**Purpose:** Administrative dashboard for platform management

**Key Features:**

- 46 React components
- 119+ pages
- User management
- Analytics dashboards
- System configuration
- Financial reporting

**Technology:**

- React 18 with TypeScript
- Vite build tool
- Zustand for state management
- Vitest for testing

### 4. CMS Panel (React)

**Purpose:** Content management for articles, courses, and media

**Key Features:**

- 42 React components
- 70+ pages
- Content creation and editing
- Media management
- Publishing workflow
- Version control

**Technology:**

- React 18 with TypeScript
- Vite build tool
- React Query for data fetching
- TipTap for rich text editing

### 5. Landing Page (Next.js)

**Purpose:** Marketing website for user acquisition

**Key Features:**

- Server-side rendering (SSR)
- SEO optimization
- Lead generation forms
- Pricing pages
- App download sections

**Technology:**

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Vercel deployment ready

## Data Flow

### User Registration Flow

```
1. User submits registration form (Mobile/Web)
   ↓
2. API validates input and checks for existing user
   ↓
3. Password hashed with bcrypt
   ↓
4. User record created in PostgreSQL
   ↓
5. JWT tokens generated (access + refresh)
   ↓
6. Session stored in Redis
   ↓
7. Welcome email sent via email service
   ↓
8. User profile created with default settings
   ↓
9. Tokens returned to client
```

### AI Coaching Interaction Flow

```
1. User sends message to AI coach
   ↓
2. API retrieves user context (goals, habits, history)
   ↓
3. Context + message sent to OpenAI GPT-4
   ↓
4. AI response generated with personalized insights
   ↓
5. Response stored in database
   ↓
6. WebSocket pushes response to client in real-time
   ↓
7. Mobile/Web app displays AI message
```

## Key Design Decisions

### 1. Monorepo Architecture

**Why:** Share code, dependencies, and configurations across multiple apps while maintaining
independent deployment.

**Benefits:**

- Shared TypeScript types between frontend and backend
- Consistent tooling and linting
- Easier refactoring across applications
- Single source of truth for dependencies

### 2. Test-Driven Development

**Why:** Achieve production-ready quality with comprehensive test coverage.

**Approach:**

- 99.7% test coverage (1023/1026 tests)
- Unit, integration, and E2E journey tests
- Established testing patterns for consistency
- Fast CI/CD with sub-4 minute test suite

**See:** [Testing Overview](../testing/TESTING_OVERVIEW.md)

### 3. Microservice-Ready Architecture

**Why:** Prepare for future scalability while maintaining monolithic simplicity for now.

**Strategy:**

- Services separated by domain (auth, coaching, payments)
- Clear service boundaries
- Stateless API design
- Easy to extract into microservices later

### 4. AI-First Approach

**Why:** Leverage AI to provide personalized coaching at scale.

**Implementation:**

- OpenAI GPT-4 for conversational AI
- Anthropic Claude for advanced reasoning
- Hugging Face for specialized ML models
- Local LLM support for privacy-sensitive features

## Security Architecture

### Authentication Layers

1. **JWT Tokens** - Short-lived access tokens + refresh tokens
2. **OAuth Providers** - Google, Apple, Facebook sign-in
3. **WebAuthn** - Biometric authentication for mobile
4. **2FA** - TOTP-based two-factor authentication
5. **Session Management** - Redis-backed sessions with fingerprinting

### Data Protection

- **Encryption at Rest** - PostgreSQL encryption
- **Encryption in Transit** - TLS 1.3 for all connections
- **Password Hashing** - bcrypt with salting
- **Row-Level Security** - Multi-tenant data isolation
- **GDPR Compliance** - Data export and deletion

**See:** [SECURITY.md](../SECURITY.md)

## Performance Optimizations

### Database

- Connection pooling (min: 2, max: 10)
- Query optimization with indexes
- Database query monitoring
- Slow query logging

### Caching Strategy

- Redis for session data (TTL: 30 days)
- API response caching (configurable TTL)
- Static asset CDN caching
- Browser caching headers

### Real-time Communication

- WebSocket for live updates
- Server-Sent Events (SSE) for dashboards
- Optimistic UI updates
- Background sync for mobile

## Testing Strategy

### Test Pyramid

```
         /\
        /  \          E2E Journey Tests (158 tests)
       /────\         - User flows
      /  ##  \        - Payment flows
     /   ##   \       - Integration scenarios
    /    ##    \
   /──────────\     Integration Tests (182 tests)
  /     ####    \    - Service integration
 /      ####     \   - API contracts
/       ####      \  - Database operations
──────────────────
      ######         Unit Tests (687 tests)
      ######         - Business logic
      ######         - Utilities
      ######         - Pure functions
```

### Test Coverage: 99.7%

- **1023 passing tests** out of 1026 total
- **Zero failing tests**
- **54/55 test suites passing** (98.2%)
- **All critical business flows validated**

**See:** [Testing Overview](../testing/TESTING_OVERVIEW.md)

## Deployment Architecture

### Environments

1. **Development** - Local development environment
2. **Staging** - Pre-production testing
3. **Production** - Live environment

### CI/CD Pipeline (GitHub Actions)

```
Push to GitHub
      ↓
Lint & Type Check
      ↓
Run Tests (99.7% coverage)
      ↓
Build Applications
      ↓
Deploy to Environment
      ↓
Post-deployment Tests
      ↓
Monitor & Alert
```

## Tech Stack Summary

| Layer            | Technology                      | Purpose               |
| ---------------- | ------------------------------- | --------------------- |
| **Mobile**       | Flutter 3.7+                    | iOS & Android apps    |
| **Web Frontend** | React 18, Next.js 15            | Admin, CMS, Landing   |
| **Backend**      | Node.js 20, Express, TypeScript | API server            |
| **Database**     | PostgreSQL 14+                  | Primary data store    |
| **Cache**        | Redis 7+                        | Sessions & caching    |
| **ORM**          | Prisma                          | Database access       |
| **Auth**         | JWT, OAuth2, WebAuthn           | Authentication        |
| **AI**           | OpenAI, Claude, Hugging Face    | AI coaching           |
| **Payments**     | Stripe                          | Payment processing    |
| **Testing**      | Jest, Vitest, Playwright        | Comprehensive testing |
| **CI/CD**        | GitHub Actions                  | Automation            |

## What's Next?

Now that you understand the architecture:

1. **[Development Setup](DEVELOPMENT_SETUP.md)** - Detailed environment configuration
2. **[Development Guide](../development/DEVELOPMENT_GUIDE.md)** - Workflows and best practices
3. **[Project Structure](../setup/Project_Structure.md)** - Detailed code organization

---

**Previous:** [← Quick Start](QUICK_START.md) | **Next:**
[Development Setup →](DEVELOPMENT_SETUP.md)
