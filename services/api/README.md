# UpCoach Backend API

A comprehensive Node.js/Express backend API for the UpCoach personal development platform.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **User Management**: Complete user profile and account management
- **Task Management**: CRUD operations with filtering, pagination, and statistics
- **Goal Tracking**: Goal setting with milestones and progress tracking
- **Mood Tracking**: Daily mood logging with insights and analytics
- **AI Chat**: OpenAI-powered personal coaching conversations
- **Real-time Data**: Redis caching and session management
- **Security**: Rate limiting, input validation, and secure headers
- **Observability**: Structured logging and error handling
- **Database**: PostgreSQL with comprehensive schema

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with pg driver
- **Cache**: Redis for sessions and caching
- **AI**: OpenAI GPT integration
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod for schema validation
- **Logging**: Winston for structured logging
- **Deployment**: Docker with multi-stage builds

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Redis 6+
- OpenAI API key

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your configuration:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/upcoach_db

# JWT Secrets (generate secure keys)
JWT_SECRET=your-super-secret-jwt-token-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-token-minimum-32-characters

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# Redis
REDIS_URL=redis://localhost:6379
```

### 3. Setup Database

```bash
# Create database
createdb upcoach_db

# Run migrations
psql -d upcoach_db -f src/database/migrations/001_initial_schema.sql
```

### 4. Start Development Server

```bash
# Start in development mode
npm run dev

# Or using Docker Compose
docker-compose -f docker-compose.dev.yml up
```

The API will be available at `http://localhost:3001`

## 🐳 Docker Development

### Quick Start with Docker

```bash
# Start all services (PostgreSQL, Redis, Backend, pgAdmin)
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Services

- **Backend API**: http://localhost:3001
- **pgAdmin**: http://localhost:5050 (admin@upcoach.com / admin123)
- **Redis Commander**: http://localhost:8081
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/auth/verify` | Verify token |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/users/statistics` | Get user stats |
| DELETE | `/api/users/account` | Deactivate account |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (with filters) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task by ID |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats/overview` | Task statistics |

### Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List goals (with filters) |
| POST | `/api/goals` | Create goal |
| GET | `/api/goals/:id` | Get goal with milestones |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |
| POST | `/api/goals/:id/milestones` | Create milestone |
| PUT | `/api/goals/:goalId/milestones/:milestoneId` | Update milestone |
| DELETE | `/api/goals/:goalId/milestones/:milestoneId` | Delete milestone |

### Mood Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mood` | List mood entries |
| POST | `/api/mood` | Create mood entry |
| GET | `/api/mood/today` | Get today's mood |
| GET | `/api/mood/stats/overview` | Mood insights |
| PUT | `/api/mood/:id` | Update mood entry |
| DELETE | `/api/mood/:id` | Delete mood entry |

### AI Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | List conversations |
| POST | `/api/chat/conversations` | Create conversation |
| GET | `/api/chat/conversations/:id` | Get conversation |
| PUT | `/api/chat/conversations/:id` | Update conversation |
| DELETE | `/api/chat/conversations/:id` | Delete conversation |
| POST | `/api/chat/message` | Send message and get AI response |

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
```

### Project Structure

```
backend/
├── src/
│   ├── config/           # Environment and configuration
│   ├── database/         # Database migrations and setup
│   ├── middleware/       # Express middleware
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── scripts/             # Deployment and utility scripts
├── docker-compose.dev.yml # Development Docker setup
├── Dockerfile           # Production Docker image
└── README.md
```

## 🚢 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Production

```bash
# Build production image
docker build -t upcoach-backend:latest .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL=your-db-url \
  -e JWT_SECRET=your-jwt-secret \
  -e OPENAI_API_KEY=your-openai-key \
  upcoach-backend:latest
```

### Environment Variables

See `.env.example` for all available configuration options.

**Required Variables:**
- `DATABASE_URL`
- `JWT_SECRET` (minimum 32 characters)
- `JWT_REFRESH_SECRET` (minimum 32 characters)
- `OPENAI_API_KEY`

## 🔒 Security

- JWT token authentication with refresh tokens
- Password hashing with bcryptjs
- Rate limiting to prevent abuse
- Input validation with Zod
- SQL injection prevention with parameterized queries
- Security headers with Helmet
- CORS configuration

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

### Logs

Logs are structured JSON format using Winston:

```bash
# View logs in development
tail -f logs/app.log

# With Docker
docker-compose logs -f backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints and examples

---

**Happy Coaching! 🎯** 