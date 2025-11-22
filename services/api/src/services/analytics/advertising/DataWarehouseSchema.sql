-- =============================================
-- Data Warehouse Schema for Multi-Platform Advertising Analytics
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- =============================================
-- Core Dimension Tables
-- =============================================

-- Platform dimension
CREATE TABLE IF NOT EXISTS dim_platforms (
    platform_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_code VARCHAR(50) UNIQUE NOT NULL,
    platform_name VARCHAR(100) NOT NULL,
    api_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign dimension
CREATE TABLE IF NOT EXISTS dim_campaigns (
    campaign_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id UUID REFERENCES dim_platforms(platform_id),
    campaign_id VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(500),
    campaign_type VARCHAR(100),
    objective VARCHAR(100),
    status VARCHAR(50),
    start_date DATE,
    end_date DATE,
    created_date TIMESTAMP WITH TIME ZONE,
    modified_date TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE DEFAULT '9999-12-31',
    UNIQUE(platform_id, campaign_id, valid_from)
);

-- Ad set/group dimension
CREATE TABLE IF NOT EXISTS dim_ad_sets (
    ad_set_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_key UUID REFERENCES dim_campaigns(campaign_key),
    ad_set_id VARCHAR(255) NOT NULL,
    ad_set_name VARCHAR(500),
    status VARCHAR(50),
    bid_strategy VARCHAR(100),
    optimization_goal VARCHAR(100),
    is_current BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE DEFAULT '9999-12-31'
);

-- Creative/Ad dimension
CREATE TABLE IF NOT EXISTS dim_creatives (
    creative_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_set_key UUID REFERENCES dim_ad_sets(ad_set_key),
    creative_id VARCHAR(255) NOT NULL,
    creative_name VARCHAR(500),
    creative_type VARCHAR(100),
    format VARCHAR(100),
    headline TEXT,
    body_text TEXT,
    call_to_action VARCHAR(100),
    landing_page_url TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    is_current BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE DEFAULT '9999-12-31'
);

-- Audience dimension
CREATE TABLE IF NOT EXISTS dim_audiences (
    audience_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id UUID REFERENCES dim_platforms(platform_id),
    audience_id VARCHAR(255) NOT NULL,
    audience_name VARCHAR(500),
    audience_type VARCHAR(100),
    size_estimate BIGINT,
    targeting_criteria JSONB,
    created_date TIMESTAMP WITH TIME ZONE,
    modified_date TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN DEFAULT true
);

-- Date dimension
CREATE TABLE IF NOT EXISTS dim_date (
    date_key INTEGER PRIMARY KEY,
    full_date DATE UNIQUE NOT NULL,
    day_of_week INTEGER,
    day_of_month INTEGER,
    day_of_year INTEGER,
    week_of_year INTEGER,
    month INTEGER,
    month_name VARCHAR(20),
    quarter INTEGER,
    year INTEGER,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    fiscal_year INTEGER,
    fiscal_quarter INTEGER
);

-- Time dimension (for hourly analysis)
CREATE TABLE IF NOT EXISTS dim_time (
    time_key INTEGER PRIMARY KEY,
    hour INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    hour_24 VARCHAR(5),
    hour_12 VARCHAR(8),
    am_pm VARCHAR(2),
    time_of_day VARCHAR(20)
);

-- Geography dimension
CREATE TABLE IF NOT EXISTS dim_geography (
    geo_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(2),
    country_name VARCHAR(100),
    region VARCHAR(100),
    state_province VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50)
);

-- Device dimension
CREATE TABLE IF NOT EXISTS dim_devices (
    device_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_type VARCHAR(50),
    device_platform VARCHAR(50),
    operating_system VARCHAR(100),
    browser VARCHAR(100)
);

-- Content dimension (for CMS integration)
CREATE TABLE IF NOT EXISTS dim_content (
    content_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    title TEXT,
    description TEXT,
    author VARCHAR(255),
    category VARCHAR(100),
    tags TEXT[],
    created_date TIMESTAMP WITH TIME ZONE,
    published_date TIMESTAMP WITH TIME ZONE,
    modified_date TIMESTAMP WITH TIME ZONE,
    word_count INTEGER,
    reading_time_minutes INTEGER,
    sentiment_score DECIMAL(3, 2),
    is_current BOOLEAN DEFAULT true
);

