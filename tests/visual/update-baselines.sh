#!/bin/bash

# Script to update visual test baselines
echo "Updating visual test baselines..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm ci
fi

# Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install

# Update baselines for all projects
echo "Generating new baseline images..."
npx playwright test --update-snapshots

echo "Baseline images updated successfully!"
echo "New baselines are located in: tests/**/*-snapshots/"
echo ""
echo "To commit the changes:"
echo "  git add tests/**/*-snapshots/"
echo "  git commit -m 'chore: update visual test baselines'"