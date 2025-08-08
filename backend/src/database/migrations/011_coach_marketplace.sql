-- Coach Profiles Table
CREATE TABLE IF NOT EXISTS coach_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  bio TEXT,
  specializations TEXT[], -- Array of specialization areas
  certifications JSONB, -- Array of certification objects
  experience_years INTEGER DEFAULT 0,
  languages VARCHAR(10)[], -- ISO language codes
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Availability & Booking
  is_available BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  min_booking_hours DECIMAL(3, 1) DEFAULT 1.0,
  max_booking_hours DECIMAL(3, 1) DEFAULT 4.0,
  availability_schedule JSONB, -- Weekly recurring availability
  booking_buffer_hours INTEGER DEFAULT 24, -- Hours in advance required
  
  -- Profile Media
  profile_image_url TEXT,
  cover_image_url TEXT,
  intro_video_url TEXT,
  gallery_images JSONB, -- Array of image URLs
  
  -- Stats & Rating
  total_sessions INTEGER DEFAULT 0,
  total_clients INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  response_time_hours DECIMAL(5, 2), -- Average response time
  
  -- Settings
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  accepts_insurance BOOLEAN DEFAULT false,
  accepted_payment_methods JSONB,
  
  -- Metadata
  tags TEXT[],
  seo_slug VARCHAR(255) UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coach Specializations Table (for searchable categories)
CREATE TABLE IF NOT EXISTS coach_specializations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coach Sessions Table
CREATE TABLE IF NOT EXISTS coach_sessions (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coach_profiles(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  session_type VARCHAR(50) NOT NULL, -- 'video', 'audio', 'chat', 'in-person'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled'
  
  -- Timing
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  timezone VARCHAR(50) NOT NULL,
  
  -- Meeting Details
  meeting_url TEXT,
  meeting_password VARCHAR(100),
  location_address TEXT, -- For in-person sessions
  
  -- Pricing
  hourly_rate DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'refunded', 'failed'
  payment_id VARCHAR(255), -- Stripe payment ID
  
  -- Notes & Resources
  coach_notes TEXT,
  client_notes TEXT,
  shared_resources JSONB, -- Array of resource links/files
  
  -- Feedback
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_feedback TEXT,
  coach_rating INTEGER CHECK (coach_rating >= 1 AND coach_rating <= 5),
  coach_feedback TEXT,
  
  -- Metadata
  cancellation_reason TEXT,
  cancelled_by VARCHAR(50), -- 'coach', 'client', 'system'
  cancelled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coach Reviews Table
CREATE TABLE IF NOT EXISTS coach_reviews (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coach_profiles(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES coach_sessions(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT NOT NULL,
  
  -- Detailed Ratings
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  knowledge_rating INTEGER CHECK (knowledge_rating >= 1 AND knowledge_rating <= 5),
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  
  is_verified BOOLEAN DEFAULT false, -- Verified purchase
  is_featured BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  
  coach_response TEXT,
  coach_response_at TIMESTAMP WITH TIME ZONE,
  
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(coach_id, client_id, session_id)
);

-- Coach Availability Table (for custom availability)
CREATE TABLE IF NOT EXISTS coach_availability (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coach_profiles(id) ON DELETE CASCADE,
  
  -- Availability Type
  availability_type VARCHAR(50) NOT NULL, -- 'available', 'busy', 'vacation'
  
  -- Date/Time Range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  recurrence_days INTEGER[], -- For weekly: 0=Sunday, 6=Saturday
  
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coach Packages Table
CREATE TABLE IF NOT EXISTS coach_packages (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coach_profiles(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Package Details
  session_count INTEGER NOT NULL,
  validity_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Savings
  original_price DECIMAL(10, 2),
  discount_percentage DECIMAL(5, 2),
  
  -- Limits
  max_purchases_per_client INTEGER DEFAULT 1,
  total_available INTEGER,
  total_sold INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client Package Purchases
CREATE TABLE IF NOT EXISTS client_coach_packages (
  id SERIAL PRIMARY KEY,
  package_id INTEGER REFERENCES coach_packages(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  sessions_remaining INTEGER NOT NULL,
  
  payment_id VARCHAR(255),
  amount_paid DECIMAL(10, 2) NOT NULL,
  
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  
  UNIQUE(package_id, client_id)
);

-- Indexes for performance
CREATE INDEX idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX idx_coach_profiles_is_available ON coach_profiles(is_available);
CREATE INDEX idx_coach_profiles_specializations ON coach_profiles USING GIN(specializations);
CREATE INDEX idx_coach_profiles_languages ON coach_profiles USING GIN(languages);
CREATE INDEX idx_coach_profiles_hourly_rate ON coach_profiles(hourly_rate);
CREATE INDEX idx_coach_profiles_average_rating ON coach_profiles(average_rating DESC);
CREATE INDEX idx_coach_profiles_seo_slug ON coach_profiles(seo_slug);

CREATE INDEX idx_coach_sessions_coach_id ON coach_sessions(coach_id);
CREATE INDEX idx_coach_sessions_client_id ON coach_sessions(client_id);
CREATE INDEX idx_coach_sessions_scheduled_at ON coach_sessions(scheduled_at);
CREATE INDEX idx_coach_sessions_status ON coach_sessions(status);

CREATE INDEX idx_coach_reviews_coach_id ON coach_reviews(coach_id);
CREATE INDEX idx_coach_reviews_client_id ON coach_reviews(client_id);
CREATE INDEX idx_coach_reviews_rating ON coach_reviews(rating);

CREATE INDEX idx_coach_availability_coach_id ON coach_availability(coach_id);
CREATE INDEX idx_coach_availability_dates ON coach_availability(start_date, end_date);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_coach_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_updated_at();

CREATE TRIGGER update_coach_sessions_updated_at
  BEFORE UPDATE ON coach_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_updated_at();

CREATE TRIGGER update_coach_reviews_updated_at
  BEFORE UPDATE ON coach_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_updated_at();

CREATE TRIGGER update_coach_packages_updated_at
  BEFORE UPDATE ON coach_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_updated_at();

-- Function to update coach stats after review
CREATE OR REPLACE FUNCTION update_coach_stats_after_review()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coach_profiles
  SET 
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2) 
      FROM coach_reviews 
      WHERE coach_id = NEW.coach_id AND is_visible = true
    ),
    rating_count = (
      SELECT COUNT(*) 
      FROM coach_reviews 
      WHERE coach_id = NEW.coach_id AND is_visible = true
    )
  WHERE id = NEW.coach_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coach_stats_on_review
  AFTER INSERT OR UPDATE ON coach_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_stats_after_review();

-- Function to update coach session stats
CREATE OR REPLACE FUNCTION update_coach_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE coach_profiles
    SET 
      total_sessions = total_sessions + 1,
      total_clients = (
        SELECT COUNT(DISTINCT client_id)
        FROM coach_sessions
        WHERE coach_id = NEW.coach_id AND status = 'completed'
      )
    WHERE id = NEW.coach_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coach_stats_on_session_complete
  AFTER UPDATE ON coach_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_session_stats();