"use client"

import { useState, useEffect } from "react"

interface DrawResult {
  draw_name: string
  date: string
  gagnants: number[]
  machine?: number[]
}

export function useDrawData() {
  const [drawResults, setDrawResults] = useState<DrawResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const generateMockData = (): DrawResult[] => {
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

    // Générer des données pour les 60 derniers jours
    for (let i = 0; i < 60; i++) {
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
          // 70% de chance d'avoir des numéros machine
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

    // Trier par date décroissante
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Simuler un appel API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // En production, vous utiliseriez l'API réelle
      // const response = await fetch('/api/lottery-results')
      // const data = await response.json()

      const mockData = generateMockData()
      setDrawResults(mockData)
    } catch (err) {
      setError("Erreur lors du chargement des données")
      console.error("Erreur:", err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    drawResults,
    loading,
    error,
    refreshData,
  }
}
