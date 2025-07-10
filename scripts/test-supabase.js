const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.log('Vérifiez que .env.local contient:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔄 Test de connexion à Supabase...')
  
  try {
    // Test 1: Connexion de base
    const { data: tables, error: tablesError } = await supabase
      .from('lottery_results')
      .select('count', { count: 'exact', head: true })
    
    if (tablesError) {
      console.error('❌ Erreur de connexion:', tablesError.message)
      return
    }
    
    console.log('✅ Connexion réussie!')
    console.log(`📊 Nombre de résultats en base: ${tables?.length || 0}`)
    
    // Test 2: Lecture des données
    const { data: results, error: resultsError } = await supabase
      .from('lottery_results')
      .select('*')
      .limit(5)
    
    if (resultsError) {
      console.error('❌ Erreur lecture:', resultsError.message)
      return
    }
    
    console.log(`📋 Derniers résultats (${results?.length || 0}):`)
    results?.forEach(result => {
      console.log(`  - ${result.draw_name} (${result.date}): ${result.gagnants.join(', ')}`)
    })
    
    // Test 3: Vérification des tables
    const { data: schemas } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['lottery_results', 'ml_models', 'ml_predictions'])
    
    console.log('🗄️ Tables disponibles:', schemas?.map(s => s.table_name).join(', '))
    
    console.log('🎉 Tous les tests sont passés!')
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
  }
}

testConnection()