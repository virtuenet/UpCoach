#!/bin/bash

# AIFeedback
sed -i '' '99 a\
// Initialize model - skip in test environment to prevent "No Sequelize instance passed" errors\
// Jest mocks will handle model initialization in tests\
if (process.env.NODE_ENV !== '\''test'\'') {
' src/models/AIFeedback.ts

# Find closing line for AIFeedback.init and add closing brace
sed -i '' '/^);$/,/^\/\/ Define associations/ { /^);$/ a\
}
}' src/models/AIFeedback.ts

echo "✓ Wrapped AIFeedback.init()"
