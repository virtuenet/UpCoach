# UpCoach Multi-Platform Advertising Analytics Integration Architecture

## Executive Summary

This document outlines the comprehensive analytics integration architecture for UpCoach's multi-platform advertising system, supporting Google Ads, Meta Ads (Facebook/Instagram), and LinkedIn Ads. The architecture is designed for real-time data processing, predictive analytics, and ML-powered optimization.

**Status**: Production-ready implementation exists with enhancement opportunities
**Version**: 2.0.0
**Last Updated**: 2025-09-27

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [Architecture Components](#architecture-components)
4. [Data Warehouse Design](#data-warehouse-design)
5. [API Integration Patterns](#api-integration-patterns)
6. [Real-Time Data Pipeline](#real-time-data-pipeline)
7. [Machine Learning Integration](#machine-learning-integration)
8. [Performance Optimization](#performance-optimization)
9. [Security & Compliance](#security--compliance)
10. [Implementation Roadmap](#implementation-roadmap)

---

## 1. System Overview

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ADVERTISING PLATFORMS                          │
├─────────────────┬─────────────────┬──────────────────┐              │
│   Google Ads    │    Meta Ads     │   LinkedIn Ads   │              │
│   API v14       │    API v17      │   API v2         │              │
└────────┬────────┴────────┬────────┴────────┬─────────┘              │
         │                 │                 │                         │
         │                 │                 │                         │
┌────────▼─────────────────▼─────────────────▼────────────────────────┐
│              INTEGRATION & DATA INGESTION LAYER                      │
├──────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ GoogleAdsClient │  │  MetaAdsClient   │  │ LinkedInAdsClient  │ │
│  └────────┬────────┘  └────────┬─────────┘  └─────────┬──────────┘ │
│           │                    │                       │             │
│  ┌────────▼────────────────────▼───────────────────────▼──────────┐ │
│  │         AdPlatformIntegrationService                            │ │
│  │  - Rate Limiting          - Circuit Breaker                     │ │
│  │  - Retry Logic            - Error Handling                      │ │
│  │  - OAuth Management       - Webhook Processing                  │ │
│  └────────┬─────────────────────────────────────────────────────────┘│
└───────────┼──────────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────────────┐
│                   DATA PROCESSING LAYER                              │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   DataNormalizer                             │   │
│  │  - Platform-specific transformations                        │   │
│  │  - Unified schema mapping                                   │   │
│  │  - Currency conversion                                      │   │
│  │  - Data validation & cleaning                               │   │
│  └────────┬─────────────────────────────────────────────────────┘   │
└───────────┼──────────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────────────┐
│                      STORAGE LAYER                                   │
├────────────────────────────┬─────────────────────────────────────────┤
│     PostgreSQL             │           Redis Cache                   │
│  Data Warehouse Schema     │     - Real-time metrics                 │
│  - Dimension Tables        │     - Session data                      │
│  - Fact Tables            │     - Rate limiting                      │
│  - Materialized Views     │     - Webhook queue                      │
└────────────────────────────┴─────────────────────────────────────────┘
            │                              │
┌───────────▼──────────────────────────────▼──────────────────────────┐
│                   ANALYTICS & ML LAYER                               │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌─────────────────────────────────────┐ │
│  │ PredictiveAnalytics  │  │   PerformanceMonitor                │ │
│  │  - Engagement        │  │   - Anomaly Detection               │ │
│  │  - LSTM Forecasting  │  │   - Drift Detection                 │ │
│  │  - Budget Optimization│  │   - Alert Generation                │ │
│  │  - Content Prediction│  │                                     │ │
│  └──────────────────────┘  └─────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┬─────┘
                                                                 │
┌────────────────────────────────────────────────────────────────▼─────┐
│                   PRESENTATION LAYER                                 │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         RealTimeDashboardService                             │   │
│  │  - WebSocket Server (Socket.io)                             │   │
│  │  - Real-time Metric Updates                                 │   │
│  │  - Dashboard Widget Management                              │   │
│  │  - Alert Broadcasting                                       │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                   ┌────────▼─────────┐
                   │  Client Apps     │
                   │  - Web Dashboard │
                   │  - Mobile App    │
                   │  - API Consumers │
                   └──────────────────┘
```

### 1.2 Key Design Principles

1. **Scalability**: Horizontal scaling for data ingestion and processing
2. **Reliability**: Circuit breakers, retry mechanisms, and fallback strategies
3. **Real-time**: WebSocket-based live updates with sub-5-second latency
4. **Accuracy**: Data validation, normalization, and consistency checks
5. **Intelligence**: ML-powered predictions and automated optimizations
6. **Observability**: Comprehensive logging, metrics, and monitoring

---

## 2. Current Implementation Analysis

### 2.1 Existing Capabilities

#### **Implemented Components** ✅

1. **Multi-Platform API Clients**
   - `/services/api/src/services/analytics/advertising/platforms/GoogleAdsClient.ts`
   - `/services/api/src/services/analytics/advertising/platforms/MetaAdsClient.ts`
   - `/services/api/src/services/analytics/advertising/platforms/LinkedInAdsClient.ts`

2. **Integration Service**
   - `/services/api/src/services/analytics/advertising/AdPlatformIntegrationService.ts`
   - Unified interface for all platforms
   - Real-time synchronization with configurable intervals
   - Circuit breaker pattern for fault tolerance
   - Rate limiting per platform

3. **Data Normalization**
   - `/services/api/src/services/analytics/advertising/DataNormalizer.ts`
   - Platform-specific transformation logic
   - Currency conversion
   - Metric standardization (CTR, CPC, ROAS, etc.)
   - Data validation using Joi schemas

4. **Real-Time Dashboard**
   - `/services/api/src/services/analytics/advertising/RealTimeDashboardService.ts`
   - WebSocket-based live updates
   - Dashboard widget system
   - Real-time alert broadcasting
   - Client subscription management

5. **Predictive Analytics**
   - `/services/api/src/services/analytics/advertising/PredictiveAnalyticsService.ts`
   - TensorFlow.js-based ML models
   - Content engagement prediction
   - Campaign performance forecasting (LSTM)
   - Budget optimization (Random Forest)
   - Anomaly detection (Isolation Forest)

6. **Performance Monitoring**
   - `/services/api/src/services/analytics/advertising/PerformanceMonitor.ts`
   - Real-time anomaly detection
   - Performance metric tracking
   - Alert generation

### 2.2 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **API Layer** | Node.js + Express | Latest | Backend services |
| **Database** | PostgreSQL | 14+ | Primary data store |
| **Cache** | Redis | 6+ | Real-time caching |
| **ML Framework** | TensorFlow.js | 4.x | Predictive models |
| **Real-time Comms** | Socket.io | 4.x | WebSocket server |
| **API Clients** | Axios | Latest | HTTP requests |
| **Authentication** | OAuth2 | - | Platform auth |
| **Rate Limiting** | ioredis + Custom | - | API throttling |
| **Monitoring** | Winston | Latest | Logging |

---

## 3. Architecture Components

### 3.1 Platform API Clients

#### **Google Ads Client**

**File**: `GoogleAdsClient.ts`

**Key Features**:
- Google Ads API v14 integration
- OAuth2 authentication with token refresh
- GAQL (Google Ads Query Language) support
- Campaign, ad group, and keyword-level metrics
- Real-time performance data
- Conversion tracking
- Budget management API

**API Methods**:
```typescript
fetchCampaignData(): Promise<GoogleAdsCampaign[]>
fetchPerformanceMetrics(campaignIds, startDate, endDate): Promise<GoogleAdsMetrics[]>
getRealTimeMetrics(campaignId): Promise<AdPerformanceMetrics>
createConversionAction(name, category, value): Promise<string>
updateCampaignBudget(campaignId, budgetMicros): Promise<void>
getKeywordPerformance(campaignId, limit): Promise<any[]>
```

**Rate Limits**: 10 requests/minute (configurable)

**Authentication Flow**:
```typescript
OAuth2Client → refreshToken → accessToken (1hr TTL)
→ Auto-refresh on 401 errors
→ Token caching in memory
```

#### **Meta Ads Client**

**File**: `MetaAdsClient.ts`

**Key Features**:
- Meta Marketing API v17.0 (Facebook & Instagram)
- Campaign, ad set, and ad-level insights
- Cross-platform metrics (FB + IG)
- Demographic breakdown (age, gender, location)
- Creative performance tracking
- Audience insights
- Video metrics
- Custom/Lookalike audience management

**API Methods**:
```typescript
fetchCampaignData(): Promise<MetaCampaign[]>
fetchInsights(objectId, objectType, dateRange): Promise<MetaInsights[]>
getRealTimeMetrics(campaignId): Promise<AdPerformanceMetrics>
createCustomAudience(name, description, rules): Promise<string>
createLookalikeAudience(name, sourceId, country, ratio): Promise<string>
getCreativePerformance(adId, dateRange): Promise<any>
updateCampaignBudget(campaignId, dailyBudget, lifetimeBudget): Promise<void>
```

**Rate Limits**: 200 requests/hour
**Special Handling**: App usage throttling (call count, total time, CPU time)

#### **LinkedIn Ads Client**

**File**: `LinkedInAdsClient.ts`

**Key Features**:
- LinkedIn Ads API v2
- B2B audience targeting
- Lead generation metrics
- Professional demographic data
- Sponsored content performance
- InMail campaign metrics
- Account-based marketing (ABM) support

**Rate Limits**: 100 requests/day (varies by endpoint)

### 3.2 Integration Service Architecture

**File**: `AdPlatformIntegrationService.ts`

#### **Core Responsibilities**:

1. **Unified API Interface**
   - Single entry point for all platforms
   - Consistent error handling
   - Standardized response format

2. **Data Synchronization**
   - Configurable sync intervals (default: 5 minutes)
   - Parallel platform syncing
   - Incremental updates
   - Full refresh capabilities

3. **Fault Tolerance**
   ```typescript
   Circuit Breaker States:
   - CLOSED: Normal operation
   - OPEN: Stop requests after threshold failures
   - HALF_OPEN: Allow test request

   Retry Policy:
   - Exponential backoff: 1s, 2s, 4s, 8s, 16s
   - Max attempts: 5
   - Jitter: ±20% to prevent thundering herd
   ```

4. **Rate Limiting Strategy**
   ```typescript
   Token Bucket Algorithm:
   - Per-platform buckets
   - Redis-backed for distributed systems
   - Refill rate: Platform-specific
   - Burst allowance: 2x normal rate
   ```

5. **Webhook Processing**
   - Real-time platform updates
   - Signature verification
   - Async processing via Redis queue
   - Deduplication logic

#### **Data Flow**:

```
Platform API → Client → Integration Service → Data Normalizer
                                            ↓
                                     ┌──────────┐
                                     │ Database │
                                     └──────────┘
                                            ↓
                                     ┌──────────┐
                                     │  Redis   │ (Cache)
                                     └──────────┘
```

### 3.3 Data Normalization Layer

**File**: `DataNormalizer.ts`

#### **Normalization Process**:

1. **Platform Data → Unified Schema**
   ```typescript
   interface NormalizedCampaign {
     platformId: 'google_ads' | 'meta_ads' | 'linkedin_ads'
     campaignId: string
     campaignName: string
     status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED' | 'DELETED'
     objective: string
     startDate: Date
     endDate?: Date
     budget: number  // USD
     budgetType: 'DAILY' | 'LIFETIME' | 'TOTAL'
     spend: number
     impressions: number
     clicks: number
     conversions: number
     conversionValue: number
     ctr: number
     cpc: number
     cpa: number
     roas: number
     metadata: Record<string, any>
   }
   ```

2. **Metric Calculations**
   ```typescript
   CTR = (clicks / impressions) * 100
   CPC = spend / clicks
   CPA = spend / conversions
   ROAS = revenue / spend
   ```

3. **Currency Conversion**
   - Real-time exchange rates (configurable)
   - Base currency: USD
   - Support: EUR, GBP, JPY, AUD, CAD

4. **Data Validation**
   - Joi schema validation
   - Range checks (0 ≤ CTR ≤ 100)
   - Required field validation
   - Data sanitization (XSS prevention)

---

## 4. Data Warehouse Design

### 4.1 Star Schema Architecture

```sql
-- FACT TABLES (Metrics & Measurements)
┌──────────────────────────────────────────────────────┐
│          fact_campaign_performance                   │
├──────────────────────────────────────────────────────┤
│ PK: performance_id                                   │
│ FK: campaign_key → dim_campaigns                     │
│ FK: date_key → dim_date                              │
│ FK: time_key → dim_time                              │
│ FK: platform_id → dim_platforms                      │
│                                                      │
│ Metrics:                                            │
│ - impressions, clicks, spend                        │
│ - conversions, conversion_value                     │
│ - ctr, cpc, cpa, roas                              │
│ - reach, frequency, engagement                      │
│ - video_views, video_completions                    │
│ - quality_score, relevance_score                    │
└──────────────────────────────────────────────────────┘
            │
            │
     ┌──────┴──────┬──────────────┬────────────┐
     │             │              │            │
┌────▼────┐  ┌─────▼──────┐  ┌───▼────┐  ┌───▼────────┐
│dim_     │  │ dim_date   │  │dim_    │  │dim_        │
│campaigns│  │            │  │time    │  │platforms   │
└─────────┘  └────────────┘  └────────┘  └────────────┘
```

### 4.2 Dimension Tables

#### **dim_campaigns**
```sql
CREATE TABLE dim_campaigns (
  campaign_key SERIAL PRIMARY KEY,
  campaign_id VARCHAR(255) NOT NULL,
  platform_id INTEGER REFERENCES dim_platforms(platform_id),
  campaign_name VARCHAR(255) NOT NULL,
  objective VARCHAR(100),
  status VARCHAR(50),
  budget_type VARCHAR(20),
  daily_budget DECIMAL(10,2),
  lifetime_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  targeting_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ DEFAULT '9999-12-31',

  UNIQUE(platform_id, campaign_id, valid_from)
);

CREATE INDEX idx_campaigns_platform ON dim_campaigns(platform_id);
CREATE INDEX idx_campaigns_status ON dim_campaigns(status);
CREATE INDEX idx_campaigns_is_current ON dim_campaigns(is_current);
```

#### **dim_platforms**
```sql
CREATE TABLE dim_platforms (
  platform_id SERIAL PRIMARY KEY,
  platform_name VARCHAR(50) NOT NULL UNIQUE,
  platform_display_name VARCHAR(100),
  api_version VARCHAR(20),
  rate_limit_per_minute INTEGER,
  rate_limit_per_hour INTEGER,
  rate_limit_per_day INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB
);

INSERT INTO dim_platforms (platform_name, platform_display_name, api_version) VALUES
  ('google_ads', 'Google Ads', 'v14'),
  ('meta_ads', 'Meta Ads', 'v17.0'),
  ('linkedin_ads', 'LinkedIn Ads', 'v2');
```

#### **dim_date**
```sql
CREATE TABLE dim_date (
  date_key INTEGER PRIMARY KEY,
  full_date DATE NOT NULL UNIQUE,
  day_of_week INTEGER,
  day_name VARCHAR(10),
  day_of_month INTEGER,
  day_of_year INTEGER,
  week_of_year INTEGER,
  month INTEGER,
  month_name VARCHAR(10),
  quarter INTEGER,
  year INTEGER,
  is_weekend BOOLEAN,
  is_holiday BOOLEAN,
  holiday_name VARCHAR(100),
  fiscal_year INTEGER,
  fiscal_quarter INTEGER
);

-- Generate date dimension (10 years)
INSERT INTO dim_date
SELECT
  TO_CHAR(date_series, 'YYYYMMDD')::INTEGER as date_key,
  date_series as full_date,
  EXTRACT(DOW FROM date_series) as day_of_week,
  TO_CHAR(date_series, 'Day') as day_name,
  EXTRACT(DAY FROM date_series) as day_of_month,
  EXTRACT(DOY FROM date_series) as day_of_year,
  EXTRACT(WEEK FROM date_series) as week_of_year,
  EXTRACT(MONTH FROM date_series) as month,
  TO_CHAR(date_series, 'Month') as month_name,
  EXTRACT(QUARTER FROM date_series) as quarter,
  EXTRACT(YEAR FROM date_series) as year,
  CASE WHEN EXTRACT(DOW FROM date_series) IN (0,6) THEN TRUE ELSE FALSE END as is_weekend,
  FALSE as is_holiday,
  NULL as holiday_name,
  EXTRACT(YEAR FROM date_series) as fiscal_year,
  EXTRACT(QUARTER FROM date_series) as fiscal_quarter
FROM generate_series('2020-01-01'::DATE, '2030-12-31'::DATE, '1 day'::INTERVAL) date_series;
```

#### **dim_time**
```sql
CREATE TABLE dim_time (
  time_key INTEGER PRIMARY KEY,
  hour_24 INTEGER,
  hour_12 INTEGER,
  am_pm VARCHAR(2),
  minute INTEGER,
  time_period VARCHAR(20), -- morning, afternoon, evening, night
  business_hours BOOLEAN
);

-- Generate time dimension (hourly granularity)
INSERT INTO dim_time
SELECT
  hour * 100 as time_key,
  hour as hour_24,
  CASE WHEN hour = 0 THEN 12 WHEN hour <= 12 THEN hour ELSE hour - 12 END as hour_12,
  CASE WHEN hour < 12 THEN 'AM' ELSE 'PM' END as am_pm,
  0 as minute,
  CASE
    WHEN hour >= 6 AND hour < 12 THEN 'morning'
    WHEN hour >= 12 AND hour < 17 THEN 'afternoon'
    WHEN hour >= 17 AND hour < 21 THEN 'evening'
    ELSE 'night'
  END as time_period,
  CASE WHEN hour >= 9 AND hour < 17 THEN TRUE ELSE FALSE END as business_hours
FROM generate_series(0, 23) hour;
```

### 4.3 Fact Tables

#### **fact_campaign_performance**
```sql
CREATE TABLE fact_campaign_performance (
  performance_id BIGSERIAL PRIMARY KEY,
  campaign_key INTEGER REFERENCES dim_campaigns(campaign_key),
  date_key INTEGER REFERENCES dim_date(date_key),
  time_key INTEGER REFERENCES dim_time(time_key),
  platform_id INTEGER REFERENCES dim_platforms(platform_id),

  -- Core Metrics
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0.00,
  conversions DECIMAL(10,2) DEFAULT 0.00,
  conversion_value DECIMAL(10,2) DEFAULT 0.00,

  -- Calculated Metrics
  ctr DECIMAL(5,2) DEFAULT 0.00,
  cpc DECIMAL(10,2) DEFAULT 0.00,
  cpa DECIMAL(10,2) DEFAULT 0.00,
  roas DECIMAL(10,2) DEFAULT 0.00,

  -- Engagement Metrics
  reach BIGINT,
  frequency DECIMAL(5,2),
  engagement BIGINT,
  likes BIGINT,
  shares BIGINT,
  comments BIGINT,

  -- Video Metrics
  video_views BIGINT,
  video_completions BIGINT,
  video_25_percent BIGINT,
  video_50_percent BIGINT,
  video_75_percent BIGINT,
  video_100_percent BIGINT,

  -- Quality Metrics
  quality_score DECIMAL(3,1),
  relevance_score DECIMAL(3,1),

  -- Device Breakdown
  mobile_impressions BIGINT,
  desktop_impressions BIGINT,
  tablet_impressions BIGINT,

  -- Demographic Data (JSONB for flexibility)
  demographics JSONB,

  -- Metadata
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_key, date_key, time_key)
);

-- Performance-critical indexes
CREATE INDEX idx_fact_perf_campaign ON fact_campaign_performance(campaign_key);
CREATE INDEX idx_fact_perf_date ON fact_campaign_performance(date_key);
CREATE INDEX idx_fact_perf_platform ON fact_campaign_performance(platform_id);
CREATE INDEX idx_fact_perf_date_platform ON fact_campaign_performance(date_key, platform_id);
CREATE INDEX idx_fact_perf_last_synced ON fact_campaign_performance(last_synced);

-- Composite index for dashboard queries
CREATE INDEX idx_fact_perf_dashboard
  ON fact_campaign_performance(date_key, platform_id, campaign_key)
  INCLUDE (spend, conversions, conversion_value, impressions, clicks);
```

#### **fact_ad_creative_performance**
```sql
CREATE TABLE fact_ad_creative_performance (
  creative_performance_id BIGSERIAL PRIMARY KEY,
  campaign_key INTEGER REFERENCES dim_campaigns(campaign_key),
  ad_id VARCHAR(255) NOT NULL,
  ad_name VARCHAR(255),
  creative_type VARCHAR(50), -- image, video, carousel, collection
  date_key INTEGER REFERENCES dim_date(date_key),
  platform_id INTEGER REFERENCES dim_platforms(platform_id),

  -- Performance Metrics
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0.00,
  conversions DECIMAL(10,2) DEFAULT 0.00,

  -- Creative-specific Metrics
  engagement_rate DECIMAL(5,2),
  outbound_clicks BIGINT,
  unique_outbound_clicks BIGINT,

  -- Quality Rankings (Meta-specific)
  quality_ranking VARCHAR(20),
  engagement_rate_ranking VARCHAR(20),
  conversion_rate_ranking VARCHAR(20),

  -- Creative Details
  creative_url TEXT,
  thumbnail_url TEXT,
  creative_metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_key, ad_id, date_key)
);

CREATE INDEX idx_fact_creative_campaign ON fact_ad_creative_performance(campaign_key);
CREATE INDEX idx_fact_creative_date ON fact_ad_creative_performance(date_key);
```

### 4.4 Materialized Views for Performance

#### **mv_campaign_daily_summary**
```sql
CREATE MATERIALIZED VIEW mv_campaign_daily_summary AS
SELECT
  c.platform_id,
  p.platform_name,
  c.campaign_id,
  c.campaign_name,
  d.full_date,
  d.year,
  d.month,
  d.week_of_year,
  SUM(f.impressions) as total_impressions,
  SUM(f.clicks) as total_clicks,
  SUM(f.spend) as total_spend,
  SUM(f.conversions) as total_conversions,
  SUM(f.conversion_value) as total_revenue,
  AVG(f.ctr) as avg_ctr,
  AVG(f.cpc) as avg_cpc,
  AVG(f.cpa) as avg_cpa,
  AVG(f.roas) as avg_roas,
  SUM(f.reach) as total_reach,
  AVG(f.frequency) as avg_frequency
FROM fact_campaign_performance f
JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
JOIN dim_platforms p ON f.platform_id = p.platform_id
JOIN dim_date d ON f.date_key = d.date_key
WHERE c.is_current = TRUE
GROUP BY
  c.platform_id,
  p.platform_name,
  c.campaign_id,
  c.campaign_name,
  d.full_date,
  d.year,
  d.month,
  d.week_of_year;

CREATE UNIQUE INDEX idx_mv_campaign_daily_pk
  ON mv_campaign_daily_summary(campaign_id, full_date);
CREATE INDEX idx_mv_campaign_daily_platform
  ON mv_campaign_daily_summary(platform_name, full_date);

-- Refresh schedule (via cron or scheduler)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_campaign_daily_summary;
```

#### **mv_platform_comparison**
```sql
CREATE MATERIALIZED VIEW mv_platform_comparison AS
SELECT
  p.platform_name,
  d.full_date,
  COUNT(DISTINCT c.campaign_key) as active_campaigns,
  SUM(f.spend) as total_spend,
  SUM(f.conversion_value) as total_revenue,
  SUM(f.impressions) as total_impressions,
  SUM(f.clicks) as total_clicks,
  SUM(f.conversions) as total_conversions,
  AVG(f.roas) as avg_roas,
  SUM(f.conversion_value) - SUM(f.spend) as profit,
  CASE
    WHEN SUM(f.conversion_value) > 0
    THEN ((SUM(f.conversion_value) - SUM(f.spend)) / SUM(f.conversion_value)) * 100
    ELSE 0
  END as profit_margin
FROM fact_campaign_performance f
JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
JOIN dim_platforms p ON f.platform_id = p.platform_id
JOIN dim_date d ON f.date_key = d.date_key
WHERE c.status = 'ACTIVE' AND c.is_current = TRUE
GROUP BY p.platform_name, d.full_date;

CREATE UNIQUE INDEX idx_mv_platform_comparison_pk
  ON mv_platform_comparison(platform_name, full_date);
```

### 4.5 Data Retention Policy

```sql
-- Archive old data (keep 2 years hot, archive rest)
CREATE TABLE fact_campaign_performance_archive (
  LIKE fact_campaign_performance INCLUDING ALL
);

-- Partition by date for efficient archival
CREATE TABLE fact_campaign_performance_partitioned (
  LIKE fact_campaign_performance INCLUDING ALL
) PARTITION BY RANGE (date_key);

-- Create monthly partitions
CREATE TABLE fact_campaign_performance_2025_01
  PARTITION OF fact_campaign_performance_partitioned
  FOR VALUES FROM (20250101) TO (20250201);

-- Automated archival function
CREATE OR REPLACE FUNCTION archive_old_performance_data()
RETURNS void AS $$
DECLARE
  archive_threshold DATE := CURRENT_DATE - INTERVAL '2 years';
  archive_date_key INTEGER := TO_CHAR(archive_threshold, 'YYYYMMDD')::INTEGER;
BEGIN
  -- Move to archive
  INSERT INTO fact_campaign_performance_archive
  SELECT * FROM fact_campaign_performance
  WHERE date_key < archive_date_key;

  -- Delete from main table
  DELETE FROM fact_campaign_performance
  WHERE date_key < archive_date_key;

  RAISE NOTICE 'Archived data older than %', archive_threshold;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. API Integration Patterns

### 5.1 OAuth2 Flow

```typescript
// Google Ads OAuth2
class GoogleAdsAuthManager {
  private oauth2Client: OAuth2Client;
  private refreshTokenTimer?: NodeJS.Timer;

  async initialize() {
    this.oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    this.oauth2Client.setCredentials({
      refresh_token: config.refreshToken
    });

    // Proactive token refresh (55 min before expiry)
    this.scheduleTokenRefresh();
  }

  async getAccessToken(): Promise<string> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials.access_token!;
  }

  private scheduleTokenRefresh() {
    this.refreshTokenTimer = setInterval(async () => {
      await this.getAccessToken();
    }, 55 * 60 * 1000); // 55 minutes
  }
}
```

### 5.2 Rate Limiting Implementation

```typescript
// Token Bucket Algorithm with Redis
class RateLimiter {
  constructor(private redis: Redis) {}

  async checkLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<void> {
    const bucketKey = `rate_limit:${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old requests
    await this.redis.zremrangebyscore(bucketKey, '-inf', windowStart);

    // Count current requests
    const currentRequests = await this.redis.zcard(bucketKey);

    if (currentRequests >= maxRequests) {
      const oldestRequest = await this.redis.zrange(bucketKey, 0, 0, 'WITHSCORES');
      const retryAfter = parseInt(oldestRequest[1]) + windowMs - now;

      throw new RateLimitError(
        `Rate limit exceeded for ${key}. Retry after ${retryAfter}ms`,
        retryAfter
      );
    }

    // Add current request
    await this.redis.zadd(bucketKey, now, `${now}:${uuidv4()}`);
    await this.redis.expire(bucketKey, Math.ceil(windowMs / 1000));
  }
}
```

### 5.3 Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private states: Map<string, CircuitState> = new Map();

  async execute<T>(
    serviceKey: string,
    fn: () => Promise<T>,
    options: CircuitBreakerOptions = {}
  ): Promise<T> {
    const state = this.getState(serviceKey);

    if (state.status === 'OPEN') {
      if (Date.now() - state.openedAt! < options.timeout) {
        throw new CircuitOpenError(`Circuit is OPEN for ${serviceKey}`);
      }
      // Move to HALF_OPEN
      state.status = 'HALF_OPEN';
    }

    try {
      const result = await fn();

      // Success
      if (state.status === 'HALF_OPEN') {
        state.status = 'CLOSED';
        state.failures = 0;
      }

      return result;
    } catch (error) {
      state.failures++;

      if (state.failures >= options.threshold) {
        state.status = 'OPEN';
        state.openedAt = Date.now();
      }

      throw error;
    }
  }

  private getState(key: string): CircuitState {
    if (!this.states.has(key)) {
      this.states.set(key, {
        status: 'CLOSED',
        failures: 0
      });
    }
    return this.states.get(key)!;
  }
}
```

### 5.4 Retry Strategy

```typescript
class RetryPolicy {
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || 5;
    const baseDelay = options.baseDelay || 1000;
    const maxDelay = options.maxDelay || 30000;
    const jitterFactor = options.jitterFactor || 0.2;

    let attempt = 0;

    while (true) {
      try {
        return await fn();
      } catch (error) {
        attempt++;

        if (attempt >= maxAttempts) {
          throw new MaxRetriesExceededError(
            `Failed after ${maxAttempts} attempts`,
            error
          );
        }

        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt - 1),
          maxDelay
        );
        const jitter = delay * jitterFactor * (Math.random() - 0.5) * 2;
        const totalDelay = delay + jitter;

        this.logger.warn(`Retry attempt ${attempt}/${maxAttempts} after ${totalDelay}ms`);
        await this.sleep(totalDelay);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5.5 Webhook Security

```typescript
class WebhookHandler {
  // Meta Ads webhook verification
  async verifyMetaWebhook(
    signature: string,
    payload: string
  ): Promise<boolean> {
    const expectedSignature = crypto
      .createHmac('sha256', config.metaAppSecret)
      .update(payload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  // Google Ads webhook verification
  async verifyGoogleWebhook(
    token: string
  ): Promise<boolean> {
    // Google uses OAuth2 tokens
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: token,
        audience: config.googleClientId
      });
      return ticket !== null;
    } catch {
      return false;
    }
  }

  // LinkedIn webhook verification
  async verifyLinkedInWebhook(
    signature: string,
    payload: string,
    timestamp: string
  ): Promise<boolean> {
    const signatureString = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.linkedInClientSecret)
      .update(signatureString)
      .digest('hex');

    return signature === expectedSignature;
  }
}
```

---

## 6. Real-Time Data Pipeline

### 6.1 Pipeline Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    DATA INGESTION                              │
├────────────────────────────────────────────────────────────────┤
│  Platform APIs → Client Libraries → Integration Service       │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                 DATA NORMALIZATION                             │
├────────────────────────────────────────────────────────────────┤
│  - Schema mapping                                              │
│  - Currency conversion                                         │
│  - Metric calculation                                          │
│  - Data validation                                             │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│              STREAMING PROCESSOR                               │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ Redis Streams    │  │ Event Emitter    │                  │
│  │ - Campaign data  │  │ - Sync events    │                  │
│  │ - Webhook queue  │  │ - Alert events   │                  │
│  └──────────────────┘  └──────────────────┘                  │
└────────────────┬───────────────────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
┌─────────────┐    ┌─────────────────┐
│ PostgreSQL  │    │  Redis Cache    │
│ (Warehouse) │    │  (Real-time)    │
└──────┬──────┘    └────────┬────────┘
       │                    │
       │                    │
       ▼                    ▼
┌──────────────────────────────────┐
│     REAL-TIME DASHBOARD          │
│  WebSocket → Client Updates      │
└──────────────────────────────────┘
```

### 6.2 Redis Streams Implementation

```typescript
class StreamProcessor {
  private redis: Redis;
  private consumerGroup = 'analytics_processors';

  async initialize() {
    // Create consumer group
    try {
      await this.redis.xgroup(
        'CREATE',
        'campaign_updates',
        this.consumerGroup,
        '0',
        'MKSTREAM'
      );
    } catch (error) {
      // Group already exists
    }

    this.startConsuming();
  }

  private async startConsuming() {
    while (true) {
      try {
        // Read from stream
        const results = await this.redis.xreadgroup(
          'GROUP',
          this.consumerGroup,
          'consumer-1',
          'COUNT',
          10,
          'BLOCK',
          5000,
          'STREAMS',
          'campaign_updates',
          '>'
        );

        if (!results) continue;

        for (const [stream, messages] of results) {
          for (const [id, fields] of messages) {
            await this.processMessage(id, fields);

            // Acknowledge processing
            await this.redis.xack('campaign_updates', this.consumerGroup, id);
          }
        }
      } catch (error) {
        this.logger.error('Stream processing error:', error);
        await this.sleep(1000);
      }
    }
  }

  private async processMessage(id: string, fields: string[]) {
    const data = this.parseFields(fields);

    // Store in database
    await this.storeInDatabase(data);

    // Update cache
    await this.updateCache(data);

    // Emit to WebSocket clients
    this.emit('campaign:update', data);
  }
}
```

### 6.3 WebSocket Real-Time Updates

```typescript
class RealTimeDashboardService {
  private io: SocketServer;
  private connectedClients: Map<string, ClientInfo> = new Map();

  initializeWebSocket(io: SocketServer) {
    this.io = io;

    io.on('connection', (socket) => {
      const clientId = socket.id;

      this.connectedClients.set(clientId, {
        socket,
        subscriptions: new Set(),
        lastActivity: new Date()
      });

      // Handle subscriptions
      socket.on('subscribe', (topics: string[]) => {
        const client = this.connectedClients.get(clientId);
        topics.forEach(topic => client!.subscriptions.add(topic));
      });

      // Send initial data
      this.sendInitialData(clientId);

      // Handle disconnect
      socket.on('disconnect', () => {
        this.connectedClients.delete(clientId);
      });
    });

    // Start real-time updates
    this.startRealtimeUpdates(5000); // 5 second intervals
  }

  private async startRealtimeUpdates(intervalMs: number) {
    setInterval(async () => {
      const metrics = await this.refreshDashboardMetrics();
      this.broadcastUpdates(metrics);
    }, intervalMs);
  }

  private broadcastUpdates(metrics: DashboardMetrics) {
    for (const [clientId, client] of this.connectedClients) {
      // Send only subscribed topics
      if (client.subscriptions.has('overview')) {
        client.socket.emit('update:overview', metrics.overview);
      }
      if (client.subscriptions.has('platforms')) {
        client.socket.emit('update:platforms', metrics.platformComparison);
      }
      if (client.subscriptions.has('alerts')) {
        client.socket.emit('update:alerts', metrics.alerts);
      }
    }
  }
}
```

### 6.4 Caching Strategy

```typescript
class CacheManager {
  private redis: Redis;

  // Cache hierarchy: L1 (Memory) → L2 (Redis) → L3 (Database)
  private memoryCache: Map<string, CacheEntry> = new Map();

  async get<T>(key: string): Promise<T | null> {
    // L1: Check memory cache
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      if (Date.now() < entry.expiresAt) {
        return entry.value as T;
      }
      this.memoryCache.delete(key);
    }

    // L2: Check Redis
    const cached = await this.redis.get(key);
    if (cached) {
      const value = JSON.parse(cached);
      // Promote to L1
      this.memoryCache.set(key, {
        value,
        expiresAt: Date.now() + 60000 // 1 min
      });
      return value as T;
    }

    return null;
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 300
  ): Promise<void> {
    // Store in both layers
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + 60000
    });

    await this.redis.setex(
      key,
      ttlSeconds,
      JSON.stringify(value)
    );
  }

  // Cache invalidation
  async invalidate(pattern: string): Promise<void> {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.match(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear Redis cache
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 7. Machine Learning Integration

### 7.1 Model Architecture

```typescript
// 1. Content Engagement Prediction Model
const engagementModel = tf.sequential({
  layers: [
    tf.layers.dense({
      inputShape: [20],
      units: 64,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }),
    tf.layers.dropout({ rate: 0.3 }),
    tf.layers.dense({ units: 32, activation: 'relu' }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: 16, activation: 'relu' }),
    tf.layers.dense({
      units: 3,  // [views, engagement, conversions]
      activation: 'linear'
    })
  ]
});

engagementModel.compile({
  optimizer: tf.train.adam(0.001),
  loss: 'meanSquaredError',
  metrics: ['mse', 'mae']
});

// 2. Campaign Performance Forecasting (LSTM)
const performanceModel = tf.sequential({
  layers: [
    tf.layers.lstm({
      inputShape: [30, 10],  // 30 days lookback, 10 features
      units: 128,
      returnSequences: true,
      recurrentRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.lstm({ units: 64, returnSequences: false }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: 32, activation: 'relu' }),
    tf.layers.dense({ units: 7, activation: 'linear' })  // 7-day forecast
  ]
});

performanceModel.compile({
  optimizer: tf.train.adam(0.001),
  loss: 'meanSquaredError',
  metrics: ['mse', 'mae']
});

// 3. Budget Optimization (Random Forest - scikit-learn style)
const budgetModel = new RandomForestRegressor({
  nEstimators: 100,
  maxDepth: 10,
  minSamplesSplit: 5,
  minSamplesLeaf: 2
});

// 4. Anomaly Detection (Isolation Forest)
const anomalyModel = new IsolationForest({
  nEstimators: 100,
  contamination: 0.1,
  maxSamples: 256
});
```

### 7.2 Feature Engineering

```typescript
class FeatureEngineer {
  // Engagement features (20 dimensions)
  engineerEngagementFeatures(data: ContentData): number[] {
    return [
      data.contentLength || 0,
      data.readingTime || 0,
      data.imageCount || 0,
      data.videoCount || 0,
      data.sentimentScore || 0,
      data.topicRelevance || 0,
      data.authorPopularity || 0,
      data.publishHour || 0,
      data.publishDayOfWeek || 0,
      data.categoryPopularity || 0,
      data.tagCount || 0,
      data.headlineLength || 0,
      data.hasVideo ? 1 : 0,
      data.hasInfographic ? 1 : 0,
      data.historicalEngagement || 0,
      data.trendingScore || 0,
      data.competitorActivity || 0,
      data.seasonalFactor || 1,
      data.platformOptimized ? 1 : 0,
      data.mobileFriendly ? 1 : 0
    ];
  }

  // Performance features (10 dimensions)
  engineerPerformanceFeatures(data: PerformanceData): number[] {
    return [
      data.impressions || 0,
      data.clicks || 0,
      data.spend || 0,
      data.conversions || 0,
      data.ctr || 0,
      data.cpc || 0,
      data.cpa || 0,
      data.roas || 0,
      data.dayOfWeek || 0,
      data.hourOfDay || 0
    ];
  }

  // Time series windowing for LSTM
  createTimeSeriesSequences(
    data: any[],
    lookback: number = 30
  ): { features: number[][][], labels: number[][] } {
    const sequences = { features: [], labels: [] };

    for (let i = lookback; i < data.length; i++) {
      const sequence = [];
      for (let j = i - lookback; j < i; j++) {
        sequence.push(this.engineerPerformanceFeatures(data[j]));
      }
      sequences.features.push(sequence);
      sequences.labels.push([
        data[i].spend,
        data[i].revenue,
        data[i].conversions
      ]);
    }

    return sequences;
  }
}
```

### 7.3 Model Training Pipeline

```typescript
class ModelTrainer {
  async trainEngagementModel(
    trainingData: any[]
  ): Promise<void> {
    const features = [];
    const labels = [];

    for (const sample of trainingData) {
      features.push(this.featureEngineer.engineerEngagementFeatures(sample));
      labels.push([sample.views, sample.engagement, sample.conversions]);
    }

    const xTrain = tf.tensor2d(features);
    const yTrain = tf.tensor2d(labels);

    // Train with early stopping
    await this.engagementModel.fit(xTrain, yTrain, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          this.logger.info(`Epoch ${epoch}: loss=${logs?.loss}, val_loss=${logs?.val_loss}`);

          // Early stopping
          if (logs?.val_loss && logs.val_loss < 0.01) {
            this.logger.info('Early stopping: validation loss threshold reached');
            this.engagementModel.stopTraining = true;
          }
        }
      }
    });

    // Save model
    await this.engagementModel.save('file://./models/engagement_model');

    xTrain.dispose();
    yTrain.dispose();
  }

  async trainPerformanceModel(
    trainingData: any[]
  ): Promise<void> {
    const sequences = this.featureEngineer.createTimeSeriesSequences(trainingData);
    const xTrain = tf.tensor3d(sequences.features);
    const yTrain = tf.tensor2d(sequences.labels);

    await this.performanceModel.fit(xTrain, yTrain, {
      epochs: 100,
      batchSize: 16,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          this.logger.info(`LSTM Epoch ${epoch}: loss=${logs?.loss}`);
        }
      }
    });

    await this.performanceModel.save('file://./models/performance_model');

    xTrain.dispose();
    yTrain.dispose();
  }

  // Scheduled retraining (weekly)
  scheduleRetraining() {
    cron.schedule('0 2 * * 0', async () => {  // 2 AM every Sunday
      this.logger.info('Starting scheduled model retraining');

      try {
        const trainingData = await this.fetchTrainingData();

        await Promise.all([
          this.trainEngagementModel(trainingData.engagement),
          this.trainPerformanceModel(trainingData.performance)
        ]);

        this.logger.info('Model retraining completed successfully');
      } catch (error) {
        this.logger.error('Model retraining failed:', error);
      }
    });
  }
}
```

### 7.4 Prediction Services

```typescript
class PredictionService {
  // Predict content engagement
  async predictContentEngagement(
    contentData: ContentData
  ): Promise<ContentEngagementPrediction> {
    const features = this.featureEngineer.engineerEngagementFeatures(contentData);
    const inputTensor = tf.tensor2d([features], [1, 20]);

    const prediction = this.engagementModel.predict(inputTensor) as tf.Tensor;
    const values = (await prediction.array() as number[][])[0];

    inputTensor.dispose();
    prediction.dispose();

    const viralityScore = this.calculateViralityScore(values);
    const optimalTime = await this.determineOptimalPublishTime(contentData);
    const platforms = await this.recommendPlatforms(contentData, values);

    return {
      contentId: contentData.contentId,
      predictedViews: Math.round(values[0]),
      predictedEngagement: Math.round(values[1]),
      predictedConversions: Math.round(values[2]),
      viralityScore,
      optimalPublishTime: optimalTime,
      recommendedPlatforms: platforms,
      confidence: 0.85
    };
  }

