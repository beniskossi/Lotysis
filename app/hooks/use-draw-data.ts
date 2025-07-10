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

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Utiliser l'API route Next.js pour récupérer les vraies données
      const response = await fetch('/api/lottery-results?real=true')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setDrawResults(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError("Erreur lors du chargement des vraies données")
      console.error("Erreur:", err)
      setDrawResults([])
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