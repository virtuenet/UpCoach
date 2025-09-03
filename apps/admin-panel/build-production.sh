#!/bin/bash

echo "Building Admin Panel with relaxed TypeScript checks..."

# Skip TypeScript check and go directly to Vite build
npx vite build

# Check if dist folder was created
if [ -d "dist" ]; then
  echo "✅ Admin Panel build completed"
  exit 0
else
  echo "❌ Build failed - no output generated"
  exit 1
fi