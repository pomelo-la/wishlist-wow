-- Add Prod & IT fields to initiatives table
-- All fields as TEXT for simplicity as requested

ALTER TABLE initiatives
ADD COLUMN IF NOT EXISTS tech_seeds TEXT DEFAULT '0',
ADD COLUMN IF NOT EXISTS tech_certainty TEXT DEFAULT '0',
ADD COLUMN IF NOT EXISTS tech_notes TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ux_seeds TEXT DEFAULT '0',
ADD COLUMN IF NOT EXISTS ux_certainty TEXT DEFAULT '0',
ADD COLUMN IF NOT EXISTS ux_cases TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS product_cases TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS product_providers TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS product_not_considered TEXT DEFAULT '';

-- Add comments for documentation
COMMENT ON COLUMN initiatives.tech_seeds IS 'Días de semillas para tecnología';
COMMENT ON COLUMN initiatives.tech_certainty IS 'Porcentaje de certidumbre técnica (0-100)';
COMMENT ON COLUMN initiatives.tech_notes IS 'Notas técnicas y casuísticas';
COMMENT ON COLUMN initiatives.ux_seeds IS 'Días de semillas para UX';
COMMENT ON COLUMN initiatives.ux_certainty IS 'Porcentaje de certidumbre UX (0-100)';
COMMENT ON COLUMN initiatives.ux_cases IS 'Casuísticas de UX';
COMMENT ON COLUMN initiatives.product_cases IS 'Casuísticas de producto';
COMMENT ON COLUMN initiatives.product_providers IS 'Proveedores involucrados';
COMMENT ON COLUMN initiatives.product_not_considered IS 'Qué no se contempla en la iniciativa';
