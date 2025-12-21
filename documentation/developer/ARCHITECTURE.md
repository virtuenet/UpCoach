# UpCoach Platform Architecture

## Overview

UpCoach is a comprehensive coaching platform that combines AI-powered insights with habit tracking, goal management, and wellness monitoring. The platform is designed as a modular, scalable system following microservices principles.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Mobile App  │  │ Admin Panel  │  │  CMS Panel   │  │Landing Page │ │
│  │   (Flutter)  │  │   (React)    │  │   (React)    │  │   (Next.js) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY                                   │
│                        (Rate Limiting, Auth)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Core API    │  │  AI Service  │  │ LLM Gateway  │  │   Worker    │ │
│  │  (Node.js)   │  │  (Python)    │  │  (Node.js)   │  │  (Node.js)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │      S3      │  │    CDN      │ │
│  │   (Primary)  │  │   (Cache)    │  │   (Assets)   │  │(CloudFront) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
UpCoach/
├── apps/                          # Client applications
│   ├── mobile/                    # Flutter mobile app
│   │   ├── lib/
│   │   │   ├── core/             # Core utilities, services, providers
│   │   │   ├── features/         # Feature modules
│   │   │   └── shared/           # Shared widgets, models
│   │   └── test/                 # Tests
│   ├── admin-panel/              # React admin dashboard
│   ├── cms-panel/                # Content management
│   └── landing-page/             # Marketing website
│
├── services/                      # Backend services
│   ├── api/                      # Core REST API
│   │   ├── src/
│   │   │   ├── routes/           # API routes
│   │   │   ├── services/         # Business logic
│   │   │   ├── models/           # Database models
│   │   │   └── middleware/       # Express middleware
│   │   └── prisma/               # Database schema
│   └── llm-server/               # AI/LLM gateway
│
├── packages/                      # Shared packages
│   ├── shared-types/             # TypeScript types
│   └── ui-components/            # Shared UI components
│
├── infrastructure/               # DevOps & IaC
│   ├── terraform/                # Infrastructure as Code
│   ├── prometheus/               # Monitoring config
│   └── grafana/                  # Dashboard config
│
├── documentation/                 # Project documentation
│   ├── api/                      # API documentation
│   ├── developer/                # Developer guides
│   └── user/                     # User documentation
│
└── config/                       # Configuration files
    ├── docker/                   # Docker configurations
    └── scripts/                  # Build/deploy scripts
```

## Core Components

### 1. Mobile Application (Flutter)

**Technology Stack:**
- Flutter 3.24+
- Riverpod (State Management)
- Freezed (Code Generation)
- Dio (HTTP Client)
- Hive (Local Storage)

**Architecture Pattern:** Clean Architecture with Feature-First organization

```
lib/
├── core/
│   ├── analytics/         # Firebase Analytics
│   ├── auth/              # Authentication logic
│   ├── config/            # App configuration
│   ├── errors/            # Error handling
│   ├── network/           # API client
│   ├── performance/       # Performance monitoring
│   ├── providers/         # Global providers
│   ├── security/          # Security utilities
│   ├── services/          # Core services
│   ├── sync/              # Offline sync
│   ├── theme/             # App theming
│   └── widgets/           # Reusable widgets
│
├── features/
│   ├── auth/              # Authentication feature
│   ├── habits/            # Habit tracking
│   ├── goals/             # Goal management
│   ├── wellness/          # Wellness data
│   ├── coaching/          # AI coaching
│   └── settings/          # User settings
│
└── shared/
    ├── models/            # Shared data models
    └── widgets/           # Shared UI components
```

### 2. API Service (Node.js/Express)

**Technology Stack:**
- Node.js 20+
- Express.js
- Prisma (ORM)
- PostgreSQL
- Redis (Caching)

**Key Features:**
- RESTful API design
- JWT authentication
- Rate limiting
- Request validation
- Error handling middleware

```
src/
├── routes/
│   ├── auth.ts            # Authentication routes
│   ├── users.ts           # User management
│   ├── habits.ts          # Habit CRUD
│   ├── goals.ts           # Goal management
│   ├── wellness.ts        # Wellness data
│   └── ai.ts              # AI features
│
├── services/
│   ├── AuthService.ts
│   ├── HabitService.ts
│   ├── GoalService.ts
│   ├── AIService.ts
│   └── IntegrationService.ts
│
├── models/
│   └── (Prisma models)
│
├── middleware/
│   ├── auth.ts            # JWT verification
│   ├── rateLimit.ts       # Rate limiting
│   ├── validation.ts      # Request validation
│   └── errorHandler.ts    # Error handling
│
└── utils/
    ├── logger.ts
    ├── cache.ts
    └── encryption.ts
