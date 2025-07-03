"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface DrawResult {
  draw_name: string
  date: string
  gagnants: number[]
  machine?: number[]
}

interface DrawDataProps {
  drawName: string
  data: DrawResult[]
  getNumberColor: (num: number) => string
}

export function DrawData({ drawName, data, getNumberColor }: DrawDataProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Données - {drawName}</CardTitle>
          <CardDescription>Aucune donnée disponible pour ce tirage</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Calculer les fréquences
  const frequencies = new Map<number, number>()
  data.forEach((result) => {
    result.gagnants.forEach((num) => {
      frequencies.set(num, (frequencies.get(num) || 0) + 1)
    })
  })

  // Trier par fréquence
  const sortedFrequencies = Array.from(frequencies.entries()).sort(([, a], [, b]) => b - a)

  const mostFrequent = sortedFrequencies.slice(0, 10)
  const leastFrequent = sortedFrequencies.slice(-10).reverse()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Aperçu des données - {drawName}
            <Badge variant="outline">{data.length} tirages</Badge>
          </CardTitle>
          <CardDescription>Analyse des {data.length} derniers tirages disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tirages analysés</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{frequencies.size}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Numéros différents</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.length * 5}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total numéros tirés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Numéros les plus fréquents
            </CardTitle>
            <CardDescription>Top 10 des numéros les plus tirés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostFrequent.map(([num, freq], idx) => (
                <div key={num} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                      {idx + 1}
                    </Badge>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getNumberColor(num)}`}
                    >
                      {num}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{freq} fois</div>
                    <div className="text-sm text-gray-500">{((freq / data.length) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Numéros les moins fréquents
            </CardTitle>
            <CardDescription>Top 10 des numéros les moins tirés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leastFrequent.map(([num, freq], idx) => (
                <div key={num} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                      {idx + 1}
                    </Badge>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getNumberColor(num)}`}
                    >
                      {num}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{freq} fois</div>
                    <div className="text-sm text-gray-500">{((freq / data.length) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Derniers tirages</CardTitle>
          <CardDescription>Les 10 derniers résultats enregistrés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.slice(0, 10).map((result, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg gap-4"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{new Date(result.date).toLocaleDateString("fr-FR")}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.gagnants.map((num, numIdx) => (
                    <div
                      key={numIdx}
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getNumberColor(num)}`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
