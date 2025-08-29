#!/bin/bash

echo "Fixing all res references in controllers..."

# Find all TypeScript files with _res: Response pattern
find src -name "*.ts" -type f | while read file; do
  # Check if file contains "_res: Response" pattern
  if grep -q "_res: Response" "$file"; then
    echo "Processing $file..."
    
    # Replace standalone res references with _res
    # but only where res is not part of another word
    sed -i '' 's/\([^_a-zA-Z]\)res\./\1_res./g' "$file"
    sed -i '' 's/^res\./_res./g' "$file"
    sed -i '' 's/return res\./return _res./g' "$file"
    sed -i '' 's/\([^_a-zA-Z]\)res\.status/\1_res.status/g' "$file"
    sed -i '' 's/^res\.status/_res.status/g' "$file"
    
    # Remove the (res as any) casts we added earlier and replace with _res
    sed -i '' 's/(res as any)/_res/g' "$file"
  fi
done

echo "All res references fixed!"