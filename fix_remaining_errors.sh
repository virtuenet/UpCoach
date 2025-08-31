#!/bin/bash

# Fix remaining "error" references to "_error" in specific patterns
cd "/Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project/backend"

echo "Fixing remaining error references..."

# Fix "next(error);" -> "next(_error);" in files that have catch(_error)
find src -name "*.ts" -type f -exec grep -l "catch.*(_error)" {} \; | while read file; do
  echo "Fixing next(error) in: $file"
  sed -i '' 's/next(error);/next(_error);/g' "$file"
done

# Fix "throw error;" -> "throw _error;" in files that have catch(_error)
find src -name "*.ts" -type f -exec grep -l "catch.*(_error)" {} \; | while read file; do
  echo "Fixing throw error in: $file"
  sed -i '' 's/throw error;/throw _error;/g' "$file"
done

echo "Fixed remaining error references."