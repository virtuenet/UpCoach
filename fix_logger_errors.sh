#!/bin/bash

# Fix logger._error back to logger.error
cd "/Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project/backend"

echo "Fixing logger._error back to logger.error..."
find src -name "*.ts" -type f -exec sed -i '' 's/logger\._error/logger.error/g' {} \;

echo "Fixed logger method calls."