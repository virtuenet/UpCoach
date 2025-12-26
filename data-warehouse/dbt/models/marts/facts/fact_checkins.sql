{{
  config(
    materialized='incremental',
    unique_key='checkin_id',
    on_schema_change='append_new_columns',
    tags=['marts', 'facts', 'incremental']
  )
}}

WITH checkins AS (
  SELECT * FROM {{ ref('stg_habit_checkins') }}
  {% if is_incremental() %}
  WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
  {% endif %}
),

habits AS (
  SELECT * FROM {{ ref('stg_habits') }}
),

users AS (
  SELECT * FROM {{ ref('dim_users') }}
),

final AS (
  SELECT
    c.checkin_id,
    c.habit_id,
    c.user_id,
    c.status,
    c.checkin_date,
    c.checkin_month,
    c.checkin_week,
    c.day_of_week,
    c.hour_of_day,
    c.created_at,
    c.scheduled_for,
    c.completed_at,

    -- Habit attributes
    h.name AS habit_name,
    h.category AS habit_category,
    h.frequency AS habit_frequency,

    -- User attributes
    u.subscription_tier AS user_subscription_tier,
    u.user_lifecycle_stage,

    -- Metrics
    CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END AS is_completed,
    CASE WHEN c.status = 'missed' THEN 1 ELSE 0 END AS is_missed,

    -- Timestamps
    CURRENT_TIMESTAMP AS dbt_updated_at

  FROM checkins c
  LEFT JOIN habits h ON c.habit_id = h.habit_id
  LEFT JOIN users u ON c.user_id = u.user_id
)

SELECT * FROM final