-- =============================================
-- Fact Tables
-- =============================================

-- Main performance fact table (partitioned by date)
CREATE TABLE IF NOT EXISTS fact_campaign_performance (
    performance_id UUID DEFAULT uuid_generate_v4(),
    date_key INTEGER REFERENCES dim_date(date_key),
    time_key INTEGER REFERENCES dim_time(time_key),
    platform_id UUID REFERENCES dim_platforms(platform_id),
    campaign_key UUID REFERENCES dim_campaigns(campaign_key),
    ad_set_key UUID REFERENCES dim_ad_sets(ad_set_key),
    creative_key UUID REFERENCES dim_creatives(creative_key),
    audience_key UUID REFERENCES dim_audiences(audience_key),
    geo_key UUID REFERENCES dim_geography(geo_key),
    device_key UUID REFERENCES dim_devices(device_key),

    -- Metrics
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend DECIMAL(15, 2) DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    conversion_value DECIMAL(15, 2) DEFAULT 0,
    reach BIGINT DEFAULT 0,
    frequency DECIMAL(10, 2) DEFAULT 0,

    -- Calculated metrics
    ctr DECIMAL(10, 4) GENERATED ALWAYS AS (
        CASE WHEN impressions > 0
        THEN (clicks::DECIMAL / impressions) * 100
        ELSE 0 END
    ) STORED,
    cpc DECIMAL(15, 4) GENERATED ALWAYS AS (
        CASE WHEN clicks > 0
        THEN spend / clicks
        ELSE 0 END
    ) STORED,
    cpm DECIMAL(15, 4) GENERATED ALWAYS AS (
        CASE WHEN impressions > 0
        THEN (spend / impressions) * 1000
        ELSE 0 END
    ) STORED,
    cpa DECIMAL(15, 4) GENERATED ALWAYS AS (
        CASE WHEN conversions > 0
        THEN spend / conversions
        ELSE 0 END
    ) STORED,
    roas DECIMAL(10, 2) GENERATED ALWAYS AS (
        CASE WHEN spend > 0
        THEN conversion_value / spend
        ELSE 0 END
    ) STORED,

    -- Engagement metrics
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    video_views INTEGER DEFAULT 0,
    video_completions INTEGER DEFAULT 0,
    engagement_rate DECIMAL(10, 4),

    -- Quality metrics
    quality_score DECIMAL(3, 1),
    relevance_score DECIMAL(3, 1),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (performance_id, date_key)
) PARTITION BY RANGE (date_key);

-- Create partitions for the fact table (monthly partitions)
CREATE TABLE fact_campaign_performance_202401 PARTITION OF fact_campaign_performance
    FOR VALUES FROM (20240101) TO (20240201);
CREATE TABLE fact_campaign_performance_202402 PARTITION OF fact_campaign_performance
    FOR VALUES FROM (20240201) TO (20240301);
-- Continue creating partitions as needed...

