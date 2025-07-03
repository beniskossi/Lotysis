"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, Filter, Download } from "lucide-react"

interface DrawResult {
  draw_name: string
  date: string
  gagnants: number[]
  machine?: number[]
}

interface DrawHistoryProps {
  drawName: string
  data: DrawResult[]
  getNumberColor: (num: number) => string
}

export function DrawHistory({ drawName, data, getNumberColor }: DrawHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "numbers">("date")
  const [filterBy, setFilterBy] = useState<"all" | "recent" | "old">("all")
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique - {drawName}</CardTitle>
          <CardDescription>Aucune donnée disponible pour ce tirage</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Filtrer et trier les données
  let filteredData = [...data]

  // Filtrer par numéro sélectionné
  if (selectedNumber) {
    filteredData = filteredData.filter((result) => result.gagnants.includes(selectedNumber))
  }

  // Filtrer par période
  if (filterBy === "recent") {
    filteredData = filteredData.slice(0, 30)
  } else if (filterBy === "old") {
    filteredData = filteredData.slice(30)
  }

  // Filtrer par recherche de date
  if (searchTerm) {
    filteredData = filteredData.filter(
      (result) =>
        result.date.includes(searchTerm) || result.gagnants.some((num) => num.toString().includes(searchTerm)),
    )
  }

  // Trier
  if (sortBy === "date") {
    filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const exportData = () => {
    const csvContent = [
      ["Date", "Tirage", "Numéros Gagnants", "Numéros Machine"].join(","),
      ...filteredData.map((result) =>
        [result.date, result.draw_name, result.gagnants.join("-"), result.machine?.join("-") || ""].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `historique-${drawName}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historique - {drawName}
            </span>
            <Button variant="outline" size="sm" onClick={exportData} className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
          </CardTitle>
          <CardDescription>Consultation détaillée de {data.length} tirages enregistrés</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtres et recherche */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par date ou numéro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={sortBy} onValueChange={(value: "date" | "numbers") => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Trier par date</SelectItem>
                <SelectItem value="numbers">Trier par numéros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={(value: "all" | "recent" | "old") => setFilterBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les tirages</SelectItem>
                <SelectItem value="recent">30 plus récents</SelectItem>
                <SelectItem value="old">Plus anciens</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedNumber?.toString() || "all"}
              onValueChange={(value) => setSelectedNumber(value === "all" ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par numéro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les numéros</SelectItem>
                {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{filteredData.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tirages affichés</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {filteredData.length > 0 ? new Date(filteredData[0].date).toLocaleDateString("fr-FR") : "-"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Plus récent</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {filteredData.length > 0
                  ? new Date(filteredData[filteredData.length - 1].date).toLocaleDateString("fr-FR")
                  : "-"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Plus ancien</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{selectedNumber || "Tous"}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Numéro filtré</div>
            </div>
          </div>

          {/* Liste des tirages */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredData.map((result, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="whitespace-nowrap">
                      {new Date(result.date).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </Badge>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Tirage #{data.length - idx}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Gagnants:</span>
                      <div className="flex gap-1">
                        {result.gagnants.map((num, numIdx) => (
                          <div
                            key={numIdx}
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getNumberColor(num)} ${selectedNumber === num ? "ring-2 ring-yellow-400" : ""}`}
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>

                    {result.machine && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Machine:</span>
                        <div className="flex gap-1">
                          {result.machine.map((num, numIdx) => (
                            <div
                              key={numIdx}
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getNumberColor(num)} opacity-75`}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucun résultat trouvé avec les filtres actuels</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
