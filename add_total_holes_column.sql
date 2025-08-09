-- Agregar la columna total_holes a la tabla round_stats
ALTER TABLE round_stats ADD COLUMN IF NOT EXISTS total_holes INTEGER NOT NULL DEFAULT 18; 