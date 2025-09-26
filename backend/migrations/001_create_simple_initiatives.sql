-- Create simple_initiatives table
CREATE TABLE simple_initiatives (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100),
    vertical VARCHAR(100),
    client_type VARCHAR(100),
    country VARCHAR(100),
    systemic_risk VARCHAR(100),
    economic_impact VARCHAR(100),
    experience_impact VARCHAR(100),
    competitive_focus VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_simple_initiatives_category ON simple_initiatives (category);
CREATE INDEX idx_simple_initiatives_vertical ON simple_initiatives (vertical);
CREATE INDEX idx_simple_initiatives_country ON simple_initiatives (country);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_simple_initiatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_simple_initiatives_updated_at
    BEFORE UPDATE ON simple_initiatives
    FOR EACH ROW
    EXECUTE FUNCTION update_simple_initiatives_updated_at();
