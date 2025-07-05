"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, BarChart3, TrendingUp, Database, Settings, RefreshCw } from "lucide-react"
import { DrawData } from "./components/draw-data"
import { DrawStats } from "./components/draw-stats"
import { DrawPredictions } from "./components/draw-predictions"
import { DrawHistory } from "./components/draw-history"
import { AdminPanel } from "./components/admin-panel"
import { InstallPWA } from "./components/install-pwa"
import { useDrawData } from "./hooks/use-draw-data"
import { DRAW_SCHEDULE } from "./lib/constants"
// Ajouter l'import du TensorFlowLoader
import { TensorFlowLoader } from "./components/tensorflow-loader"
import { ModelSyncStatus } from "./components/model-sync-status"

export default function LotteryAnalyzer() {
  const [selectedDay, setSelectedDay] = useState("Lundi")
  const [selectedDraw, setSelectedDraw] = useState("Reveil")
  const [activeTab, setActiveTab] = useState("donnees")
  const [showAdmin, setShowAdmin] = useState(false)
  const { drawResults, loading, refreshData } = useDrawData()

  // Ajouter un état pour le chargement de TensorFlow
  const [tensorFlowLoaded, setTensorFlowLoaded] = useState(false)
  const [showTensorFlowLoader, setShowTensorFlowLoader] = useState(true)

  useEffect(() => {
    // Mettre à jour le tirage sélectionné quand le jour change
    const firstDraw = Object.keys(DRAW_SCHEDULE[selectedDay as keyof typeof DRAW_SCHEDULE])[0]
    const drawName = (DRAW_SCHEDULE[selectedDay as keyof typeof DRAW_SCHEDULE] as any)[firstDraw]
    setSelectedDraw(drawName)
  }, [selectedDay])

  const getNumberColor = (num: number) => {
    if (num >= 1 && num <= 9) return "bg-white text-black border-2 border-gray-300"
    if (num >= 10 && num <= 19) return "bg-blue-800 text-white"
    if (num >= 20 && num <= 29) return "bg-green-800 text-white"
    if (num >= 30 && num <= 39) return "bg-indigo-800 text-white"
    if (num >= 40 && num <= 49) return "bg-yellow-600 text-white"
    if (num >= 50 && num <= 59) return "bg-pink-600 text-white"
    if (num >= 60 && num <= 69) return "bg-orange-600 text-white"
    if (num >= 70 && num <= 79) return "bg-gray-600 text-white"
    if (num >= 80 && num <= 90) return "bg-red-600 text-white"
    return "bg-gray-400 text-white"
  }

  const currentDrawData = drawResults.filter((result) => result.draw_name === selectedDraw)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Analyseur de Loterie</h1>
            <p className="text-gray-600 dark:text-gray-300">Analyse avancée des résultats avec prédictions IA</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <InstallPWA />
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdmin(!showAdmin)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Admin
            </Button>
          </div>
        </div>

        {showAdmin && (
          <div className="mb-8">
            <AdminPanel />
          </div>
        )}

        {/* Sélecteurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Jour de la semaine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(DRAW_SCHEDULE).map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tirage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDraw} onValueChange={setSelectedDraw}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DRAW_SCHEDULE[selectedDay as keyof typeof DRAW_SCHEDULE]).map(([time, drawName]) => (
                    <SelectItem key={drawName as string} value={drawName as string}>
                      {time} - {drawName as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {showTensorFlowLoader && !tensorFlowLoaded && (
          <div className="mb-8">
            <TensorFlowLoader
              onLoaded={() => {
                setTensorFlowLoaded(true)
                setShowTensorFlowLoader(false)
              }}
              onError={(error) => {
                console.error("Erreur TensorFlow.js:", error)
                setShowTensorFlowLoader(false)
              }}
            />
          </div>
        )}

        {tensorFlowLoaded && (
          <div className="mb-4">
            <ModelSyncStatus />
          </div>
        )}

        {/* Dernier tirage */}
        {currentDrawData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Dernier tirage - {selectedDraw}</span>
                <Badge variant="secondary">{new Date(currentDrawData[0].date).toLocaleDateString("fr-FR")}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Numéros Gagnants</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentDrawData[0].gagnants.map((num, idx) => (
                      <div
                        key={idx}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getNumberColor(num)}`}
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>

                {currentDrawData[0].machine && (
                  <div>
                    <h4 className="font-semibold mb-2">Numéros Machine</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentDrawData[0].machine.map((num, idx) => (
                        <div
                          key={idx}
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getNumberColor(num)} opacity-75`}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="donnees" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Données</span>
            </TabsTrigger>
            <TabsTrigger value="statistiques" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Statistiques</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Prédictions</span>
            </TabsTrigger>
            <TabsTrigger value="historique" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="donnees">
            <DrawData drawName={selectedDraw} data={currentDrawData} getNumberColor={getNumberColor} />
          </TabsContent>

          <TabsContent value="statistiques">
            <DrawStats drawName={selectedDraw} data={currentDrawData} getNumberColor={getNumberColor} />
          </TabsContent>

          <TabsContent value="predictions">
            <DrawPredictions drawName={selectedDraw} data={currentDrawData} getNumberColor={getNumberColor} />
          </TabsContent>

          <TabsContent value="historique">
            <DrawHistory drawName={selectedDraw} data={currentDrawData} getNumberColor={getNumberColor} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