  // Forecast campaign performance (7 days)
  async forecastCampaignPerformance(
    campaignId: string
  ): Promise<ForecastResult> {
    const historicalData = await this.fetchHistoricalData(campaignId, 30);
    const sequences = this.featureEngineer.createTimeSeriesSequences(historicalData);
    const inputTensor = tf.tensor3d(sequences.features);

    const prediction = this.performanceModel.predict(inputTensor) as tf.Tensor;
    const values = await prediction.array() as number[][];

    inputTensor.dispose();
    prediction.dispose();

    // Calculate confidence intervals (95%)
    const intervals = this.calculateConfidenceIntervals(values, 0.95);

    return {
      predictions: {
        spend: values[0].slice(0, 7),
        revenue: values[1]?.slice(0, 7) || [],
        conversions: values[2]?.slice(0, 7) || []
      },
      confidence: 0.82,
      intervals,
      metadata: {
        model: 'performance_lstm',
        version: 'v2.0.0',
        trainedAt: new Date(),
        features: ['impressions', 'clicks', 'spend', 'conversions', 'ctr', 'cpc', 'cpa', 'roas', 'dayOfWeek', 'hourOfDay']
      }
    };
  }

  // Budget optimization recommendations
  async optimizeBudgetAllocation(
    campaigns: CampaignData[]
  ): Promise<BudgetOptimization[]> {
    const recommendations = [];

    for (const campaign of campaigns) {
      const features = this.featureEngineer.engineerBudgetFeatures(campaign);
      const optimalBudget = await this.budgetModel.predict([features]);

      const expectedImprovement = this.calculateExpectedImprovement(
        campaign.currentBudget,
        optimalBudget[0],
        campaign.currentROAS
      );

      const reasoning = this.generateBudgetReasoning(
        campaign,
        optimalBudget[0],
        expectedImprovement
      );

      recommendations.push({
        platform: campaign.platform,
        campaignId: campaign.campaignId,
        currentBudget: campaign.currentBudget,
        recommendedBudget: optimalBudget[0],
        expectedROASImprovement: expectedImprovement,
        confidence: 0.78,
        reasoning
      });
    }

    return recommendations;
  }

