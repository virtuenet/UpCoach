-- Migration: Create A/B Testing Tables
-- Description: Create tables for experiments, assignments, and events tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create experiments table
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    variants JSONB NOT NULL,
    traffic_allocation INTEGER NOT NULL DEFAULT 100 CHECK (traffic_allocation >= 1 AND traffic_allocation <= 100),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    target_metric VARCHAR(255) NOT NULL,
    success_criteria JSONB NOT NULL,
    segmentation JSONB,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_end_date_after_start CHECK (end_date IS NULL OR end_date > start_date)
);

-- Create experiment_assignments table
CREATE TABLE experiment_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant_id VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context JSONB,
    is_excluded BOOLEAN DEFAULT FALSE,
    exclusion_reason VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    session_id VARCHAR(255),
    
    UNIQUE(experiment_id, user_id)
);

-- Create experiment_events table
CREATE TABLE experiment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variant_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_value DECIMAL(10,2),
    properties JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255),
    metadata JSONB
);

-- Create indexes for performance
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_experiments_dates ON experiments(start_date, end_date);
CREATE INDEX idx_experiments_created_by ON experiments(created_by);

CREATE INDEX idx_experiment_assignments_experiment_user ON experiment_assignments(experiment_id, user_id);
CREATE INDEX idx_experiment_assignments_user ON experiment_assignments(user_id);
CREATE INDEX idx_experiment_assignments_variant ON experiment_assignments(variant_id);
CREATE INDEX idx_experiment_assignments_assigned_at ON experiment_assignments(assigned_at);
CREATE INDEX idx_experiment_assignments_excluded ON experiment_assignments(is_excluded);

CREATE INDEX idx_experiment_events_experiment_variant ON experiment_events(experiment_id, variant_id);
CREATE INDEX idx_experiment_events_user ON experiment_events(user_id);
CREATE INDEX idx_experiment_events_type ON experiment_events(event_type);
CREATE INDEX idx_experiment_events_timestamp ON experiment_events(timestamp);
CREATE INDEX idx_experiment_events_experiment_variant_type ON experiment_events(experiment_id, variant_id, event_type);

-- Create updated_at trigger for experiments table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_experiments_updated_at 
    BEFORE UPDATE ON experiments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- This would be useful for development/testing environments

-- Sample experiment
INSERT INTO experiments (
    name,
    description,
    variants,
    target_metric,
    success_criteria,
    start_date,
    created_by,
    updated_by
) VALUES (
    'Landing Page Hero Test',
    'Test different hero sections on the landing page to improve signup conversion',
    '[
        {
            "id": "control",
            "name": "Original Hero",
            "description": "Current hero section with existing copy",
            "allocation": 50,
            "isControl": true,
            "configuration": {
                "heroTitle": "Transform Your Life with AI Coaching",
                "heroSubtitle": "Get personalized guidance and achieve your goals",
                "ctaText": "Start Free Trial"
            }
        },
        {
            "id": "variant-a",
            "name": "Emotional Hero",
            "description": "Hero section with more emotional appeal",
            "allocation": 50,
            "isControl": false,
            "configuration": {
                "heroTitle": "Break Through Your Barriers",
                "heroSubtitle": "Join thousands who have transformed their lives with AI-powered coaching",
                "ctaText": "Begin Your Journey"
            }
        }
    ]'::jsonb,
    'signup_conversion',
    '{
        "primaryMetric": "signup_conversion",
        "minimumDetectableEffect": 10,
        "confidenceLevel": 95,
        "statisticalPower": 80,
        "minimumSampleSize": 1000
    }'::jsonb,
    NOW(),
    (SELECT id FROM users WHERE email = 'admin@upcoach.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'admin@upcoach.com' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE experiments IS 'A/B testing experiments configuration and metadata';
COMMENT ON TABLE experiment_assignments IS 'User assignments to experiment variants';
COMMENT ON TABLE experiment_events IS 'Events and conversions tracked for experiments';

COMMENT ON COLUMN experiments.variants IS 'JSON array containing variant configurations';
COMMENT ON COLUMN experiments.success_criteria IS 'JSON object with statistical testing parameters';
COMMENT ON COLUMN experiments.segmentation IS 'JSON object with user segmentation rules';
COMMENT ON COLUMN experiment_assignments.context IS 'Additional context data at time of assignment';
COMMENT ON COLUMN experiment_events.properties IS 'Event-specific properties and metadata';
COMMENT ON COLUMN experiment_events.event_value IS 'Numeric value associated with the event (revenue, duration, etc.)';

-- Grant permissions (adjust based on your user roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON experiments TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON experiment_assignments TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON experiment_events TO app_user; 