# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UpCoach is an AI-powered coaching platform with:
- **Mobile App**: Flutter app for iOS/Android coaching experience
- **Admin Panel**: React/Vite dashboard for platform management (port 1006)
- **Backend API**: Express/TypeScript API service (port 1080)
- **Landing Page**: Next.js marketing site (port 1005)
- **CMS Panel**: React/Vite content management (port 1007)

## Development Environment Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- Docker Desktop 4.20+
- Flutter 3.16+ with Dart 3.2+
- PostgreSQL 14+ (via Docker)
- Redis 7+ (via Docker)
- Git 2.30+

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd upcoach-project

# Copy environment variables
cp .env.example .env
cp .env.monitoring.example .env.monitoring

# Install dependencies
make install-all

# Start Docker services
open -a "Docker Desktop"  # macOS
make build
make up

# Apply database migrations
make db-migrate
make db-seed  # Optional: Load test data
```

### IDE Configuration
- **VS Code**: Install recommended extensions from `.vscode/extensions.json`
- **WebStorm/IntelliJ**: Import project settings from `.idea/`
- **Cursor**: Claude Code integration works out of the box

## Essential Commands

### Quick Development Start
```bash
make dev              # Start all services with hot-reload
make logs             # Monitor service logs in real-time
```

### Testing Commands
```bash
# Run tests before committing
make test             # All tests
make test-unit        # Unit tests only
make test-e2e         # E2E tests with Playwright
make test-flutter     # Flutter mobile app tests

# Backend specific
cd backend && npm test

# Admin panel specific
cd admin-panel && npm run test:unit
```

### Code Quality
```bash
make lint             # Run all linters
make format           # Auto-format all code

# TypeScript type checking
cd admin-panel && npm run type-check
cd backend && npm run build  # Will fail on type errors
```

### Database Operations
```bash
make db-migrate       # Apply pending migrations
make db-console       # Direct PostgreSQL access
make db-reset         # Full reset (destructive)
make db-backup        # Create backup
```

### Building & Deployment
```bash
make build            # Build all Docker containers
make up               # Start all services
make down             # Stop all services
make restart          # Restart all services
make clean            # Clean Docker volumes and cache
```

### Security & Monitoring
```bash
# Security scanning
make security-scan    # Run security audit
make dast-scan        # Dynamic application security testing
npm audit fix         # Fix npm vulnerabilities