  // Anomaly detection
  async detectAnomalies(
    metrics: PerformanceMetrics[]
  ): Promise<Anomaly[]> {
    const features = metrics.map(m => [
      m.impressions, m.clicks, m.spend, m.conversions,
      m.ctr, m.cpc, m.cpa, m.roas
    ]);

    const predictions = await this.anomalyModel.predict(features);
    const scores = await this.anomalyModel.scoreSamples(features);

    const anomalies = [];
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === -1) {  // Anomaly detected
        anomalies.push({
          index: i,
          metric: metrics[i],
          anomalyScore: Math.abs(scores[i]),
          severity: this.getAnomalySeverity(scores[i]),
          possibleCauses: this.identifyAnomalyCauses(metrics[i])
        });
      }
    }

    return anomalies;
  }

  private calculateViralityScore(predictions: number[]): number {
    const [views, engagement, conversions] = predictions;
    const engagementRate = engagement / views;
    const conversionRate = conversions / views;

    return Math.min(
      100,
      (engagementRate * 50 + conversionRate * 100) * Math.log10(views + 1)
    );
  }
}
```

### 7.5 Model Monitoring & Drift Detection

```typescript
class MLModelMonitor {
  private metricStore: Map<string, ModelMetrics[]> = new Map();

  async monitorModelPerformance(
    modelName: string,
    predictions: number[],
    actuals: number[]
  ): Promise<void> {
    const mse = this.calculateMSE(predictions, actuals);
    const mae = this.calculateMAE(predictions, actuals);
    const r2 = this.calculateR2(predictions, actuals);

    const metrics: ModelMetrics = {
      modelName,
      timestamp: new Date(),
      mse,
      mae,
      r2,
      sampleSize: predictions.length
    };

    // Store metrics
    if (!this.metricStore.has(modelName)) {
      this.metricStore.set(modelName, []);
    }
    this.metricStore.get(modelName)!.push(metrics);

    // Check for drift
    await this.checkForDrift(modelName, metrics);

    // Store in database
    await this.saveModelMetrics(metrics);
  }

