import { LotteryResultService, MLModelService, PredictionService } from '../../lib/supabase'
import { AuditService } from './logger'

export interface BackupData {
  version: string
  timestamp: Date
  lottery_results: any[]
  ml_models: any[]
  ml_predictions: any[]
  settings: any
  metadata: {
    total_records: number
    backup_size: string
    created_by: string
  }
}

export class BackupService {
  
  // Créer une sauvegarde complète
  static async createFullBackup(userId: string = 'admin'): Promise<BackupData> {
    try {
      // Log de l'action
      await AuditService.logAction({
        action: 'CREATE_BACKUP',
        user_id: userId,
        resource_type: 'system',
        details: { type: 'full_backup' }
      })

      // Récupérer toutes les données
      const [lotteryResults, mlModels, predictions] = await Promise.all([
        LotteryResultService.getResults({ limit: 10000 }), // Limite de sécurité
        this.getAllMLModels(),
        this.getAllPredictions()
      ])

      // Récupérer les paramètres de configuration
      const settings = this.getSystemSettings()

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        lottery_results: lotteryResults,
        ml_models: mlModels,
        ml_predictions: predictions,
        settings,
        metadata: {
          total_records: lotteryResults.length + mlModels.length + predictions.length,
          backup_size: this.calculateSize(lotteryResults, mlModels, predictions),
          created_by: userId
        }
      }

      return backupData
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error)
      throw error
    }
  }

  // Exporter la sauvegarde au format JSON
  static async exportBackup(backupData: BackupData): Promise<Blob> {
    try {
      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      return blob
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      throw error
    }
  }

  // Télécharger la sauvegarde
  static async downloadBackup(backupData: BackupData, filename?: string) {
    try {
      const blob = await this.exportBackup(backupData)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      const defaultFilename = `lotysis-backup-${new Date().toISOString().split('T')[0]}.json`
      link.download = filename || defaultFilename
      link.href = url
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      throw error
    }
  }

  // Valider un fichier de sauvegarde
  static validateBackupFile(fileContent: string): { valid: boolean; error?: string; data?: BackupData } {
    try {
      const data = JSON.parse(fileContent) as BackupData
      
      // Vérifications de base
      if (!data.version || !data.timestamp || !data.lottery_results) {
        return { valid: false, error: 'Format de sauvegarde invalide' }
      }

      if (!Array.isArray(data.lottery_results)) {
        return { valid: false, error: 'Les résultats de loterie doivent être un tableau' }
      }

      // Vérifier la version de compatibilité
      if (data.version !== '1.0.0') {
        return { valid: false, error: `Version non supportée: ${data.version}` }
      }

      return { valid: true, data }
    } catch (error) {
      return { valid: false, error: 'Fichier JSON invalide' }
    }
  }

  // Restaurer depuis une sauvegarde
  static async restoreFromBackup(
    backupData: BackupData, 
    options: {
      restoreLotteryResults?: boolean
      restoreMLModels?: boolean
      restorePredictions?: boolean
      restoreSettings?: boolean
      overwriteExisting?: boolean
    } = {},
    userId: string = 'admin'
  ): Promise<{ success: boolean; details: any }> {
    try {
      // Log de l'action
      await AuditService.logAction({
        action: 'RESTORE_BACKUP',
        user_id: userId,
        resource_type: 'system',
        details: { 
          backup_timestamp: backupData.timestamp,
          options 
        }
      })

      const results = {
        lottery_results: 0,
        ml_models: 0,
        ml_predictions: 0,
        settings: false,
        errors: [] as string[]
      }

      // Restaurer les résultats de loterie
      if (options.restoreLotteryResults !== false && backupData.lottery_results) {
        try {
          for (const result of backupData.lottery_results) {
            // Supprimer les champs auto-générés
            const { id, created_at, updated_at, ...cleanResult } = result
            
            if (options.overwriteExisting) {
              // Vérifier si existe déjà
              const existing = await this.findExistingResult(cleanResult)
              if (existing) {
                await LotteryResultService.updateResult(existing.id, cleanResult)
              } else {
                await LotteryResultService.addResult(cleanResult)
              }
            } else {
              await LotteryResultService.addResult(cleanResult)
            }
            results.lottery_results++
          }
        } catch (error) {
          results.errors.push(`Erreur restauration résultats: ${error}`)
        }
      }

      // Restaurer les modèles ML
      if (options.restoreMLModels !== false && backupData.ml_models) {
        try {
          for (const model of backupData.ml_models) {
            const { id, created_at, ...cleanModel } = model
            await MLModelService.saveModel(cleanModel)
            results.ml_models++
          }
        } catch (error) {
          results.errors.push(`Erreur restauration modèles: ${error}`)
        }
      }

      // Restaurer les prédictions
      if (options.restorePredictions !== false && backupData.ml_predictions) {
        try {
          for (const prediction of backupData.ml_predictions) {
            const { id, prediction_date, ...cleanPrediction } = prediction
            await PredictionService.savePrediction(cleanPrediction)
            results.ml_predictions++
          }
        } catch (error) {
          results.errors.push(`Erreur restauration prédictions: ${error}`)
        }
      }

      // Restaurer les paramètres
      if (options.restoreSettings !== false && backupData.settings) {
        try {
          await this.restoreSystemSettings(backupData.settings)
          results.settings = true
        } catch (error) {
          results.errors.push(`Erreur restauration paramètres: ${error}`)
        }
      }

      return { success: results.errors.length === 0, details: results }
    } catch (error) {
      console.error('Erreur lors de la restauration:', error)
      throw error
    }
  }

  // Créer une sauvegarde incrémentale (seulement les nouveaux éléments)
  static async createIncrementalBackup(
    lastBackupDate: Date,
    userId: string = 'admin'
  ): Promise<BackupData> {
    try {
      // Log de l'action
      await AuditService.logAction({
        action: 'CREATE_INCREMENTAL_BACKUP',
        user_id: userId,
        resource_type: 'system',
        details: { since: lastBackupDate }
      })

      const startDate = lastBackupDate.toISOString().split('T')[0]
      
      // Récupérer seulement les données modifiées
      const [lotteryResults] = await Promise.all([
        LotteryResultService.getResults({ start_date: startDate })
      ])

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        lottery_results: lotteryResults,
        ml_models: [], // Les modèles ML ne sont pas versionnés par date
        ml_predictions: [],
        settings: {},
        metadata: {
          total_records: lotteryResults.length,
          backup_size: this.calculateSize(lotteryResults, [], []),
          created_by: userId
        }
      }

      return backupData
    } catch (error) {
      console.error('Erreur lors de la sauvegarde incrémentale:', error)
      throw error
    }
  }

  // Méthodes utilitaires privées
  private static async getAllMLModels() {
    // TODO: Implémenter quand la méthode sera disponible
    return []
  }

  private static async getAllPredictions() {
    // TODO: Implémenter quand la méthode sera disponible
    return []
  }

  private static getSystemSettings() {
    // TODO: Récupérer les paramètres système depuis le localStorage ou la DB
    return {
      api_url: localStorage.getItem('api_url') || '',
      sync_interval: localStorage.getItem('sync_interval') || '30',
      prediction_depth: localStorage.getItem('prediction_depth') || '100',
      confidence_threshold: localStorage.getItem('confidence_threshold') || '60'
    }
  }

  private static async restoreSystemSettings(settings: any) {
    // TODO: Restaurer les paramètres système
    Object.keys(settings).forEach(key => {
      localStorage.setItem(key, settings[key])
    })
  }

  private static calculateSize(results: any[], models: any[], predictions: any[]): string {
    const totalSize = JSON.stringify({ results, models, predictions }).length
    const sizeInKB = Math.round(totalSize / 1024)
    const sizeInMB = Math.round(sizeInKB / 1024)
    
    if (sizeInMB > 0) return `${sizeInMB} MB`
    if (sizeInKB > 0) return `${sizeInKB} KB`
    return `${totalSize} bytes`
  }

  private static async findExistingResult(result: any) {
    // TODO: Implémenter la recherche d'un résultat existant
    // Pour l'instant, on suppose qu'il n'existe pas
    return null
  }
}