# Monitoring
make monitor          # Start monitoring dashboard
make health-check     # Check all services health
make logs-tail        # Tail logs with filters
```

## Architecture & Key Patterns

### Backend API Structure
- **Controllers**: Request handling and validation in `backend/src/controllers/`
  - `TwoFactorAuthController.ts`: 2FA and WebAuthn management
- **Services**: Business logic in `backend/src/services/`
  - `TwoFactorAuthService.ts`: TOTP/SMS authentication
  - `WebAuthnService.ts`: Passkey authentication
  - `compliance/`: GDPR and data protection services
  - `monitoring/`: Application performance monitoring
- **Middleware**: Security and request processing
  - `securityHeaders.ts`: CSP, HSTS, XSS protection
- **Models**: Sequelize models in `backend/src/models/`
- **Database**: PostgreSQL with migrations in `backend/src/database/migrations/`

### Frontend Architecture
- **Admin Panel**: React with TypeScript, Material-UI components
- **State Management**: React hooks and context
- **API Integration**: Axios with interceptors in `src/services/api.ts`
- **Charts**: Recharts library for data visualization

### Mobile App Structure
- **Feature-based**: Organized by features in `lib/features/`
- **Services**: Core services in `lib/core/services/`
- **Models**: Freezed models in `lib/shared/models/`
- **State**: Riverpod for state management

### Database Schema Key Tables
- `users`: User accounts with roles (user/admin/coach)
- `subscriptions`: Stripe subscription tracking
- `transactions`: Financial transaction records
- `financial_snapshots`: Daily/monthly aggregated metrics
- `billing_events`: Comprehensive audit trail

### Authentication & Security
- Supabase for mobile and web authentication
- JWT tokens for API authentication
- Role-based access control (RBAC)
- Two-Factor Authentication (TOTP, SMS)
- WebAuthn/Passkeys support
- Security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting and DDoS protection
- Session management with Redis

## Development Workflow

### Feature Development
1. Create feature branch from `main`
2. Make changes with hot-reload active
3. Run relevant tests locally
4. Ensure linting passes
5. Create PR with descriptive title

### Common Development Tasks

#### Adding a New API Endpoint
1. Create controller method in `backend/src/controllers/`
2. Add service logic in `backend/src/services/`
3. Update routes in `backend/src/routes/`
4. Add validation middleware if needed
5. Write tests in `backend/src/tests/`

#### Modifying Database Schema
1. Create migration file: `backend/src/database/migrations/XXX_description.sql`
2. Update Sequelize models in `backend/src/models/`
3. Run `make db-migrate` to apply
4. Update TypeScript interfaces if needed

#### Adding Admin Panel Feature
1. Create component in `admin-panel/src/components/`
2. Add page in `admin-panel/src/pages/`
3. Update routing in `admin-panel/src/App.tsx`
4. Add API service methods in `admin-panel/src/services/`
5. Write tests in `admin-panel/src/tests/`

#### Mobile App Development
1. Create feature module in `mobile-app/lib/features/`
2. Add models with Freezed in `mobile-app/lib/shared/models/`
3. Implement services in `mobile-app/lib/core/services/`
4. Update router in `mobile-app/lib/core/router/app_router.dart`
5. Run `flutter pub run build_runner build` for code generation

## Critical Paths & Dependencies

### Service Dependencies
- Backend depends on PostgreSQL and Redis
- Admin Panel depends on Backend API
- Mobile App uses Supabase directly + Backend API
- All services use environment variables from `.env`

### Build Order
1. Database (PostgreSQL) must be running first
2. Backend API needs database migrations applied
3. Frontend apps can start after Backend is healthy

### Environment Variables
Critical variables that must be set:
- `DATABASE_URL`: PostgreSQL connection
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Authentication
- `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`: Payments
- `OPENAI_API_KEY`: AI coaching features

## Security & Compliance

### Security Features
- **Two-Factor Authentication**: TOTP and SMS-based 2FA
- **WebAuthn**: Passwordless authentication with biometrics
- **Security Headers**: Comprehensive CSP and HSTS policies
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Sanitization and XSS prevention
- **Encryption**: TLS 1.3 for transport, AES-256 for storage

### Compliance
- **GDPR**: Data protection and privacy controls
- **CCPA**: California privacy compliance
- **SOC 2**: Security controls and audit trails
- **PCI DSS**: Payment card data protection (via Stripe)

### Security Testing
- **SAST**: Static application security testing in CI
- **DAST**: Dynamic security testing with OWASP ZAP
- **Dependency Scanning**: Automated vulnerability checks
- **Penetration Testing**: Quarterly security audits

For detailed security implementation, see:
- `/docs/SECURITY_TESTING.md`
- `/docs/TWO_FACTOR_AUTH.md`
- `/docs/MONITORING_SECURITY.md`

## CI/CD & Deployment

### GitHub Actions Workflows

#### Core Pipelines
- **`ci.yml`**: Main CI pipeline for all services
- **`backend-tests.yml`**: Backend unit and integration tests
- **`visual-tests.yml`**: Playwright visual regression testing
- **`security.yml`**: Security scanning and compliance checks
- **`dast.yml`**: Dynamic application security testing
- **`production-deploy.yml`**: Production deployment pipeline

#### Deployment Process
```bash
# Development
git push origin feature/branch  # Triggers CI checks

# Staging
git push origin main           # Auto-deploys to staging

# Production
git tag v1.2.3                 # Create release tag
git push origin v1.2.3         # Triggers production deploy
```

### Rollback Procedures
```bash
# Immediate rollback
make rollback VERSION=v1.2.2

# Database rollback
make db-rollback MIGRATION=20240101_feature

# Feature flag disable
make feature-toggle FEATURE=new-ui ENABLED=false
```

## Monitoring & Observability

### Application Monitoring
- **Health Checks**: `/api/health` endpoints for all services
- **Metrics Collection**: Prometheus metrics at `/metrics`
- **Error Tracking**: Sentry integration for error reporting
- **Performance Monitoring**: APM with distributed tracing
- **Log Aggregation**: Centralized logging with structured logs

### Dashboards & Alerts
- **Grafana Dashboards**: Real-time metrics visualization
- **Alert Rules**: PagerDuty integration for critical issues
- **SLA Monitoring**: 99.9% uptime tracking
- **Cost Monitoring**: Cloud spend and resource usage

### Monitoring Commands
```bash
# View real-time metrics
make metrics-dashboard

