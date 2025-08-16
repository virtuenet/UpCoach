# Library Replacements for Custom Implementations

## Recommended Library Replacements

### 1. **Retry Mechanism** → `axios-retry`
```bash
npm install axios-retry
```
- Replaces: Custom retry logic in multiple services
- Benefit: Battle-tested, configurable retry strategies
- Lines saved: ~150

### 2. **Circuit Breaker** → `opossum`
```bash
npm install opossum
```
- Replaces: Custom CircuitBreaker class
- Benefit: Production-ready with metrics and monitoring
- Lines saved: ~200

### 3. **Rate Limiting** → `express-rate-limit`
```bash
npm install express-rate-limit
```
- Replaces: Custom rate limiting implementations
- Benefit: Flexible, well-maintained
- Lines saved: ~100

### 4. **Validation** → `joi` or keep `express-validator`
```bash
npm install joi
```
- Replaces: Some custom validation logic
- Benefit: Comprehensive validation with great error messages
- Lines saved: ~150

### 5. **Date Manipulation** → Already using `date-fns` ✓
- Status: Already implemented correctly

### 6. **Logging** → `winston` (consider upgrade)
```bash
npm install winston
```
- Current: Custom logger wrapper
- Benefit: More features, better performance
- Lines saved: ~50

### 7. **Queue Processing** → `bull` or `bullmq`
```bash
npm install bull
```
- Replaces: Custom email queue implementation
- Benefit: Redis-backed, reliable job processing
- Lines saved: ~200

### 8. **Cron Jobs** → `node-cron`
```bash
npm install node-cron
```
- Replaces: Custom scheduling logic
- Benefit: Standard cron syntax, reliable
- Lines saved: ~100

### 9. **Environment Validation** → `dotenv` + `joi`
```bash
npm install dotenv joi
```
- Replaces: Manual env checking
- Benefit: Type-safe environment variables
- Lines saved: ~50

### 10. **HTTP Client** → Keep `axios` ✓
- Status: Good choice, widely used

## Implementation Script

```json
// Add to package.json dependencies
{
  "dependencies": {
    "axios-retry": "^3.8.0",
    "opossum": "^8.1.0",
    "express-rate-limit": "^6.10.0",
    "bull": "^4.11.0",
    "node-cron": "^3.0.2"
  }
}
```

## Migration Plan

### Step 1: Install Libraries
```bash
npm install axios-retry opossum express-rate-limit bull node-cron
```

### Step 2: Create Adapters
Create adapter files that wrap the libraries with our existing interfaces:

```typescript
// src/lib/retry.ts
import axiosRetry from 'axios-retry';

export function setupRetry(client: AxiosInstance, options?: IAxiosRetryConfig) {
  axiosRetry(client, {
    retries: options?.retries || 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
             error.response?.status === 429;
    },
    ...options
  });
}
```

### Step 3: Replace Custom Implementations

1. **Replace RetryMechanism**
   - Location: `/backend/src/services/ai/RetryMechanism.ts`
   - Replace with: `axios-retry` configuration

2. **Replace CircuitBreaker**
   - Location: `/backend/src/services/ai/CircuitBreaker.ts`
   - Replace with: `opossum` implementation

3. **Replace Rate Limiting**
   - Location: Custom middleware
   - Replace with: `express-rate-limit`

4. **Replace Queue Processing**
   - Location: Email service queue
   - Replace with: `bull` jobs

## Estimated Impact

- **Total lines saved**: ~1,000 lines
- **Dependencies added**: 5 production dependencies
- **Maintenance burden**: Significantly reduced
- **Reliability**: Improved with battle-tested libraries
- **Performance**: Similar or better

## Testing Strategy

1. Create integration tests for each replacement
2. Run existing tests to ensure compatibility
3. Monitor performance metrics
4. Gradual rollout with feature flags if needed