#!/bin/bash

echo "Standardizing spacing with UIConstants..."

# Add UIConstants import to files that don't have it
for file in lib/features/home/screens/home_screen.dart \
            lib/features/chat/screens/chat_screen.dart \
            lib/features/profile/screens/profile_screen.dart \
            lib/features/tasks/screens/tasks_screen.dart \
            lib/features/goals/screens/goals_screen.dart \
            lib/features/mood/screens/mood_screen.dart; do
    
    # Check if UIConstants is already imported
    if ! grep -q "ui_constants.dart" "$file"; then
        # Add import after the first import statement
        sed -i '' '/^import /a\
import '\''../../../shared/constants/ui_constants.dart'\'';
' "$file"
    fi
done

# Replace common spacing values with UIConstants
# 4 -> UIConstants.spacingXS
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(height: 4)/SizedBox(height: UIConstants.spacingXS)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(width: 4)/SizedBox(width: UIConstants.spacingXS)/g' {} +

# 8 -> UIConstants.spacingSM
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(height: 8)/SizedBox(height: UIConstants.spacingSM)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(width: 8)/SizedBox(width: UIConstants.spacingSM)/g' {} +

# 12 -> between SM and MD, use MD
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(height: 12)/SizedBox(height: UIConstants.spacingMD)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(width: 12)/SizedBox(width: UIConstants.spacingMD)/g' {} +

# 16 -> UIConstants.spacingMD
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(height: 16)/SizedBox(height: UIConstants.spacingMD)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(width: 16)/SizedBox(width: UIConstants.spacingMD)/g' {} +

# 20 -> close to LG, use LG
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(height: 20)/SizedBox(height: UIConstants.spacingLG)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(width: 20)/SizedBox(width: UIConstants.spacingLG)/g' {} +

# 24 -> UIConstants.spacingLG
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(height: 24)/SizedBox(height: UIConstants.spacingLG)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(width: 24)/SizedBox(width: UIConstants.spacingLG)/g' {} +

# 32 -> UIConstants.spacingXL
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(height: 32)/SizedBox(height: UIConstants.spacingXL)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(width: 32)/SizedBox(width: UIConstants.spacingXL)/g' {} +

# 48 -> UIConstants.spacing2XL
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(height: 48)/SizedBox(height: UIConstants.spacing2XL)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(width: 48)/SizedBox(width: UIConstants.spacing2XL)/g' {} +

# 60, 64 -> UIConstants.spacing3XL
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(height: 60)/SizedBox(height: UIConstants.spacing3XL)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/SizedBox(height: 64)/SizedBox(height: UIConstants.spacing3XL)/g' {} +

# Replace EdgeInsets values
find lib -name "*.dart" -type f -exec sed -i '' 's/EdgeInsets\.all(8)/EdgeInsets.all(UIConstants.spacingSM)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/EdgeInsets\.all(12)/EdgeInsets.all(UIConstants.spacingMD)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/EdgeInsets\.all(16)/EdgeInsets.all(UIConstants.spacingMD)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/EdgeInsets\.all(20)/EdgeInsets.all(UIConstants.spacingLG)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/EdgeInsets\.all(24)/EdgeInsets.all(UIConstants.spacingLG)/g' {} +

# Replace border radius values
find lib -name "*.dart" -type f -exec sed -i '' 's/BorderRadius\.circular(8)/BorderRadius.circular(UIConstants.radiusMD)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/BorderRadius\.circular(12)/BorderRadius.circular(UIConstants.radiusLG)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/BorderRadius\.circular(16)/BorderRadius.circular(UIConstants.radiusXL)/g' {} +
find lib -name "*.dart" -type f -exec sed -i '' 's/BorderRadius\.circular(20)/BorderRadius.circular(UIConstants.radiusXL)/g' {} +

echo "Spacing standardization complete!"