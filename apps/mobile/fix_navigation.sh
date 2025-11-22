#!/bin/bash

echo "Fixing navigation inconsistencies in Flutter app..."

# Fix Navigator.pop(context) to context.pop()
find lib -name "*.dart" -type f -exec sed -i '' 's/Navigator\.pop(context)/context.pop()/g' {} +

# Fix Navigator.pushNamed(context, '/route') to context.go('/route')
find lib -name "*.dart" -type f -exec sed -i '' 's/Navigator\.pushNamed(context, '\''\/tasks'\'')/context.go('\''\/tasks'\'')/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/Navigator\.pushNamed(context, '\''\/goals'\'')/context.go('\''\/goals'\'')/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/Navigator\.pushNamed(context, '\''\/mood'\'')/context.go('\''\/mood'\'')/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/Navigator\.pushNamed(context, '\''\/ai-coach'\'')/context.go('\''\/ai-coach'\'')/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/Navigator\.pushNamed(context, '\''\/ai\/insights'\'')/context.go('\''\/ai\/insights'\'')/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/Navigator\.pushNamed(context, '\''\/feedback'\'')/context.go('\''\/feedback'\'')/g' {} +

# Fix Navigator.push with MaterialPageRoute patterns
# This is more complex and needs manual review for each case

echo "Basic navigation fixes applied. Manual review needed for Navigator.push patterns."