import winston from 'winston'

// Configuration du logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Écriture dans des fichiers
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

// En développement, on ajoute aussi la console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// Interface pour les logs d'audit
export interface AuditLog {
  id?: string
  action: string
  user_id?: string
  resource_type: string
  resource_id?: string
  details: any
  timestamp: Date
  ip_address?: string
  user_agent?: string
}

// Service de journalisation avec Supabase
export class AuditService {
  
  // Enregistrer une action d'audit
  static async logAction(audit: Omit<AuditLog, 'id' | 'timestamp'>) {
    try {
      const logEntry = {
        ...audit,
        timestamp: new Date(),
        id: crypto.randomUUID()
      }
      
      // Log local avec Winston
      logger.info('Admin Action', logEntry)
      
      // TODO: Sauvegarder en base Supabase quand la table audit_logs sera créée
      // await supabase.from('audit_logs').insert([logEntry])
      
      return logEntry
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de l\'audit:', error)
      throw error
    }
  }
  
  // Récupérer les logs d'audit
  static async getAuditLogs(filters?: {
    action?: string
    resource_type?: string
    start_date?: Date
    end_date?: Date
    limit?: number
  }) {
    try {
      // TODO: Implémenter avec Supabase quand la table sera créée
      // Pour l'instant, retourne des données simulées
      return [
        {
          id: '1',
          action: 'CREATE_RESULT',
          user_id: 'admin',
          resource_type: 'lottery_result',
          resource_id: '123',
          details: { draw_name: 'Reveil', numbers: [1, 2, 3, 4, 5] },
          timestamp: new Date(),
          ip_address: '127.0.0.1'
        }
      ]
    } catch (error) {
      logger.error('Erreur lors de la récupération des logs:', error)
      throw error
    }
  }
  
  // Nettoyer les anciens logs
  static async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
      
      logger.info(`Nettoyage des logs antérieurs à ${cutoffDate.toISOString()}`)
      
      // TODO: Implémenter avec Supabase
      return true
    } catch (error) {
      logger.error('Erreur lors du nettoyage des logs:', error)
      throw error
    }
  }
}

export { logger }
