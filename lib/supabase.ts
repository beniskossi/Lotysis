import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing in environment variables')
}
if (!supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in environment variables')
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

// Admin client with service role key (for server-side operations)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = serviceRoleKey ? createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-my-custom-header': 'lotysis-admin' },
  },
}) : null

// Helper function to ensure service role key is available
export function requireServiceRoleKey() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in environment variables')
  }
  return supabaseAdmin!
}
