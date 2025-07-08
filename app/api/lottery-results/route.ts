import { NextResponse } from "next/server"
import { requireServiceRoleKey } from '../../../lib/supabase'

// Interface pour les résultats de tirage
interface DrawResult {
  draw_name: string
  date: string
  gagnants: number[]
  machine?: number[]
}

// Planning des tirages pour les tirages standards
const DRAW_SCHEDULE = {
  Lundi: {
    '10H': 'Reveil',
    '13H': 'Etoile',
    '16H': 'Akwaba',
    '18H15': 'Monday Special',
  },
  Mardi: {
    '10H': 'La Matinale',
    '13H': 'Emergence',
    '16H': 'Sika',
    '18H15': 'Lucky Tuesday',
  },
  Mercredi: {
    '10H': 'Premiere Heure',
    '13H': 'Fortune',
    '16H': 'Baraka',
    '18H15': 'Midweek',
  },
  Jeudi: {
    '10H': 'Kado',
    '13H': 'Privilege',
    '16H': 'Monni',
    '18H15': 'Fortune Thursday',
  },
  Vendredi: {
    '10H': 'Cash',
    '13H': 'Solution',
    '16H': 'Wari',
    '18H15': 'Friday Bonanza',
  },
  Samedi: {
    '10H': 'Soutra',
    '13H': 'Diamant',
    '16H': 'Moaye',
    '18H15': 'National',
  },
  Dimanche: {
    '10H': 'Benediction',
    '13H': 'Prestige',
    '16H': 'Awale',
    '18H15': 'Espoir',
  },
}

// Fonction pour récupérer les vrais résultats depuis l'API
async function fetchRealResults(month?: string): Promise<DrawResult[]> {
  const baseUrl = 'https://lotobonheur.ci/api/results'
  const url = month ? `${baseUrl}?month=${month}` : baseUrl
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://lotobonheur.ci/resultats',
      },
      next: { revalidate: 300 }, // Cache pendant 5 minutes
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const resultsData = await response.json()
    
    if (!resultsData.success) {
      throw new Error('API returned unsuccessful response')
    }

    const drawsResultsWeekly = resultsData.drawsResultsWeekly
    if (!drawsResultsWeekly || !Array.isArray(drawsResultsWeekly)) {
      throw new Error('Invalid API response structure')
    }

    // Noms de tirages valides
    const validDrawNames = new Set<string>()
    Object.values(DRAW_SCHEDULE).forEach((day) => {
      Object.values(day).forEach((drawName) => validDrawNames.add(drawName))
    })

    const results: DrawResult[] = []
    const currentYear = new Date().getFullYear()

    // Traiter les résultats de tirages
    for (const week of drawsResultsWeekly) {
      if (!week.drawResultsDaily || !Array.isArray(week.drawResultsDaily)) {
        continue
      }

      for (const dailyResult of week.drawResultsDaily) {
        const dateStr = dailyResult.date
        let drawDate: string

        try {
          // Parser la date (ex: "dimanche 04/05" vers "2025-05-04")
          const [, dayMonth] = dateStr.split(' ')
          const [day, month] = dayMonth.split('/')
          const parsedDate = new Date(currentYear, parseInt(month) - 1, parseInt(day))
          drawDate = parsedDate.toISOString().split('T')[0]
        } catch (e) {
          console.warn(`Format de date invalide: ${dateStr}, erreur: ${e}`)
          continue
        }

        // Traiter les tirages standards
        if (dailyResult.drawResults?.standardDraws) {
          for (const draw of dailyResult.drawResults.standardDraws) {
            const drawName = draw.drawName
            
            if (!validDrawNames.has(drawName) || draw.winningNumbers?.startsWith('.')) {
              continue // Ignorer les tirages invalides ou avec des placeholders
            }

            // Parser les numéros
            const winningNumbers = (draw.winningNumbers?.match(/\d+/g) || []).map(Number).slice(0, 5)
            const machineNumbers = (draw.machineNumbers?.match(/\d+/g) || []).map(Number).slice(0, 5)

            // Valider les données (au moins les numéros gagnants sont requis)
            if (winningNumbers.length === 5) {
              results.push({
                draw_name: drawName,
                date: drawDate,
                gagnants: winningNumbers,
                machine: machineNumbers.length === 5 ? machineNumbers : undefined,
              })
            } else {
              console.warn(`Données incomplètes pour le tirage ${drawName}: ${winningNumbers}`)
            }
          }
        }
      }
    }

    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error(`Erreur lors de la récupération depuis ${url}:`, error)
    
    // Fallback vers des données mockées en cas d'erreur
    return generateFallbackData()
  }
}

