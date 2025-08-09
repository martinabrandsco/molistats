-- Check the structure of the round_stats table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'round_stats' 
ORDER BY ordinal_position;

-- Check if there's any data in the round_stats table
SELECT COUNT(*) as total_rounds FROM round_stats;

-- Check a sample round to see the structure of gir_by_distance
SELECT 
  id,
  course_name,
  timestamp,
  gir_by_distance
FROM round_stats 
LIMIT 1;

-- Check if gir_by_distance contains the averageFirstPuttDistance field
-- This will show the JSON structure
SELECT 
  id,
  course_name,
  gir_by_distance::text as gir_by_distance_text
FROM round_stats 
WHERE gir_by_distance IS NOT NULL
LIMIT 3; 