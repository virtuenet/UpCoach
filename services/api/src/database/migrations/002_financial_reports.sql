-- Create financial reports table
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  format VARCHAR(50) NOT NULL DEFAULT 'json',
  scheduled_for TIMESTAMP,
  generated_at TIMESTAMP,
  parameters JSONB,
  data JSONB,
  error TEXT,
  recipients TEXT[],
  file_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_financial_reports_type ON financial_reports(type);
CREATE INDEX idx_financial_reports_status ON financial_reports(status);
CREATE INDEX idx_financial_reports_scheduled_for ON financial_reports(scheduled_for);
CREATE INDEX idx_financial_reports_created_at ON financial_reports(created_at);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_financial_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER financial_reports_updated_at_trigger
BEFORE UPDATE ON financial_reports
FOR EACH ROW
EXECUTE FUNCTION update_financial_reports_updated_at(); 