# UpCoach Platform Architecture

**Version:** 1.0.0
**Last Updated:** 2025-10-28

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Architecture](#data-architecture)
6. [Security Architecture](#security-architecture)
7. [API Design](#api-design)
8. [Authentication & Authorization](#authentication--authorization)
9. [Real-Time Communication](#real-time-communication)
10. [AI/ML Architecture](#aiml-architecture)
11. [Deployment Architecture](#deployment-architecture)
12. [Scalability & Performance](#scalability--performance)
13. [Monitoring & Observability](#monitoring--observability)

---

## System Overview

UpCoach is a full-stack coaching platform built as a **monorepo** with multiple applications sharing common packages and infrastructure.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Web Apps (React)          │          Mobile App (Flutter)      │
│  - Admin Panel             │          - iOS / Android           │
│  - CMS Panel               │          - Progressive Web App     │
│  - Landing Page            │                                    │
└──────────────┬─────────────┴───────────────┬───────────────────┘
               │                             │
               │        API Gateway (Nginx)  │
               │              ↓              │
               └──────────────┬──────────────┘
                              │
┌─────────────────────────────┴─────────────────────────────────┐
│                     APPLICATION LAYER                          │
├───────────────────────────────────────────────────────────────┤
│              Express.js Backend (TypeScript)                   │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  Controllers  │  Services  │  Middleware  │  Routes  │     │
│  └──────────────────────────────────────────────────────┘     │
└──────────────┬─────────────┬───────────────┬──────────────────┘
               │             │               │
       ┌───────┴────┐  ┌────┴─────┐  ┌─────┴──────┐
       │ PostgreSQL │  │  Redis   │  │  External  │
       │  Database  │  │  Cache   │  │  Services  │
       └────────────┘  └──────────┘  └────────────┘
                                         │
                        ┌────────────────┼──────────────┐
                        │                │              │
                    OpenAI          Stripe         Sentry
                    Claude         Payments      Monitoring
```

### Component Interaction Flow

```
User Request → Nginx → API Server → Authentication → Authorization →
    → Business Logic → Database/Cache → Response → User
```

---

## Architecture Principles

### 1. Separation of Concerns
- Clear boundaries between layers
- Single Responsibility Principle
- Domain-driven design patterns

### 2. Scalability
- Horizontal scaling capability
- Stateless API design
- Caching strategies
- Database optimization

### 3. Security First
- Defense in depth
- Input validation at all layers
- Secure by default
- Regular security audits

### 4. Maintainability
- Clean code principles
- Comprehensive documentation
- Automated testing
- Continuous integration

### 5. Performance
- Response time < 200ms for 95th percentile
- Efficient database queries
- CDN for static assets
- Lazy loading and code splitting

---

## Technology Stack

### Backend Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 20+ | JavaScript runtime |
| Framework | Express.js | Web framework |
| Language | TypeScript 5.3 | Type-safe JavaScript |
| Database | PostgreSQL 14+ | Primary data store |
| ORM | Sequelize 6+ | Database abstraction |
| Cache | Redis 7+ | Session & data caching |
| Queue | Redis (partial) | Background jobs |
| Real-time | Socket.io, SSE | WebSocket & events |

### Frontend Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React 18 | UI framework |
| Language | TypeScript 5.3 | Type safety |
| Build Tool | Vite | Fast builds |
| State | React Context, Zustand | State management |
| Forms | React Hook Form | Form handling |
| Validation | Zod | Schema validation |
| Testing | Vitest, Playwright | Unit & E2E tests |

### Mobile Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Flutter 3.7+ | Cross-platform |
| Language | Dart 2.19+ | Type-safe language |
| State | Riverpod | State management |
| Navigation | go_router | Routing |
| Storage | Hive, SQLite | Local storage |
| Networking | Dio | HTTP client |
| Real-time | Socket.io | WebSocket |

### DevOps Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Containers | Docker | Containerization |
| Orchestration | Kubernetes | Container orchestration |
| CI/CD | GitHub Actions | Automation |
| Monitoring | Sentry, DataDog | Error tracking & APM |
| Logging | Winston | Structured logging |
| CDN | Configured | Asset delivery |

---

## System Components

### 1. API Server (`services/api`)

**Responsibilities:**
- RESTful API endpoints
- Business logic execution
- Authentication & authorization
- Real-time communication
- Background job processing
- Integration with external services

**Key Modules:**
- **Controllers:** Request handling and response formatting
- **Services:** Business logic implementation
- **Middleware:** Request/response processing pipeline
- **Models:** Database entity definitions
- **Routes:** API endpoint definitions
- **Utils:** Helper functions and utilities

### 2. Admin Panel (`apps/admin-panel`)

**Responsibilities:**
- User management
- Financial dashboards
- Analytics & reporting
- System configuration
- Content moderation
- Subscription management

**Features:**
- User role management
- Revenue tracking
- Transaction monitoring
- System health monitoring
- Audit log viewing

### 3. CMS Panel (`apps/cms-panel`)

**Responsibilities:**
- Content creation & editing
- Course management
- Media library
- Category management
- Content analytics

**Features:**
- Rich text editor
- Media upload & management
- Content scheduling
- SEO optimization
- Version control (partial)

### 4. Landing Page (`apps/landing-page`)

**Responsibilities:**
- Marketing website
- Lead generation
- SEO optimization
- Contact forms
- A/B testing (partial)

**Features:**
- Static site generation
- Form submissions
- Analytics integration
- Rate limiting

### 5. Mobile App (`mobile-app`)

**Responsibilities:**
- User habit tracking
- Goal management
- AI coaching interface
- Chat & community
- Voice journal
- Progress tracking

**Features:**
- Offline support
- Push notifications
- Biometric authentication
- Real-time sync
- Background audio recording

---

## Data Architecture

### Database Schema Overview

#### Core Entities

**Users & Authentication:**
- `users` - User accounts
- `user_profiles` - Extended user information
- `user_sessions` - Active sessions
- `refresh_tokens` - JWT refresh tokens
- `user_devices` - Registered devices
- `two_factor_secrets` - 2FA configuration

**Coaching & Habits:**
- `habits` - User habits
- `habit_logs` - Habit completion records
- `goals` - User goals
- `goal_milestones` - Goal progress markers
- `tasks` - User tasks
- `mood_logs` - Mood tracking data

**Content:**
- `content` - Articles, posts, courses
- `content_categories` - Content categorization
- `content_tags` - Content tagging
- `content_versions` - Version history
- `media` - Media files
- `courses` - Structured courses
- `course_modules` - Course sections

**Community:**
- `forum_threads` - Discussion threads
- `forum_posts` - Thread replies
- `comments` - Content comments
- `community_groups` - User groups
- `group_memberships` - Group participation

**AI & Analytics:**
- `ai_conversations` - Chat history
- `ai_insights` - Generated insights
- `user_analytics` - User activity metrics
- `content_analytics` - Content performance
- `event_logs` - System events

**Financial:**
- `subscriptions` - User subscriptions
- `transactions` - Payment records
- `invoices` - Invoice history
- `payment_methods` - Stored payment info
- `refunds` - Refund records

**Enterprise:**
- `organizations` - Business accounts
- `organization_members` - Team members
- `teams` - Organization teams
- `sso_providers` - SSO configuration

### Data Relationships

```
users (1) ──→ (*) habits
users (1) ──→ (*) goals
users (1) ──→ (*) subscriptions
users (1) ──→ (*) user_analytics
users (1) ──→ (*) ai_conversations
users (1) ──→ (*) forum_threads
organizations (1) ──→ (*) organization_members
content (1) ──→ (*) content_versions
```

### Caching Strategy

**Redis Cache Layers:**

1. **Session Cache** (TTL: 7 days)
   - User sessions
   - JWT tokens
   - Active connections

2. **Data Cache** (TTL: varies)
   - User profiles (1 hour)
   - Content (5 minutes)
   - Analytics (10 minutes)
   - API responses (1 minute)

3. **Rate Limiting** (TTL: 1 hour)
   - IP-based limits
   - User-based limits
   - Endpoint-based limits

**Cache Invalidation:**
- Write-through for critical data
- TTL-based expiration
- Manual invalidation on updates
- Pub/sub for distributed invalidation

---

## Security Architecture

### Defense in Depth

```
Layer 1: Network Security (SSL/TLS, Firewall)
    ↓
Layer 2: API Gateway (Rate Limiting, DDoS Protection)
    ↓
Layer 3: Authentication (JWT, OAuth2, 2FA)
    ↓
Layer 4: Authorization (RBAC, Permissions)
    ↓
Layer 5: Input Validation (Zod Schemas)
    ↓
Layer 6: Business Logic (SQL Injection Prevention)
    ↓
Layer 7: Data Layer (Encryption at Rest)
```

### Security Measures

#### 1. Authentication
- JWT with RS256/HS256 signing
- Refresh token rotation
- Token blacklisting
- Session management
- OAuth2 providers (Google, Apple, Facebook)
- Two-factor authentication (TOTP)
- WebAuthn/FIDO2 support

#### 2. Authorization
- Role-Based Access Control (RBAC)
- Permission-based access
- Resource ownership validation
- Organization-level isolation

#### 3. Input Validation
- Zod schema validation
- SQL injection protection
- XSS prevention
- CSRF tokens
- File upload validation
- Rate limiting

#### 4. Data Protection
- Passwords: bcrypt (14 rounds)
- Sensitive data: AES-256 encryption
- TLS 1.3 for transport
- Secure cookie handling
- HSTS headers

#### 5. Audit & Monitoring
- Comprehensive audit trails
- Security event logging
- Anomaly detection
- Sentry error tracking
- DataDog security monitoring

### Compliance

- **GDPR:** Data export, right to be forgotten, consent management
- **HIPAA:** PHI encryption, access logging, audit trails
- **SOC2:** Security controls, monitoring, incident response

---

## API Design

### RESTful Principles

**Resource-Based URLs:**
```
GET    /api/v1/users              # List users
POST   /api/v1/users              # Create user
GET    /api/v1/users/:id          # Get user
PUT    /api/v1/users/:id          # Update user
DELETE /api/v1/users/:id          # Delete user
```

**HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Response Format:**

Success:
```json
{
  "success": true,
  "data": { /* resource */ },
  "message": "Operation successful"
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [ /* validation errors */ ]
  }
}
```

### API Versioning

- URL-based versioning: `/api/v1/`, `/api/v2/`
- Backward compatibility maintained
- Deprecation warnings in headers

### Rate Limiting

**Limits by Endpoint Type:**
- Authentication: 5 requests/15 minutes
- Standard API: 100 requests/15 minutes
- Search: 20 requests/minute
- Upload: 10 requests/hour

**Implementation:**
- Redis-based storage
- IP + User ID tracking
- Progressive backoff
- `X-RateLimit-*` headers

---

## Authentication & Authorization

### JWT Authentication Flow

```
1. User Login
   ↓
2. Validate Credentials
   ↓
3. Generate Access Token (15 min) + Refresh Token (7 days)
   ↓
4. Store Refresh Token (Redis + DB)
   ↓
5. Return Tokens to Client
   ↓
6. Client Includes Access Token in Requests
   ↓
7. Token Expires → Use Refresh Token
   ↓
8. Generate New Access Token
```

### Token Structure

**Access Token:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "user",
  "permissions": ["read:own", "write:own"],
  "iat": 1234567890,
  "exp": 1234568790
}
```

### OAuth2 Providers

**Supported Providers:**
- Google OAuth2
- Apple Sign In
- Facebook Login

**Flow:**
```
Client → Provider Authorization → Callback → Exchange Code
   → Get User Info → Create/Update User → Generate JWT
```

### Role-Based Access Control

**Roles:**
- `user` - Standard user
- `coach` - Coach with extended permissions
- `admin` - Full system access
- `organization_admin` - Organization management

**Permission Model:**
```typescript
{
  users: {
    read: ['admin', 'coach'],
    write: ['admin'],
    delete: ['admin']
  },
  content: {
    read: ['user', 'coach', 'admin'],
    write: ['coach', 'admin'],
    publish: ['admin']
  }
}
```

---

## Real-Time Communication

### WebSocket Architecture

**Implementation:** Socket.io

**Connection Flow:**
```
Client → Connect → Authenticate → Join Rooms → Listen/Emit Events
```

**Event Types:**
- `chat:message` - Chat messages
- `notification:new` - New notifications
- `habit:updated` - Habit status changes
- `presence:status` - User online status

**Rooms:**
- User-specific: `user:{userId}`
- Organization: `org:{orgId}`
- Chat: `chat:{chatId}`
- Global: `system:broadcasts`

### Server-Sent Events (SSE)

**Use Cases:**
- Real-time notifications
- Progress updates
- System announcements

**Endpoint:**
```
GET /api/v1/sse/notifications
Accept: text/event-stream
```

---

## AI/ML Architecture

### AI Service Layer

```
┌──────────────────────────────────────┐
│      AI Service Abstraction Layer    │
├──────────────────────────────────────┤
│  - Prompt Engineering                │
│  - Context Management                │
│  - Response Processing               │
│  - Circuit Breaker                   │
│  - Retry Logic                       │
└────────┬─────────────────────────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    │         │         │          │
  OpenAI   Anthropic  HuggingFace Local
  GPT-4    Claude     Transformers LLM
```

### ML Components

**1. Recommendation Engine**
- Collaborative filtering
- Content-based filtering
- Hybrid approach

**2. Predictive Analytics**
- User behavior prediction
- Goal completion forecasting
- Churn prediction

**3. Personalization Engine**
- User profiling
- Dynamic content adjustment
- Adaptive learning paths

**4. Conversational AI**
- Multi-turn conversations
- Context management
- Intent recognition
- Entity extraction

**5. Voice AI**
- Speech-to-text (Whisper API)
- Emotion detection
- Voice analysis

### AI Data Flow

```
User Input → Preprocessing → Context Retrieval →
   → Prompt Engineering → LLM API Call →
   → Response Processing → Store Context → Return Response
```

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────┐
│        Developer Machine            │
├─────────────────────────────────────┤
│  Docker Compose:                    │
│  - PostgreSQL                       │
│  - Redis                            │
│  - API Server (Node.js)             │
│  - Frontend Dev Servers (Vite)      │
└─────────────────────────────────────┘
```

### Production Environment

```
┌───────────────────────────────────────────┐
│            Load Balancer (Nginx)          │
└─────────────┬─────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐         ┌────▼───┐
│ API    │         │ API    │
│ Server │         │ Server │
│   1    │         │   2    │
└────┬───┘         └────┬───┘
     │                  │
     └──────┬───────────┘
            │
    ┌───────┴────────┐
    │                │
┌───▼────────┐  ┌───▼──────┐
│ PostgreSQL │  │  Redis   │
│  Primary   │  │  Cluster │
└────────────┘  └──────────┘
```

### Container Architecture

**Docker Compose Services:**
- `postgres` - PostgreSQL database
- `redis` - Redis cache
- `api` - Backend API server
- `admin-panel` - Admin web app
- `cms-panel` - CMS web app
- `landing-page` - Marketing site
- `nginx` - Reverse proxy

---

## Scalability & Performance

### Horizontal Scaling

**Stateless API Servers:**
- No local state
- Session in Redis
- File uploads to S3/CDN
- WebSocket sticky sessions

**Database Scaling:**
- Read replicas
- Connection pooling
- Query optimization
- Indexing strategy

**Cache Scaling:**
- Redis cluster
- Cache-aside pattern
- Write-through caching
- TTL-based expiration

### Performance Optimizations

**Backend:**
- Database query optimization
- Connection pooling (max 20 connections)
- Response compression
- API response caching
- Batch operations

**Frontend:**
- Code splitting
- Lazy loading
- Image optimization
- CDN for static assets
- Service Worker caching

**Mobile:**
- Local database caching
- Image compression
- Lazy loading
- Background sync

### Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 200ms |
| Database Query Time (p95) | < 50ms |
| Page Load Time (p95) | < 2s |
| Mobile App Launch | < 3s |
| WebSocket Latency | < 100ms |

---

## Monitoring & Observability

### Monitoring Stack

**Error Tracking:** Sentry
- JavaScript/TypeScript errors
- Backend exceptions
- Performance monitoring
- Release tracking

**APM:** DataDog
- Request tracing
- Performance metrics
- Database query profiling
- Custom metrics

**Logging:** Winston
- Structured JSON logs
- Log levels (error, warn, info, debug)
- Correlation IDs
- Log aggregation

### Key Metrics

**Application Metrics:**
- Request rate
- Error rate
- Response time
- Throughput

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Disk I/O
- Network I/O

**Business Metrics:**
- User registrations
- Active users
- Subscription conversions
- Revenue

### Alerting

**Alert Channels:**
- Email
- Slack
- PagerDuty (production)

**Alert Conditions:**
- Error rate > 1%
- Response time > 500ms (p95)
- Database connections > 80%
- Redis memory > 90%
- Disk usage > 85%

---

## Future Architecture Considerations

### Planned Enhancements

1. **Microservices Transition**
   - Split monolith into domain services
   - Service mesh (Istio)
   - Event-driven architecture

2. **Advanced ML Pipeline**
   - Model training automation
   - A/B testing framework
   - Feature store
   - Model versioning

3. **Global CDN**
   - Multi-region deployment
   - Edge computing
   - Geo-routing

4. **Advanced Analytics**
   - Data warehouse (BigQuery/Snowflake)
   - Real-time analytics pipeline
   - Business intelligence dashboards

5. **Message Queue**
   - RabbitMQ/Kafka integration
   - Background job processing
   - Event sourcing

---

## Appendix

### Architecture Decision Records (ADRs)

For detailed decision rationale, see:
- [ADR-001: Monorepo Structure](adr/001-monorepo.md) (coming soon)
- [ADR-002: Database Choice](adr/002-database.md) (coming soon)
- [ADR-003: State Management](adr/003-state-management.md) (coming soon)

### Related Documentation

- [Sprint Progress Tracking](../planning/SPRINT_PROGRESS_TRACKING.md)
- [Coding Standards](../../SPRINT_CODING_STANDARDS.md)
- [Security Policy](../../SECURITY.md)
- [API Reference](../api/) (coming soon)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-28
**Maintained By:** UpCoach Engineering Team
