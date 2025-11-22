# Analytics Testing Guide

## Automated Coverage

| Layer | Location | Command | What it Verifies |
|-------|----------|---------|------------------|
| API analytics service | `services/api/src/services/analytics/__tests__/AnalyticsService.test.ts` | `cd services/api && npm run test -- AnalyticsService` | SQL aggregation logic + graceful fallbacks when tables missing. |
| Admin UI dashboard | `apps/admin-panel/src/pages/__tests__/AnalyticsPage.test.tsx` | `cd apps/admin-panel && npm run test -- AnalyticsPage` | React Query wiring + rendering of goal/habit/engagement widgets. |

> **Tip:** add `--watch` during development for faster feedback.

## Manual Smoke Tests

1. **Backend**
   - `npm run dev` in `services/api`.
   - Hit `GET /api/analytics/v2/goals/overview` with a valid bearer token.
   - Confirm JSON includes `totalGoals`, `completedGoals`, `completionRate`.
2. **Admin Panel**
   - `npm run dev` in `apps/admin-panel`.
   - Navigate to `/analytics`.
   - Validate cards, charts, and toggle controls render without errors.

## CI Integration

- `ci-api.yml` executes backend unit + integration suites (analytics tests included automatically).
- `ci-web.yml` runs Vitest, so the new dashboard test is enforced on every PR.

## Future Enhancements

- Add Playwright E2E flow that loads `/analytics`, triggers toggle buttons, and asserts chart tooltips.
- Implement contract/integration tests that seed synthetic data and hit live `/analytics/v2` endpoints.
- Expand snapshot tests for `GoalOverviewCards` to monitor UI changes.


