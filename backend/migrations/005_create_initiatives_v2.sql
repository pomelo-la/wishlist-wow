-- Migration to create initiatives_v2 table with new structure
CREATE TABLE initiatives_v2 (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quarter VARCHAR(20),
    score DECIMAL(5,2),
    category VARCHAR(100),
    vertical VARCHAR(100),
    client_type VARCHAR(100),
    country VARCHAR(100),
    systemic_risk VARCHAR(100),
    economic_impact VARCHAR(100),
    economic_impact_description TEXT,
    experience_impact TEXT, -- JSON array as text
    competitive_approach VARCHAR(200),
    executive_summary TEXT,
    roi DECIMAL(10,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_initiatives_v2_status ON initiatives_v2 (status);
CREATE INDEX idx_initiatives_v2_category ON initiatives_v2 (category);
CREATE INDEX idx_initiatives_v2_vertical ON initiatives_v2 (vertical);
CREATE INDEX idx_initiatives_v2_country ON initiatives_v2 (country);
CREATE INDEX idx_initiatives_v2_created_by ON initiatives_v2 (created_by);
CREATE INDEX idx_initiatives_v2_quarter ON initiatives_v2 (quarter);
CREATE INDEX idx_initiatives_v2_score ON initiatives_v2 (score);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_initiatives_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_initiatives_v2_updated_at
BEFORE UPDATE ON initiatives_v2
FOR EACH ROW
EXECUTE FUNCTION update_initiatives_v2_updated_at();
