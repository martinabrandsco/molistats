-- Crear tabla de estadísticas de ronda
CREATE TABLE round_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  course_name TEXT NOT NULL,
  total_holes INTEGER NOT NULL DEFAULT 18,
  total_score INTEGER NOT NULL,
  fir_percentage DECIMAL(5,2) NOT NULL,
  gir_percentage DECIMAL(5,2) NOT NULL,
  gir_by_distance JSONB NOT NULL,
  total_putts INTEGER NOT NULL,
  scrambling_percentage DECIMAL(5,2) NOT NULL,
  sand_save_percentage DECIMAL(5,2) NOT NULL,
  total_penalties INTEGER NOT NULL,
  first_putt_distances JSONB NOT NULL,
  make_rate_putts JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear políticas de seguridad
ALTER TABLE round_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON round_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON round_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON round_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stats" ON round_stats
  FOR DELETE USING (auth.uid() = user_id); 