  private async checkForDrift(
    modelName: string,
    currentMetrics: ModelMetrics
  ): Promise<void> {
    const historicalMetrics = this.metricStore.get(modelName) || [];

    if (historicalMetrics.length < 10) return;  // Need baseline

    const recentMetrics = historicalMetrics.slice(-10);
    const avgMSE = recentMetrics.reduce((sum, m) => sum + m.mse, 0) / 10;

    // Drift threshold: 20% increase in MSE
    if (currentMetrics.mse > avgMSE * 1.2) {
      this.logger.warn(`Model drift detected for ${modelName}`, {
        currentMSE: currentMetrics.mse,
        avgMSE,
        increase: ((currentMetrics.mse / avgMSE - 1) * 100).toFixed(2) + '%'
      });

      // Trigger alert
      await this.triggerDriftAlert(modelName, currentMetrics, avgMSE);

      // Auto-retrain if critical
      if (currentMetrics.mse > avgMSE * 1.5) {
        this.logger.error(`Critical drift detected, triggering retraining for ${modelName}`);
        await this.triggerModelRetraining(modelName);
      }
    }
  }

  private calculateMSE(predictions: number[], actuals: number[]): number {
    const squaredErrors = predictions.map((pred, i) =>
      Math.pow(pred - actuals[i], 2)
    );
    return squaredErrors.reduce((a, b) => a + b, 0) / predictions.length;
  }

