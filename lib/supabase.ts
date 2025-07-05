import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes')
}

// Client Supabase avec types TypeScript
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-my-custom-header': 'lotysis-app' },
  },
})

// Types utiles pour les tables
export type LotteryResult = Database['public']['Tables']['lottery_results']['Row']
export type NewLotteryResult = Database['public']['Tables']['lottery_results']['Insert']
export type UpdateLotteryResult = Database['public']['Tables']['lottery_results']['Update']

export type MLModel = Database['public']['Tables']['ml_models']['Row']
export type NewMLModel = Database['public']['Tables']['ml_models']['Insert']
export type UpdateMLModel = Database['public']['Tables']['ml_models']['Update']

export type MLPrediction = Database['public']['Tables']['ml_predictions']['Row']
export type NewMLPrediction = Database['public']['Tables']['ml_predictions']['Insert']
export type UpdateMLPrediction = Database['public']['Tables']['ml_predictions']['Update']

export type DrawSchedule = Database['public']['Tables']['draw_schedules']['Row']