-- Enable TimescaleDB hypertable for real-time metrics
CREATE TABLE IF NOT EXISTS fact_realtime_metrics (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    platform_id UUID REFERENCES dim_platforms(platform_id),
    campaign_id VARCHAR(255) NOT NULL,
    ad_set_id VARCHAR(255),
    creative_id VARCHAR(255),

    -- Real-time metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    spend DECIMAL(15, 4) DEFAULT 0,
    conversions INTEGER DEFAULT 0,

    -- Additional metrics
    active_users INTEGER,
    page_views INTEGER,
    bounce_rate DECIMAL(5, 2),
    avg_session_duration INTEGER,

    PRIMARY KEY (time, platform_id, campaign_id)
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('fact_realtime_metrics', 'time');

-- Content performance fact table
CREATE TABLE IF NOT EXISTS fact_content_performance (
    content_performance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date_key INTEGER REFERENCES dim_date(date_key),
    content_key UUID REFERENCES dim_content(content_key),
    campaign_key UUID REFERENCES dim_campaigns(campaign_key),

    -- Attribution metrics
    attributed_impressions BIGINT DEFAULT 0,
    attributed_clicks BIGINT DEFAULT 0,
    attributed_conversions BIGINT DEFAULT 0,
    attributed_revenue DECIMAL(15, 2) DEFAULT 0,

    -- Engagement metrics
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    time_on_page INTEGER DEFAULT 0,
    scroll_depth DECIMAL(5, 2),

    -- Social metrics
    social_shares INTEGER DEFAULT 0,
    social_likes INTEGER DEFAULT 0,
    social_comments INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test results fact table
CREATE TABLE IF NOT EXISTS fact_ab_test_results (
    test_result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL,
    variant_id VARCHAR(50) NOT NULL,
    date_key INTEGER REFERENCES dim_date(date_key),

    -- Test metrics
    impressions BIGINT DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    conversion_rate DECIMAL(10, 4),
    confidence_level DECIMAL(5, 2),
    p_value DECIMAL(10, 8),
    is_significant BOOLEAN,

    -- Performance metrics
    avg_order_value DECIMAL(15, 2),
    revenue_per_visitor DECIMAL(15, 2),
    bounce_rate DECIMAL(5, 2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Aggregate Tables for Performance
-- =============================================

-- Daily aggregates
CREATE MATERIALIZED VIEW mv_daily_campaign_summary AS
SELECT
    d.full_date,
    p.platform_name,
    c.campaign_name,
    c.status,
    SUM(f.impressions) as total_impressions,
    SUM(f.clicks) as total_clicks,
    SUM(f.spend) as total_spend,
    SUM(f.conversions) as total_conversions,
    SUM(f.conversion_value) as total_revenue,
    AVG(f.ctr) as avg_ctr,
    AVG(f.cpc) as avg_cpc,
    AVG(f.cpa) as avg_cpa,
    AVG(f.roas) as avg_roas
FROM fact_campaign_performance f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_platforms p ON f.platform_id = p.platform_id
JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
GROUP BY d.full_date, p.platform_name, c.campaign_name, c.status;

-- Weekly aggregates
CREATE MATERIALIZED VIEW mv_weekly_platform_comparison AS
SELECT
    d.year,
    d.week_of_year,
    p.platform_name,
    COUNT(DISTINCT c.campaign_id) as active_campaigns,
    SUM(f.impressions) as total_impressions,
    SUM(f.clicks) as total_clicks,
    SUM(f.spend) as total_spend,
    SUM(f.conversions) as total_conversions,
    SUM(f.conversion_value) as total_revenue,
    SUM(f.conversion_value) - SUM(f.spend) as profit,
    AVG(f.roas) as avg_roas
FROM fact_campaign_performance f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_platforms p ON f.platform_id = p.platform_id
JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
WHERE c.status = 'ACTIVE'
GROUP BY d.year, d.week_of_year, p.platform_name;

-- Content attribution view
CREATE MATERIALIZED VIEW mv_content_attribution AS
SELECT
    cnt.content_id,
    cnt.title,
    cnt.content_type,
    cnt.category,
    p.platform_name,
    SUM(cp.attributed_conversions) as total_conversions,
    SUM(cp.attributed_revenue) as total_revenue,
    AVG(cp.time_on_page) as avg_time_on_page,
    SUM(cp.social_shares) as total_shares
FROM fact_content_performance cp
JOIN dim_content cnt ON cp.content_key = cnt.content_key
JOIN dim_campaigns c ON cp.campaign_key = c.campaign_key
JOIN dim_platforms p ON c.platform_id = p.platform_id
GROUP BY cnt.content_id, cnt.title, cnt.content_type, cnt.category, p.platform_name;

-- =============================================
-- Indexes for Performance
-- =============================================

-- Fact table indexes
CREATE INDEX idx_fact_performance_date ON fact_campaign_performance(date_key);
CREATE INDEX idx_fact_performance_campaign ON fact_campaign_performance(campaign_key);
CREATE INDEX idx_fact_performance_platform ON fact_campaign_performance(platform_id);
CREATE INDEX idx_fact_performance_composite ON fact_campaign_performance(date_key, platform_id, campaign_key);

-- Dimension table indexes
CREATE INDEX idx_campaigns_platform ON dim_campaigns(platform_id);
CREATE INDEX idx_campaigns_status ON dim_campaigns(status);
CREATE INDEX idx_campaigns_dates ON dim_campaigns(start_date, end_date);
CREATE INDEX idx_ad_sets_campaign ON dim_ad_sets(campaign_key);
CREATE INDEX idx_creatives_ad_set ON dim_creatives(ad_set_key);
CREATE INDEX idx_content_type ON dim_content(content_type);
CREATE INDEX idx_content_category ON dim_content(category);

-- Real-time metrics indexes
CREATE INDEX idx_realtime_platform_time ON fact_realtime_metrics(platform_id, time DESC);
CREATE INDEX idx_realtime_campaign_time ON fact_realtime_metrics(campaign_id, time DESC);

-- =============================================
-- Functions and Procedures
-- =============================================

-- Function to calculate campaign performance trends
CREATE OR REPLACE FUNCTION calculate_campaign_trend(
    p_campaign_id UUID,
    p_days INTEGER DEFAULT 7
) RETURNS TABLE (
    date DATE,
    impressions BIGINT,
    clicks BIGINT,
    spend DECIMAL,
    conversions BIGINT,
    roas DECIMAL,
    trend_direction VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_metrics AS (
        SELECT
            d.full_date,
            SUM(f.impressions) as daily_impressions,
            SUM(f.clicks) as daily_clicks,
            SUM(f.spend) as daily_spend,
            SUM(f.conversions) as daily_conversions,
            AVG(f.roas) as daily_roas,
            LAG(SUM(f.spend)) OVER (ORDER BY d.full_date) as prev_spend
        FROM fact_campaign_performance f
        JOIN dim_date d ON f.date_key = d.date_key
        WHERE f.campaign_key = p_campaign_id
            AND d.full_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
        GROUP BY d.full_date
    )
    SELECT
        full_date,
        daily_impressions,
        daily_clicks,
        daily_spend,
        daily_conversions,
        daily_roas,
        CASE
            WHEN daily_spend > prev_spend THEN 'UP'
            WHEN daily_spend < prev_spend THEN 'DOWN'
            ELSE 'STABLE'
        END as trend_direction
    FROM daily_metrics
    ORDER BY full_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Procedure to refresh materialized views
CREATE OR REPLACE PROCEDURE refresh_analytics_views()
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_campaign_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_platform_comparison;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_content_attribution;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Triggers
-- =============================================

-- Trigger to update modified timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaign_performance_modtime
    BEFORE UPDATE ON fact_campaign_performance
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =============================================
-- Data Quality Checks
-- =============================================

-- Check for data freshness
CREATE OR REPLACE FUNCTION check_data_freshness(
    p_platform VARCHAR,
    p_threshold_hours INTEGER DEFAULT 24
) RETURNS BOOLEAN AS $$
DECLARE
    last_update TIMESTAMP;
    is_fresh BOOLEAN;
BEGIN
    SELECT MAX(created_at) INTO last_update
    FROM fact_campaign_performance f
    JOIN dim_platforms p ON f.platform_id = p.platform_id
    WHERE p.platform_code = p_platform;

    is_fresh := last_update > NOW() - INTERVAL '1 hour' * p_threshold_hours;

    IF NOT is_fresh THEN
        RAISE NOTICE 'Data for platform % is stale. Last update: %', p_platform, last_update;
    END IF;

    RETURN is_fresh;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Permissions
-- =============================================

-- Create roles
CREATE ROLE analytics_reader;
CREATE ROLE analytics_writer;
CREATE ROLE analytics_admin;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_reader;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO analytics_writer;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO analytics_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO analytics_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO analytics_admin;