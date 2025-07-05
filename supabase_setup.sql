-- ============================================
-- SCRIPT DE CRÉATION DE LA BASE DE DONNÉES LOTYSIS
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: lottery_results
-- Stockage des résultats de tirages
-- ============================================
CREATE TABLE lottery_results (
  id BIGSERIAL PRIMARY KEY,
  draw_name VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  gagnants INTEGER[] NOT NULL,
  machine INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes de validation
  CONSTRAINT valid_gagnants_length CHECK (array_length(gagnants, 1) = 5),
  CONSTRAINT valid_machine_length CHECK (machine IS NULL OR array_length(machine, 1) = 5),
  CONSTRAINT valid_gagnants_range CHECK (
    gagnants <@ ARRAY(SELECT generate_series(1, 90))
  ),
  CONSTRAINT valid_machine_range CHECK (
    machine IS NULL OR machine <@ ARRAY(SELECT generate_series(1, 90))
  ),
  CONSTRAINT unique_draw_date UNIQUE (draw_name, date)
);

-- Index pour optimiser les performances
CREATE INDEX idx_lottery_results_draw_name ON lottery_results(draw_name);
CREATE INDEX idx_lottery_results_date ON lottery_results(date DESC);
CREATE INDEX idx_lottery_results_draw_date ON lottery_results(draw_name, date DESC);

