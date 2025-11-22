# API Documentation Gap Analysis

This inventory lists the highest-impact API endpoints that previously lacked Swagger/OpenAPI coverage. Each entry includes the owning route file and a short rationale for prioritization. ✅ **Status:** All items documented on November 21, 2025 (kept here for historical tracking).

| # | Endpoint | Method | Route File | Why It Matters |
|---|----------|--------|------------|----------------|
| 1 | `/api/users/profile` | GET | `services/api/src/routes/users.ts` | Returns the core user profile payload used across dashboards and mobile clients. |
| 2 | `/api/users/profile` | PUT | `services/api/src/routes/users.ts` | Handles self-service profile updates; needs request/response schema and validation notes. |
| 3 | `/api/users/statistics` | GET | `services/api/src/routes/users.ts` | Powers engagement analytics in the dashboard; consumers need documented shape of the `statistics` object. |
| 4 | `/api/users/account` | DELETE | `services/api/src/routes/users.ts` | GDPR/account deletion workflow; requires explicit confirmation payload and error codes. |
| 5 | `/api/users/all` | GET | `services/api/src/routes/users.ts` | Admin-only listing endpoint; must document RBAC requirements and pagination contract. |
| 6 | `/api/users/:id` | GET | `services/api/src/routes/users.ts` | Admin lookup by ID; consumers need path parameter description and response DTO. |
| 7 | `/api/users/:id` | DELETE | `services/api/src/routes/users.ts` | Admin deactivation endpoint; should describe safeguards (cannot delete self) and error cases. |
| 8 | `/api/financial/webhook/stripe` | POST | `services/api/src/routes/financial.ts` | Stripe webhook entry point; needs raw body expectations, signature validation, and retry semantics. |
| 9 | `/api/financial/dashboard` | GET | `services/api/src/routes/financial.ts` | Baseline financial KPIs for executives; important to detail the metrics object structure. |
|10 | `/api/financial/dashboard/revenue` | GET | `services/api/src/routes/financial.ts` | Surfaces revenue breakdowns used in quarterly reporting. |
|11 | `/api/financial/revenue/mrr` | GET | `services/api/src/routes/financial.ts` | Critical SaaS KPI; needs enum definitions for filters and numeric precision notes. |
|12 | `/api/financial/revenue/arr` | GET | `services/api/src/routes/financial.ts` | Complements MRR documentation for annualized revenue dashboards. |
|13 | `/api/financial/reports` | GET | `services/api/src/routes/financial.ts` | Lists generated finance reports; requires pagination and filtering docs. |
|14 | `/api/financial/reports` | POST | `services/api/src/routes/financial.ts` | Creates custom finance reports; must capture validation constraints for payload fields. |
|15 | `/api/financial/reports/:id/send` | POST | `services/api/src/routes/financial.ts` | Triggers email delivery of a report; needs explanation of permissions and throttling. |
|16 | `/api/financial/reports/schedule` | POST | `services/api/src/routes/financial.ts` | Schedules recurring reports; request body has complex validation that should be documented. |
|17 | `/api/financial/revenue/by-plan` | GET | `services/api/src/routes/financial.ts` | Breaks down revenue per subscription plan; valuable for growth and pricing teams. |

> **Next Action:** For each endpoint above, add a `@swagger` block in the referenced route file and update `services/api/docs/API_DOCUMENTATION_GUIDE.md` with the new coverage percentage.

