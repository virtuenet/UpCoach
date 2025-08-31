# Email Service Migration Guide

## Overview
This guide documents the migration from multiple email service implementations to the unified `UnifiedEmailService`.

## Breaking Changes

### Method Name Change
- **Old**: `emailService.sendEmail(options)`
- **New**: `emailService.send(options)`

All email options remain the same - only the method name has changed.

## Migration Steps

### 1. Update Imports
```typescript
// Old (multiple services)
import { EmailService } from '../services/EmailService';
import { emailAutomationService } from '../services/email/emailService';

// New (unified service)
import emailService from '../services/email/UnifiedEmailService';
```

### 2. Update Method Calls
```typescript
// Old
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  template: 'welcome',
  data: { name: 'John' }
});

// New
await emailService.send({
  to: 'user@example.com',
  subject: 'Welcome',
  template: 'welcome',
  data: { name: 'John' }
});
```

### 3. Type-Safe Templates (Optional Enhancement)
```typescript
// With type safety
import { EmailTemplateMap } from '../interfaces/IEmailService';

await emailService.send<'welcome'>({
  template: 'welcome',
  to: 'user@example.com',
  subject: 'Welcome',
  data: {
    name: 'John',
    activationUrl: 'https://...',
    expiresIn: '24 hours'
  }
});
```

## New Features Available

### Progress Tracking
```typescript
const progress = await emailService.sendWithProgress({
  to: 'user@example.com',
  subject: 'Large Report',
  attachments: [largePdfFile]
});

// Monitor progress
console.log(`Status: ${progress.status}, Progress: ${progress.progress}%`);
```

### Bulk Queuing
```typescript
await emailService.queueBulk([
  { to: 'user1@example.com', subject: 'Newsletter', template: 'newsletter' },
  { to: 'user2@example.com', subject: 'Newsletter', template: 'newsletter' },
  // ... more emails
]);
```

### Metrics
```typescript
const metrics = emailService.getMetrics();
console.log(`Sent: ${metrics.sent}, Failed: ${metrics.failed}`);
```

## Testing

### Mocking in Tests
```typescript
jest.mock('../services/email/UnifiedEmailService', () => ({
  __esModule: true,
  default: {
    send: jest.fn().mockResolvedValue(true),
    queue: jest.fn().mockResolvedValue(undefined),
    getMetrics: jest.fn().mockReturnValue({
      sent: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      queued: 0,
    }),
  },
}));
```

## Verification Script
Run this to find any remaining `sendEmail` calls:
```bash
grep -r "sendEmail" --include="*.ts" --include="*.js" src/
```

## Rollback Plan
If issues arise:
1. The old method signatures are preserved in git history
2. Create a compatibility wrapper:
```typescript
// Temporary compatibility layer
emailService.sendEmail = emailService.send;
```

## Support
For issues or questions about the migration:
- Check error logs for detailed error messages
- Review the UnifiedEmailService implementation
- Contact the backend team