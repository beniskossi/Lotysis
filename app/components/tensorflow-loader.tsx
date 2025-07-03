"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, Download, CheckCircle, AlertCircle } from "lucide-react"

interface TensorFlowLoaderProps {
  onLoaded?: () => void
  onError?: (error: string) => void
}

export function TensorFlowLoader({ onLoaded, onError }: TensorFlowLoaderProps) {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStage, setLoadingStage] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendInfo, setBackendInfo] = useState<{
    backend: string
    version: string
    features: string[]
  } | null>(null)

  useEffect(() => {
    loadTensorFlow()
  }, [])

  const loadTensorFlow = async () => {
    try {
      setLoadingStage("Chargement de TensorFlow.js...")
      setLoadingProgress(10)

      // Import dynamique de TensorFlow.js
      const tf = await import("@tensorflow/tfjs")
      setLoadingProgress(30)

      setLoadingStage("Initialisation du backend...")
      await tf.ready()
      setLoadingProgress(60)

      setLoadingStage("Configuration des optimisations...")

      // Configurer les optimisations
      tf.env().set("WEBGL_PACK", true)
      tf.env().set("WEBGL_FORCE_F16_TEXTURES", true)
      tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 0)

      setLoadingProgress(80)

      setLoadingStage("Vérification des capacités...")

      // Obtenir les informations du backend
      const backend = tf.getBackend()
      const version = tf.version.tfjs
      const features = []

      if (backend === "webgl") {
        features.push("Accélération GPU")
        features.push("WebGL 2.0")
      }

      if (tf.env().getBool("WEBGL_PACK")) {
        features.push("Texture Packing")
      }

      features.push("Float16 Support")

      setBackendInfo({ backend, version, features })
      setLoadingProgress(100)

      setLoadingStage("Prêt !")
      setIsLoaded(true)

      if (onLoaded) {
        onLoaded()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue"
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
    }
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Erreur de chargement TensorFlow.js
          </CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Les prédictions avancées ne seront pas disponibles. L'application utilisera les algorithmes de base.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoaded && backendInfo) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            TensorFlow.js Chargé
          </CardTitle>
          <CardDescription>Machine Learning prêt pour les prédictions avancées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="font-medium text-sm">Backend:</span>
              <div className="text-green-600 font-semibold">{backendInfo.backend.toUpperCase()}</div>
            </div>
            <div>
              <span className="font-medium text-sm">Version:</span>
              <div className="text-green-600 font-semibold">{backendInfo.version}</div>
            </div>
            <div>
              <span className="font-medium text-sm">Fonctionnalités:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {backendInfo.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 animate-pulse" />
          Chargement TensorFlow.js
        </CardTitle>
        <CardDescription>Initialisation du moteur de machine learning...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>{loadingStage}</span>
              <span>{loadingProgress}%</span>
            </div>
            <Progress value={loadingProgress} className="h-2" />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Download className="h-4 w-4" />
            <span>Téléchargement des modèles de neurones...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
