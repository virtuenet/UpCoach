#!/bin/bash

# TypeScript Dependency Fix Script for UpCoach Recovery
echo "🔧 UpCoach TypeScript Dependency Recovery Script"
echo "================================================"

cd "/Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project"

echo "📦 Installing missing TypeScript dependencies..."

# Install root dependencies
npm install --save-dev typescript@latest @types/node@latest

# Fix API service dependencies
cd services/api
echo "🔧 Fixing API service dependencies..."

# Move sequelize to dependencies if not already there
npm install --save sequelize@^6.37.7
npm install --save-dev @types/sequelize@^4.28.20

# Install missing type declarations
npm install --save-dev @types/redis@^4.0.11
npm install --save-dev @types/express@^4.17.21
npm install --save-dev @types/express-validator@^3.0.0

echo "🔍 Running TypeScript compilation check..."
npx tsc --noEmit --skipLibCheck 2>&1 | head -30

echo "✅ TypeScript dependency fixes complete!"
echo "🚀 Next: Run npm run type-check to verify all fixes"

cd ../..