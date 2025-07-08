-- Fonction pour nettoyer les anciennes données
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Supprimer les prédictions anciennes (> 1 an)
  DELETE FROM ml_predictions 
  WHERE prediction_date < NOW() - INTERVAL '1 year';
  
  -- Supprimer les anciens modèles inactifs (> 6 mois)
  DELETE FROM ml_models 
  WHERE is_active = false 
    AND created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Programmer l'exécution via pg_cron (extension Supabase)
SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data();');
