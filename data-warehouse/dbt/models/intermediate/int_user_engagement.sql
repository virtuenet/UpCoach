{{
  config(
    materialized='ephemeral',
    tags=['intermediate', 'engagement']
  )
}}

WITH users AS (
  SELECT * FROM {{ ref('stg_users') }}
),

checkins AS (
  SELECT * FROM {{ ref('stg_habit_checkins') }}
),

sessions AS (
  SELECT * FROM {{ ref('stg_user_sessions') }}
),

-- Calculate engagement metrics per user
user_checkin_metrics AS (
  SELECT
    user_id,
    COUNT(*) AS total_checkins,
    COUNT(DISTINCT checkin_date) AS active_days,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_checkins,
    COUNT(CASE WHEN status = 'missed' THEN 1 END) AS missed_checkins,
    MAX(created_at) AS last_checkin_at,
    DATEDIFF(day, MAX(created_at), CURRENT_TIMESTAMP) AS days_since_last_checkin
  FROM checkins
  GROUP BY user_id
),

user_session_metrics AS (
  SELECT
    user_id,
    COUNT(*) AS total_sessions,
    SUM(session_duration_minutes) AS total_session_minutes,
    AVG(session_duration_minutes) AS avg_session_duration_minutes,
    MAX(login_at) AS last_session_at,
    COUNT(DISTINCT session_date) AS active_session_days
  FROM sessions
  GROUP BY user_id
),

combined AS (
  SELECT
    u.user_id,
    u.created_at AS user_created_at,
    u.subscription_tier,
    u.subscription_status,

    -- Checkin metrics
    COALESCE(cm.total_checkins, 0) AS total_checkins,
    COALESCE(cm.active_days, 0) AS active_days,
    COALESCE(cm.completed_checkins, 0) AS completed_checkins,
    COALESCE(cm.missed_checkins, 0) AS missed_checkins,
    cm.last_checkin_at,
    COALESCE(cm.days_since_last_checkin, 999) AS days_since_last_checkin,

    -- Completion rate
    CASE
      WHEN cm.total_checkins > 0 THEN
        ROUND(100.0 * cm.completed_checkins / cm.total_checkins, 2)
      ELSE 0
    END AS completion_rate_pct,

    -- Session metrics
    COALESCE(sm.total_sessions, 0) AS total_sessions,
    COALESCE(sm.total_session_minutes, 0) AS total_session_minutes,
    COALESCE(sm.avg_session_duration_minutes, 0) AS avg_session_duration_minutes,
    sm.last_session_at,
    COALESCE(sm.active_session_days, 0) AS active_session_days,

    -- Engagement score (0-100)
    LEAST(100, GREATEST(0,
      (COALESCE(cm.active_days, 0) * 2) +
      (CASE WHEN cm.total_checkins > 0 THEN (100.0 * cm.completed_checkins / cm.total_checkins) ELSE 0 END * 0.5) +
      (COALESCE(sm.active_session_days, 0) * 1.5)
    )) AS engagement_score

  FROM users u
  LEFT JOIN user_checkin_metrics cm ON u.user_id = cm.user_id
  LEFT JOIN user_session_metrics sm ON u.user_id = sm.user_id
)

SELECT * FROM combined
