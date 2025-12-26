{{
  config(
    materialized='view',
    tags=['staging', 'users']
  )
}}

WITH source AS (
  SELECT * FROM {{ source('upcoach', 'users') }}
),

renamed AS (
  SELECT
    id AS user_id,
    email,
    name,
    subscription_tier,
    subscription_status,
    trial_ends_at,
    subscription_started_at,
    subscription_cancelled_at,
    created_at,
    updated_at,
    deleted_at,

    -- Parse notification preferences
    notification_preferences::json AS notification_preferences,

    -- Tenant information
    tenant_id,

    -- Metadata
    metadata::json AS metadata,

    -- Timestamps
    last_login_at,
    email_verified_at,

    -- Flags
    is_active,
    is_admin

  FROM source
  WHERE deleted_at IS NULL
)

SELECT * FROM renamed