```

### 3. Admin Panel (React)

**Technology Stack:**
- React 18+
- TypeScript
- TanStack Query
- Tailwind CSS
- Recharts

**Features:**
- User management
- Analytics dashboard
- Content management
- Subscription management

### 4. Infrastructure

**Cloud Services:**
- AWS (Primary cloud)
- Railway (API hosting)
- Vercel (Static hosting)
- CloudFront (CDN)

**Databases:**
- PostgreSQL 15 (Primary database)
- Redis 7 (Caching, sessions)

**Monitoring:**
- Prometheus (Metrics)
- Grafana (Dashboards)
- Sentry (Error tracking)
- CloudWatch (AWS monitoring)

## Data Flow

### Authentication Flow

```
┌────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│ Client │────▶│   API   │────▶│  Auth   │────▶│ Database │
└────────┘     └─────────┘     │ Service │     └──────────┘
     │              │          └─────────┘          │
     │              │               │               │
     │              ▼               ▼               │
     │         ┌─────────┐    ┌─────────┐          │
     │         │  Redis  │◀───│   JWT   │          │
     │         │ (Token) │    │ Service │          │
     │         └─────────┘    └─────────┘          │
     │              │                              │
     ◀──────────────┴──────────────────────────────┘
         Access Token + Refresh Token
```

### Habit Tracking Flow

```
┌────────┐     ┌─────────┐     ┌─────────┐
│ Client │────▶│   API   │────▶│ Habit   │
│ (Log)  │     └─────────┘     │ Service │
└────────┘          │          └─────────┘
                    │               │
                    ▼               ▼
              ┌─────────┐    ┌──────────┐
              │  Redis  │    │ Database │
              │ (Cache) │    │ (Store)  │
              └─────────┘    └──────────┘
                    │               │
                    └───────┬───────┘
                            ▼
                      ┌─────────┐
                      │   AI    │
                      │ Service │
                      └─────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Insights    │
                    │ & Suggestions │
                    └───────────────┘
```

### Offline Sync Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────┐ │
│  │   User   │───▶│  Operation   │───▶│   Pending Queue       │ │
│  │  Action  │    │   Manager    │    │   (Hive Storage)      │ │
│  └──────────┘    └──────────────┘    └───────────────────────┘ │
│                                               │                  │
│                         ┌─────────────────────┘                  │
│                         ▼                                        │
│              ┌───────────────────┐                               │
│              │   Sync Manager    │◀──── Network Status          │
│              └───────────────────┘                               │
│                         │                                        │
│                         │ (When Online)                          │
└─────────────────────────│───────────────────────────────────────┘
                          ▼
              ┌───────────────────┐
              │    Server API     │
              └───────────────────┘
                          │
                          ▼
              ┌───────────────────┐
              │  Conflict Check   │
              │  & Resolution     │
              └───────────────────┘
```

## Security Architecture

### Authentication & Authorization

1. **JWT Tokens**
   - Access tokens (15 min expiry)
   - Refresh tokens (7 days expiry)
   - Token rotation on refresh

2. **Password Security**
   - Argon2id hashing
   - Minimum 8 characters
   - Complexity requirements

3. **API Security**
   - Rate limiting (100 req/min default)
   - CORS configuration
   - Input validation (Zod)
   - SQL injection prevention (Prisma)

### Data Protection

1. **Encryption**
   - TLS 1.3 in transit
   - AES-256 at rest
   - Field-level encryption for sensitive data

2. **Mobile Security**
   - Secure storage (Keychain/Keystore)
   - Certificate pinning
   - Root/jailbreak detection
   - Biometric authentication

## Scalability Considerations

### Horizontal Scaling

- Stateless API design
- Redis for session management
- Database connection pooling
- CDN for static assets

### Performance Optimization

- Query optimization with indexes
- Response caching (Redis)
- Lazy loading in mobile app
- Image optimization and compression

### Database Scaling

- Read replicas for analytics
- Connection pooling
- Query optimization
- Partitioning for large tables

## Deployment Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌────────────┐
│  Code   │───▶│  Build  │───▶│  Test   │───▶│   Deploy   │
│  Push   │    │ & Lint  │    │ Suite   │    │ (Staging)  │
└─────────┘    └─────────┘    └─────────┘    └────────────┘
                                                   │
                                                   ▼
                                            ┌────────────┐
                                            │   Manual   │
                                            │  Approval  │
                                            └────────────┘
                                                   │
                                                   ▼
                                            ┌────────────┐
                                            │  Deploy    │
                                            │(Production)│
                                            └────────────┘
```

## Monitoring & Observability

### Metrics

- Request latency (p50, p95, p99)
- Error rates
- Active users
- API usage by endpoint
- Database query performance

### Logging

- Structured JSON logging
- Log levels: DEBUG, INFO, WARN, ERROR
- Correlation IDs for tracing
- Log aggregation (CloudWatch)

### Alerting

- High error rate (>1% 5xx)
- High latency (>2s p95)
- Low disk space (<10%)
- High CPU usage (>80%)
- Database connection issues

## Future Considerations

1. **GraphQL API** - For flexible data fetching
2. **WebSocket Support** - Real-time features
3. **ML Pipeline** - Custom model training
4. **Multi-tenancy** - Enterprise features
5. **Internationalization** - Multi-language support
