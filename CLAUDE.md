# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UpCoach is an AI-powered coaching platform with:
- **Mobile App**: Flutter app for iOS/Android coaching experience
- **Admin Panel**: React/Vite dashboard for platform management (port 8006)
- **Backend API**: Express/TypeScript API service (port 8080)
- **Landing Page**: Next.js marketing site (port 8005)
- **CMS Panel**: React/Vite content management (port 8007)

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
```

## Architecture & Key Patterns

### Backend API Structure
- **Controllers**: Request handling and validation in `backend/src/controllers/`
- **Services**: Business logic in `backend/src/services/`
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

### Authentication
- Supabase for mobile and web authentication
- JWT tokens for API authentication
- Role-based access control (RBAC)

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