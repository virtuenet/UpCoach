# Week 2: Accelerate to 70% Test Coverage 🚀

**Start Date:** November 15, 2025 **Starting Point:** 61.3% (573/934 tests) **Target:** 70% (655/934
tests) **Tests Needed:** +82 tests

---

## Week 2 Strategy

### Core Philosophy

Build on Week 1's momentum by targeting **high-impact, systematic fixes** that unlock large test
suites.

### Success Metrics

- **Primary Goal:** 70% pass rate (655/934 tests)
- **Stretch Goal:** 75% pass rate (701/934 tests)
- **Test Suites:** 40+/55 passing (72%+)
- **Timeline:** 5-7 working sessions

---

## High-Impact Targets (Ranked)

### Tier 1: AI Services Stack (68 tests total)

**Estimated Impact:** +60-68 tests | **Difficulty:** Medium | **Priority:** 🔥 HIGHEST

1. **AIService.test.ts** - 0/40 passing
   - OpenAI SDK mocking needed
   - Streaming response handling
   - Multiple AI provider support
   - **Value:** Core service, unlocks AIController

2. **AIController.test.ts** - 0/28 passing
   - Depends on AIService mock
   - API endpoint testing
   - Request/response validation
   - **Value:** User-facing API coverage

**Strategy:**

- Create comprehensive OpenAI SDK mock
- Mock streaming responses with async iterators
- Apply WebAuthn success pattern (systematic mock → test alignment)

---

### Tier 2: Redis Infrastructure (33 tests)

**Estimated Impact:** +25-33 tests | **Difficulty:** High | **Priority:** 🔥 HIGH

3. **RedisService.test.ts** - 0/33 passing
   - Singleton pattern challenges
   - Complex Redis operation mocking
   - Connection lifecycle testing
   - **Blocker:** Deferred in Week 1 due to complexity

**Strategy:**

- Implement dependency injection for testability
- OR: Create factory pattern for test instances
- Leverage enhanced Redis mock from Week 1
- Apply lessons from RedisService.simple.test.ts success

---

### Tier 3: Middleware Completion (14 tests)

**Estimated Impact:** +10-14 tests | **Difficulty:** Medium | **Priority:** MEDIUM

4. **middleware/auth.test.ts** - 4/18 passing
   - JWT token edge cases
   - Request fingerprinting
   - Token refresh flows
   - **Value:** Critical security layer coverage

**Strategy:**

- Build on Week 1 JWT fixes
- Add comprehensive request mocking
- Test all middleware error paths

---

### Tier 4: E2E User Journeys (50-75 tests)

**Estimated Impact:** +30-50 tests | **Difficulty:** High | **Priority:** MEDIUM

5. **E2E Journey Tests** - Multiple files, all failing
   - coach-revenue-journey.test.ts
   - subscription-monetization-journey.test.ts
   - user-onboarding-journey.test.ts
   - goal-management-flow.test.ts
   - coaching-session-flow.test.ts
   - payment-flow.test.ts

**Strategy:**

- Create shared E2E test fixtures
- Mock external services (Stripe, SendGrid, etc.)
- Focus on happy paths first
- Build test data factories

---

### Tier 5: Smaller Opportunities (20-30 tests)

**Estimated Impact:** +15-25 tests | **Difficulty:** Low-Medium | **Priority:** LOW

6. **controllers/CoachController.test.ts** - Unknown pass rate
7. **controllers/FinancialDashboardController.test.ts** - Unknown pass rate
8. **services/EmailService.test.ts** - Unknown pass rate
9. **services/GDPRService.test.ts** - Unknown pass rate
10. **services/CoachIntelligenceService.test.ts** - Unknown pass rate

---

## Week 2 Session Plan

### Session 1: AI Services Foundation (TODAY)

**Goal:** Fix AIService.test.ts - target 30/40 tests passing **Approach:**

- Create OpenAI SDK mock with all required methods
- Mock streaming responses using async generators
- Fix configuration and API key mocking
- **Expected Gain:** +25-30 tests

### Session 2: AI Stack Completion

**Goal:** Complete AIService + AIController.test.ts **Approach:**

- Finish remaining AIService tests
- Apply AIService mock to AIController tests
- Fix controller endpoint testing
- **Expected Gain:** +35-40 tests | **Cumulative:** ~610-615 tests (65-66%)

### Session 3: Redis Service Deep Dive

**Goal:** Fix RedisService.test.ts - target 25/33 tests passing **Approach:**

- Implement dependency injection OR factory pattern
- Leverage manual Redis mock
- Fix singleton test challenges
- **Expected Gain:** +20-25 tests | **Cumulative:** ~635-640 tests (68%)

### Session 4: Middleware & Quick Wins

**Goal:** Complete auth middleware + small test files **Approach:**

- Fix remaining 14 middleware/auth tests
- Knock out 2-3 small service test files
- **Expected Gain:** +20-25 tests | **Cumulative:** ~655-665 tests (70%+)

### Session 5+: E2E & Stretch Goals

**Goal:** E2E journey tests + push toward 75% **Approach:**

- Create E2E test infrastructure
- Fix highest-value journey tests
- Continue small file wins
- **Expected Gain:** +30-50 tests | **Cumulative:** 685-715 tests (73-77%)

---

## Technical Preparation

### Mocks to Create

