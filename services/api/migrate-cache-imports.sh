#!/bin/bash

# Migration script to update cache service imports to unified cache service

echo "Starting cache service migration..."

# Files to update
files=(
  "src/services/analytics/AdvancedAnalyticsService.ts"
  "src/services/community/ForumService.ts"
  "src/services/gamification/GamificationService.ts"
  "src/services/coach/CoachService.ts"
  "src/services/referral/ReferralService.ts"
  "src/services/ai/AIService.ts"
  "src/services/email/EmailAutomationService.ts"
  "src/services/database/QueryOptimizer.ts"
  "src/services/cms/PublishingService.ts"
  "src/services/analytics/AnalyticsService.ts"
  "src/controllers/cms/CMSController.ts"
)

# Update imports
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Updating $file..."
    
    # Update import from cacheService to UnifiedCacheService
    sed -i.bak "s|from '\.\./cacheService'|from '../cache/UnifiedCacheService'|g" "$file"
    sed -i.bak "s|from '\.\./cache/CacheService'|from '../cache/UnifiedCacheService'|g" "$file"
    sed -i.bak "s|from '\.\./ai/CacheService'|from '../cache/UnifiedCacheService'|g" "$file"
    sed -i.bak "s|from '\.\./\.\./services/cacheService'|from '../../services/cache/UnifiedCacheService'|g" "$file"
    sed -i.bak "s|from '\.\./\.\./services/cache/CacheService'|from '../../services/cache/UnifiedCacheService'|g" "$file"
    
    # Update class/instance names
    sed -i.bak "s|import { cacheService }|import { getCacheService }|g" "$file"
    sed -i.bak "s|import { CacheService }|import { UnifiedCacheService }|g" "$file"
    sed -i.bak "s|import cacheService|import { getCacheService }|g" "$file"
    
    # Update usage
    sed -i.bak "s|cacheService\.|getCacheService().|g" "$file"
    sed -i.bak "s|new CacheService()|new UnifiedCacheService()|g" "$file"
    
    # Clean up backup files
    rm -f "${file}.bak"
  fi
done

echo "Migration complete!"
echo ""
echo "Next steps:"
echo "1. Remove old cache service files:"
echo "   - src/services/cacheService.ts"
echo "   - src/services/ai/CacheService.ts"
echo "   - src/services/cache/CacheService.ts (keep directory for UnifiedCacheService)"
echo ""
echo "2. Run tests to verify the migration"
echo "3. Update any remaining imports manually if needed"