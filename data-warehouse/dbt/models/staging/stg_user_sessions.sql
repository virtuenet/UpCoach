{{
  config(
    materialized='view',
    tags=['staging', 'sessions']
  )
}}

WITH source AS (
  SELECT * FROM {{ source('upcoach', 'user_sessions') }}
),

renamed AS (
  SELECT
    id AS session_id,
    user_id,
    device_type,
    platform,
    app_version,
    login_at,
    logout_at,
    created_at,
    updated_at,

    -- Calculate session metrics
    DATEDIFF(minute, login_at, COALESCE(logout_at, CURRENT_TIMESTAMP)) AS session_duration_minutes,
    DATE(login_at) AS session_date,
    DATE_TRUNC('month', login_at) AS session_month,
    EXTRACT(HOUR FROM login_at) AS login_hour,
    EXTRACT(DOW FROM login_at) AS login_day_of_week,

    -- Session flags
    CASE WHEN logout_at IS NULL THEN TRUE ELSE FALSE END AS is_active_session

  FROM source
)

SELECT * FROM renamed