1. **OpenAI SDK Mock** (Priority 1)

   ```javascript
   // src/tests/__mocks__/openai.js
   - ChatCompletion API
   - Streaming responses
   - Error handling
   - Rate limiting simulation
   ```

2. **Stripe SDK Mock** (Priority 2)

   ```javascript
   // src/tests/__mocks__/stripe.js
   - Payment intents
   - Subscriptions
   - Webhooks
   - Customer management
   ```

3. **SendGrid Mock** (Priority 3)
   ```javascript
   // src/tests/__mocks__/@sendgrid/mail.js
   - Email sending
   - Template rendering
   - Batch operations
   ```

### Infrastructure Improvements

1. **Test Data Factories**
   - User factory (extend existing)
   - Coach factory
   - Session factory
   - Payment factory

2. **Shared Test Utilities**
   - Authentication helpers
   - Database seeding
   - Mock request builders
   - Assertion helpers

3. **Environment Setup**
   - Dedicated test database
   - Redis test instance
   - Mock API servers (Stripe, OpenAI)

---

## Success Criteria

### Minimum Success (70%)

- ✅ 655/934 tests passing (70.1%)
- ✅ AIService fully working (40/40)
- ✅ AIController fully working (28/28)
- ✅ 2-3 additional test files at 100%

### Target Success (72-73%)

- ✅ 675/934 tests passing (72.3%)
- ✅ AI stack complete (68 tests)
- ✅ RedisService mostly working (25/33)
- ✅ Auth middleware complete (18/18)
- ✅ 5+ test files at 100%

### Stretch Success (75%)

- ✅ 701/934 tests passing (75%)
- ✅ All Tier 1-3 targets complete
- ✅ 2-3 E2E journeys working
- ✅ 42+/55 test suites passing

---

## Risk Mitigation

### Known Challenges

1. **OpenAI Streaming Responses**
   - **Risk:** Complex async iterator mocking
   - **Mitigation:** Study existing stream mocks, use simple generators

2. **Redis Singleton Pattern**
   - **Risk:** Same issue that blocked Week 1
   - **Mitigation:** Research dependency injection patterns, consider factory

3. **E2E Test Complexity**
   - **Risk:** Multiple service dependencies, long test chains
   - **Mitigation:** Start with simpler journeys, build shared fixtures

4. **External API Mocking**
   - **Risk:** Stripe/OpenAI have complex APIs
   - **Mitigation:** Mock only methods we actually use, not full SDK

### Contingency Plans

If targets prove too difficult:

- **Fallback 1:** Focus on smaller service files (EmailService, GDPRService)
- **Fallback 2:** Improve existing partial-pass files (middleware/auth, CoachController)
- **Fallback 3:** Create more model mocks (Goal, Task, Mood) for +15-20 tests

---

## Week 1 Lessons Applied

### What Worked ✅

1. **Parallel agent execution** - Use for independent test files
2. **Infrastructure-first fixes** - Mock quality > quantity
3. **Real vs mocked dependencies** - Sometimes real is better (JWT)
4. **Systematic approach** - Fix root causes, not symptoms
5. **Quick wins first** - Build momentum with high-pass-rate files

### What to Improve 🔧

1. **Earlier agent deployment** - Start parallel work sooner
2. **Mock planning** - Create comprehensive mocks before fixing tests
3. **Test file analysis** - Understand all failures before starting
4. **Documentation as we go** - Don't save for end
5. **Incremental validation** - Run tests more frequently

---

## Daily Targets

### Day 1 (Today): AI Services

- Target: +30 tests → 603/934 (64.5%)
- Focus: AIService.test.ts

### Day 2: AI Stack Complete

- Target: +38 tests → 641/934 (68.6%)
- Focus: AIService + AIController

### Day 3: Redis Deep Dive

- Target: +25 tests → 666/934 (71.3%)
- Focus: RedisService.test.ts

### Day 4: Middleware & Quick Wins

- Target: +20 tests → 686/934 (73.4%)
- Focus: auth middleware + small files

### Day 5: E2E & Polish

- Target: +15 tests → 701/934 (75%)
- Focus: E2E journeys + final cleanup

---

## Tracking & Metrics

### Daily Check-in Questions

1. What was today's pass rate improvement?
2. Which patterns emerged from successful fixes?
3. What blockers were encountered?
4. What's the next highest-value target?
5. Are we on track for 70%?

### Progress Dashboard

| Day    | Tests Passing | Pass Rate | Daily Gain | Cumulative Gain |
| ------ | ------------- | --------- | ---------- | --------------- |
| W1 End | 573           | 61.3%     | -          | Baseline        |
| D1     | TBD           | TBD       | TBD        | TBD             |
| D2     | TBD           | TBD       | TBD        | TBD             |
| D3     | TBD           | TBD       | TBD        | TBD             |
| D4     | TBD           | TBD       | TBD        | TBD             |
| D5     | TBD           | TBD       | TBD        | TBD             |

---

## Let's Begin! 🚀

**First Task:** Create OpenAI SDK mock and fix AIService.test.ts

**Expected Outcome:** 30-35/40 AIService tests passing, unlocking path to AIController

**Confidence Level:** High - leveraging Week 1 mock patterns and systematic approach

---

_Week 2 Kickoff - November 15, 2025_ _Starting: 573/934 (61.3%) → Target: 655/934 (70%)_
