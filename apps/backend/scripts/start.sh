#!/bin/bash

# UpCoach Backend Startup Script

set -e

echo "🚀 Starting UpCoach Backend..."

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET environment variable is not set"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: OPENAI_API_KEY environment variable is not set"
    echo "   AI chat functionality will not work"
fi

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
while ! nc -z $(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/') $(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/'); do
    sleep 1
    echo "   Still waiting for database..."
done
echo "✅ Database is ready"

# Wait for Redis to be ready (if Redis URL is set)
if [ ! -z "$REDIS_URL" ]; then
    echo "⏳ Waiting for Redis connection..."
    REDIS_HOST=$(echo $REDIS_URL | sed 's/redis:\/\/\([^:]*\):.*/\1/')
    REDIS_PORT=$(echo $REDIS_URL | sed 's/.*:\([0-9]*\)/\1/')
    
    while ! nc -z $REDIS_HOST $REDIS_PORT; do
        sleep 1
        echo "   Still waiting for Redis..."
    done
    echo "✅ Redis is ready"
fi

# Run database migrations (if they exist)
if [ -f "./dist/database/migrate.js" ]; then
    echo "🔄 Running database migrations..."
    node ./dist/database/migrate.js
    echo "✅ Migrations completed"
fi

# Create necessary directories
mkdir -p logs uploads

# Set permissions
chmod 755 logs uploads

echo "🎯 Environment: $NODE_ENV"
echo "🌐 Port: ${PORT:-3001}"
echo "📊 Log Level: ${LOG_LEVEL:-info}"

# Start the application
if [ "$NODE_ENV" = "development" ]; then
    echo "🔧 Starting in development mode..."
    npm run dev
else
    echo "🚀 Starting in production mode..."
    npm start
fi 