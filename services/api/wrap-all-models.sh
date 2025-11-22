#!/bin/bash

wrap_model() {
  local file=$1
  local model_name=$2
  local init_line=$3
  
  # Add conditional before init
  local before_line=$((init_line - 1))
  sed -i '' "${before_line} a\\
// Initialize model - skip in test environment to prevent \"No Sequelize instance passed\" errors\\
// Jest mocks will handle model initialization in tests\\
if (process.env.NODE_ENV !== 'test') {
" "$file"
  
  # Find the closing ); after init and add closing brace
  local close_line=$(awk "NR > $init_line && /^);$/ {print NR; exit}" "$file")
  sed -i '' "${close_line} a\\
}
" "$file"
  
  echo "✓ Wrapped $model_name at line $init_line (closes at $close_line)"
}

# Coach models
wrap_model "src/models/CoachSession.ts" "CoachSession" 245
wrap_model "src/models/CoachProfile.ts" "CoachProfile" 206
wrap_model "src/models/CoachPackage.ts" "CoachPackage" 133
wrap_model "src/models/CoachReview.ts" "CoachReview" 248

# Financial models
wrap_model "src/models/financial/RevenueAnalytics.ts" "RevenueAnalytics" 142
wrap_model "src/models/financial/CostTracking.ts" "CostTracking" 92
wrap_model "src/models/financial/FinancialSnapshot.ts" "FinancialSnapshot" 106

echo "✅ All models wrapped successfully!"
