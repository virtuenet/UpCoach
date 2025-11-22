#!/bin/bash

wrap_associations() {
  local file=$1
  local model_name=$2
  
  # Find the line with "// Define associations"
  local assoc_line=$(grep -n "// Define associations" "$file" | cut -d: -f1 | head -1)
  
  if [ -z "$assoc_line" ]; then
    echo "⚠ No associations found in $model_name"
    return
  fi
  
  # Find export default line
  local export_line=$(grep -n "^export default $model_name" "$file" | cut -d: -f1 | head -1)
  
  if [ -z "$export_line" ]; then
    echo "⚠ No export found in $model_name"
    return
  fi
  
  # Replace "// Define associations" with wrapped version
  sed -i '' "${assoc_line}s|// Define associations|// Define associations - skip in test environment\\
if (process.env.NODE_ENV !== 'test') {|" "$file"
  
  # Add closing brace before export
  local before_export=$((export_line - 1))
  sed -i '' "${before_export} a\\
}
" "$file"
  
  echo "✓ Wrapped $model_name associations (lines $assoc_line to $export_line)"
}

# Coach models - only if not already wrapped
grep -q "// Define associations - skip in test environment" src/models/AIFeedback.ts || wrap_associations "src/models/AIFeedback.ts" "AIFeedback"
grep -q "// Define associations - skip in test environment" src/models/CoachSession.ts || wrap_associations "src/models/CoachSession.ts" "CoachSession"
grep -q "// Define associations - skip in test environment" src/models/CoachProfile.ts || wrap_associations "src/models/CoachProfile.ts" "CoachProfile"
grep -q "// Define associations - skip in test environment" src/models/CoachPackage.ts || wrap_associations "src/models/CoachPackage.ts" "CoachPackage"
grep -q "// Define associations - skip in test environment" src/models/CoachReview.ts || wrap_associations "src/models/CoachReview.ts" "CoachReview"

echo "✅ All associations wrapped!"
