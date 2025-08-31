#!/bin/bash

echo "Fixing Sequelize import paths..."

# Find and replace in models files
find src/models -name "*.ts" -exec sed -i '' 's|from '\''\.\.\/\.\.\/config/sequelize'\''|from '\''../config/sequelize'\''|g' {} \;

echo "Fixed Sequelize paths in model files"

# Also fix any remaining ones that might be in subdirectories
find src/models -name "*.ts" -exec sed -i '' 's|from '\''\.\.\/\.\.\/\.\.\/config/sequelize'\''|from '\''../../config/sequelize'\''|g' {} \;

echo "Done fixing all Sequelize import paths"