# Test Execution Guide for UpCoach

This guide provides detailed instructions for running and maintaining the test suites for Stage 4 (Landing Page) and Stage 6 (AI Services).

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Running Tests](#running-tests)
3. [Test Configuration](#test-configuration)
4. [Debugging Tests](#debugging-tests)
5. [CI/CD Integration](#cicd-integration)
6. [Test Maintenance](#test-maintenance)
7. [Performance Benchmarks](#performance-benchmarks)

---

## Environment Setup

### Prerequisites
```bash
# Node.js version
node --version  # Should be 18.x or higher

# Install dependencies
cd upcoach-project
npm install

# Landing page dependencies
cd landing-page
npm install

# Backend dependencies
cd ../backend
npm install
```

### Environment Variables for Testing
Create `.env.test` files:

**Landing Page (.env.test)**
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST123456
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_123
```

**Backend (.env.test)**
```env
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/upcoach_test
JWT_SECRET=test-secret-key
OPENAI_API_KEY=test-api-key
CLAUDE_API_KEY=test-api-key
```

---

## Running Tests

### Landing Page Tests

```bash
cd landing-page

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test Hero.test

# Run tests with coverage
npm test -- --coverage

# Run performance tests only
npm test performance

# Run scenario tests
npm test scenarios
```

### Backend AI Tests

```bash
cd backend

# Run all tests
npm test

# Run unit tests only
npm test -- --testPathPattern=services

# Run integration tests
npm test -- --testPathPattern=integration

# Run scenario tests
npm test -- --testPathPattern=scenarios

# Run performance tests
npm test -- --testPathPattern=performance

# Run with coverage
npm test -- --coverage --coverageDirectory=coverage
```

### Running Specific Test Suites

```bash
# Landing Page Component Tests
npm test -- --testNamePattern="Hero Section"
npm test -- --testNamePattern="Lead Capture Form"

# AI Service Tests
npm test -- --testNamePattern="AIService"
npm test -- --testNamePattern="UserProfilingService"
npm test -- --testNamePattern="RecommendationEngine"
```

---

## Test Configuration

### Jest Configuration

**Landing Page (jest.config.js)**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**Backend (jest.config.js)**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000, // 30 seconds for AI tests
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/index.ts',
  ],
};
```

### Test Database Setup

```bash
# Create test database
createdb upcoach_test

# Run migrations
cd backend
npm run db:migrate:test

# Seed test data
npm run db:seed:test
```

---

## Debugging Tests

### Visual Debugging

```bash
# Run tests with debugging output
DEBUG=* npm test

# Run specific test with console logs
npm test -- --verbose Hero.test

# Debug in VS Code
# Add breakpoint and run "Jest: Debug" from command palette
```

### Common Issues and Solutions

1. **Timeout Errors**
```javascript
// Increase timeout for specific test
test('long running test', async () => {
  // test code
}, 10000); // 10 seconds
```

2. **Mock Not Working**
```javascript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

3. **Async Issues**
```javascript
// Always await async operations
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

4. **Memory Leaks**
```javascript
// Clean up after tests
afterEach(() => {
  cleanup();
});
```

---

## CI/CD Integration

### GitHub Actions Configuration

**.github/workflows/test.yml**
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-landing-page:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd landing-page
        npm ci
    
    - name: Run tests
      run: |
        cd landing-page
        npm test -- --coverage --ci
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        directory: ./landing-page/coverage
        flags: landing-page

  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: upcoach_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run migrations
      run: |
        cd backend
        npm run db:migrate:test
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/upcoach_test
    
    - name: Run tests
      run: |
        cd backend
        npm test -- --coverage --ci
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/upcoach_test
        JWT_SECRET: test-secret
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        directory: ./backend/coverage
        flags: backend

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Run performance tests
      run: |
        cd landing-page
        npm ci
        npm test -- --testPathPattern=performance
        
        cd ../backend
        npm ci
        npm test -- --testPathPattern=performance
    
    - name: Upload performance results
      uses: actions/upload-artifact@v3
      with:
        name: performance-results
        path: |
          landing-page/performance-results.json
          backend/performance-results.json
```

### Pre-commit Hooks

**.husky/pre-commit**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests for changed files
npm run test:staged
```

---

## Test Maintenance

### Best Practices

1. **Keep Tests Updated**
   - Update tests when features change
   - Remove obsolete tests
   - Add tests for new features

2. **Mock Management**
   ```javascript
   // Create reusable mocks
   export const mockAIResponse = (content: string) => ({
     content,
     provider: 'openai',
     model: 'gpt-4',
     usage: { totalTokens: 100 }
   });
   ```

3. **Test Data Factories**
   ```javascript
   // Use factories for consistent test data
   import { generateTestUser, generateTestLead } from './utils/testHelpers';
   
   const user = generateTestUser({ name: 'Custom Name' });
   ```

4. **Performance Monitoring**
   ```javascript
   // Track test execution time
   console.time('Test Suite');
   // ... tests
   console.timeEnd('Test Suite');
   ```

### Regular Maintenance Tasks

1. **Weekly**
   - Review failed tests in CI
   - Update snapshots if needed
   - Check test coverage reports

2. **Monthly**
   - Review and update test data
   - Optimize slow tests
   - Update dependencies

3. **Quarterly**
   - Full test suite audit
   - Performance benchmark review
   - Mock service updates

---

## Performance Benchmarks

### Expected Performance Metrics

**Landing Page**
- Hero render: < 100ms
- Features render: < 150ms
- Form submission: < 1s
- Page load (FCP): < 1.5s
- Full page load: < 3s

**AI Services**
- AI response: < 2s
- Profile creation: < 500ms
- Recommendations: < 1s
- Predictions: < 800ms
- Batch operations: < 5s

### Monitoring Performance

```bash
# Generate performance report
npm run test:performance -- --json --outputFile=performance-results.json

# Analyze results
node scripts/analyze-performance.js
```

### Performance Optimization Tips

1. **Frontend**
   - Use React.memo for expensive components
   - Implement virtual scrolling for lists
   - Optimize bundle size

2. **Backend**
   - Implement caching strategies
   - Use database indexes
   - Optimize AI prompts

---

## Troubleshooting

### Common Error Messages

1. **"Cannot find module"**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **"Timeout exceeded"**
   ```javascript
   // Increase Jest timeout
   jest.setTimeout(30000);
   ```

3. **"Connection refused"**
   ```bash
   # Check services are running
   docker-compose up -d
   ```

### Debug Commands

```bash
# Run with Node debugging
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Run with verbose output
npm test -- --verbose --detectOpenHandles

# Check for memory leaks
npm test -- --logHeapUsage
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Performance Testing Guide](https://web.dev/vitals/)

For additional support, check the project's internal documentation or contact the development team.