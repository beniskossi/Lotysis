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
