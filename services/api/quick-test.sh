#!/bin/bash

# Test key files that showed promise
echo "Testing files with high pass rates..."
echo ""

test_and_report() {
  local file=$1
  echo "Testing: $file"
  output=$(npm test -- --testPathPattern="$file" --silent 2>&1 | grep "Tests:")
  echo "  $output"
  echo ""
}

# Files that showed 100% or high pass rates
test_and_report "basic.test.ts"
test_and_report "minimal.test.ts"
test_and_report "controllers/health.minimal.test.ts"
test_and_report "services/UserService.minimal.test.ts"
test_and_report "routes/health.test.ts"
test_and_report "services/SchedulerService.test.ts"
test_and_report "services/TwoFactorAuthService.test.ts"
test_and_report "services/GamificationService.test.ts"
test_and_report "models/User.test.ts"
test_and_report "models/User.unit.test.ts"
test_and_report "service-integration/ABTestingService.test.ts"
test_and_report "service-integration/CoachingSessionService.test.ts"
test_and_report "service-integration/GoalManagementService.test.ts"
test_and_report "service-integration/ReferralService.test.ts"
test_and_report "service-integration/PaymentManagementService.test.ts"
test_and_report "service-integration/UserRegistrationService.test.ts"
test_and_report "contracts/auth-api.contract.test.ts"
test_and_report "contracts/coaching-api.contract.test.ts"
test_and_report "contracts/financial-api.contract.test.ts"
test_and_report "contracts/referral-api.contract.test.ts"
test_and_report "contracts/goals-api.contract.test.ts"
test_and_report "validation/auth.validation.test.ts"
test_and_report "security/auth-authorization.test.ts"
test_and_report "security/input-validation.test.ts"
test_and_report "performance/memory-leaks.test.ts"
test_and_report "performance/critical-endpoints.test.ts"
test_and_report "services/UserService.test.ts"
test_and_report "utils/security.test.ts"

# Files with some failures but high pass rate
test_and_report "utils/logger.minimal.test.ts"
test_and_report "services/WebAuthnService.test.ts"
test_and_report "services/RedisService.simple.test.ts"
test_and_report "auth/auth-routes.test.ts"
test_and_report "middleware/auth.test.ts"
