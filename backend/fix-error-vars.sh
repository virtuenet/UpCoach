#!/bin/bash

# Fix all _error references to error in TypeScript files
echo "Fixing _error references in TypeScript files..."

# Fix catch blocks with _error
find src/ -name "*.ts" -type f -exec sed -i '' 's/} catch (_error)/} catch (error)/g' {} +

# Fix references to _error variable
find src/ -name "*.ts" -type f -exec sed -i '' 's/(_error as Error)/(error as Error)/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/{ _error/{ error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/, _error/, error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/_error instanceof/error instanceof/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/formatZodError(_error)/formatZodError(error)/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/: _error/: error/g' {} +

echo "Fixed _error references in TypeScript files"