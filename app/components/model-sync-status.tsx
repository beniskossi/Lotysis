"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cloud, CloudOff, Download, Upload, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { ModelStorageService } from "../services/model-storage-service"

interface SyncStatus {
  isOnline: boolean
  lastSync: number | null
  pendingUploads: number
  pendingDownloads: number
  syncInProgress: boolean
}

export function ModelSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingUploads: 0,
    pendingDownloads: 0,
    syncInProgress: false,
  })

  const modelStorage = ModelStorageService.getInstance()

  useEffect(() => {
    const handleOnline = () => setSyncStatus((prev) => ({ ...prev, isOnline: true }))
    const handleOffline = () => setSyncStatus((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Charger le statut de synchronisation depuis le localStorage
    const lastSync = localStorage.getItem("lastModelSync")
    if (lastSync) {
      setSyncStatus((prev) => ({ ...prev, lastSync: Number.parseInt(lastSync) }))
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleManualSync = async () => {
    setSyncStatus((prev) => ({ ...prev, syncInProgress: true }))

    try {
      // Simuler la synchronisation (à implémenter avec un vrai service cloud)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const now = Date.now()
      localStorage.setItem("lastModelSync", now.toString())
      setSyncStatus((prev) => ({
        ...prev,
        lastSync: now,
        syncInProgress: false,
        pendingUploads: 0,
        pendingDownloads: 0,
      }))
    } catch (error) {
      console.error("Erreur de synchronisation:", error)
      setSyncStatus((prev) => ({ ...prev, syncInProgress: false }))
    }
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "Jamais"

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days} jour(s)`
  }

  return (
    <Card className="p-3">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {syncStatus.isOnline ? (
                <Cloud className="h-4 w-4 text-green-600" />
              ) : (
                <CloudOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">{syncStatus.isOnline ? "En ligne" : "Hors ligne"}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Dernière sync: {formatLastSync(syncStatus.lastSync)}</span>
              {(syncStatus.pendingUploads > 0 || syncStatus.pendingDownloads > 0) && (
                <Badge variant="secondary" className="text-xs">
                  {syncStatus.pendingUploads + syncStatus.pendingDownloads} en attente
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncStatus.syncInProgress ? (
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Synchronisation...
              </div>
            ) : syncStatus.lastSync && Date.now() - syncStatus.lastSync < 5 * 60 * 1000 ? (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />À jour
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-orange-600">
                <AlertCircle className="h-3 w-3" />
                Sync recommandée
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
              className="h-7 px-2 text-xs bg-transparent"
            >
              {syncStatus.syncInProgress ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {syncStatus.pendingUploads > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
            <Upload className="h-3 w-3" />
            {syncStatus.pendingUploads} modèle(s) à sauvegarder
          </div>
        )}

        {syncStatus.pendingDownloads > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
            <Download className="h-3 w-3" />
            {syncStatus.pendingDownloads} mise(s) à jour disponible(s)
          </div>
        )}
      </CardContent>
    </Card>
  )
}
