import { supabase, LotteryResultService } from '../lib/supabase'

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
