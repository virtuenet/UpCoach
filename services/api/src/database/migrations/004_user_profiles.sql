-- Create user_profiles table for AI-powered user profiling
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    learning_style VARCHAR(20) DEFAULT 'balanced' CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading', 'balanced')),
    communication_preference VARCHAR(20) DEFAULT 'supportive' CHECK (communication_preference IN ('supportive', 'direct', 'analytical', 'motivational', 'empathetic')),
    personality_type VARCHAR(50),
    coaching_preferences JSONB DEFAULT '{
        "preferredMethods": ["goal", "habit", "reflection"],
        "sessionFrequency": "weekly",
        "sessionDuration": 30,
        "preferredTimes": ["morning", "evening"],
        "focusAreas": ["productivity", "wellbeing"]
    }'::jsonb,
    behavior_patterns JSONB DEFAULT '{
        "avgSessionDuration": 0,
        "completionRate": 0,
        "engagementLevel": 0,
        "preferredTopics": [],
        "responseTime": 0,
        "consistencyScore": 0
    }'::jsonb,
    progress_metrics JSONB DEFAULT '{
        "totalGoalsSet": 0,
        "goalsCompleted": 0,
        "currentStreak": 0,
        "longestStreak": 0,
        "totalSessions": 0,
        "accountAge": 0,
        "lastActiveDate": null
    }'::jsonb,
    strengths TEXT[] DEFAULT ARRAY[]::TEXT[],
    growth_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
    motivators TEXT[] DEFAULT ARRAY[]::TEXT[],
    obstacles TEXT[] DEFAULT ARRAY[]::TEXT[],
    preferences JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_learning_style ON user_profiles(learning_style);
CREATE INDEX idx_user_profiles_communication_preference ON user_profiles(communication_preference);
CREATE INDEX idx_user_profiles_behavior_patterns ON user_profiles USING GIN (behavior_patterns);
CREATE INDEX idx_user_profiles_progress_metrics ON user_profiles USING GIN (progress_metrics);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at_trigger
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at();

-- Add profile insights tracking table
CREATE TABLE IF NOT EXISTS profile_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    insight_content TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    evidence JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for profile insights
CREATE INDEX idx_profile_insights_user_id ON profile_insights(user_id);
CREATE INDEX idx_profile_insights_type ON profile_insights(insight_type);
CREATE INDEX idx_profile_insights_active ON profile_insights(is_active) WHERE is_active = true;
CREATE INDEX idx_profile_insights_generated_at ON profile_insights(generated_at);

-- Add profile assessment history
CREATE TABLE IF NOT EXISTS profile_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL,
    assessment_data JSONB NOT NULL,
    readiness_level VARCHAR(20) CHECK (readiness_level IN ('beginner', 'intermediate', 'advanced')),
    recommendations TEXT[],
    assessment_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for assessments
CREATE INDEX idx_profile_assessments_user_id ON profile_assessments(user_id);
CREATE INDEX idx_profile_assessments_type ON profile_assessments(assessment_type);
CREATE INDEX idx_profile_assessments_created_at ON profile_assessments(created_at);

-- Add comment
COMMENT ON TABLE user_profiles IS 'Stores AI-powered user profiling data for personalized coaching';
COMMENT ON TABLE profile_insights IS 'Tracks AI-generated insights about user behavior and progress';
COMMENT ON TABLE profile_assessments IS 'Historical record of user profile assessments and recommendations';