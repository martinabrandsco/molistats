-- Add average_score_by_par column to round_stats table
ALTER TABLE round_stats ADD COLUMN IF NOT EXISTS average_score_by_par JSONB DEFAULT '{"par3": 0, "par4": 0, "par5": 0}'::jsonb;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'round_stats' AND column_name = 'average_score_by_par';
