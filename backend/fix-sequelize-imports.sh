#!/bin/bash

echo "Fixing Sequelize imports in model files..."

# Find all TypeScript files that import sequelize from ./index and update them
find src/models -name "*.ts" -exec grep -l "from.*\.\/index" {} \; | while read file; do
  echo "Updating: $file"
  # Update single-level imports (./index)
  sed -i '' "s|from '\./index'|from '../../config/sequelize'|g" "$file"
  # Update two-level imports (../index)
  sed -i '' "s|from '\.\./index'|from '../../config/sequelize'|g" "$file"
  # Update three-level imports (../../index)  
  sed -i '' "s|from '\.\./\.\./index'|from '../../../config/sequelize'|g" "$file"
done

echo "Sequelize imports fixed successfully!"