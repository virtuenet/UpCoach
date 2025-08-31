#!/bin/bash

# Migration script to update email service imports to unified email service

echo "Starting email service migration..."

# Find all files that import email services
files=$(grep -r "EmailService\|EmailAutomationService" ../backend/src --include="*.ts" --include="*.js" -l | grep -v UnifiedEmailService | grep -v node_modules)

for file in $files; do
  if [ -f "$file" ]; then
    echo "Updating $file..."
    
    # Update imports
    sed -i.bak "s|from '\.\./services/EmailService'|from '../services/email/UnifiedEmailService'|g" "$file"
    sed -i.bak "s|from '\.\./EmailService'|from './UnifiedEmailService'|g" "$file"
    sed -i.bak "s|from '\./EmailAutomationService'|from './UnifiedEmailService'|g" "$file"
    sed -i.bak "s|from '\.\./\.\./services/EmailService'|from '../../services/email/UnifiedEmailService'|g" "$file"
    sed -i.bak "s|from '\.\./\.\./services/email/EmailService'|from '../../services/email/UnifiedEmailService'|g" "$file"
    sed -i.bak "s|from '\.\./\.\./services/email/EmailAutomationService'|from '../../services/email/UnifiedEmailService'|g" "$file"
    
    # Update class names
    sed -i.bak "s|EmailService\.|emailService.|g" "$file"
    sed -i.bak "s|EmailAutomationService|emailService|g" "$file"
    sed -i.bak "s|new EmailService()|emailService|g" "$file"
    
    # Update imports
    sed -i.bak "s|import { EmailService }|import { emailService }|g" "$file"
    sed -i.bak "s|import EmailService|import { emailService }|g" "$file"
    
    # Clean up backup files
    rm -f "${file}.bak"
  fi
done

echo "Migration complete!"
echo ""
echo "Next steps:"
echo "1. Remove old email service files:"
echo "   - src/services/EmailService.ts"
echo "   - src/services/email/EmailService.ts"
echo "   - src/services/email/EmailAutomationService.ts"
echo ""
echo "2. Run tests to verify the migration"