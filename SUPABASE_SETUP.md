# 🚀 Configuration Supabase pour Lotysis

## Étapes de Configuration

### 1. Créer un Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur **"New Project"**
4. Choisissez votre organisation
5. Configurez le projet :
   - **Name** : `lotysis-production`
   - **Database Password** : Générez un mot de passe fort
   - **Region** : Choisissez la plus proche (Europe West pour la France)
6. Cliquez sur **"Create new project"**
7. Attendez ~2 minutes que le projet soit créé

### 2. Configurer la Base de Données

1. Dans votre projet Supabase, allez dans **"SQL Editor"**
2. Copiez tout le contenu du fichier `supabase_setup.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **"Run"** pour exécuter le script
5. Vérifiez que toutes les tables sont créées sans erreur

### 3. Récupérer les Clés API

1. Allez dans **"Settings"** → **"API"**
2. Notez ces informations :
   - **Project URL** : `https://your-project-ref.supabase.co`
   - **anon public** : Clé publique anonyme
   - **service_role** : Clé de service (gardez-la secrète)

### 4. Configurer les Variables d'Environnement

1. Copiez le fichier `.env.example` vers `.env.local` :
   ```bash
   cp .env.example .env.local
   ```

2. Remplissez vos vraies valeurs :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 5. Tester la Connexion

Créez un fichier de test `test-supabase.js` :

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Test de connexion
async function testConnection() {
  const { data, error } = await supabase
    .from('draw_schedules')
    .select('*')
    .limit(5)
    
  if (error) {
    console.error('❌ Erreur de connexion:', error)
  } else {
    console.log('✅ Connexion réussie!')
    console.log('📅 Planning des tirages:', data)
  }
}

testConnection()
```

Exécutez : `node test-supabase.js`

## Structure de la Base de Données

### Tables Principales

| Table | Description | Données |
|-------|-------------|---------|
| `lottery_results` | Résultats des tirages | ~1000 lignes/mois |
| `ml_models` | Modèles IA sauvegardés | ~112 modèles (28 tirages × 4 types) |
| `ml_predictions` | Prédictions historiques | ~3000 lignes/mois |
| `draw_schedules` | Planning officiel | 28 lignes fixes |

### Vues Statistiques

| Vue | Description |
|-----|-------------|
| `draw_statistics` | Stats par tirage |
| `number_frequencies` | Fréquences des numéros |
| `model_performance` | Performance des modèles IA |

## Migration des Données Existantes

Si vous avez des données existantes, voici comment les migrer :

### Script de Migration

```typescript
import { supabase, LotteryResultService } from './app/lib/supabase'

async function migrateExistingData() {
  // 1. Récupérer les données depuis l'API existante
  const response = await fetch('/api/lottery-results?real=false')
  const { data: existingResults } = await response.json()
  
  console.log(`Migration de ${existingResults.length} résultats...`)
  
  // 2. Insérer en lot dans Supabase
  for (const result of existingResults) {
    try {
      await LotteryResultService.addResult({
        draw_name: result.draw_name,
        date: result.date,
        gagnants: result.gagnants,
        machine: result.machine
      })
      console.log(`✅ Migré: ${result.draw_name} - ${result.date}`)
    } catch (error) {
      console.log(`⚠️ Déjà existant: ${result.draw_name} - ${result.date}`)
    }
  }
  
  console.log('🎉 Migration terminée!')
}

migrateExistingData()
```

## Sécurité et Bonnes Pratiques

### Row Level Security (RLS)

```sql
-- Politique pour permettre les lectures publiques
CREATE POLICY "lottery_results_read" ON lottery_results
  FOR SELECT USING (true);

-- Politique pour limiter les écritures aux utilisateurs authentifiés
CREATE POLICY "lottery_results_write" ON lottery_results
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Validation des Données

```sql
-- Contraintes automatiques
CONSTRAINT valid_gagnants_length CHECK (array_length(gagnants, 1) = 5)
CONSTRAINT valid_gagnants_range CHECK (gagnants <@ ARRAY(SELECT generate_series(1, 90)))
```

## Optimisation des Performances

### Index Recommandés

```sql
-- Recherches par tirage et date
CREATE INDEX idx_lottery_results_draw_date ON lottery_results(draw_name, date DESC);

-- Recherches dans les arrays de numéros
CREATE INDEX idx_lottery_results_gagnants_gin ON lottery_results USING GIN (gagnants);

-- Requêtes récentes (90 derniers jours)
CREATE INDEX idx_lottery_results_recent ON lottery_results(date DESC) 
WHERE date >= CURRENT_DATE - INTERVAL '90 days';
```

### Requêtes Optimisées

```sql
-- Statistiques de fréquence des numéros
SELECT 
  unnest(gagnants) as number,
  COUNT(*) as frequency
FROM lottery_results 
WHERE draw_name = 'Reveil' 
  AND date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY unnest(gagnants)
ORDER BY frequency DESC;
```

## Surveillance et Maintenance

### Dashboard Supabase

1. **Métriques** : Surveiller l'utilisation de la base
2. **Logs** : Analyser les erreurs et performances
3. **Auth** : Gérer les utilisateurs si nécessaire

### Nettoyage Automatique

```sql
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
```

## Estimation des Coûts

### Plan Gratuit Supabase
- ✅ **Base de données** : 500 MB (largement suffisant)
- ✅ **Auth** : 50,000 utilisateurs actifs par mois
- ✅ **Storage** : 1 GB
- ✅ **Edge Functions** : 500,000 invocations
- ✅ **Realtime** : 200 connexions simultanées

### Estimation pour Lotysis
- **Données** : ~50 MB par an (très confortable)
- **Requêtes** : ~10,000 par mois (sous les limites)
- **Coût** : **GRATUIT** pour les premières années

### Montée en Charge (Plan Pro - $25/mois)
- **Base de données** : 8 GB
- **Auth** : 100,000 utilisateurs
- **Requêtes** : Illimitées
- **Support** : Email

## Déploiement en Production

### Checklist de Déploiement

- [ ] ✅ Base de données créée et scripts exécutés
- [ ] ✅ Variables d'environnement configurées
- [ ] ✅ RLS activé et politiques définies
- [ ] ✅ Sauvegarde automatique activée
- [ ] ✅ Monitoring configuré
- [ ] ✅ Tests de performance effectués

### Variables pour Vercel/Netlify

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Support et Troubleshooting

### Erreurs Communes

1. **"Invalid API key"** → Vérifiez les variables d'environnement
2. **"Row Level Security"** → Vérifiez les politiques RLS
3. **"Connection timeout"** → Vérifiez la région Supabase

### Logs Utiles

```sql
-- Surveiller les erreurs de contraintes
SELECT * FROM pg_stat_database WHERE datname = 'postgres';

-- Analyser les requêtes lentes
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

---

**🎯 Supabase est le choix optimal pour Lotysis** grâce à sa simplicité, ses performances SQL et son coût maîtrisé !