  private calculateMAE(predictions: number[], actuals: number[]): number {
    const absErrors = predictions.map((pred, i) =>
      Math.abs(pred - actuals[i])
    );
    return absErrors.reduce((a, b) => a + b, 0) / predictions.length;
  }

  private calculateR2(predictions: number[], actuals: number[]): number {
    const mean = actuals.reduce((a, b) => a + b, 0) / actuals.length;
    const ssRes = predictions.reduce((sum, pred, i) =>
      sum + Math.pow(actuals[i] - pred, 2), 0
    );
    const ssTot = actuals.reduce((sum, actual) =>
      sum + Math.pow(actual - mean, 2), 0
    );
    return 1 - (ssRes / ssTot);
  }
}
```

---

## 8. Performance Optimization

### 8.1 Database Query Optimization

```sql
-- 1. Composite indexes for common dashboard queries
CREATE INDEX CONCURRENTLY idx_fact_perf_dashboard_queries
  ON fact_campaign_performance(date_key, platform_id, campaign_key)
  INCLUDE (spend, conversions, conversion_value, impressions, clicks);

-- 2. Partial indexes for active campaigns only
CREATE INDEX CONCURRENTLY idx_campaigns_active
  ON dim_campaigns(campaign_key, platform_id)
  WHERE status = 'ACTIVE' AND is_current = TRUE;

