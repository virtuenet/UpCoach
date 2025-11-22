#!/bin/bash

# Migration script to update content service imports
echo "🔄 Migrating content service imports..."

# Update PublishingService imports
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" | while read file; do
  # Replace old service imports with unified service
  sed -i '' "s|from '.*PublishingService'|from './cms/UnifiedContentService'|g" "$file"
  sed -i '' "s|new PublishingService()|getContentService()|g" "$file"
  sed -i '' "s|PublishingService\.|UnifiedContentService\.|g" "$file"
done

# Update model imports
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" | while read file; do
  # Replace old model imports
  sed -i '' "s|ContentArticle|UnifiedContent|g" "$file"
  sed -i '' "s|from '.*models/cms/Article'|from '../models/cms'|g" "$file"
  sed -i '' "s|from '.*models/cms/Content'|from '../models/cms'|g" "$file"
  sed -i '' "s|from '.*models/cms/Course'|from '../models/cms'|g" "$file"
  sed -i '' "s|from '.*models/cms/Template'|from '../models/cms'|g" "$file"
done

echo "✅ Service imports migrated"
echo ""
echo "Next steps:"
echo "1. Review the changes"
echo "2. Run tests to ensure everything works"
echo "3. Remove old service files once verified"