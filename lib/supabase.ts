import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only throw errors in production or when actually trying to use Supabase
let supabaseClient: any = null;
let supabaseAdminClient: any = null;

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured. Some features may not work.');
    return null;
  }

  try {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

function createSupabaseAdminClient() {
  if (!serviceRoleKey || !supabaseUrl) {
    console.warn('Supabase service role key not configured. Admin features may not work.');
    return null;
  }

  try {
    return createClient<Database>(supabaseUrl, serviceRoleKey, {
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
    });
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error);
    return null;
  }
}

// Initialize clients
supabaseClient = createSupabaseClient();
supabaseAdminClient = createSupabaseAdminClient();

export const supabase = supabaseClient;
export const supabaseAdmin = supabaseAdminClient;

export function requireServiceRoleKey() {
  if (!serviceRoleKey || !supabaseAdminClient) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in environment variables');
  }
  return supabaseAdminClient;
}

export class LotteryResultService {
  
  static async getResults(filters?: {
    draw_name?: string,
    start_date?: string,
    end_date?: string,
    limit?: number,
  }) {
    if (!supabaseClient) {
      console.warn('Supabase not configured, returning empty results');
      return [];
    }

    try {
      let query = supabaseClient
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
    } catch (error) {
      console.error('Error in getResults:', error);
      return [];
    }
  }

  static async addResult(result: any) {
    if (!supabaseClient) {
      throw new Error('Supabase not configured');
    }

    if (!result.draw_name || !result.date || !result.gagnants || result.gagnants.length !== 5) {
      throw new Error('Invalid data');
    }

    const { data, error } = await supabaseClient
      .from('lottery_results')
      .insert([result])
      .select();

    if (error) {
      console.error('Error adding result:', error);
      throw error;
    }

    return data[0];
  }

  static async updateResult(id: number, updates: any) {
    if (!supabaseClient) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabaseClient
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
    if (!supabaseClient) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabaseClient
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
    if (!supabaseClient) {
      console.warn('Supabase not configured, returning empty statistics');
      return [];
    }

    try {
      let query = supabaseClient
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
    } catch (error) {
      console.error('Error in getDrawStatistics:', error);
      return [];
    }
  }
}

export class MLModelService {
  
  static async saveModel(model: any) {
    if (!supabaseClient) {
      throw new Error('Supabase not configured');
    }

    await supabaseClient
      .from('ml_models')
      .update({ is_active: false })
      .eq('draw_name', model.draw_name)
      .eq('model_type', model.model_type);

    const { data, error } = await supabaseClient
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
    if (!supabaseClient) {
      console.warn('Supabase not configured, returning null');
      return null;
    }

    const { data, error } = await supabaseClient
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
    if (!supabaseClient) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    const { data, error } = await supabaseClient
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
  
  static async savePrediction(prediction: any) {
    if (!supabaseClient) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabaseClient
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
    if (!supabaseClient) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    let query = supabaseClient
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
    if (!supabaseClient) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabaseClient
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

      if (!supabaseClient) {
        console.warn('Supabase not configured, skipping sync to database');
        return {
          success: true,
          synced: 0,
          total: externalResults.length,
        };
      }

      for (const externalResult of externalResults) {
        const existing = await supabaseClient
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
    if (!supabaseClient) {
      throw new Error('Supabase not configured');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabaseClient
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
  return { supabase: supabaseClient, LotteryResultService, MLModelService, PredictionService, SyncService };
}

// Type exports for better TypeScript integration
export type LotteryResult = any;
export type NewLotteryResult = any;
export type UpdateLotteryResult = any;
export type MLModel = any;
export type NewMLModel = any;
export type UpdateMLModel = any;
export type MLPrediction = any;
export type NewMLPrediction = any;
export type UpdateMLPrediction = any;
export type DrawSchedule = any;