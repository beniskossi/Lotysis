// Script de test pour vérifier la connexion Supabase
// Exécuter avec: node test-supabase.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Test de connexion Supabase...')
console.log('📍 URL:', supabaseUrl)
console.log('🔑 Clé (masquée):', supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'NON DÉFINIE')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!')
  console.error('Vérifiez votre fichier .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test 1: Vérifier les tables
async function testTables() {
  console.log('\n📋 Test 1: Vérification des tables...')
  
  try {
    const { data, error } = await supabase
      .from('draw_schedules')
      .select('*')
      .limit(5)
      
    if (error) {
      console.error('❌ Erreur tables:', error.message)
      return false
    } else {
      console.log('✅ Tables accessibles!')
      console.log(`📅 ${data.length} tirages trouvés dans le planning`)
      return true
    }
  } catch (err) {
    console.error('❌ Erreur de connexion:', err.message)
    return false
  }
}

// Test 2: Tester l'insertion
async function testInsert() {
  console.log('\n💾 Test 2: Test d\'insertion...')
  
  try {
    const testResult = {
      draw_name: 'Reveil',
      date: '2025-01-06',
      gagnants: [12, 34, 56, 78, 90]
    }
    
    const { data, error } = await supabase
      .from('lottery_results')
      .insert([testResult])
      .select()
      
    if (error) {
      if (error.code === '23505') { // Contrainte unique
        console.log('⚠️ Résultat déjà existant (normal)')
        return true
      } else {
        console.error('❌ Erreur insertion:', error.message)
        return false
      }
    } else {
      console.log('✅ Insertion réussie!')
      console.log('📊 Résultat inséré:', data[0])
      return true
    }
  } catch (err) {
    console.error('❌ Erreur test insertion:', err.message)
    return false
  }
}

// Test 3: Tester les vues
async function testViews() {
  console.log('\n📈 Test 3: Test des vues statistiques...')
  
  try {
    const { data, error } = await supabase
      .from('draw_statistics')
      .select('*')
      .limit(3)
      
    if (error) {
      console.error('❌ Erreur vues:', error.message)
      return false
    } else {
      console.log('✅ Vues accessibles!')
      if (data.length > 0) {
        console.log('📊 Exemple de statistiques:', data[0])
      }
      return true
    }
  } catch (err) {
    console.error('❌ Erreur test vues:', err.message)
    return false
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🎯 Début des tests Supabase\n')
  
  const results = {
    tables: await testTables(),
    insert: await testInsert(),
    views: await testViews()
  }
  
  console.log('\n📋 Résumé des tests:')
  console.log('- Tables:', results.tables ? '✅' : '❌')
  console.log('- Insertion:', results.insert ? '✅' : '❌')
  console.log('- Vues:', results.views ? '✅' : '❌')
  
  const allPassed = Object.values(results).every(Boolean)
  
  if (allPassed) {
    console.log('\n🎉 SUCCÈS: Supabase est correctement configuré!')
    console.log('🚀 Vous pouvez maintenant utiliser l\'application')
  } else {
    console.log('\n⚠️ ÉCHEC: Certains tests ont échoué')
    console.log('📖 Consultez SUPABASE_SETUP.md pour plus d\'aide')
  }
  
  process.exit(allPassed ? 0 : 1)
}

runAllTests()
