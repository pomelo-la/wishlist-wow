-- Initial schema for Pomelo Wishlist
-- Run with: psql -d pomelo_wishlist -f migrations/001_initial_schema.sql

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('creator', 'reviewer', 'it_manager', 'owner', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initiatives table
CREATE TABLE IF NOT EXISTS initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    creator_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'loaded', 'in_review', 'in_estimation', 'evaluation_closed', 'prioritized')),

    -- Context
    category VARCHAR(50) CHECK (category IN ('regulatory', 'risk', 'performance', 'value_prop', 'new_product')),
    vertical VARCHAR(50) CHECK (vertical IN ('banking', 'retail', 'government', 'healthcare', 'education')),
    countries TEXT[], -- Array of country codes
    client VARCHAR(255),
    client_type VARCHAR(50) CHECK (client_type IN ('top_issuer', 'major', 'medium', 'small', 'startup')),

    -- Business case
    description TEXT,
    economic_impact_type VARCHAR(50) CHECK (economic_impact_type IN ('significant', 'moderate', 'low', 'hard_to_quantify')),
    economic_impact_note TEXT,

    -- Experience impact (embedded as JSON)
    improve_onboarding BOOLEAN DEFAULT false,
    reduce_friction BOOLEAN DEFAULT false,
    enhance_security BOOLEAN DEFAULT false,
    improve_performance BOOLEAN DEFAULT false,
    add_new_features BOOLEAN DEFAULT false,
    improve_accessibility BOOLEAN DEFAULT false,

    -- Innovation
    innovation_level VARCHAR(50) CHECK (innovation_level IN ('disruptive', 'incremental', 'parity')),

    -- Technical estimation (embedded)
    effort_weeks INTEGER,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 10),
    dependencies TEXT,
    technical_risks TEXT,

    -- System risk
    systemic_risk VARCHAR(50) CHECK (systemic_risk IN ('blocker', 'high', 'medium', 'low')),

    -- Scoring (embedded as JSON for flexibility)
    category_score INTEGER DEFAULT 0,
    vertical_score INTEGER DEFAULT 0,
    client_score INTEGER DEFAULT 0,
    country_score INTEGER DEFAULT 0,
    risk_score INTEGER DEFAULT 0,
    economic_score INTEGER DEFAULT 0,
    experience_score INTEGER DEFAULT 0,
    innovation_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    score_explanation TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for chat functionality
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    author_role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suggestions table for agent suggestions
CREATE TABLE IF NOT EXISTS suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    field VARCHAR(100) NOT NULL,
    suggested_value TEXT NOT NULL,
    rationale TEXT NOT NULL,
    confidence INTEGER CHECK (confidence BETWEEN 1 AND 10),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    field VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_initiatives_status ON initiatives(status);
CREATE INDEX IF NOT EXISTS idx_initiatives_category ON initiatives(category);
CREATE INDEX IF NOT EXISTS idx_initiatives_creator_id ON initiatives(creator_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_total_score ON initiatives(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_messages_initiative_id ON messages(initiative_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_initiative_id ON suggestions(initiative_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_initiative_id ON audit_logs(initiative_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_initiatives_updated_at BEFORE UPDATE ON initiatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();