# Check service health
curl http://localhost:8080/api/health

# View error reports
make sentry-dashboard

# Generate performance report
make performance-report
```

For monitoring setup, see `/docs/MONITORING_SECURITY.md`

## Testing Strategy

### Unit Tests
- Backend: Jest with Supertest for API testing
- Admin Panel: Vitest for React components
- Mobile: Flutter test framework

### E2E Tests
- Playwright for all web interfaces
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile viewport testing included

### Test Data
- Use `make db-seed` for consistent test data
- Test users: admin@upcoach.ai, coach@upcoach.ai, user@upcoach.ai
- All test users password: `testpass123`

### Security Testing
- **SAST**: CodeQL analysis on every PR
- **DAST**: OWASP ZAP scanning in staging
- **Dependency Audit**: Daily vulnerability checks
- **Penetration Testing**: Quarterly assessments

### Performance Testing
- **Load Testing**: k6 scripts for API endpoints
- **Stress Testing**: Identify breaking points
- **Browser Performance**: Lighthouse CI integration
- **Mobile Performance**: Flutter performance profiling

## Current Implementation Status

### Completed (Stage 3)
- Financial dashboard with real-time metrics
- Stripe payment integration
- Automated reporting system
- Cost tracking and analytics
- Alert and notification system

### In Progress
- Mobile app feature enhancements
- Advanced AI coaching capabilities
- Performance optimization

## Common Issues & Solutions

### Docker Services Not Starting
```bash
make down
make build
make up
```

### Database Connection Issues
- Check `.env` has correct `DATABASE_URL`
- Ensure PostgreSQL container is healthy: `docker ps`
- Try `make db-reset` for clean slate

### TypeScript Errors
- Admin Panel: `cd admin-panel && npm run type-check`
- Backend: `cd backend && npm run build`
- Fix type errors before committing

### Flutter Build Issues
```bash
cd mobile-app
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

## Performance Considerations

### Database
- Indexes on foreign keys and frequently queried columns
- Use database views for complex aggregations
- Connection pooling configured in Sequelize

### Frontend
- Lazy loading for route components
- Memoization for expensive calculations
- Debounced API calls for search/filter operations

### API
- Response caching with Redis
- Pagination for list endpoints
- Rate limiting on public endpoints

## Visual Development & Testing

### Design System

The project follows S-Tier SaaS design standards inspired by Stripe, Airbnb, and Linear. All UI development must adhere to:

- **Design Principles**: `/context/design-principles.md` - Comprehensive checklist for world-class UI
- **Component Library**: NextUI with custom Tailwind configuration

### Quick Visual Check

**IMMEDIATELY after implementing any front-end change:**

1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages` ⚠️

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review

For significant UI changes or before merging PRs, use the design review agent:

```bash
# Option 1: Use the slash command
/design-review

# Option 2: Invoke the agent directly
@agent-design-review
```

The design review agent will:

- Test all interactive states and user flows
- Verify responsiveness (desktop/tablet/mobile)
- Check accessibility (WCAG 2.1 AA compliance)
- Validate visual polish and consistency
- Test edge cases and error states
- Provide categorized feedback (Blockers/High/Medium/Nitpicks)

### Playwright MCP Integration

#### Essential Commands for UI Testing

```javascript
// Navigation & Screenshots
mcp__playwright__browser_navigate(url); // Navigate to page
mcp__playwright__browser_take_screenshot(); // Capture visual evidence
mcp__playwright__browser_resize(
  width,
  height
); // Test responsiveness

// Interaction Testing
mcp__playwright__browser_click(element); // Test clicks
mcp__playwright__browser_type(
  element,
  text
); // Test input
mcp__playwright__browser_hover(element); // Test hover states

