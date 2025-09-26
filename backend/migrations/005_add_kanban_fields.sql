-- Migration to add new Kanban fields to initiatives table
-- This migration adds all the new fields required for the Kanban board functionality

-- Add new columns to initiatives table
ALTER TABLE initiatives 
ADD COLUMN IF NOT EXISTS quarter VARCHAR(50),
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category_new VARCHAR(100),
ADD COLUMN IF NOT EXISTS vertical_new VARCHAR(100),
ADD COLUMN IF NOT EXISTS client_type_new VARCHAR(50),
ADD COLUMN IF NOT EXISTS country_new VARCHAR(50),
ADD COLUMN IF NOT EXISTS systemic_risk_new VARCHAR(50),
ADD COLUMN IF NOT EXISTS economic_impact_new VARCHAR(200),
ADD COLUMN IF NOT EXISTS economic_impact_description TEXT,
ADD COLUMN IF NOT EXISTS experience_impact_new TEXT[],
ADD COLUMN IF NOT EXISTS competitive_approach VARCHAR(100),
ADD COLUMN IF NOT EXISTS executive_summary TEXT,
ADD COLUMN IF NOT EXISTS roi INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- Update existing records with default values
UPDATE initiatives SET 
    quarter = 'Q1 2024',
    score = 0,
    category_new = 'Mandates / Regulatorio / Riesgo',
    vertical_new = 'Processing',
    client_type_new = 'Todos',
    country_new = 'Todos',
    systemic_risk_new = 'N/A',
    economic_impact_new = 'Impacto menor o dificil de cuantificar',
    economic_impact_description = '',
    experience_impact_new = ARRAY[]::TEXT[],
    competitive_approach = 'Paridad con competencia',
    executive_summary = '',
    roi = 0,
    created_by = 'System'
WHERE quarter IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_initiatives_quarter ON initiatives(quarter);
CREATE INDEX IF NOT EXISTS idx_initiatives_score ON initiatives(score);
CREATE INDEX IF NOT EXISTS idx_initiatives_category_new ON initiatives(category_new);
CREATE INDEX IF NOT EXISTS idx_initiatives_vertical_new ON initiatives(vertical_new);
CREATE INDEX IF NOT EXISTS idx_initiatives_client_type_new ON initiatives(client_type_new);
CREATE INDEX IF NOT EXISTS idx_initiatives_country_new ON initiatives(country_new);
CREATE INDEX IF NOT EXISTS idx_initiatives_systemic_risk_new ON initiatives(systemic_risk_new);
CREATE INDEX IF NOT EXISTS idx_initiatives_roi ON initiatives(roi);
CREATE INDEX IF NOT EXISTS idx_initiatives_created_by ON initiatives(created_by);

-- Add constraints for enum values
ALTER TABLE initiatives 
ADD CONSTRAINT chk_category_new CHECK (category_new IN (
    'Mandates / Regulatorio / Riesgo',
    'Mejora de performance',
    'Value Prop',
    'Lanzamiento nuevo producto'
));

ALTER TABLE initiatives 
ADD CONSTRAINT chk_vertical_new CHECK (vertical_new IN (
    'Processing',
    'Core',
    'BIN Sponsor',
    'Card Management & Logistics',
    'Tokenización',
    'Fraud Tools',
    'Platform experience'
));

ALTER TABLE initiatives 
ADD CONSTRAINT chk_client_type_new CHECK (client_type_new IN (
    'Todos',
    'Top Issuer',
    'Tier 1',
    'Tier 2',
    'Tier 3'
));

ALTER TABLE initiatives 
ADD CONSTRAINT chk_country_new CHECK (country_new IN (
    'Todos',
    'Argentina',
    'Brasil',
    'Chile',
    'Colombia',
    'Mexico',
    'ROLA'
));

ALTER TABLE initiatives 
ADD CONSTRAINT chk_systemic_risk_new CHECK (systemic_risk_new IN (
    'Bloqueante',
    'Alto',
    'Medio',
    'Bajo',
    'N/A'
));

ALTER TABLE initiatives 
ADD CONSTRAINT chk_economic_impact_new CHECK (economic_impact_new IN (
    'Aumento significativo en revenue o nueva linea revenue',
    'Aumento moderado en revenue existente',
    'Impacto menor o dificil de cuantificar'
));

ALTER TABLE initiatives 
ADD CONSTRAINT chk_competitive_approach CHECK (competitive_approach IN (
    'Disrrustivo / Innovador',
    'Mejora incremental',
    'Paridad con competencia'
));

-- Add constraints for numeric fields
ALTER TABLE initiatives 
ADD CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= 100);

ALTER TABLE initiatives 
ADD CONSTRAINT chk_roi_positive CHECK (roi >= 0);

-- Add comments for documentation
COMMENT ON COLUMN initiatives.quarter IS 'Quarter when the initiative was created (e.g., Q1 2024)';
COMMENT ON COLUMN initiatives.score IS 'Numeric score for the initiative (0-100)';
COMMENT ON COLUMN initiatives.category_new IS 'Category of the initiative';
COMMENT ON COLUMN initiatives.vertical_new IS 'Business vertical for the initiative';
COMMENT ON COLUMN initiatives.client_type_new IS 'Type of client for the initiative';
COMMENT ON COLUMN initiatives.country_new IS 'Country where the initiative applies';
COMMENT ON COLUMN initiatives.systemic_risk_new IS 'Systemic risk level of the initiative';
COMMENT ON COLUMN initiatives.economic_impact_new IS 'Type of economic impact';
COMMENT ON COLUMN initiatives.economic_impact_description IS 'Detailed description of economic impact';
COMMENT ON COLUMN initiatives.experience_impact_new IS 'Array of experience impacts';
COMMENT ON COLUMN initiatives.competitive_approach IS 'Competitive approach strategy';
COMMENT ON COLUMN initiatives.executive_summary IS 'Executive summary of the initiative';
COMMENT ON COLUMN initiatives.roi IS 'Return on investment percentage';
COMMENT ON COLUMN initiatives.created_by IS 'Name of the user who created the initiative';
