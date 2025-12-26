{{
  config(
    materialized='table',
    tags=['marts', 'metrics', 'revenue']
  )
}}

WITH subscriptions AS (
  SELECT * FROM {{ ref('stg_subscriptions') }}
),

daily_mrr AS (
  SELECT
    DATE_TRUNC('day', d.date_day) AS metric_date,
    s.tier,

    -- MRR calculation
    SUM(CASE
      WHEN s.status = 'active'
        AND s.current_period_start <= d.date_day
        AND (s.current_period_end >= d.date_day OR s.current_period_end IS NULL)
      THEN s.amount
      ELSE 0
    END) AS mrr,

    -- Customer counts
    COUNT(DISTINCT CASE
      WHEN s.status = 'active'
        AND s.current_period_start <= d.date_day
        AND (s.current_period_end >= d.date_day OR s.current_period_end IS NULL)
      THEN s.user_id
    END) AS active_customers,

    -- New MRR
    SUM(CASE
      WHEN DATE(s.created_at) = d.date_day
      THEN s.amount
      ELSE 0
    END) AS new_mrr,

    -- Churned MRR
    SUM(CASE
      WHEN DATE(s.canceled_at) = d.date_day
      THEN s.amount
      ELSE 0
    END) AS churned_mrr,

    -- Expansion MRR (upgrades)
    0 AS expansion_mrr,  -- TODO: Implement upgrade tracking

    -- Contraction MRR (downgrades)
    0 AS contraction_mrr  -- TODO: Implement downgrade tracking

  FROM {{ ref('dim_date') }} d
  CROSS JOIN subscriptions s
  WHERE d.date_day >= '2024-01-01'
    AND d.date_day <= CURRENT_DATE
  GROUP BY 1, 2
),

with_movement AS (
  SELECT
    *,
    new_mrr + expansion_mrr - churned_mrr - contraction_mrr AS net_mrr_movement,
    mrr - LAG(mrr) OVER (PARTITION BY tier ORDER BY metric_date) AS mrr_growth

  FROM daily_mrr
)

SELECT * FROM with_movement
ORDER BY metric_date DESC, tier
