{{
  config(
    materialized='view',
    tags=['staging', 'checkins']
  )
}}

WITH source AS (
  SELECT * FROM {{ source('upcoach', 'habit_checkins') }}
),

renamed AS (
  SELECT
    id AS checkin_id,
    habit_id,
    user_id,
    status,
    notes,
    created_at,
    scheduled_for,
    completed_at,
    updated_at,

    -- Extract date components for partitioning
    DATE(created_at) AS checkin_date,
    DATE_TRUNC('month', created_at) AS checkin_month,
    DATE_TRUNC('week', created_at) AS checkin_week,
    EXTRACT(DOW FROM created_at) AS day_of_week,
    EXTRACT(HOUR FROM created_at) AS hour_of_day

  FROM source
)

SELECT * FROM renamed
