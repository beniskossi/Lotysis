import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing in environment variables');
}
if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
});

export const supabaseAdmin = serviceRoleKey ? createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-my-custom-header': 'lotysis-admin' },
  },
}) : null;

export function requireServiceRoleKey() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in environment variables');
  }
  return supabaseAdmin!;
}

export class LotteryResultService {
  
  static async getResults(filters?: {
    draw_name?: string,
    start_date?: string,
    end_date?: string,
    limit?: number,
  }) {
    let query = supabase
      .from('lottery_results')
      .select('*')
      .order('date', { ascending: false });

    if (filters?.draw_name) {
      query = query.eq('draw_name', filters.draw_name);
    }

    if (filters?.start_date) {
      query = query.gte('date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('date', filters.end_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching results:', error);
      throw error;
    }

    return data || [];
  }

  static async addResult(result: Omit<Database['public']['Tables']['lottery_results']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
    if (!result.draw_name || !result.date || !result.gagnants || result.gagnants.length !== 5) {
      throw new Error('Invalid data');
    }

    const { data, error } = await supabase
      .from('lottery_results')
      .insert([result])
      .select();

    if (error) {
      console.error('Error adding result:', error);
      throw error;
    }

    return data[0];
  }

  static async updateResult(id: number, updates: Partial<Database['public']['Tables']['lottery_results']['Update']>) {
    const { data, error } = await supabase
      .from('lottery_results')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating result:', error);
      throw error;
    }

    return data[0];
  }

  static async deleteResult(id: number) {
    const { error } = await supabase
      .from('lottery_results')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting result:', error);
      throw error;
    }

    return true;
  }

  static async getDrawStatistics(draw_name?: string) {
    let query = supabase
      .from('draw_statistics')
      .select('*');

    if (draw_name) {
      query = query.eq('draw_name', draw_name);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching draw statistics:', error);
      throw error;
    }

    return data || [];
  }
}

export class MLModelService {
  
  static async saveModel(model: Omit<Database['public']['Tables']['ml_models']['Insert'], 'id' | 'created_at'>) {
    await supabase
      .from('ml_models')
      .update({ is_active: false })
      .eq('draw_name', model.draw_name)
      .eq('model_type', model.model_type);

    const { data, error } = await supabase
      .from('ml_models')
      .insert([{ ...model, is_active: true }])
      .select();

    if (error) {
      console.error('Error saving model:', error);
      throw error;
    }

    return data[0];
  }

  static async loadModel(draw_name: string, model_type: string) {
    const { data, error } = await supabase
      .from('ml_models')
      .select('*')
      .eq('draw_name', draw_name)
      .eq('model_type', model_type)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading model:', error);
      throw error;
    }

    return data;
  }

  static async getModelsForDraw(draw_name: string) {
    const { data, error } = await supabase
      .from('ml_models')
      .select('*')
      .eq('draw_name', draw_name)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching models:', error);
      throw error;
    }

    return data || [];
  }
}

export class PredictionService {
  
  static async savePrediction(prediction: Omit<Database['public']['Tables']['ml_predictions']['Insert'], 'id' | 'prediction_date'>) {
    const { data, error } = await supabase
      .from('ml_predictions')
      .insert([prediction])
      .select();

    if (error) {
      console.error('Error saving prediction:', error);
      throw error;
    }

    return data[0];
  }

  static async getRecentPredictions(draw_name?: string, limit = 10) {
    let query = supabase
      .from('ml_predictions')
      .select('*')
      .order('prediction_date', { ascending: false })
      .limit(limit);

    if (draw_name) {
      query = query.eq('draw_name', draw_name);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching predictions:', error);
      throw error;
    }

    return data || [];
  }

  static async updatePredictionAccuracy(prediction_id: number, actual_result_id: number, accuracy: number) {
    const { data, error } = await supabase
      .from('ml_predictions')
      .update({ actual_result_id, accuracy })
      .eq('id', prediction_id)
      .select();

    if (error) {
      console.error('Error updating prediction accuracy:', error);
      throw error;
    }

    return data[0];
  }
}

export class SyncService {
  
  static async syncWithExternalAPI(month?: string) {
    try {
      const response = await fetch(`/api/lottery-results?month=${month || ''}&real=true`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      const externalResults = result.data;
      let syncedCount = 0;

      for (const externalResult of externalResults) {
        const existing = await supabase
          .from('lottery_results')
          .select('id')
          .eq('draw_name', externalResult.draw_name)
          .eq('date', externalResult.date)
          .single();

        if (existing.error?.code === 'PGRST116') {
          await LotteryResultService.addResult(externalResult);
          syncedCount++;
        }
      }

      return {
        success: true,
        synced: syncedCount,
        total: externalResults.length,
      };
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    }
  }

  static async cleanupOldData(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('lottery_results')
      .delete()
      .lt('date', cutoffDate.toISOString().split('T')[0]);

    if (error) {
      console.error('Error cleaning up data:', error);
      throw error;
    }

    return true;
  }
}

export function useSupabaseData() {
  return { supabase, LotteryResultService, MLModelService, PredictionService, SyncService };
}

// Type exports for better TypeScript integration
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