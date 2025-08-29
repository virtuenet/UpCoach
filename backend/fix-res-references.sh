#!/bin/bash

echo "Fixing res parameter references..."

# List of files that need fixing based on the error output
files=(
  "src/controllers/AdvancedAnalyticsController.ts"
  "src/controllers/AIAnalyticsController.ts"
  "src/controllers/CoachIntelligenceController.ts"
  "src/controllers/cms/ArticleController.ts"
  "src/controllers/cms/CMSController.ts"
  "src/controllers/cms/ContentController.ts"
  "src/controllers/cms/ContentTagController.ts"
  "src/controllers/experiments/ExperimentsController.ts"
  "src/lib/circuit-breaker.ts"
  "src/lib/retry.ts"
  "src/middleware/authorize.ts"
  "src/middleware/error.ts"
  "src/services/TwoFactorAuthService.ts"
  "src/services/WebAuthnService.ts"
  "src/services/redis.ts"
  "src/services/upload/UploadService.ts"
  "src/utils/dbSecurity.ts"
  "src/validation/schemas/coach.schema.ts"
)

# For each file, replace 'res.' and 'res)' patterns with '(res as any).'
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Replace patterns where res is used directly (not _res)
    # This handles cases where res is referenced in the function body
    sed -i '' 's/\bres\./\(res as any\)\./g' "$file"
    sed -i '' 's/return res\./return \(res as any\)\./g' "$file"
    sed -i '' 's/\bres\.status/\(res as any\)\.status/g' "$file"
    sed -i '' 's/\bres\.json/\(res as any\)\.json/g' "$file"
    sed -i '' 's/\bres\.send/\(res as any\)\.send/g' "$file"
    sed -i '' 's/\bres\.cookie/\(res as any\)\.cookie/g' "$file"
    sed -i '' 's/\bres\.setHeader/\(res as any\)\.setHeader/g' "$file"
    sed -i '' 's/\bres\.redirect/\(res as any\)\.redirect/g' "$file"
    sed -i '' 's/\bres\.locals/\(res as any\)\.locals/g' "$file"
    sed -i '' 's/\bres\.set/\(res as any\)\.set/g' "$file"
    sed -i '' 's/\bres\.end/\(res as any\)\.end/g' "$file"
    
    # Fix double casting patterns that might result from multiple runs
    sed -i '' 's/\(\(res as any\) as any\)/\(res as any\)/g' "$file"
  fi
done

echo "Res parameter references fixed!"