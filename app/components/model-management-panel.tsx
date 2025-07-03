"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Download,
  Upload,
  Trash2,
  RefreshCw,
  HardDrive,
  FileText,
  AlertTriangle,
  TrendingDown,
  Zap,
} from "lucide-react"
import { ModelStorageService } from "../services/model-storage-service"
import { CompressionSettingsPanel } from "./compression-settings-panel"
import { useToast } from "@/hooks/use-toast"

interface ModelMetadata {
  drawName: string
  version: string
  size: number
  originalSize?: number
  compressionRatio?: number
  createdAt: number
  lastUsed: number
  performance?: {
    accuracy: number
    loss: number
    trainingTime: number
  }
  compression?: {
    method: string
    level: string
    savings: number
  }
}

interface StorageStats {
  totalModels: number
  totalSize: number
  totalOriginalSize: number
  totalSavings: number
  averageCompressionRatio: number
  oldestModel: string | null
  newestModel: string | null
}

export function ModelManagementPanel() {
  const [models, setModels] = useState<ModelMetadata[]>([])
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const modelStorage = ModelStorageService.getInstance()

  useEffect(() => {
    loadModelData()
  }, [])

  const loadModelData = async () => {
    setLoading(true)
    try {
      await modelStorage.initialize()
      const [modelMetadata, stats] = await Promise.all([
        modelStorage.getAllModelMetadata(),
        modelStorage.getStorageStats(),
      ])

      setModels(modelMetadata)
      setStorageStats(stats)
    } catch (error) {
      console.error("Erreur lors du chargement des modèles:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des modèles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportModel = async (drawName: string) => {
    try {
      const blob = await modelStorage.exportModels(drawName)
      if (!blob) {
        throw new Error("Impossible d'exporter le modèle")
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `model-compressed-${drawName}-${Date.now()}.lzma`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export réussi",
        description: `Modèle ${drawName} exporté avec compression`,
      })
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le modèle",
        variant: "destructive",
      })
    }
  }

  const handleImportModel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const drawName = await modelStorage.importModels(file)
      if (!drawName) {
        throw new Error("Format de fichier invalide")
      }

      await loadModelData()
      toast({
        title: "Import réussi",
        description: `Modèle ${drawName} importé et décompressé avec succès`,
      })
    } catch (error) {
      console.error("Erreur lors de l'import:", error)
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer le modèle",
        variant: "destructive",
      })
    }

    // Reset input
    event.target.value = ""
  }

  const handleDeleteModel = async (drawName: string) => {
    try {
      await modelStorage.deleteModels(drawName)
      await loadModelData()
      toast({
        title: "Suppression réussie",
        description: `Modèle ${drawName} supprimé`,
      })
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer le modèle",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedModels.size === 0) return

    try {
      for (const drawName of selectedModels) {
        await modelStorage.deleteModels(drawName)
      }
      setSelectedModels(new Set())
      await loadModelData()
      toast({
        title: "Suppression réussie",
        description: `${selectedModels.size} modèle(s) supprimé(s)`,
      })
    } catch (error) {
      console.error("Erreur lors de la suppression en lot:", error)
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer les modèles sélectionnés",
        variant: "destructive",
      })
    }
  }

  const handleCleanupOldModels = async () => {
    try {
      const deletedCount = await modelStorage.cleanupOldModels()
      await loadModelData()
      toast({
        title: "Nettoyage terminé",
        description: `${deletedCount} ancien(s) modèle(s) supprimé(s)`,
      })
    } catch (error) {
      console.error("Erreur lors du nettoyage:", error)
      toast({
        title: "Erreur de nettoyage",
        description: "Impossible de nettoyer les anciens modèles",
        variant: "destructive",
      })
    }
  }

  const toggleModelSelection = (drawName: string) => {
    const newSelection = new Set(selectedModels)
    if (newSelection.has(drawName)) {
      newSelection.delete(drawName)
    } else {
      newSelection.add(drawName)
    }
    setSelectedModels(newSelection)
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCompressionBadge = (model: ModelMetadata) => {
    if (!model.compressionRatio) return null

    const ratio = model.compressionRatio
    if (ratio >= 5) {
      return <Badge className="bg-green-100 text-green-800">Excellent ({ratio.toFixed(1)}x)</Badge>
    } else if (ratio >= 3) {
      return <Badge className="bg-blue-100 text-blue-800">Bon ({ratio.toFixed(1)}x)</Badge>
    } else if (ratio >= 2) {
      return <Badge className="bg-yellow-100 text-yellow-800">Modéré ({ratio.toFixed(1)}x)</Badge>
    } else {
      return <Badge variant="outline">Faible ({ratio.toFixed(1)}x)</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Gestion des Modèles ML Compressés
          </span>
          <Button variant="outline" size="sm" onClick={loadModelData} disabled={loading} className="bg-transparent">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
        <CardDescription>Sauvegarde, compression et gestion des modèles TensorFlow.js</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="models">Modèles</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            <TabsTrigger value="compression">Compression</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {storageStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Modèles stockés</span>
                  </div>
                  <div className="text-2xl font-bold">{storageStats.totalModels}</div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Espace utilisé</span>
                  </div>
                  <div className="text-2xl font-bold">{formatSize(storageStats.totalSize)}</div>
                  {storageStats.totalOriginalSize > storageStats.totalSize && (
                    <div className="text-xs text-gray-500">Orig: {formatSize(storageStats.totalOriginalSize)}</div>
                  )}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">Économies</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{formatSize(storageStats.totalSavings)}</div>
                  <div className="text-xs text-gray-500">
                    {((storageStats.totalSavings / storageStats.totalOriginalSize) * 100).toFixed(1)}% économisé
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-sm">Ratio moyen</span>
                  </div>
                  <div className="text-2xl font-bold">{storageStats.averageCompressionRatio.toFixed(1)}x</div>
                  <div className="text-xs text-gray-500">compression</div>
                </Card>
              </div>
            )}

            <Card className="p-4">
              <CardTitle className="text-lg mb-4">Actions de maintenance</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleCleanupOldModels}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                  Nettoyer anciens modèles
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBulkDelete}
                  disabled={selectedModels.size === 0}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer sélection ({selectedModels.size})
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            {models.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun modèle sauvegardé trouvé</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {models.map((model) => (
                  <Card key={model.drawName} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedModels.has(model.drawName)}
                          onChange={() => toggleModelSelection(model.drawName)}
                          className="rounded"
                        />
                        <div>
                          <h3 className="font-semibold">{model.drawName}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Version: {model.version}</span>
                            <span>Taille: {formatSize(model.size)}</span>
                            {model.originalSize && (
                              <span className="text-green-600">
                                Économie: {formatSize(model.originalSize - model.size)}
                              </span>
                            )}
                            <span>Créé: {formatDate(model.createdAt)}</span>
                            <span>Utilisé: {formatDate(model.lastUsed)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getCompressionBadge(model)}
                        {model.performance && (
                          <Badge variant="secondary" className="text-xs">
                            {(model.performance.accuracy * 100).toFixed(1)}% précision
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportModel(model.drawName)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Export
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteModel(model.drawName)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </Button>
                      </div>
                    </div>

                    {(model.performance || model.compression) && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {model.performance && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Performance</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Précision:</span>
                                <Progress value={model.performance.accuracy * 100} className="h-1 mt-1" />
                              </div>
                              <div>
                                <span className="font-medium">Perte:</span> {model.performance.loss.toFixed(4)}
                              </div>
                              <div>
                                <span className="font-medium">Temps:</span> {model.performance.trainingTime}ms
                              </div>
                            </div>
                          </div>
                        )}

                        {model.compression && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Compression</h4>
                            <div className="space-y-1 text-xs">
                              <div>
                                <span className="font-medium">Méthode:</span> {model.compression.method}
                              </div>
                              <div>
                                <span className="font-medium">Niveau:</span> {model.compression.level}
                              </div>
                              <div>
                                <span className="font-medium">Économie:</span>{" "}
                                <span className="text-green-600">{formatSize(model.compression.savings)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="import-export" className="space-y-4">
            <Card className="p-4">
              <CardTitle className="text-lg mb-4">Import de modèles compressés</CardTitle>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="model-import">Sélectionner un fichier de modèle (.lzma, .json)</Label>
                  <Input
                    id="model-import"
                    type="file"
                    accept=".lzma,.json"
                    onChange={handleImportModel}
                    className="mt-1"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Importez des modèles compressés ou non compressés. L'application détectera automatiquement le format
                  et appliquera la décompression si nécessaire.
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <CardTitle className="text-lg mb-4">Export en lot compressé</CardTitle>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Exportez tous les modèles sélectionnés avec compression maximale pour la sauvegarde ou le transfert.
                  Les fichiers exportés incluent toutes les optimisations de compression.
                </p>
                <Button
                  disabled={selectedModels.size === 0}
                  className="flex items-center gap-2"
                  onClick={async () => {
                    for (const drawName of selectedModels) {
                      await handleExportModel(drawName)
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Exporter la sélection compressée ({selectedModels.size})
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <CardTitle className="text-lg mb-4">Synchronisation cloud</CardTitle>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Synchronisez vos modèles compressés avec le cloud pour les partager entre appareils. La compression
                  réduit significativement les temps de transfert.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" disabled className="flex items-center gap-2 bg-transparent">
                    <Upload className="h-4 w-4" />
                    Sauvegarder vers le cloud
                  </Button>
                  <Button variant="outline" disabled className="flex items-center gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Restaurer depuis le cloud
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="compression">
            <CompressionSettingsPanel />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