-- ============================================
-- TABLE: ml_models
-- Stockage des modèles de machine learning
-- ============================================
CREATE TABLE ml_models (
  id BIGSERIAL PRIMARY KEY,
  draw_name VARCHAR(50) NOT NULL,
  model_type VARCHAR(20) NOT NULL CHECK (model_type IN ('lstm', 'cnn', 'ensemble', 'pattern')),
  model_data JSONB NOT NULL,
  performance_metrics JSONB,
  training_data_hash VARCHAR(64),
  version VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT unique_active_model UNIQUE (draw_name, model_type, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Index pour les modèles
CREATE INDEX idx_ml_models_draw_type ON ml_models(draw_name, model_type, is_active);
CREATE INDEX idx_ml_models_active ON ml_models(is_active, created_at DESC);

-- ============================================
-- TABLE: ml_predictions
-- Stockage des prédictions IA
-- ============================================
CREATE TABLE ml_predictions (
  id BIGSERIAL PRIMARY KEY,
  draw_name VARCHAR(50) NOT NULL,
  predicted_numbers INTEGER[] NOT NULL,
  confidence DECIMAL(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  model_used VARCHAR(20) NOT NULL,
  prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actual_result_id BIGINT REFERENCES lottery_results(id),
  accuracy DECIMAL(5,2) CHECK (accuracy IS NULL OR (accuracy >= 0 AND accuracy <= 100)),
  
  CONSTRAINT valid_predicted_numbers_length CHECK (array_length(predicted_numbers, 1) = 5),
  CONSTRAINT valid_predicted_numbers_range CHECK (
    predicted_numbers <@ ARRAY(SELECT generate_series(1, 90))
  )
);

-- Index pour les prédictions
CREATE INDEX idx_ml_predictions_draw_name ON ml_predictions(draw_name, prediction_date DESC);
CREATE INDEX idx_ml_predictions_date ON ml_predictions(prediction_date DESC);
CREATE INDEX idx_ml_predictions_model ON ml_predictions(model_used, prediction_date DESC);

-- ============================================
-- TABLE: draw_schedules
-- Planning officiel des tirages
-- ============================================
CREATE TABLE draw_schedules (
  id BIGSERIAL PRIMARY KEY,
  day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')),
  time_slot VARCHAR(10) NOT NULL,
  draw_name VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_schedule UNIQUE (day_of_week, time_slot, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Insérer le planning officiel
INSERT INTO draw_schedules (day_of_week, time_slot, draw_name) VALUES
-- Lundi
('Lundi', '10H', 'Reveil'),
('Lundi', '13H', 'Etoile'),
('Lundi', '16H', 'Akwaba'),
('Lundi', '18H15', 'Monday Special'),
-- Mardi
('Mardi', '10H', 'La Matinale'),
('Mardi', '13H', 'Emergence'),
('Mardi', '16H', 'Sika'),
('Mardi', '18H15', 'Lucky Tuesday'),
-- Mercredi
('Mercredi', '10H', 'Premiere Heure'),
('Mercredi', '13H', 'Fortune'),
('Mercredi', '16H', 'Baraka'),
('Mercredi', '18H15', 'Midweek'),
-- Jeudi
('Jeudi', '10H', 'Kado'),
('Jeudi', '13H', 'Privilege'),
('Jeudi', '16H', 'Monni'),
('Jeudi', '18H15', 'Fortune Thursday'),
-- Vendredi
('Vendredi', '10H', 'Cash'),
('Vendredi', '13H', 'Solution'),
('Vendredi', '16H', 'Wari'),
('Vendredi', '18H15', 'Friday Bonanza'),
-- Samedi
('Samedi', '10H', 'Soutra'),
('Samedi', '13H', 'Diamant'),
('Samedi', '16H', 'Moaye'),
('Samedi', '18H15', 'National'),
-- Dimanche
('Dimanche', '10H', 'Benediction'),
('Dimanche', '13H', 'Prestige'),
('Dimanche', '16H', 'Awale'),
('Dimanche', '18H15', 'Espoir');

-- ============================================
-- VUES POUR LES STATISTIQUES
-- ============================================

-- Vue pour les statistiques générales par tirage
CREATE VIEW draw_statistics AS
SELECT 
  lr.draw_name,
  COUNT(*) as total_draws,
  MIN(lr.date) as first_draw,
  MAX(lr.date) as last_draw,
  ROUND(AVG(array_length(lr.gagnants, 1))::numeric, 2) as avg_numbers_count,
  COUNT(lr.machine) FILTER (WHERE lr.machine IS NOT NULL) as machine_numbers_count
FROM lottery_results lr
GROUP BY lr.draw_name
ORDER BY total_draws DESC;

-- Vue pour les fréquences des numéros par tirage
CREATE VIEW number_frequencies AS
SELECT 
  lr.draw_name,
  unnest(lr.gagnants) as number,
  COUNT(*) as frequency,
  ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM lottery_results lr2 WHERE lr2.draw_name = lr.draw_name)) * 100, 2) as percentage
FROM lottery_results lr
GROUP BY lr.draw_name, unnest(lr.gagnants)
ORDER BY lr.draw_name, frequency DESC;

-- Vue pour les performances des modèles ML
CREATE VIEW model_performance AS
SELECT 
  mp.draw_name,
  mp.model_used,
  COUNT(*) as total_predictions,
  ROUND(AVG(mp.confidence)::numeric, 2) as avg_confidence,
  ROUND(AVG(mp.accuracy)::numeric, 2) as avg_accuracy,
  COUNT(*) FILTER (WHERE mp.accuracy >= 80) as high_accuracy_predictions,
  MAX(mp.prediction_date) as last_prediction
FROM ml_predictions mp
WHERE mp.accuracy IS NOT NULL
GROUP BY mp.draw_name, mp.model_used
ORDER BY avg_accuracy DESC NULLS LAST;

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour calculer la précision d'une prédiction
CREATE OR REPLACE FUNCTION calculate_prediction_accuracy(
  predicted_numbers INTEGER[],
  actual_numbers INTEGER[]
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  matches INTEGER := 0;
  i INTEGER;
BEGIN
  -- Compter les numéros qui correspondent
  FOR i IN 1..array_length(predicted_numbers, 1) LOOP
    IF predicted_numbers[i] = ANY(actual_numbers) THEN
      matches := matches + 1;
    END IF;
  END LOOP;
  
  -- Retourner le pourcentage de précision
  RETURN (matches::DECIMAL / array_length(predicted_numbers, 1)) * 100;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_lottery_results_updated_at
  BEFORE UPDATE ON lottery_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLITIQUES DE SÉCURITÉ (RLS)
-- ============================================

-- Activer RLS pour toutes les tables
ALTER TABLE lottery_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_schedules ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture publique des résultats de loterie
CREATE POLICY "lottery_results_read" ON lottery_results
  FOR SELECT USING (true);

-- Politique pour lecture publique des statistiques
CREATE POLICY "draw_schedules_read" ON draw_schedules
  FOR SELECT USING (true);

-- Politique pour lecture publique des modèles (métadonnées seulement)
CREATE POLICY "ml_models_read" ON ml_models
  FOR SELECT USING (true);

-- Politique pour lecture publique des prédictions
CREATE POLICY "ml_predictions_read" ON ml_predictions
  FOR SELECT USING (true);

-- Politiques d'écriture (nécessitent authentification)
-- À adapter selon vos besoins d'authentification

-- ============================================
-- INDEX SUPPLÉMENTAIRES POUR LES PERFORMANCES
-- ============================================

-- Index GIN pour recherches dans les arrays
CREATE INDEX idx_lottery_results_gagnants_gin ON lottery_results USING GIN (gagnants);
CREATE INDEX idx_lottery_results_machine_gin ON lottery_results USING GIN (machine);
CREATE INDEX idx_ml_predictions_numbers_gin ON ml_predictions USING GIN (predicted_numbers);

-- Index pour les requêtes temporelles
CREATE INDEX idx_lottery_results_recent ON lottery_results(date DESC) WHERE date >= CURRENT_DATE - INTERVAL '90 days';
CREATE INDEX idx_ml_predictions_recent ON ml_predictions(prediction_date DESC) WHERE prediction_date >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================
-- COMMENTAIRES POUR LA DOCUMENTATION
-- ============================================

COMMENT ON TABLE lottery_results IS 'Stockage des résultats de tirages de loterie avec validation des numéros';
COMMENT ON TABLE ml_models IS 'Stockage des modèles de machine learning entraînés pour chaque tirage';
COMMENT ON TABLE ml_predictions IS 'Historique des prédictions IA avec évaluation de précision';
COMMENT ON TABLE draw_schedules IS 'Planning officiel des tirages par jour et heure';

COMMENT ON COLUMN lottery_results.gagnants IS 'Array de 5 numéros gagnants entre 1 et 90';
COMMENT ON COLUMN lottery_results.machine IS 'Array optionnel de 5 numéros machine entre 1 et 90';
COMMENT ON COLUMN ml_models.model_data IS 'Données sérialisées du modèle TensorFlow.js';
COMMENT ON COLUMN ml_models.performance_metrics IS 'Métriques de performance du modèle (accuracy, loss, etc.)';

-- ============================================
-- VÉRIFICATIONS FINALES
-- ============================================

-- Vérifier que toutes les tables ont été créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('lottery_results', 'ml_models', 'ml_predictions', 'draw_schedules');

-- Vérifier que toutes les vues ont été créées
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name IN ('draw_statistics', 'number_frequencies', 'model_performance');

-- Vérifier le planning inséré
SELECT day_of_week, time_slot, draw_name 
FROM draw_schedules 
ORDER BY 
  CASE day_of_week 
    WHEN 'Lundi' THEN 1
    WHEN 'Mardi' THEN 2
    WHEN 'Mercredi' THEN 3
    WHEN 'Jeudi' THEN 4
    WHEN 'Vendredi' THEN 5
    WHEN 'Samedi' THEN 6
    WHEN 'Dimanche' THEN 7
  END,
  time_slot;

-- Fin du script
