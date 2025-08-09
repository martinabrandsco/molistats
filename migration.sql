-- Migración para agregar la columna total_holes si no existe
DO $$ 
BEGIN
    -- Verificar si la columna total_holes existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'round_stats' 
        AND column_name = 'total_holes'
    ) THEN
        -- Agregar la columna total_holes
        ALTER TABLE round_stats ADD COLUMN total_holes INTEGER NOT NULL DEFAULT 18;
    END IF;
END $$; 