{{
  config(
    materialized='view',
    tags=['staging', 'habits']
  )
}}

WITH source AS (
  SELECT * FROM {{ source('upcoach', 'habits') }}
),

renamed AS (
  SELECT
    id AS habit_id,
    user_id,
    name,
    description,
    category,
    frequency,
    target_days_per_week,
    reminder_time,
    icon,
    color,
    streak_count,
    longest_streak,
    total_completions,
    status,
    created_at,
    updated_at,
    deleted_at,
    archived_at

  FROM source
)

SELECT * FROM renamed
