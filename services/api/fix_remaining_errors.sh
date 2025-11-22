#!/bin/bash

# Fix remaining _error references
echo "Fixing remaining _error references..."

# Find and fix all remaining _error references in TypeScript files
grep -r "_error" src/ --include="*.ts" | cut -d: -f1 | sort -u | while read file; do
  echo "Fixing: $file"
  sed -i '' 's/_error/error/g' "$file"
done

echo "Fixed all remaining _error references"