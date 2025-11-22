#!/bin/bash

# Database initialization script for UpCoach backend

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-1433}
DB_USER=${DB_USER:-upcoach}
DB_PASSWORD=${DB_PASSWORD:-upcoach_secure_pass}
DB_NAME=${DB_NAME:-upcoach_db}

echo -e "${GREEN}🗄️  Initializing UpCoach Database...${NC}"

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT${NC}"
    echo -e "${YELLOW}Make sure PostgreSQL is running and configured correctly${NC}"
    exit 1
fi

# Create database if it doesn't exist
echo -e "${YELLOW}Creating database '$DB_NAME' if it doesn't exist...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres <<EOF
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\\gexec
EOF

echo -e "${GREEN}✅ Database '$DB_NAME' is ready${NC}"

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
for migration in migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo -e "${YELLOW}  Applying $(basename $migration)...${NC}"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration" 2>&1 | grep -v "already exists" || true
        echo -e "${GREEN}  ✅ Applied $(basename $migration)${NC}"
    fi
done

echo -e "${GREEN}✅ All migrations applied${NC}"

# Create required tables (if migrations don't exist)
echo -e "${YELLOW}Ensuring required tables exist...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    google_id VARCHAR(255) UNIQUE,
    google_email VARCHAR(255),
    auth_provider VARCHAR(50) DEFAULT 'email',
    preferences JSONB DEFAULT '{"theme": "light", "notifications": true, "language": "en"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Create sessions table if not exists
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);

-- Create goals table if not exists
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 3,
    target_date DATE,
    progress INTEGER DEFAULT 0,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- Create tasks table if not exists
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 3,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create coach memories table
CREATE TABLE IF NOT EXISTS coach_memories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    memory_type VARCHAR(50),
    content TEXT,
    metadata JSONB,
    importance_score FLOAT DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_memories_user_id ON coach_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_memories_session_id ON coach_memories(session_id);

-- Create auth events table for audit
CREATE TABLE IF NOT EXISTS auth_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50),
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON auth_events(event_type);

-- Insert default admin user if not exists (password: Admin@123456)
INSERT INTO users (email, password_hash, name, role, is_active, is_email_verified)
SELECT
    'admin@upcoach.ai',
    '\$2a\$10\$rBV2JDeWW3.vKyeQcM8fFO4777l./.HLE0ET.ozb2jkMg53eFSRTu',
    'System Administrator',
    'admin',
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@upcoach.ai'
);

-- Insert test user if in development (password: Test@123456)
INSERT INTO users (email, password_hash, name, role, is_active, is_email_verified)
SELECT
    'test@upcoach.ai',
    '\$2a\$10\$8K1p/J3U7z1PzOWPEY0vseOT5BKfFqmCTqNKs1GxfrQ7o9U8G5OGK',
    'Test User',
    'user',
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'test@upcoach.ai'
) AND '${NODE_ENV}' != 'production';

EOF

echo -e "${GREEN}✅ Database tables created/verified${NC}"

# Verify database setup
echo -e "${YELLOW}Verifying database setup...${NC}"
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")

echo -e "${GREEN}✅ Database initialized with $TABLE_COUNT tables${NC}"

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection test successful${NC}"
else
    echo -e "${RED}❌ Database connection test failed${NC}"
    exit 1
fi

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         Database Initialization Complete! 🎉              ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Database: $DB_NAME                                       "
echo "║  Host:     $DB_HOST:$DB_PORT                              "
echo "║  User:     $DB_USER                                       "
echo "║                                                           ║"
echo "║  Default Admin:                                          ║"
echo "║    Email:    admin@upcoach.ai                           ║"
echo "║    Password: Admin@123456                               ║"
echo "║                                                           ║"
if [ "${NODE_ENV}" != "production" ]; then
echo "║  Test User:                                             ║"
echo "║    Email:    test@upcoach.ai                           ║"
echo "║    Password: Test@123456                                ║"
echo "║                                                           ║"
fi
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"