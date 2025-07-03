"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, PieChart, Activity } from "lucide-react"

interface DrawResult {
  draw_name: string
  date: string
  gagnants: number[]
  machine?: number[]
}

interface DrawStatsProps {
  drawName: string
  data: DrawResult[]
  getNumberColor: (num: number) => string
}

export function DrawStats({ drawName, data, getNumberColor }: DrawStatsProps) {
  const [viewMode, setViewMode] = useState<"frequency" | "gaps" | "patterns">("frequency")
  const [period, setPeriod] = useState<"all" | "30" | "90">("all")

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques - {drawName}</CardTitle>
          <CardDescription>Aucune donnée disponible pour ce tirage</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Filtrer les données selon la période
  const filteredData = period === "all" ? data : data.slice(0, period === "30" ? 30 : 90)

  // Calculer les statistiques
  const frequencies = new Map<number, number>()
  const lastSeen = new Map<number, number>()

  filteredData.forEach((result, idx) => {
    result.gagnants.forEach((num) => {
      frequencies.set(num, (frequencies.get(num) || 0) + 1)
      if (!lastSeen.has(num)) {
        lastSeen.set(num, idx)
      }
    })
  })

  // Calculer les écarts (gaps)
  const gaps = new Map<number, number>()
  for (let num = 1; num <= 90; num++) {
    const lastIndex = lastSeen.get(num)
    if (lastIndex !== undefined) {
      gaps.set(num, lastIndex)
    } else {
      gaps.set(num, filteredData.length)
    }
  }

  const sortedByFrequency = Array.from(frequencies.entries()).sort(([, a], [, b]) => b - a)

  const sortedByGaps = Array.from(gaps.entries()).sort(([, a], [, b]) => b - a)

  // Analyser les patterns (paires fréquentes)
  const pairs = new Map<string, number>()
  filteredData.forEach((result) => {
    const nums = result.gagnants.sort((a, b) => a - b)
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const pair = `${nums[i]}-${nums[j]}`
        pairs.set(pair, (pairs.get(pair) || 0) + 1)
      }
    }
  })

  const topPairs = Array.from(pairs.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Statistiques avancées - {drawName}
            <Badge variant="outline">{filteredData.length} tirages</Badge>
          </CardTitle>
          <CardDescription>Analyse statistique détaillée des résultats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "frequency" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("frequency")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Fréquences
              </Button>
              <Button
                variant={viewMode === "gaps" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("gaps")}
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Écarts
              </Button>
              <Button
                variant={viewMode === "patterns" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("patterns")}
                className="flex items-center gap-2"
              >
                <PieChart className="h-4 w-4" />
                Patterns
              </Button>
            </div>

            <Select value={period} onValueChange={(value: "all" | "30" | "90") => setPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les tirages</SelectItem>
                <SelectItem value="30">30 derniers</SelectItem>
                <SelectItem value="90">90 derniers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {viewMode === "frequency" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Distribution des fréquences</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sortedByFrequency.map(([num, freq]) => (
                    <div
                      key={num}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getNumberColor(num)}`}
                        >
                          {num}
                        </div>
                        <span className="font-medium">{num}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(freq / Math.max(...Array.from(frequencies.values()))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-8">{freq}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Répartition par tranches</h3>
                <div className="space-y-4">
                  {[
                    { range: "1-10", color: "bg-white border-2 border-gray-300", textColor: "text-black" },
                    { range: "11-20", color: "bg-blue-800", textColor: "text-white" },
                    { range: "21-30", color: "bg-green-800", textColor: "text-white" },
                    { range: "31-40", color: "bg-indigo-800", textColor: "text-white" },
                    { range: "41-50", color: "bg-yellow-600", textColor: "text-white" },
                    { range: "51-60", color: "bg-pink-600", textColor: "text-white" },
                    { range: "61-70", color: "bg-orange-600", textColor: "text-white" },
                    { range: "71-80", color: "bg-gray-600", textColor: "text-white" },
                    { range: "81-90", color: "bg-red-600", textColor: "text-white" },
                  ].map(({ range, color, textColor }) => {
                    const [start, end] = range.split("-").map(Number)
                    const count = Array.from(frequencies.entries())
                      .filter(([num]) => num >= start && num <= end)
                      .reduce((sum, [, freq]) => sum + freq, 0)

                    return (
                      <div key={range} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${color} ${textColor}`}
                          >
                            {range}
                          </div>
                          <span>Numéros {range}</span>
                        </div>
                        <Badge variant="secondary">{count} tirages</Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {viewMode === "gaps" && (
            <div>
              <h3 className="font-semibold mb-4">Écarts depuis le dernier tirage</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedByGaps.slice(0, 20).map(([num, gap]) => (
                  <div key={num} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mx-auto mb-2 ${getNumberColor(num)}`}
                    >
                      {num}
                    </div>
                    <div className="text-sm font-semibold">{gap} tirages</div>
                    <div className="text-xs text-gray-500">depuis le dernier</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "patterns" && (
            <div>
              <h3 className="font-semibold mb-4">Paires de numéros les plus fréquentes</h3>
              <div className="space-y-3">
                {topPairs.map(([pair, count]) => {
                  const [num1, num2] = pair.split("-").map(Number)
                  return (
                    <div
                      key={pair}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getNumberColor(num1)}`}
                        >
                          {num1}
                        </div>
                        <span className="text-gray-400">+</span>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getNumberColor(num2)}`}
                        >
                          {num2}
                        </div>
                      </div>
                      <Badge variant="secondary">{count} fois ensemble</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