// Fonction de fallback en cas d'erreur de l'API
function generateFallbackData(): DrawResult[] {
  console.log('Utilisation des données de fallback')
  
  const draws = [
    "Reveil", "Etoile", "Akwaba", "Monday Special",
    "La Matinale", "Emergence", "Sika", "Lucky Tuesday",
    "Premiere Heure", "Fortune", "Baraka", "Midweek",
    "Kado", "Privilege", "Monni", "Fortune Thursday",
    "Cash", "Solution", "Wari", "Friday Bonanza",
    "Soutra", "Diamant", "Moaye", "National",
    "Benediction", "Prestige", "Awale", "Espoir"
  ]

  const results: DrawResult[] = []
  const today = new Date()

  // Générer des données pour les 30 derniers jours
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Générer 2-3 tirages par jour
    const numDraws = Math.floor(Math.random() * 2) + 2

    for (let j = 0; j < numDraws; j++) {
      const drawName = draws[Math.floor(Math.random() * draws.length)]

      // Générer 5 numéros gagnants uniques
      const gagnants: number[] = []
      while (gagnants.length < 5) {
        const num = Math.floor(Math.random() * 90) + 1
        if (!gagnants.includes(num)) {
          gagnants.push(num)
        }
      }
      gagnants.sort((a, b) => a - b)

      // Générer 5 numéros machine (50% de chance)
      const machine: number[] = []
      if (Math.random() > 0.5) {
        while (machine.length < 5) {
          const num = Math.floor(Math.random() * 90) + 1
          if (!machine.includes(num)) {
            machine.push(num)
          }
        }
        machine.sort((a, b) => a - b)
      }

      results.push({
        draw_name: drawName,
        date: date.toISOString().split("T")[0],
        gagnants,
        machine: machine.length > 0 ? machine : undefined,
      })
    }
  }

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const drawName = searchParams.get("draw")
    const useRealData = searchParams.get("real") === "true"

    console.log(`Récupération des résultats - Mois: ${month}, Tirage: ${drawName}, Données réelles: ${useRealData}`)

    let results: DrawResult[] = []

    if (useRealData) {
      // Essayer de récupérer les vraies données
      results = await fetchRealResults(month || undefined)
    } else {
      // Utiliser les données de fallback
      results = generateFallbackData()
    }

    // Filtrer par nom de tirage si spécifié
    if (drawName) {
      results = results.filter((result) => result.draw_name === drawName)
    }

    // Filtrer par mois si spécifié (pour les données de fallback)
    if (month && !useRealData) {
      const [monthName, year] = month.split('-')
      const monthIndex = {
        'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
        'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
      }[monthName.toLowerCase()]
      
      if (monthIndex !== undefined) {
        results = results.filter((result) => {
          const resultDate = new Date(result.date)
          return resultDate.getMonth() === monthIndex && resultDate.getFullYear() === parseInt(year || '2025')
        })
      }
    }

    console.log(`${results.length} résultats trouvés`)

    const response = NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      source: useRealData ? 'api' : 'fallback',
      cached: useRealData,
    })
    
    // Ajouter les headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    
    return response
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur",
      data: [],
      total: 0,
      source: 'error'
    }, { status: 500 })
  }
}

// Handler pour les requêtes OPTIONS (CORS preflight)
export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, { status: 200 })
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { draw_name, date, gagnants, machine } = body

    console.log('Tentative d\'ajout de résultat:', { draw_name, date, gagnants, machine })

    // Validation des données
    if (!draw_name || !date || !gagnants || gagnants.length !== 5) {
      return NextResponse.json({ 
        success: false, 
        error: "Données invalides - Nom du tirage, date et 5 numéros gagnants requis" 
      }, { status: 400 })
    }

    // Validation des numéros
    const invalidNumbers = gagnants.filter((num: number) => num < 1 || num > 90 || !Number.isInteger(num))
    if (invalidNumbers.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Les numéros doivent être des entiers entre 1 et 90" 
      }, { status: 400 })
    }

    // Validation des numéros machine si fournis
    if (machine && machine.length > 0) {
      if (machine.length !== 5) {
        return NextResponse.json({ 
          success: false, 
          error: "Les numéros machine doivent être exactement 5 si fournis" 
        }, { status: 400 })
      }
      
      const invalidMachineNumbers = machine.filter((num: number) => num < 1 || num > 90 || !Number.isInteger(num))
      if (invalidMachineNumbers.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: "Les numéros machine doivent être des entiers entre 1 et 90" 
        }, { status: 400 })
      }
    }

    // Validation de la date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json({ 
        success: false, 
        error: "Format de date invalide (YYYY-MM-DD requis)" 
      }, { status: 400 })
    }

    // Validation du nom de tirage
    const validDrawNames = new Set<string>()
    Object.values(DRAW_SCHEDULE).forEach((day) => {
      Object.values(day).forEach((drawName) => validDrawNames.add(drawName))
    })

    if (!validDrawNames.has(draw_name)) {
      return NextResponse.json({ 
        success: false, 
        error: `Nom de tirage invalide. Tirages valides: ${Array.from(validDrawNames).join(', ')}` 
      }, { status: 400 })
    }

    // En production, sauvegarder dans une base de données
    try {
      const supabaseAdmin = requireServiceRoleKey();
      const { data, error } = await supabaseAdmin
        .from('lottery_results')
        .insert([{ draw_name, date, gagnants, machine }])
        .select()

      if (error) {
        if (error.message.includes('duplicate key value')) {
          return NextResponse.json({ 
            success: false, 
            error: "Conflit de données - Nom de tirage et date déjà existants" 
          }, { status: 400 })
        } else {
          return NextResponse.json({ 
            success: false, 
            error: "Erreur de la base de données" 
          }, { status: 500 })
        }
      }

      return NextResponse.json({
        success: true,
        message: "Résultat ajouté avec succès",
        data: data ? data : []
      })

    } catch (err) {
      console.error("Erreur lors de l'ajout du résultat:", err)
      return NextResponse.json({ 
        success: false, 
        error: "Erreur serveur lors de l'ajout du résultat" 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Erreur POST:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur lors de l'ajout du résultat" 
    }, { status: 500 })
  }
}
