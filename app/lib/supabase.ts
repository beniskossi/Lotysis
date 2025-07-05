import { createClient } from '@supabase/supabase-js'

// Types pour les données de loterie
export interface LotteryResult {
  id?: number
  draw_name: string
  date: string
  gagnants: number[]
  machine?: number[]
  created_at?: string
  updated_at?: string
}

export interface MLModel {
  id?: number
  draw_name: string
  model_type: 'lstm' | 'cnn' | 'ensemble' | 'pattern'
  model_data: any
  performance_metrics?: any
  training_data_hash?: string
  version?: string
  created_at?: string
  is_active?: boolean
}

export interface MLPrediction {
  id?: number
  draw_name: string
  predicted_numbers: number[]
  confidence: number
  model_used: string
  prediction_date?: string
  actual_result_id?: number
  accuracy?: number
}

// Database type pour TypeScript
export interface Database {
  public: {
    Tables: {
      lottery_results: {
        Row: LotteryResult
        Insert: Omit<LotteryResult, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LotteryResult, 'id' | 'created_at'>>
      }
      ml_models: {
        Row: MLModel
        Insert: Omit<MLModel, 'id' | 'created_at'>
        Update: Partial<Omit<MLModel, 'id' | 'created_at'>>
      }
      ml_predictions: {
        Row: MLPrediction
        Insert: Omit<MLPrediction, 'id' | 'prediction_date'>
        Update: Partial<Omit<MLPrediction, 'id' | 'prediction_date'>>
      }
    }
    Views: {
      draw_statistics: {
        Row: {
          draw_name: string
          total_draws: number
          first_draw: string
          last_draw: string
          number: number
          frequency: number
        }
      }
    }
  }
}

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Service pour les opérations sur les résultats de loterie
export class LotteryResultService {
  
  // Récupérer tous les résultats avec filtres optionnels
  static async getResults(filters?: {
    draw_name?: string
    start_date?: string
    end_date?: string
    limit?: number
  }) {
    let query = supabase
      .from('lottery_results')
      .select('*')
      .order('date', { ascending: false })

    if (filters?.draw_name) {
      query = query.eq('draw_name', filters.draw_name)
    }

    if (filters?.start_date) {
      query = query.gte('date', filters.start_date)
    }

    if (filters?.end_date) {
      query = query.lte('date', filters.end_date)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des résultats:', error)
      throw error
    }

    return data || []
  }

  // Ajouter un nouveau résultat
  static async addResult(result: Omit<LotteryResult, 'id' | 'created_at' | 'updated_at'>) {
    // Validation côté client
    if (!result.draw_name || !result.date || !result.gagnants || result.gagnants.length !== 5) {
      throw new Error('Données invalides')
    }

    const { data, error } = await supabase
      .from('lottery_results')
      .insert([result])
      .select()

    if (error) {
      console.error('Erreur lors de l\'ajout du résultat:', error)
      throw error
    }

    return data[0]
  }

  // Mettre à jour un résultat existant
  static async updateResult(id: number, updates: Partial<LotteryResult>) {
    const { data, error } = await supabase
      .from('lottery_results')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Erreur lors de la mise à jour:', error)
      throw error
    }

    return data[0]
  }

  // Supprimer un résultat
  static async deleteResult(id: number) {
    const { error } = await supabase
      .from('lottery_results')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression:', error)
      throw error
    }

    return true
  }

  // Obtenir les statistiques par tirage
  static async getDrawStatistics(draw_name?: string) {
    let query = supabase
      .from('draw_statistics')
      .select('*')

    if (draw_name) {
      query = query.eq('draw_name', draw_name)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }

    return data || []
  }
}

// Service pour les modèles ML
export class MLModelService {
  
  // Sauvegarder un modèle ML
  static async saveModel(model: Omit<MLModel, 'id' | 'created_at'>) {
    // Désactiver les anciens modèles du même type pour ce tirage
    await supabase
      .from('ml_models')
      .update({ is_active: false })
      .eq('draw_name', model.draw_name)
      .eq('model_type', model.model_type)

    // Insérer le nouveau modèle
    const { data, error } = await supabase
      .from('ml_models')
      .insert([{ ...model, is_active: true }])
      .select()

    if (error) {
      console.error('Erreur lors de la sauvegarde du modèle:', error)
      throw error
    }

    return data[0]
  }

  // Charger un modèle actif
  static async loadModel(draw_name: string, model_type: string) {
    const { data, error } = await supabase
      .from('ml_models')
      .select('*')
      .eq('draw_name', draw_name)
      .eq('model_type', model_type)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erreur lors du chargement du modèle:', error)
      throw error
    }

    return data
  }

  // Obtenir tous les modèles pour un tirage
  static async getModelsForDraw(draw_name: string) {
    const { data, error } = await supabase
      .from('ml_models')
      .select('*')
      .eq('draw_name', draw_name)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des modèles:', error)
      throw error
    }

    return data || []
  }
}

// Service pour les prédictions
export class PredictionService {
  
  // Sauvegarder une prédiction
  static async savePrediction(prediction: Omit<MLPrediction, 'id' | 'prediction_date'>) {
    const { data, error } = await supabase
      .from('ml_predictions')
      .insert([prediction])
      .select()

    if (error) {
      console.error('Erreur lors de la sauvegarde de la prédiction:', error)
      throw error
    }

    return data[0]
  }

  // Récupérer les prédictions récentes
  static async getRecentPredictions(draw_name?: string, limit = 10) {
    let query = supabase
      .from('ml_predictions')
      .select('*')
      .order('prediction_date', { ascending: false })
      .limit(limit)

    if (draw_name) {
      query = query.eq('draw_name', draw_name)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des prédictions:', error)
      throw error
    }

    return data || []
  }

  // Mettre à jour la précision après le tirage réel
  static async updatePredictionAccuracy(prediction_id: number, actual_result_id: number, accuracy: number) {
    const { data, error } = await supabase
      .from('ml_predictions')
      .update({ actual_result_id, accuracy })
      .eq('id', prediction_id)
      .select()

    if (error) {
      console.error('Erreur lors de la mise à jour de la précision:', error)
      throw error
    }

    return data[0]
  }
}

// Utilitaires pour la synchronisation
export class SyncService {
  
  // Synchroniser avec l'API externe et sauvegarder en base
  static async syncWithExternalAPI(month?: string) {
    try {
      // Récupérer depuis l'API externe
      const response = await fetch(`/api/lottery-results?month=${month || ''}&real=true`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      const externalResults = result.data
      const syncedCount = 0

      // Insérer chaque résultat s'il n'existe pas déjà
      for (const externalResult of externalResults) {
        const existing = await supabase
          .from('lottery_results')
          .select('id')
          .eq('draw_name', externalResult.draw_name)
          .eq('date', externalResult.date)
          .single()

        if (existing.error?.code === 'PGRST116') { // Pas trouvé
          await LotteryResultService.addResult(externalResult)
          syncedCount++
        }
      }

      return {
        success: true,
        synced: syncedCount,
        total: externalResults.length
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error)
      throw error
    }
  }

  // Nettoyer les anciennes données
  static async cleanupOldData(daysToKeep = 365) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const { error } = await supabase
      .from('lottery_results')
      .delete()
      .lt('date', cutoffDate.toISOString().split('T')[0])

    if (error) {
      console.error('Erreur lors du nettoyage:', error)
      throw error
    }

    return true
  }
}

// Hook React pour utiliser Supabase
export function useSupabaseData() {
  return { supabase, LotteryResultService, MLModelService, PredictionService, SyncService }
}