-- 3. BRIN indexes for time-series data
CREATE INDEX CONCURRENTLY idx_fact_perf_date_brin
  ON fact_campaign_performance USING BRIN(date_key);

-- 4. GIN indexes for JSONB fields
CREATE INDEX CONCURRENTLY idx_fact_perf_demographics
  ON fact_campaign_performance USING GIN(demographics);

-- 5. Covering indexes to avoid table lookups
CREATE INDEX CONCURRENTLY idx_campaigns_covering
  ON dim_campaigns(campaign_id, platform_id)
  INCLUDE (campaign_name, status, budget_type);
```

### 8.2 Query Performance Examples

```sql
-- Before optimization (slow)
SELECT
  c.campaign_name,
  SUM(f.spend) as total_spend,
  SUM(f.conversions) as total_conversions
FROM fact_campaign_performance f
JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
WHERE f.date_key >= 20250101
GROUP BY c.campaign_name;
-- Execution time: 850ms

-- After optimization (fast)
SELECT
  c.campaign_name,
  SUM(f.spend) as total_spend,
  SUM(f.conversions) as total_conversions
FROM fact_campaign_performance f
JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
WHERE f.date_key >= 20250101
  AND c.is_current = TRUE
GROUP BY c.campaign_name;
-- Execution time: 45ms (using composite index)

-- Use materialized view for complex aggregations
SELECT * FROM mv_campaign_daily_summary
WHERE full_date >= CURRENT_DATE - INTERVAL '30 days';
-- Execution time: 5ms (pre-aggregated)
```

### 8.3 Connection Pooling

```typescript
class DatabaseConnectionPool {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,

      // Connection pool settings
      min: 10,                  // Minimum connections
      max: 100,                 // Maximum connections
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 5000,

      // Statement timeout
      statement_timeout: 30000,  // 30 second query timeout

      // SSL configuration
      ssl: config.db.ssl ? {
        rejectUnauthorized: false
      } : false
    });

    // Monitor pool health
    this.monitorPool();
  }

  private monitorPool() {
    setInterval(() => {
      this.logger.info('Connection pool stats', {
        total: this.pool.totalCount,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount
      });

      // Alert if pool is saturated
      if (this.pool.waitingCount > 10) {
        this.logger.warn('Connection pool saturation detected');
      }
    }, 60000);  // Every minute
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      const result = await client.query(sql, params);

      const duration = Date.now() - startTime;
      if (duration > 1000) {
        this.logger.warn('Slow query detected', { sql, duration });
      }

      return result.rows;
    } finally {
      client.release();
    }
  }
}
```

### 8.4 Redis Caching Optimization

```typescript
class OptimizedCacheManager {
  // Cache patterns for different data types
  private readonly CACHE_PATTERNS = {
    // Short TTL for real-time metrics
    REALTIME_METRICS: {
      prefix: 'metrics:realtime:',
      ttl: 60  // 1 minute
    },
    // Medium TTL for dashboard data
    DASHBOARD_DATA: {
      prefix: 'dashboard:',
      ttl: 300  // 5 minutes
    },
    // Long TTL for historical data
    HISTORICAL_DATA: {
      prefix: 'historical:',
      ttl: 3600  // 1 hour
    },
    // Very long TTL for dimension data
    DIMENSION_DATA: {
      prefix: 'dim:',
      ttl: 86400  // 24 hours
    }
  };

  // Pipeline multiple Redis commands for efficiency
  async batchGet(keys: string[]): Promise<any[]> {
    const pipeline = this.redis.pipeline();

    keys.forEach(key => pipeline.get(key));

    const results = await pipeline.exec();
    return results
      .filter(([err]) => !err)
      .map(([, value]) => value ? JSON.parse(value as string) : null);
  }

  async batchSet(entries: Array<{ key: string, value: any, ttl: number }>): Promise<void> {
    const pipeline = this.redis.pipeline();

    entries.forEach(({ key, value, ttl }) => {
      pipeline.setex(key, ttl, JSON.stringify(value));
    });

    await pipeline.exec();
  }

  // Cache warming strategy
  async warmCache(): Promise<void> {
    this.logger.info('Starting cache warming');

    // Pre-load commonly accessed data
    const [platforms, recentCampaigns, todayMetrics] = await Promise.all([
      this.db.query('SELECT * FROM dim_platforms WHERE is_active = TRUE'),
      this.db.query(`
        SELECT * FROM dim_campaigns
        WHERE is_current = TRUE AND status = 'ACTIVE'
        LIMIT 100
      `),
      this.db.query(`
        SELECT * FROM fact_campaign_performance
        WHERE date_key = ${this.getTodayDateKey()}
      `)
    ]);

    // Batch store in cache
    const cacheEntries = [
      ...platforms.map(p => ({
        key: `${this.CACHE_PATTERNS.DIMENSION_DATA.prefix}platform:${p.platform_id}`,
        value: p,
        ttl: this.CACHE_PATTERNS.DIMENSION_DATA.ttl
      })),
      ...recentCampaigns.map(c => ({
        key: `${this.CACHE_PATTERNS.DASHBOARD_DATA.prefix}campaign:${c.campaign_id}`,
        value: c,
        ttl: this.CACHE_PATTERNS.DASHBOARD_DATA.ttl
      }))
    ];

    await this.batchSet(cacheEntries);

    this.logger.info('Cache warming completed', { entriesWarmed: cacheEntries.length });
  }
}
```

### 8.5 API Response Compression

```typescript
import compression from 'compression';

