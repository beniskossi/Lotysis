import { NextResponse } from "next/server"

// Interface pour les résultats de tirage
interface DrawResult {
  draw_name: string
  date: string
  gagnants: number[]
  machine?: number[]
}

// Simulation de données pour la démo
function generateMockData(): DrawResult[] {
  const draws = [
    "Reveil",
    "Etoile",
    "Akwaba",
    "Monday Special",
    "La Matinale",
    "Emergence",
    "Sika",
    "Lucky Tuesday",
    "Premiere Heure",
    "Fortune",
    "Baraka",
    "Midweek",
    "Kado",
    "Privilege",
    "Monni",
    "Fortune Thursday",
    "Cash",
    "Solution",
    "Wari",
    "Friday Bonanza",
    "Soutra",
    "Diamant",
    "Moaye",
    "National",
    "Benediction",
    "Prestige",
    "Awale",
    "Espoir",
  ]

  const results: DrawResult[] = []
  const today = new Date()

  // Générer des données pour les 90 derniers jours
  for (let i = 0; i < 90; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Générer 2-4 tirages par jour
    const numDraws = Math.floor(Math.random() * 3) + 2

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

      // Générer 5 numéros machine (optionnel)
      const machine: number[] = []
      if (Math.random() > 0.3) {
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

    // En production, vous récupéreriez les données depuis Supabase
    // const { data, error } = await supabase
    //   .from('lottery_results')
    //   .select('*')
    //   .order('date', { ascending: false })

    let results = generateMockData()

    // Filtrer par mois si spécifié
    if (month) {
      results = results.filter((result) => result.date.includes(month))
    }

    // Filtrer par nom de tirage si spécifié
    if (drawName) {
      results = results.filter((result) => result.draw_name === drawName)
    }

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
    })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { draw_name, date, gagnants, machine } = body

    // Validation des données
    if (!draw_name || !date || !gagnants || gagnants.length !== 5) {
      return NextResponse.json({ success: false, error: "Données invalides" }, { status: 400 })
    }

    // En production, vous sauvegarderiez dans Supabase
    // const { data, error } = await supabase
    //   .from('lottery_results')
    //   .insert([{ draw_name, date, gagnants, machine }])

    return NextResponse.json({
      success: true,
      message: "Résultat ajouté avec succès",
    })
  } catch (error) {
    console.error("Erreur POST:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