// Validation
mcp__playwright__browser_console_messages(); // Check for errors
mcp__playwright__browser_snapshot(); // Accessibility check
mcp__playwright__browser_wait_for(
  text / element
); // Ensure loading
```

### Design Compliance Checklist

When implementing UI features, verify:

- [ ] **Visual Hierarchy**: Clear focus flow, appropriate spacing
- [ ] **Consistency**: Uses design tokens, follows patterns
- [ ] **Responsiveness**: Works on mobile (375px), tablet (768px), desktop (1440px)
- [ ] **Accessibility**: Keyboard navigable, proper contrast, semantic HTML
- [ ] **Performance**: Fast load times, smooth animations (150-300ms)
- [ ] **Error Handling**: Clear error states, helpful messages
- [ ] **Polish**: Micro-interactions, loading states, empty states

## When to Use Automated Visual Testing

### Use Quick Visual Check for:

- Every front-end change, no matter how small
- After implementing new components or features
- When modifying existing UI elements
- After fixing visual bugs
- Before committing UI changes

### Use Comprehensive Design Review for:

- Major feature implementations
- Before creating pull requests with UI changes
- When refactoring component architecture
- After significant design system updates
- When accessibility compliance is critical

### Skip Visual Testing for:

- Backend-only changes (API, database)
- Configuration file updates
- Documentation changes
- Test file modifications
- Non-visual utility functions

## Claude Code Agents

### Available Specialized Agents

Claude Code provides specialized agents to help with specific development tasks. Use these agents proactively when their expertise matches your task:

#### Code Quality & Review
- **`code-reviewer`**: Automated code review after writing code
  ```bash
  # Automatically triggered after significant code changes
  # Reviews for best practices, performance, security
  ```

- **`code-review-expert`**: Deep code analysis and feedback
  ```bash
  # Use for comprehensive code review before commits
  # Provides actionable improvement suggestions
  ```

- **`code-auditor-adversarial`**: Rigorous pre-merge validation
  ```bash
  # Use before merging to main branch
  # Can block merges for critical issues
  ```

#### Testing & QA
- **`qa-test-automation-lead`**: Comprehensive test planning
  ```bash
  # Use after feature implementation
  # Creates test plans across Flutter, React Native, PWA
  ```

- **`test-lead`**: Coordinates all testing efforts
  ```bash
  # Use before releases or after major changes
  # Orchestrates feedback from all review agents
  ```

#### TypeScript & Development
- **`typescript-error-fixer`**: Systematic TS error resolution
  ```bash
  # Use when TypeScript build fails
  # Iteratively fixes errors until 95% resolved
  ```

- **`codebase-simplifier`**: Reduces code complexity
  ```bash
  # Use to identify over-engineering
  # Suggests consolidation opportunities
  ```

#### Security & Compliance
- **`security-audit-expert`**: Security vulnerability analysis
  ```bash
  # Use after implementing auth features
  # Reviews for OWASP Top 10 vulnerabilities
  ```

- **`legal-privacy-counsel`**: Legal documentation
  ```bash
  # Use for ToS, DPA, privacy policies
  # Ensures GDPR/CCPA compliance
  ```

#### UI/UX & Design
- **`design-review`**: Comprehensive design review
  ```bash
  # Use command: /design-review
  # Tests responsiveness, accessibility, visual consistency
  ```

- **`ux-accessibility-auditor`**: WCAG compliance checking
  ```bash
  # Use for accessibility audits
  # Provides Figma annotations and fixes
  ```

#### Documentation
- **`docs-dx-engineer`**: Technical documentation
  ```bash
  # Use after API changes
  # Updates OpenAPI specs, ADRs, onboarding docs
  ```

### Agent Usage Examples

```bash
# After implementing a new feature
@code-reviewer          # Quick review
@qa-test-automation-lead # Test plan creation

# Before merging to main
@code-auditor-adversarial # Final validation
@security-audit-expert    # Security check

# For UI changes
/design-review          # Full design audit
@ux-accessibility-auditor # Accessibility check

# When fixing issues
@typescript-error-fixer  # Fix TS errors
@codebase-simplifier    # Reduce complexity
```

### Agent Integration Tips

1. **Proactive Usage**: Agents are triggered automatically for relevant tasks
2. **Parallel Execution**: Multiple agents can run concurrently
3. **Context Aware**: Agents understand project structure and standards
4. **Actionable Feedback**: Focus on specific, fixable issues

## Code Review Standards

### PR Requirements
1. All tests must pass
2. TypeScript build must succeed
3. Security scan must pass
4. Code coverage > 80%
5. No critical vulnerabilities
6. Design review for UI changes

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests cover new functionality
- [ ] Documentation updated
- [ ] Security best practices followed
- [ ] Performance impact assessed
- [ ] Accessibility requirements met
- [ ] Error handling implemented
- [ ] Logging added for debugging

## Release Process

### Version Management
- Semantic versioning (MAJOR.MINOR.PATCH)
- Changelog maintenance in CHANGELOG.md
- Git tags for all releases
- Release notes in GitHub Releases

### Release Checklist
1. [ ] All tests passing
2. [ ] Security scan completed
3. [ ] Performance benchmarks met
4. [ ] Documentation updated
5. [ ] Database migrations tested
6. [ ] Rollback plan documented
7. [ ] Monitoring alerts configured
8. [ ] Feature flags configured

### Deployment Stages
```bash
# 1. Development
make test-all           # Run all tests
make security-scan      # Security checks

