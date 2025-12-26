{{
  config(
    materialized='view',
    tags=['staging', 'subscriptions']
  )
}}

WITH source AS (
  SELECT * FROM {{ source('upcoach', 'subscriptions') }}
),

renamed AS (
  SELECT
    id AS subscription_id,
    user_id,
    tier,
    status,
    billing_cycle,
    amount,
    currency,
    stripe_subscription_id,
    stripe_customer_id,
    trial_start,
    trial_end,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    canceled_at,
    ended_at,
    created_at,
    updated_at,

    -- Calculate subscription metrics
    DATEDIFF(day, created_at, COALESCE(ended_at, CURRENT_TIMESTAMP)) AS subscription_lifetime_days,
    CASE WHEN status = 'active' THEN amount ELSE 0 END AS mrr_contribution

  FROM source
)

SELECT * FROM renamed
