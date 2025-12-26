{{
  config(
    materialized='table',
    tags=['marts', 'dimensions']
  )
}}

WITH users AS (
  SELECT * FROM {{ ref('stg_users') }}
),

engagement AS (
  SELECT * FROM {{ ref('int_user_engagement') }}
),

final AS (
  SELECT
    u.user_id,
    u.email,
    u.name,
    u.subscription_tier,
    u.subscription_status,
    u.trial_ends_at,
    u.subscription_started_at,
    u.subscription_cancelled_at,
    u.created_at,
    u.last_login_at,
    u.tenant_id,
    u.is_active,
    u.is_admin,

    -- Engagement metrics
    e.engagement_score,
    e.total_checkins,
    e.completion_rate_pct,
    e.days_since_last_checkin,
    e.total_sessions,
    e.avg_session_duration_minutes,

    -- User lifecycle
    DATEDIFF(day, u.created_at, CURRENT_TIMESTAMP) AS days_since_signup,
    CASE
      WHEN u.subscription_status = 'active' THEN 'active'
      WHEN u.subscription_status = 'trialing' THEN 'trial'
      WHEN u.subscription_status = 'cancelled' THEN 'churned'
      WHEN e.days_since_last_checkin > 30 THEN 'at_risk'
      ELSE 'inactive'
    END AS user_lifecycle_stage,

    -- Timestamps
    CURRENT_TIMESTAMP AS dbt_updated_at

  FROM users u
  LEFT JOIN engagement e ON u.user_id = e.user_id
)

SELECT * FROM final
