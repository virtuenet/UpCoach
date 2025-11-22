#!/bin/bash

# List of all test files
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

echo "Analyzing test files..."
echo ""

# CSV header
echo "file,passed,failed,total,pass_rate" > test-results.csv

total_files=${#test_files[@]}
current=0

for test_file in "${test_files[@]}"; do
  current=$((current + 1))
  echo "[$current/$total_files] Testing: $test_file"

  # Run the test and capture output
  output=$(npm test -- --testPathPattern="$test_file" --silent 2>&1)

  # Check if test ran successfully
  if echo "$output" | grep -q "Tests:"; then
    # Extract test counts
    passed=$(echo "$output" | grep "Tests:" | sed -E 's/.*Tests:[^0-9]*([0-9]+) passed.*/\1/' | tail -1)
    failed=$(echo "$output" | grep "Tests:" | grep -o "[0-9]* failed" | grep -o "[0-9]*" | tail -1)
    total=$(echo "$output" | grep "Tests:" | sed -E 's/.*([0-9]+) total.*/\1/' | tail -1)

    # Handle cases where numbers might be empty
    if [ -z "$passed" ]; then passed=0; fi
    if [ -z "$failed" ]; then failed=0; fi
    if [ -z "$total" ]; then total=0; fi

    # Calculate pass rate
    if [ "$total" -gt 0 ]; then
      pass_rate=$(echo "scale=1; $passed * 100 / $total" | bc)
    else
      pass_rate=0
    fi

    echo "$test_file,$passed,$failed,$total,$pass_rate" >> test-results.csv
  else
    echo "$test_file,0,0,0,0" >> test-results.csv
  fi
done

echo ""
echo "Analysis complete! Results saved to test-results.csv"
echo ""

# Now analyze the results
python3 - << 'EOF'
import csv

# Read results
with open('test-results.csv', 'r') as f:
    reader = csv.DictReader(f)
    results = list(reader)

# Convert to proper types
for r in results:
    r['passed'] = int(r['passed'])
    r['failed'] = int(r['failed'])
    r['total'] = int(r['total'])
    r['pass_rate'] = float(r['pass_rate'])

# Filter for high pass rate files (>70% and at least some tests passing)
high_pass = [r for r in results if r['pass_rate'] >= 70 and r['passed'] > 0]

# Sort by pass rate desc, then by number of failures asc
high_pass.sort(key=lambda x: (-x['pass_rate'], x['failed']))

print("=" * 90)
print("TOP 10 QUICK WIN CANDIDATES (>70% Pass Rate)")
print("=" * 90)
print()

if high_pass:
    for i, r in enumerate(high_pass[:10], 1):
        print(f"{i}. {r['file']}")
        print(f"   {r['passed']}/{r['total']} passing ({r['pass_rate']:.1f}%, {r['failed']} failure{'s' if r['failed'] != 1 else ''})")
        print()
else:
    print("No files found with >70% pass rate")
    print()

# Show all files sorted by pass rate
print("\n" + "=" * 90)
print("ALL TEST FILES BY PASS RATE")
print("=" * 90)
print()

all_sorted = sorted(results, key=lambda x: (-x['pass_rate'], x['failed']))
for r in all_sorted:
    status = "✓" if r['pass_rate'] >= 70 else "✗"
    print(f"{status} {r['file']:<55} {r['passed']:3}/{r['total']:3} ({r['pass_rate']:5.1f}%) - {r['failed']} failing")

print()
print("=" * 90)
print(f"Total files analyzed: {len(results)}")
print(f"Files with >70% pass rate: {len(high_pass)}")
print(f"Files with >80% pass rate: {len([r for r in results if r['pass_rate'] >= 80])}")
print(f"Files with 100% pass rate: {len([r for r in results if r['pass_rate'] == 100])}")
EOF
