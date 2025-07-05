# 🔧 Guide de Dépannage Supabase

## ❌ Erreurs Communes et Solutions

### 1. "Invalid API Key" ou "API key not found"

**Symptômes :**
- L'application ne se connecte pas à Supabase
- Erreur 401 dans la console

**Solutions :**
```bash
# 1. Vérifiez vos variables d'environnement
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Redémarrez le serveur de développement
npm run dev
```

**Checklist :**
- [ ] Les variables sont bien dans `.env.local`
- [ ] Les valeurs sont correctes (sans espaces)
- [ ] Le serveur a été redémarré après modification

### 2. "Permission denied" ou "Row Level Security"

**Symptômes :**
- Impossible de lire/écrire des données
- Erreur 403 dans la console

**Solutions :**
```sql
-- Dans l'éditeur SQL de Supabase, vérifiez les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('lottery_results', 'ml_models', 'ml_predictions', 'draw_schedules');

-- Si aucune politique n'apparaît, relancez le script setup
```

### 3. "Connection timeout" ou "Network error"

**Symptômes :**
- Longs délais de réponse
- Timeouts fréquents

**Solutions :**
1. **Vérifiez la région** : Choisissez Europe West si vous êtes en France
2. **Testez la connectivité** :
   ```bash
   # Testez la connexion réseau
   curl -I https://votre-projet.supabase.co
   ```

### 4. "Table does not exist"

**Symptômes :**
- Erreur sur les requêtes aux tables
- Relations manquantes

**Solutions :**
```sql
-- Vérifiez que toutes les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Si des tables manquent, relancez le script complet
```

### 5. Tests d'Intégrité Échouent

**Diagnostic :**
```bash
# Exécutez le script de test
npm run test:supabase
```

**Si échec sur les tables :**
- Vérifiez que le script SQL a été exécuté complètement
- Regardez les logs d'erreur dans Supabase

**Si échec sur l'insertion :**
- Vérifiez les contraintes de validation
- Testez avec des données simples

## 🔍 Commandes de Diagnostic

### Vérification Rapide
```bash
# Test de base
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('Supabase client créé:', !!supabase);
"
```

### Vérification Avancée
```sql
-- Dans l'éditeur SQL Supabase

-- 1. Vérifier les tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Vérifier les index
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 3. Vérifier les données de test
SELECT 
  draw_name,
  COUNT(*) as total_draws,
  MAX(date) as last_draw
FROM lottery_results
GROUP BY draw_name
LIMIT 5;
```

## 🛠️ Scripts de Réparation

### Réinitialisation Complète
```sql
-- ⚠️ ATTENTION: Supprime toutes les données!
-- À utiliser seulement si nécessaire

-- Supprimer toutes les tables
DROP TABLE IF EXISTS ml_predictions CASCADE;
DROP TABLE IF EXISTS ml_models CASCADE;
DROP TABLE IF EXISTS lottery_results CASCADE;
DROP TABLE IF EXISTS draw_schedules CASCADE;

-- Supprimer les vues
DROP VIEW IF EXISTS model_performance CASCADE;
DROP VIEW IF EXISTS number_frequencies CASCADE;
DROP VIEW IF EXISTS draw_statistics CASCADE;

-- Puis relancer le script setup complet
```

### Réparation des Politiques RLS
```sql
-- Si les politiques RLS causent des problèmes

-- Désactiver temporairement RLS (pour debug uniquement)
ALTER TABLE lottery_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE draw_schedules DISABLE ROW LEVEL SECURITY;

-- Test vos requêtes, puis réactiver
ALTER TABLE lottery_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_schedules ENABLE ROW LEVEL SECURITY;
```

## 📊 Monitoring et Logs

### Dans le Dashboard Supabase

1. **Métriques** (`Settings` → `Usage`)
   - Surveillez l'utilisation de la base
   - Vérifiez les quotas

2. **Logs** (`Logs` → `Database`)
   - Analysez les erreurs SQL
   - Surveillez les performances

3. **API Logs** (`Logs` → `API`)
   - Vérifiez les appels API
   - Identifiez les erreurs 4xx/5xx

### Logs Utiles en SQL
```sql
-- Statistiques de performance
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins DESC;

-- Requêtes les plus lentes (si pg_stat_statements activé)
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements 
WHERE query LIKE '%lottery_%'
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## 🚀 Optimisation des Performances

### Si l'application est lente

1. **Vérifiez les index :**
```sql
-- Index manquants potentiels
SELECT 
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename = 'lottery_results'
ORDER BY n_distinct DESC;
```

2. **Optimisez les requêtes :**
```sql
-- Utilisez EXPLAIN pour analyser
EXPLAIN ANALYZE 
SELECT * FROM lottery_results 
WHERE draw_name = 'Reveil' 
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC
LIMIT 10;
```

## 🔄 Synchronisation des Données

### Si l'API externe ne fonctionne pas

1. **Testez l'API directement :**
```bash
curl -H "Accept: application/json" \
     -H "User-Agent: Mozilla/5.0" \
     "https://lotobonheur.ci/api/results"
```

2. **Mode dégradé :**
   - L'application utilise automatiquement des données de fallback
   - Surveillez les logs pour les erreurs API

## 📞 Support

### Où chercher de l'aide

1. **Documentation Supabase :** [docs.supabase.com](https://docs.supabase.com)
2. **Discord Supabase :** [discord.supabase.com](https://discord.supabase.com)
3. **Issues GitHub :** [github.com/supabase/supabase](https://github.com/supabase/supabase)

### Informations à fournir en cas de problème

- Version de Supabase utilisée
- Région du projet
- Message d'erreur complet
- Configuration de votre projet (sans les clés)
- Étapes pour reproduire le problème

---

**💡 Conseil :** Gardez toujours une sauvegarde de votre configuration et données importantes !
