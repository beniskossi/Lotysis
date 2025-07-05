// Configuration pour l'API de loterie
export const API_CONFIG = {
  // URL de base de l'API externe
  EXTERNAL_API_URL: 'https://lotobonheur.ci/api/results',
  
  // Headers par défaut pour les requêtes
  DEFAULT_HEADERS: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://lotobonheur.ci/resultats',
  },
  
  // Timeout en millisecondes
  REQUEST_TIMEOUT: 10000,
  
  // Durée de cache en secondes (5 minutes)
  CACHE_DURATION: 300,
  
  // Nombre maximum de tentatives en cas d'échec
  MAX_RETRIES: 3,
  
  // Délai entre les tentatives (en millisecondes)
  RETRY_DELAY: 1000,
}

// Types pour l'API externe
export interface ExternalAPIResponse {
  success: boolean
  drawsResultsWeekly: WeeklyDrawResults[]
}

export interface WeeklyDrawResults {
  drawResultsDaily: DailyDrawResults[]
}

export interface DailyDrawResults {
  date: string
  drawResults: {
    standardDraws: StandardDraw[]
  }
}

export interface StandardDraw {
  drawName: string
  winningNumbers: string
  machineNumbers?: string
}

// Fonction utilitaire pour vérifier si une URL est accessible
export async function checkAPIHealth(url: string = API_CONFIG.EXTERNAL_API_URL): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT)
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: API_CONFIG.DEFAULT_HEADERS,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.warn('API Health Check failed:', error)
    return false
  }
}

// Fonction utilitaire pour formater les paramètres de mois
export function formatMonthParam(month: string, year: number): string {
  const monthNames = {
    '01': 'janvier', '02': 'février', '03': 'mars', '04': 'avril',
    '05': 'mai', '06': 'juin', '07': 'juillet', '08': 'août',
    '09': 'septembre', '10': 'octobre', '11': 'novembre', '12': 'décembre'
  }
  
  const monthName = monthNames[month as keyof typeof monthNames] || month
  return `${monthName}-${year}`
}

// Fonction utilitaire pour parser les dates au format français
export function parseFrenchDate(dateStr: string, year: number): Date | null {
  try {
    // Format attendu: "dimanche 04/05" ou "04/05"
    const dayMonth = dateStr.includes(' ') ? dateStr.split(' ')[1] : dateStr
    const [day, month] = dayMonth.split('/')
    
    if (!day || !month) {
      throw new Error('Invalid date format')
    }
    
    return new Date(year, parseInt(month) - 1, parseInt(day))
  } catch (error) {
    console.warn(`Failed to parse date: ${dateStr}`, error)
    return null
  }
}

// Fonction utilitaire pour valider les numéros de loterie
export function validateLotteryNumbers(numbers: number[]): boolean {
  if (!Array.isArray(numbers) || numbers.length !== 5) {
    return false
  }
  
  return numbers.every(num => 
    Number.isInteger(num) && 
    num >= 1 && 
    num <= 90
  )
}

// Fonction utilitaire pour extraire les numéros depuis une chaîne
export function extractNumbers(numberString: string): number[] {
  if (!numberString || typeof numberString !== 'string') {
    return []
  }
  
  const matches = numberString.match(/\d+/g)
  return matches ? matches.map(Number).filter(num => num >= 1 && num <= 90) : []
}