# 2. Staging
git push origin main    # Auto-deploy to staging
make smoke-test         # Verify deployment

# 3. Production
make release VERSION=1.2.3  # Create release
make deploy-prod            # Deploy to production
make verify-prod            # Post-deployment checks
```

## Recent Updates (December 2024)

### 🔧 **Latest Production-Ready Implementations**

**All Critical Systems Completed:**
✅ **Security Testing Pipeline** - Comprehensive SAST, DAST, container, and mobile security scans
✅ **CI/CD Pipeline** - Full continuous integration for all services with enhanced error handling
✅ **API Service** - Production-ready with robust type definitions, configuration, and validation
✅ **Frontend Applications** - Admin Panel, CMS, and Landing Page with optimized builds
✅ **Mobile App** - Flutter app with comprehensive testing and security validation
✅ **Production Deployment** - Quality gates, validation, and automated deployment pipeline

**Key Features Implemented:**
- **Advanced Security**: OWASP ZAP scanning, CodeQL analysis, container security, dependency auditing
- **Comprehensive Testing**: Unit, integration, E2E, visual regression, and performance testing
- **Production Configuration**: Environment validation, secrets management, and monitoring integration
- **Type Safety**: Complete TypeScript definitions with strict mode enabled for production builds
- **Error Handling**: Graceful failures and comprehensive logging throughout all services

### 🛡️ **Security & Compliance**

**Enhanced Security Implementation:**
- **Secret Management**: Advanced encryption and rotation system in `services/api/src/config/secrets.ts`
- **Environment Validation**: Comprehensive schema validation with production-grade requirements
- **API Security**: Complete validation schemas for all endpoints with input sanitization
- **Container Security**: Multi-layer security scanning with Trivy and Docker Scout integration
- **Mobile Security**: Flutter security testing with APK analysis and secret scanning

**Compliance Standards Met:**
- SOC 2 Type II controls implemented
- GDPR data protection and privacy controls
- CCPA compliance with data export capabilities
- PCI DSS compliance through Stripe integration
- OWASP Top 10 vulnerability protections

### 📊 **Performance Optimizations**

**Build Performance:**
- TypeScript incremental compilation with optimized `tsconfig.json`
- Turbo monorepo build caching and parallelization
- Webpack bundle optimization for frontend applications
- Docker multi-stage builds for optimized container images

**Runtime Performance:**
- API response caching with Redis
- Database query optimization with proper indexing
- CDN integration for static asset delivery
- Real-time monitoring with Datadog and Sentry integration

### 🚀 **CI/CD Pipeline Status**

**All Pipelines Operational:**
- ✅ **Main CI Pipeline**: Tests all services (Mobile, Admin Panel, CMS, Landing Page, API)
- ✅ **Security Testing**: Comprehensive security validation across all components
- ✅ **Production Deployment**: Quality gates with automated validation
- ✅ **Comprehensive Testing**: End-to-end testing with Playwright across multiple browsers
- ✅ **Performance Testing**: Load testing and performance benchmarking

**Quality Gates Implemented:**
- Type checking with strict TypeScript configuration
- Security auditing with multiple scan types
- Code quality validation with ESLint and Prettier
- Test coverage requirements (>80% for critical components)
- Performance benchmarks for response times

## Additional Context

### Documentation
- Design review agent configuration: `/.claude/agents/design-review-agent.md`
- Design principles checklist: `/context/design-principles.md`
- Security documentation: `/docs/SECURITY_TESTING.md`
- Two-factor auth guide: `/docs/TWO_FACTOR_AUTH.md`
- Monitoring setup: `/docs/MONITORING_SECURITY.md`

### Configuration Files
- Claude Code settings: `/.claude/settings.local.json`
- GitHub Actions: `/.github/workflows/`
- Security policies: `/.github/codeql/`
- OWASP ZAP config: `/.zap/`
- API Configuration: `services/api/src/config/`
- Type Definitions: `services/api/src/types/globals.d.ts`