#!/bin/bash

# Array of all test files
test_files=(
  "basic.test.ts"
  "minimal.test.ts"
  "utils/logger.minimal.test.ts"
  "controllers/health.minimal.test.ts"
  "services/UserService.minimal.test.ts"
  "auth/auth-routes.test.ts"
  "contracts/auth-api.contract.test.ts"
  "contracts/coaching-api.contract.test.ts"
  "contracts/financial-api.contract.test.ts"
  "contracts/referral-api.contract.test.ts"
  "contracts/goals-api.contract.test.ts"
  "controllers/CoachController.test.ts"
  "controllers/FinancialDashboardController.test.ts"
  "e2e-critical/coach-revenue-journey.test.ts"
  "e2e-critical/subscription-monetization-journey.test.ts"
  "e2e-critical/user-onboarding-journey.test.ts"
  "e2e/complete-user-journeys.test.ts"
  "integration/goal-management-flow.test.ts"
  "integration/coaching-session-flow.test.ts"
  "integration/payment-flow.test.ts"
  "integration/user-registration-flow.test.ts"
  "middleware/auth.test.ts"
  "routes/health.test.ts"
  "service-integration/ABTestingService.test.ts"
  "service-integration/CoachingSessionService.test.ts"
  "service-integration/GoalManagementService.test.ts"
  "service-integration/ReferralService.test.ts"
  "service-integration/PaymentManagementService.test.ts"
  "service-integration/UserRegistrationService.test.ts"
  "services/CoachIntelligenceService.test.ts"
  "services/AIService.test.ts"
  "services/EmailService.test.ts"
  "services/GDPRService.test.ts"
  "services/RedisService.simple.test.ts"
  "services/GamificationService.test.ts"
  "services/SchedulerService.test.ts"
  "services/StripeWebhookService.test.ts"
  "services/TwoFactorAuthService.test.ts"
  "services/WebAuthnService.test.ts"
  "validation/auth.validation.test.ts"
  "security/auth-authorization.test.ts"
  "security/input-validation.test.ts"
  "performance/memory-leaks.test.ts"
  "performance/critical-endpoints.test.ts"
  "controllers/AIController.test.ts"
  "models/User.test.ts"
  "models/User.unit.test.ts"
  "services/RedisService.test.ts"
  "services/UserService.test.ts"
  "utils/security.test.ts"
)

echo "FILE|PASSED|FAILED|TOTAL|PASS_RATE" > test-results.csv

for test_file in "${test_files[@]}"; do
  echo "Testing: $test_file"

  # Run the test and capture output
  output=$(npm test -- --testPathPattern="$test_file" --silent 2>&1)

  # Extract test counts using various patterns
  if echo "$output" | grep -q "Tests:"; then
    # Parse the "Tests: X passed, Y failed, Z total" format
    passed=$(echo "$output" | grep "Tests:" | sed -n 's/.*Tests:.*\([0-9]\+\) passed.*/\1/p' | tail -1)
    failed=$(echo "$output" | grep "Tests:" | sed -n 's/.*Tests:.*\([0-9]\+\) failed.*/\1/p' | tail -1)
    total=$(echo "$output" | grep "Tests:" | sed -n 's/.*Tests:.*\([0-9]\+\) total.*/\1/p' | tail -1)

    # Handle cases where passed or failed might be empty
    passed=${passed:-0}
    failed=${failed:-0}
    total=${total:-0}

    # Calculate pass rate
    if [ "$total" -gt 0 ]; then
      pass_rate=$(echo "scale=2; $passed * 100 / $total" | bc)
    else
      pass_rate=0
    fi

    echo "$test_file|$passed|$failed|$total|$pass_rate" >> test-results.csv
  else
    echo "$test_file|0|0|0|0" >> test-results.csv
  fi

  sleep 0.5
done

echo "Results saved to test-results.csv"
cat test-results.csv
