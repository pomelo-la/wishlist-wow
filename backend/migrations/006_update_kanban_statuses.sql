-- Update Kanban statuses to the new 5 states
-- Drop existing status constraint
ALTER TABLE initiatives 
DROP CONSTRAINT IF EXISTS chk_status;

-- Add new status constraint with the 5 new states
ALTER TABLE initiatives 
ADD CONSTRAINT chk_status CHECK (status IN (
  'Backlog',
  'Iniciativas cargadas a revisar',
  'Iniciativas a estimar',
  'Priorizacion final',
  'Roadmap del Q'
));

-- Update any existing initiatives to use the new status format
UPDATE initiatives 
SET status = 'Backlog' 
WHERE status NOT IN (
  'Backlog',
  'Iniciativas cargadas a revisar',
  'Iniciativas a estimar',
  'Priorizacion final',
  'Roadmap del Q'
);
