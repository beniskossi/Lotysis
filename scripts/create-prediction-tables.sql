-- Tables pour le système de prédictions avancé

-- Table pour le cache des prédictions
CREATE TABLE IF NOT EXISTS prediction_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_name TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  data_hash TEXT NOT NULL,
  prediction JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_name, algorithm, data_hash)
);

-- Table pour les feedbacks des prédictions
CREATE TABLE IF NOT EXISTS prediction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id TEXT NOT NULL,
  user_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  accuracy INTEGER DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 5),
  actual_numbers INTEGER[],
  comment TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  draw_name TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les performances des modèles
CREATE TABLE IF NOT EXISTS model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  algorithm TEXT NOT NULL,
  draw_name TEXT NOT NULL,
  total_predictions INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  confidence_adjustment INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(algorithm, draw_name)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_prediction_cache_draw_algo ON prediction_cache(draw_name, algorithm);
CREATE INDEX IF NOT EXISTS idx_prediction_cache_expires ON prediction_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_feedback_draw_algo ON prediction_feedback(draw_name, algorithm);
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON prediction_feedback(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_algo_draw ON model_performance(algorithm, draw_name);

-- Fonction pour nettoyer le cache expiré
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM prediction_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Politique RLS pour les tables (permettre toutes les opérations pour l'instant)
ALTER TABLE prediction_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_performance ENABLE ROW LEVEL SECURITY;

-- Politiques permissives pour le développement
CREATE POLICY "Allow all operations on prediction_cache" ON prediction_cache FOR ALL USING (true);
CREATE POLICY "Allow all operations on prediction_feedback" ON prediction_feedback FOR ALL USING (true);
CREATE POLICY "Allow all operations on model_performance" ON model_performance FOR ALL USING (true);