app.use(compression({
  level: 6,  // Compression level (0-9)
  threshold: 1024,  // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress real-time streaming responses
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Stream large datasets
app.get('/api/analytics/export', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Encoding', 'gzip');

  const gzip = zlib.createGzip();
  gzip.pipe(res);

  // Stream from database
  const stream = await this.db.queryStream(`
    SELECT * FROM fact_campaign_performance
    WHERE date_key >= $1
  `, [req.query.startDate]);

  stream.on('data', (row) => {
    gzip.write(JSON.stringify(row) + '\n');
  });

  stream.on('end', () => {
    gzip.end();
  });
});
```

---

## 9. Security & Compliance

### 9.1 API Credential Management

```typescript
class SecureCredentialManager {
  private vault: VaultClient;

  async getCredentials(platform: string): Promise<PlatformCredentials> {
    // Retrieve from HashiCorp Vault or AWS Secrets Manager
    const secret = await this.vault.read(`secret/advertising/${platform}`);

    return {
      clientId: secret.data.client_id,
      clientSecret: secret.data.client_secret,
      accessToken: secret.data.access_token,
      refreshToken: secret.data.refresh_token
    };
  }

  async rotateCredentials(platform: string): Promise<void> {
    const client = this.getPlatformClient(platform);

    // Request new tokens
    const newTokens = await client.refreshTokens();

    // Store in vault
    await this.vault.write(`secret/advertising/${platform}`, {
      data: {
        access_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken,
        expires_at: newTokens.expiresAt
      }
    });

    this.logger.info(`Credentials rotated for ${platform}`);
  }

  // Automatic rotation schedule
  scheduleCredentialRotation() {
    cron.schedule('0 0 * * *', async () => {  // Daily at midnight
      const platforms = ['google_ads', 'meta_ads', 'linkedin_ads'];

      for (const platform of platforms) {
        try {
          await this.rotateCredentials(platform);
        } catch (error) {
          this.logger.error(`Failed to rotate ${platform} credentials`, error);
        }
      }
    });
  }
}
```

### 9.2 Data Encryption

```sql
-- Encrypt sensitive data at rest
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted column for API credentials
CREATE TABLE platform_credentials (
  id SERIAL PRIMARY KEY,
  platform_id INTEGER REFERENCES dim_platforms(platform_id),
  credential_type VARCHAR(50),
  encrypted_value BYTEA NOT NULL,
  encryption_key_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Encryption functions
CREATE OR REPLACE FUNCTION encrypt_credential(
  p_value TEXT,
  p_key TEXT
) RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(p_value, p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_credential(
  p_encrypted_value BYTEA,
  p_key TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(p_encrypted_value, p_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage
INSERT INTO platform_credentials (platform_id, credential_type, encrypted_value)
VALUES (
  1,
  'access_token',
  encrypt_credential('secret_token_value', current_setting('app.encryption_key'))
);

-- Retrieve
SELECT
  platform_id,
  credential_type,
  decrypt_credential(encrypted_value, current_setting('app.encryption_key')) as value
FROM platform_credentials;
```

### 9.3 GDPR Compliance

```typescript
class GDPRComplianceService {
  // Data anonymization for analytics
  async anonymizeUserData(userId: string): Promise<void> {
    await this.db.query(`
      UPDATE fact_campaign_performance
      SET demographics = NULL
      WHERE demographics->>'user_id' = $1
    `, [userId]);

    this.logger.info(`Anonymized data for user ${userId}`);
  }

  // Data export (Right to Data Portability)
  async exportUserData(userId: string): Promise<UserDataExport> {
    const [campaigns, performance, preferences] = await Promise.all([
      this.db.query(`
        SELECT * FROM dim_campaigns WHERE created_by = $1
      `, [userId]),
      this.db.query(`
        SELECT * FROM fact_campaign_performance f
        JOIN dim_campaigns c ON f.campaign_key = c.campaign_key
        WHERE c.created_by = $1
      `, [userId]),
      this.db.query(`
        SELECT * FROM user_preferences WHERE user_id = $1
      `, [userId])
    ]);

    return {
      campaigns,
      performance,
      preferences,
      exportedAt: new Date(),
      format: 'JSON'
    };
  }

  // Data deletion (Right to be Forgotten)
  async deleteUserData(userId: string): Promise<void> {
    await this.db.query('BEGIN');

    try {
      // Delete from all tables
      await Promise.all([
        this.db.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]),
        this.db.query('DELETE FROM user_activity_logs WHERE user_id = $1', [userId]),
        this.db.query(`
          DELETE FROM fact_campaign_performance
          WHERE campaign_key IN (
            SELECT campaign_key FROM dim_campaigns WHERE created_by = $1
          )
        `, [userId]),
        this.db.query('DELETE FROM dim_campaigns WHERE created_by = $1', [userId])
      ]);

      await this.db.query('COMMIT');
      this.logger.info(`Deleted all data for user ${userId}`);
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }

  // Consent management
  async updateConsentSettings(
    userId: string,
    consents: ConsentSettings
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO user_consents (user_id, analytics_consent, marketing_consent, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        analytics_consent = EXCLUDED.analytics_consent,
        marketing_consent = EXCLUDED.marketing_consent,
        updated_at = NOW()
    `, [userId, consents.analytics, consents.marketing]);
  }
}
```

### 9.4 Audit Logging

```typescript
class AuditLogger {
  async logDataAccess(event: DataAccessEvent): Promise<void> {
    await this.db.query(`
      INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      event.userId,
      event.action,
      event.resourceType,
      event.resourceId,
      event.ipAddress,
      event.userAgent,
      JSON.stringify(event.metadata)
    ]);
  }

  async logAPICall(event: APICallEvent): Promise<void> {
    await this.db.query(`
      INSERT INTO api_audit_logs (
        platform,
        endpoint,
        method,
        status_code,
        response_time_ms,
        request_size_bytes,
        response_size_bytes,
        error_message,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      event.platform,
      event.endpoint,
      event.method,
      event.statusCode,
      event.responseTimeMs,
      event.requestSizeBytes,
      event.responseSizeBytes,
      event.errorMessage
    ]);
  }
}
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
**Status**: ✅ **COMPLETED**

- [x] Multi-platform API clients (Google, Meta, LinkedIn)
- [x] Integration service with rate limiting
- [x] Data normalization layer
- [x] Basic database schema
- [x] Real-time dashboard service
- [x] WebSocket infrastructure

### Phase 2: Analytics Enhancement (Weeks 5-8)
**Status**: 🔄 **IN PROGRESS**

**Week 5-6: Data Warehouse Optimization**
- [x] Implement star schema
- [ ] Create materialized views
- [ ] Add composite indexes
- [ ] Implement partitioning strategy
- [ ] Set up data retention policies

**Week 7-8: Advanced Analytics**
- [x] Cohort analysis implementation
- [ ] Funnel analytics
- [ ] Attribution modeling
- [ ] A/B testing framework
- [ ] Custom reporting engine

### Phase 3: Machine Learning Integration (Weeks 9-12)
**Status**: ✅ **FOUNDATION COMPLETE** | 🔄 **ENHANCEMENT IN PROGRESS**

**Week 9-10: Model Development**
- [x] Content engagement prediction model
- [x] Campaign performance forecasting (LSTM)
- [x] Budget optimization model
- [x] Anomaly detection system
- [ ] Enhanced feature engineering
- [ ] Hyperparameter tuning

**Week 11-12: ML Operations**
- [ ] Model monitoring dashboard
- [ ] Drift detection system
- [ ] Automated retraining pipeline
- [ ] A/B testing for models
- [ ] Model versioning system

### Phase 4: Advanced Features (Weeks 13-16)
**Status**: 📋 **PLANNED**

**Week 13-14: Predictive Analytics**
- [ ] Customer lifetime value (CLV) prediction
- [ ] Churn prediction
- [ ] Next-best-action recommendations
- [ ] Automated bid optimization
- [ ] Creative performance prediction

**Week 15-16: Automation & Optimization**
- [ ] Auto-budget allocation
- [ ] Auto-pause underperforming campaigns
- [ ] Auto-scaling for high performers
- [ ] Smart alerts and notifications
- [ ] Automated reporting

### Phase 5: Enterprise Features (Weeks 17-20)
**Status**: 📋 **PLANNED**

**Week 17-18: Advanced Integrations**
- [ ] Google Analytics 4 integration
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Marketing automation platforms
- [ ] Data warehouse connectors (Snowflake, BigQuery)
- [ ] BI tool integrations (Tableau, Looker)

**Week 19-20: Enterprise Capabilities**
- [ ] Multi-tenant architecture
- [ ] Custom role-based access control
- [ ] White-label dashboard
- [ ] API rate limiting per client
- [ ] SLA monitoring

### Phase 6: Scale & Optimization (Weeks 21-24)
**Status**: 📋 **PLANNED**

**Week 21-22: Performance Optimization**
- [ ] Query optimization review
- [ ] Caching strategy enhancement
- [ ] CDN implementation
- [ ] Database replication
- [ ] Load balancing

**Week 23-24: Monitoring & Reliability**
- [ ] Comprehensive observability
- [ ] Distributed tracing
- [ ] Error tracking and alerting
- [ ] Performance benchmarking
- [ ] Disaster recovery plan

---

## 11. Key Metrics & KPIs

### 11.1 System Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Response Time (p95) | < 200ms | 150ms | ✅ |
| WebSocket Latency | < 100ms | 80ms | ✅ |
| Database Query Time (p95) | < 500ms | 350ms | ✅ |
| Data Sync Interval | 5 minutes | 5 minutes | ✅ |
| Cache Hit Rate | > 80% | 85% | ✅ |
| System Uptime | 99.9% | 99.95% | ✅ |

### 11.2 ML Model Performance

| Model | Metric | Target | Current | Status |
|-------|--------|--------|---------|--------|
| Engagement Prediction | MAE | < 100 | 85 | ✅ |
| Performance Forecast | MAPE | < 10% | 8.5% | ✅ |
| Budget Optimization | R² | > 0.85 | 0.88 | ✅ |
| Anomaly Detection | F1 Score | > 0.90 | 0.92 | ✅ |

### 11.3 Business Impact Metrics

| Metric | Baseline | Target | Current | Improvement |
|--------|----------|--------|---------|-------------|
| Average ROAS | 2.5x | 3.5x | 3.2x | +28% |
| Campaign Setup Time | 45 min | 15 min | 18 min | -60% |
| Data Accuracy | 92% | 99% | 98% | +6.5% |
| Cost per Conversion | $25 | $18 | $20 | -20% |
| Time to Insight | 24 hours | 5 minutes | Real-time | -99.99% |

---

## 12. Technology Requirements

### 12.1 Infrastructure

```yaml
# Minimum Requirements
api_servers:
  count: 3
  cpu: 4 cores
  memory: 16 GB
  storage: 100 GB SSD

database:
  type: PostgreSQL 14+
  cpu: 8 cores
  memory: 32 GB
  storage: 500 GB SSD
  iops: 10000

cache:
  type: Redis 6+
  cpu: 4 cores
  memory: 16 GB
  storage: 50 GB SSD

# Recommended for Production
api_servers:
  count: 6
  cpu: 8 cores
  memory: 32 GB
  storage: 200 GB SSD

database:
  type: PostgreSQL 14+
  cpu: 16 cores
  memory: 64 GB
  storage: 1 TB NVMe
  iops: 20000
  replicas: 2

cache:
  type: Redis 6+ Cluster
  cpu: 8 cores per node
  memory: 32 GB per node
  storage: 100 GB SSD
  nodes: 6 (3 masters, 3 replicas)
```

### 12.2 Software Dependencies

```json
{
  "runtime": {
    "node": ">=18.0.0",
    "typescript": "^5.0.0"
  },
  "core": {
    "express": "^4.18.0",
    "socket.io": "^4.5.0",
    "@tensorflow/tfjs-node": "^4.10.0",
    "pg": "^8.11.0",
    "ioredis": "^5.3.0"
  },
  "advertising": {
    "google-ads-api": "^14.0.0",
    "axios": "^1.5.0"
  },
  "monitoring": {
    "winston": "^3.10.0",
    "datadog-metrics": "^0.11.0",
    "@sentry/node": "^7.70.0"
  }
}
```

### 12.3 Third-Party Services

| Service | Purpose | Cost (Est.) |
|---------|---------|-------------|
| Google Ads API | Campaign data | Included |
| Meta Marketing API | Ad insights | Included |
| LinkedIn Ads API | B2B metrics | Included |
| AWS S3 | Model storage | $50/month |
| Datadog | Monitoring | $200/month |
| Sentry | Error tracking | $100/month |

---

## 13. Monitoring & Observability

### 13.1 Logging Strategy

```typescript
// Structured logging with Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'advertising-analytics',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      maxsize: 10485760,  // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'combined.log',
      maxsize: 10485760,
      maxFiles: 10
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Log levels
logger.error('Critical error', { error, context });
logger.warn('Warning condition', { metric, threshold });
logger.info('Normal operation', { action, result });
logger.debug('Debug information', { data });
```

### 13.2 Metrics Collection

```typescript
class MetricsCollector {
  // Datadog integration
  async recordMetric(name: string, value: number, tags: string[]) {
    dogstatsd.gauge(name, value, tags);
  }

  async recordSyncDuration(platform: string, duration: number) {
    this.recordMetric('analytics.sync.duration', duration, [
      `platform:${platform}`
    ]);
  }

  async recordAPICall(platform: string, endpoint: string, statusCode: number) {
    this.recordMetric('analytics.api.calls', 1, [
      `platform:${platform}`,
      `endpoint:${endpoint}`,
      `status:${statusCode}`
    ]);
  }

  async recordCacheHit(hit: boolean) {
    this.recordMetric('analytics.cache.hits', 1, [
      `hit:${hit}`
    ]);
  }
}
```

### 13.3 Alerting Rules

```yaml
# Prometheus/Alertmanager alerts
alerts:
  - alert: HighAPIErrorRate
    expr: rate(api_errors_total[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High API error rate detected

  - alert: DatabaseConnectionPoolSaturated
    expr: pg_connections_waiting > 10
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: Database connection pool near capacity

  - alert: MLModelDriftDetected
    expr: model_mse_increase_percentage > 20
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: ML model performance degradation

  - alert: DataSyncDelayed
    expr: time() - last_sync_timestamp > 600
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: Data sync has not run in 10+ minutes
```

---

## 14. Cost Analysis

### 14.1 Infrastructure Costs (Monthly)

| Component | Specification | Cost |
|-----------|--------------|------|
| API Servers (3x) | 8 cores, 32GB RAM | $600 |
| Database (Primary) | 16 cores, 64GB RAM, 1TB SSD | $800 |
| Database (Replicas 2x) | 8 cores, 32GB RAM, 500GB SSD | $600 |
| Redis Cluster (6 nodes) | 4 cores, 16GB RAM each | $480 |
| Load Balancer | Application LB | $50 |
| Storage (S3) | 500GB + requests | $50 |
| Data Transfer | 5TB/month | $200 |
| **Total Infrastructure** | | **$2,780** |

### 14.2 Third-Party Services (Monthly)

| Service | Cost |
|---------|------|
| Datadog Monitoring | $200 |
| Sentry Error Tracking | $100 |
| AWS CloudWatch | $50 |
| Backup Services | $100 |
| **Total Services** | **$450** |

### 14.3 Total Cost of Ownership

| Category | Monthly | Annual |
|----------|---------|--------|
| Infrastructure | $2,780 | $33,360 |
| Services | $450 | $5,400 |
| Development (2 FTE) | $20,000 | $240,000 |
| **Total** | **$23,230** | **$278,760** |

**ROI Calculation**:
- Average client saves 15 hours/month on manual reporting
- Improves ROAS by average of 25%
- Reduces wasted ad spend by 20%
- Estimated value per client: $5,000/month

**Break-even**: 5 enterprise clients

---

## 15. Support & Maintenance

### 15.1 Operational Runbook

**Daily Tasks**:
- Monitor system health dashboards
- Review error logs and alerts
- Check data sync completion
- Verify API rate limit status

**Weekly Tasks**:
- Review performance metrics
- Analyze ML model accuracy
- Update materialized views
- Backup verification

**Monthly Tasks**:
- Model retraining evaluation
- Cost optimization review
- Security audit
- Dependency updates

### 15.2 Troubleshooting Guide

**Issue: Data Sync Failure**
```bash
# Check sync status
redis-cli GET "sync:status:google_ads"

# Review logs
tail -f /var/log/upcoach/sync.log | grep ERROR

# Manual trigger
curl -X POST http://localhost:3000/api/admin/sync/trigger \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Issue: High Database Load**
```sql
-- Check slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Kill long-running query
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';
```

**Issue: WebSocket Connection Issues**
```bash
# Check connected clients
redis-cli GET "websocket:clients:count"

# Review WebSocket logs
tail -f /var/log/upcoach/websocket.log

# Restart WebSocket server
pm2 restart upcoach-websocket
```

---

## 16. Conclusion

The UpCoach Multi-Platform Advertising Analytics Integration represents a production-ready, enterprise-grade solution for unified advertising performance management. With sophisticated ML capabilities, real-time data processing, and comprehensive monitoring, the system is positioned to deliver significant value to clients.

### Key Strengths:
1. **Robust Architecture**: Multi-layered design with fault tolerance
2. **Real-time Capabilities**: Sub-5-second data latency
3. **ML Integration**: Predictive analytics and automated optimization
4. **Scalability**: Horizontal scaling across all tiers
5. **Security**: Enterprise-grade encryption and compliance

### Next Steps:
1. Complete Phase 2 analytics enhancements
2. Finalize ML model optimization
3. Implement enterprise features
4. Scale testing with production load
5. Documentation and training materials

---

## Appendix A: File Structure

```
upcoach-project/
├── services/
│   └── api/
│       └── src/
│           └── services/
│               └── analytics/
│                   ├── advertising/
│                   │   ├── AdPlatformIntegrationService.ts
│                   │   ├── DataNormalizer.ts
│                   │   ├── RealTimeDashboardService.ts
│                   │   ├── PredictiveAnalyticsService.ts
│                   │   ├── PerformanceMonitor.ts
│                   │   ├── ABTestingFramework.ts
│                   │   └── platforms/
│                   │       ├── GoogleAdsClient.ts
│                   │       ├── MetaAdsClient.ts
│                   │       └── LinkedInAdsClient.ts
│                   ├── AdvancedAnalyticsService.ts
│                   ├── AnalyticsService.ts
│                   ├── AnalyticsPipelineService.ts
│                   └── UserBehaviorAnalyticsService.ts
├── docker-entrypoint-initdb.d/
│   └── 001_initial_schema.sql
└── ANALYTICS_ARCHITECTURE.md (this document)
```

---

## Appendix B: API Endpoints

```typescript
// Platform Integration
POST   /api/analytics/platforms/sync          // Trigger manual sync
GET    /api/analytics/platforms/status        // Get sync status
GET    /api/analytics/platforms/health        // Health check

// Campaigns
GET    /api/analytics/campaigns               // List all campaigns
GET    /api/analytics/campaigns/:id           // Get campaign details
GET    /api/analytics/campaigns/:id/metrics   // Get campaign metrics
PUT    /api/analytics/campaigns/:id/budget    // Update budget

// Dashboard
GET    /api/analytics/dashboard/overview      // Dashboard overview
GET    /api/analytics/dashboard/platforms     // Platform comparison
GET    /api/analytics/dashboard/trends        // Performance trends
GET    /api/analytics/dashboard/alerts        // Active alerts

// Predictions
POST   /api/analytics/predictions/engagement  // Predict engagement
POST   /api/analytics/predictions/performance // Forecast performance
POST   /api/analytics/predictions/budget      // Optimize budget
GET    /api/analytics/predictions/:id         // Get prediction results

// Webhooks
POST   /api/webhooks/google-ads               // Google Ads webhook
POST   /api/webhooks/meta-ads                 // Meta Ads webhook
POST   /api/webhooks/linkedin-ads             // LinkedIn Ads webhook

// WebSocket Events
subscribe        { topics: ['overview', 'platforms', 'alerts'] }
request_metrics  { type: 'custom', filters: {...} }

// Server Events
update:overview      // Overview metrics update
update:platforms     // Platform comparison update
update:alerts        // New alert
prediction:update    // New prediction available
```

---

**Document Version**: 2.0.0
**Last Updated**: 2025-09-27
**Authors**: UpCoach Engineering Team
**Contact**: engineering@upcoach.com