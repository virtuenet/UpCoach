# Advanced Analytics & Reporting – Requirements

## Objectives

1. **Coach effectiveness** – quantify how goals, habits, and AI nudges improve outcomes.
2. **Engagement pulse** – detect churn risk early via product usage telemetry.
3. **Revenue intelligence** – unify subscription + in-app purchases + cohort data.
4. **Operational insight** – provide exportable/embedded dashboards for execs & coaches.

## Key Metrics

| Category | Metric | Definition | Cadence |
|----------|--------|------------|---------|
| Goals | `goal_completion_rate` | completed goals / active goals per cohort | daily |
| Habits | `habit_adherence_score` | rolling 7-day adherence with weight for streaks | hourly ingestion / daily summary |
| AI | `ai_nudge_effectiveness` | percent of AI nudges that lead to engagement within 24h | hourly |
| Revenue | `net_mrr`, `expansion_mrr`, `contraction_mrr`, `churn_mrr` | aligned with Stripe/SaaS metrics definitions | daily |
| Cohorts | `week_n_retention` | retention curve per signup cohort | weekly |
| Engagement | `active_minutes`, `sessions_per_user`, `message_response_time` | aggregated from realtime service + chat | hourly |

## Data Sources

- **Postgres (services/api)** – canonical goals, habits, chats, tasks.
- **Stripe + financial service** – subscription + payment events (via existing webhook).
- **Redis events / realtime metrics** – fine-grained engagement logs.
- **Mobile analytics** – local offline events forwarded through Sync service.

## Storage Strategy

| Layer | Tooling | Notes |
|-------|---------|-------|
| Raw events | `analytics.events` table (JSONB) + S3 parquet export | Append-only partitioned by day. |
| Aggregations | Materialized views in Postgres (`analytics.goal_summary_mv`, etc.) | Refreshed via cron / background worker. |
| Warehouse (optional) | BigQuery or Snowflake (phase 2) | For long-term trend analysis. |
| Caching | Redis keys (`analytics:goal:{orgId}`) | Serve dashboard quickly. |

## API Surface (planned)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/goals/overview` | GET | KPI cards for SMART goals. |
| `/api/analytics/habits/adherence` | GET | Time series for adherence score. |
| `/api/analytics/ai/nudges` | GET | Nudge effectiveness + breakdown by persona. |
| `/api/analytics/revenue/kpis` | GET | Net MRR, churn, expansion metrics. |
| `/api/analytics/cohorts/{cohortId}` | GET | Cohort deep dive. |
| `/api/analytics/exports` | POST | Async job to export data (CSV/PDF). |

## Dashboards (Web)

- `apps/web/src/features/analytics/RevenueDashboard.tsx`
  - MRR cards, plan breakdown donut, ARR forecast line chart.
- `apps/web/src/features/analytics/EngagementDashboard.tsx`
  - Session heatmap, daily active users, chat response SLA.
- `apps/web/src/features/analytics/CoachInsights.tsx`
  - Leaderboard for coaches vs completion rate.

Use `@upcoach/ui` chart primitives (wrapping `recharts`) with `zod` validated data fetching hooks.

## Reporting & Exports

1. Asynchronous export jobs stored in `report_jobs` table (`id`, `type`, `status`, `payload`, `s3_url`).
2. Background worker (BullMQ) generates CSV/PDF using `report-builder` shared lib.
3. Exports expire in 14 days; accessible via signed URL.

## Access Control

- Analytics APIs require `role ∈ {admin, coach}` by default.
- Multi-tenant support through `tenant_id` filter in every query (see `docs/architecture/MULTI_TENANT.md` once drafted).
- Rate limiting: 60 requests/minute per tenant for heavy aggregations.

## Next Steps

1. Design Prisma/Sequelize migrations for analytics schemas.
2. Build cron/queue workers to refresh materialized views.
3. Implement `/api/analytics/*` endpoints + tests.
4. Ship new web dashboards behind feature flag `analytics_v2`.
# Analytics & Reporting Requirements

_Version 1.0 – November 21, 2025_

This document defines the KPIs, data sources, and storage strategy for the Advanced Analytics initiative.

---

## 1. Business KPIs

| Pillar | KPI | Definition | Target |
|--------|-----|------------|--------|
| Engagement | Weekly Active Users (WAU) | Distinct users completing any tracked action in a 7-day window | 25% WoW increase |
| Goals | Goal Completion Rate | `Completed goals / Active goals` per cohort | ≥ 65% |
| Habits | Habit Adherence | Avg. streak length + completion percentage | ≥ 4.5 days |
| Coaching | AI Session Satisfaction | Avg. rating from post-session surveys | ≥ 4.2/5 |
| Revenue | MRR, ARPU, Churn | Derived from Stripe subscriptions + RevenueCat entitlements | MRR +15% QoQ |
| Retention | D1 / D7 / D30 | Cohort retention curves stored in warehouse | D7 ≥ 40% |

---

## 2. Data Sources

- **PostgreSQL OLTP (`services/api`):** goals, habits, tasks, mood entries, chat logs
- **Stripe Webhooks:** subscription lifecycle events
- **RevenueCat Webhooks:** mobile entitlement events
- **Supabase Realtime:** mobile engagement
- **Mixpanel Export API:** raw event stream (optional)

---

## 3. Storage Strategy

| Layer | Technology | Purpose |
|-------|------------|---------|
| Raw Landing | AWS S3 (`s3://upcoach-analytics-landing`) | Append-only parquet files (daily partition) |
| Warehouse | Snowflake (preferred) / BigQuery | Historical joins + Looker dashboards |
| Operational Cache | Redis Hashes (`analytics:*`) | Quick `/analytics` API responses |

**Ingestion cadence**

- **Streaming:** Stripe / RevenueCat webhooks → SNS → Lambda → Postgres + S3
- **Batch (hourly):** Debezium CDC → Kafka → Snowflake
- **Batch (daily):** dbt transformations → `analytics_*` materialized views

---

## 4. Exposed APIs

| Endpoint | Description | Auth |
|----------|-------------|------|
| `GET /api/analytics/overview` | Aggregated KPIs for dashboard cards | Admin |
| `GET /api/analytics/goals` | Goal completion time-series (filter by cohort) | Admin/Coach |
| `GET /api/analytics/habits` | Habit adherence metrics | Admin/Coach |
| `GET /api/analytics/revenue` | Subscription + entitlement metrics | Finance |
| `GET /api/analytics/export` | CSV export trigger (async) | Admin |

---

## 5. Data Model (Warehouse)

```sql
-- Fact table
FACT_PRODUCTIVITY (
  date_key DATE,
  user_id UUID,
  goals_completed INT,
  habits_checked INT,
  mood_avg NUMERIC,
  chat_sessions INT,
  revenue_cents INT
)

DIM_USER (
  user_id UUID PRIMARY KEY,
  signup_date DATE,
  plan VARCHAR,
  tenant_id UUID,
  coach_id UUID
)
```

---

## 6. Security & Compliance

- All personally identifiable information (PII) is hashed before landing zone
- Warehouse access via SSO + row-level security (tenant_id)
- Data retention: 24 months (per GDPR & CCPA)
- Audit logs stored in `analytics_audit_log` table

---

## 7. Next Steps

1. Implement ingestion Lambda for Stripe + RevenueCat
2. Create dbt models for `FACT_PRODUCTIVITY` and `DIM_SUBSCRIPTION`
3. Build `/analytics/overview` endpoint (see `services/api/src/routes/analytics.ts`)
4. Publish Looker dashboards (KPIs + drill-downs)

