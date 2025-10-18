# UpCoach - AI-Powered Coaching Platform

## 🚀 Overview

UpCoach is a comprehensive AI-powered coaching platform that provides personalized professional development through an intelligent mobile app, web interfaces, and administrative tools. The platform leverages advanced AI to deliver contextual coaching, task management, mood tracking, and progress reporting.

## 🏗️ Architecture

The project follows a microservices architecture with the following components:

- **Mobile App**: Flutter-based native application (iOS/Android)
- **Landing Page**: Next.js marketing website
- **Admin Panel**: React admin dashboard for platform management
- **CMS Panel**: Content management system for coaches and content creators
- **Backend Services**: Supabase + custom API endpoints
- **AI Services**: OpenAI GPT integration for coaching intelligence

## 📁 Project Structure

```
upcoach-project/
├── mobile-app/          # Flutter mobile application
├── landing-page/        # Next.js marketing website
├── admin-panel/         # React admin dashboard
├── cms-panel/           # React CMS interface
├── backend/             # Backend services and APIs
├── tests/              # E2E and integration tests
├── docker/             # Docker configurations
├── docs/               # Documentation and checklists
└── .github/            # CI/CD workflows
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (v4.0+)
- Node.js (v18+)
- Flutter SDK (v3.16+)
- Git

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/upcoach.git
   cd upcoach-project
   ```

2. **Setup environment**
   ```bash
   make setup
   ```
   This will copy `env.example` to `.env`. Edit `.env` with your configuration.

3. **Start services**
   ```bash
   make up
   ```

4. **Run database migrations**
   ```bash
   make db-migrate
   make db-seed
   ```

5. **Access services**
   - Landing Page: http://localhost:3000
   - Admin Panel: http://localhost:3001
   - CMS Panel: http://localhost:3002
   - API: http://localhost:8080
   - PgAdmin: http://localhost:5050
   - Mailhog: http://localhost:8025

## 🛠️ Development

### Available Commands

```bash
# Docker Management
make build          # Build all containers
make up             # Start all services
make down           # Stop all services
make logs           # View all logs
make status         # Check service status

# Database
make db-console     # Access PostgreSQL console
make db-backup      # Backup database
make db-reset       # Reset database

# Development
make dev            # Start development environment
make dev-landing    # Start landing page only
make dev-admin      # Start admin panel only
make dev-mobile     # Start Flutter app

# Testing
make test           # Run all tests
make test-e2e       # Run E2E tests
make test-flutter   # Run Flutter tests

# Code Quality
make lint           # Run linters
make format         # Format code
make security-scan  # Run security scan
```

### Development Workflow

1. Create feature branch
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make changes and test locally
   ```bash
   make dev
   make test
   ```

3. Commit changes
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

4. Push and create PR
   ```bash
   git push origin feature/your-feature
   ```

## 🧪 Testing

### Test Structure

- **Unit Tests**: Component and function-level tests
- **Integration Tests**: API and service integration tests
- **E2E Tests**: Full user journey tests with Playwright
- **Flutter Tests**: Mobile app unit and widget tests

### Running Tests

```bash
# Run all tests
make test

# Run specific test suites
make test-unit
make test-e2e
make test-flutter

# Generate coverage report
make test-coverage
```

### Testing Tools

- **Playwright**: E2E testing for web applications
- **Jest**: Unit testing for JavaScript/TypeScript
- **Flutter Test**: Mobile app testing
- **Supertest**: API testing

## 📋 Implementation Stages

### Stage 1: Foundation & Infrastructure (Weeks 1-3)
- [x] Docker environment setup
- [x] Database schema design
- [x] Authentication system
- [x] CI/CD pipeline
- [ ] Supabase configuration
- [ ] Testing infrastructure

### Stage 2: Landing Page (Weeks 4-5)
- [ ] Next.js setup
- [ ] Hero section
- [ ] Features showcase
- [ ] Pricing section
- [ ] SEO optimization
- [ ] Performance optimization

### Stage 3: Mobile App Core (Weeks 6-10)
- [ ] Flutter project setup
- [ ] Authentication flow
- [ ] AI Coach chat interface
- [ ] Task management
- [ ] Calendar integration
- [ ] Push notifications

### Stage 4: Advanced Features (Weeks 11-14)
- [ ] Smart input processing
- [ ] Mood tracking
- [ ] Weekly reports
- [ ] Learning library
- [ ] Offline support

### Stage 5: Admin & CMS (Weeks 15-17)
- [ ] Admin dashboard
- [ ] User management
- [ ] Content management
- [ ] Analytics
- [ ] Flag system

### Stage 6: Production (Weeks 18-20)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Monitoring setup
- [ ] Documentation
- [ ] Deployment

## 🔒 Security

- HTTPS everywhere
- JWT-based authentication
- Role-based access control (RBAC)
- Data encryption at rest and in transit
- Regular security audits
- GDPR & HIPAA compliance ready

## 📊 Monitoring & Analytics

- Application monitoring with Sentry
- Performance tracking with Lighthouse
- User analytics with Google Analytics
- Custom metrics dashboard
- Real-time error tracking

## 🚢 Deployment

### Staging Deployment
```bash
make deploy-staging
```

### Production Deployment
```bash
make deploy-prod
```

### Environment Variables

Key environment variables required:

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `OPENAI_API_KEY`: OpenAI API key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `REVENUECAT_API_KEY`: RevenueCat API key

See `env.example` for complete list.

## 📚 Documentation

### Developer Documentation
- [Development Guide](CLAUDE.md) - Complete development setup and workflows
- [Design Principles](context/design-principles.md) - UI/UX design standards
- [Security Testing](docs/SECURITY_TESTING.md) - Security implementation guide
- [Two-Factor Authentication](docs/TWO_FACTOR_AUTH.md) - 2FA implementation details
- [Monitoring & Security](docs/MONITORING_SECURITY.md) - System monitoring setup

### Implementation Guides
- [Backend Implementation](docs/implementation/) - Backend setup and configuration guides
- [CMS Implementation](docs/implementation/IMPLEMENTATION_PLAN.md) - CMS panel setup
- [Library Replacements](docs/implementation/library-replacements.md) - Dependency management

### Testing Documentation
- [Testing Strategy](docs/testing/testing-strategy.md) - Comprehensive testing approach
- [Visual Testing](docs/testing/visual-tests.md) - Visual regression testing
- [E2E Testing](docs/testing/e2e-tests.md) - End-to-end testing setup
- [Test Implementation Guide](docs/testing/test-implementation-guide.md) - Testing best practices

### Planning & Architecture
- [Enhancement Plan](docs/planning/enhancement-plan.md) - Feature development roadmap
- [Intelligence Features](docs/planning/intelligence-features.md) - AI coaching features
- [Design System](docs/design-system.md) - Component library and design tokens

### Service Documentation
- [Backend API](backend/README.md) - Backend service documentation
- [Badge System](badges/README.md) - Test and coverage badges

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🆘 Support

- Documentation: [docs.upcoach.ai](https://docs.upcoach.ai)
- Email: support@upcoach.ai
- Slack: [UpCoach Workspace](https://upcoach.slack.com)

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Enterprise SSO
- [ ] API marketplace
- [ ] White-label options

---

Built with ❤️ by the UpCoach Team 