{{
  config(
    materialized='view',
    tags=['staging', 'goals']
  )
}}

WITH source AS (
  SELECT * FROM {{ source('upcoach', 'goals') }}
),

renamed AS (
  SELECT
    id AS goal_id,
    user_id,
    title,
    description,
    category,
    target_value,
    current_value,
    progress_percentage,
    status,
    deadline,
    priority,
    created_at,
    updated_at,
    completed_at,
    deleted_at,

    -- Calculate goal metrics
    DATEDIFF(day, created_at, COALESCE(completed_at, CURRENT_TIMESTAMP)) AS days_active,
    DATEDIFF(day, CURRENT_TIMESTAMP, deadline) AS days_until_deadline,
    CASE
      WHEN status = 'completed' THEN DATEDIFF(day, created_at, completed_at)
      ELSE NULL
    END AS days_to_complete

  FROM source
  WHERE deleted_at IS NULL
)

SELECT * FROM renamed
