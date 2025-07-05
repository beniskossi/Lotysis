"use client"

import React, { useState } from 'react'
import { Download, Upload, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { BackupService, BackupData } from '@/app/lib/backup-service'

export function BackupRestorePanel() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [lastBackup, setLastBackup] = useState<BackupData | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [restoreOptions, setRestoreOptions] = useState({
    restoreLotteryResults: true,
    restoreMLModels: true,
    restorePredictions: true,
    restoreSettings: true,
    overwriteExisting: false
  })

  const { toast } = useToast()

  // Créer une sauvegarde complète
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    try {
      const backupData = await BackupService.createFullBackup('admin')
      setLastBackup(backupData)
      
      toast({
        title: "Sauvegarde créée",
        description: `${backupData.metadata.total_records} enregistrements sauvegardés (${backupData.metadata.backup_size})`,
      })
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de créer la sauvegarde",
        variant: "destructive",
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  // Télécharger la dernière sauvegarde
  const handleDownloadBackup = async () => {
    if (!lastBackup) {
      toast({
        title: "Aucune sauvegarde",
        description: "Créez d'abord une sauvegarde",
        variant: "destructive",
      })
      return
    }

    try {
      await BackupService.downloadBackup(lastBackup)
      toast({
        title: "Téléchargement lancé",
        description: "La sauvegarde a été téléchargée",
      })
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger la sauvegarde",
        variant: "destructive",
      })
    }
  }

  // Sélectionner un fichier de restauration
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
  }

  // Restaurer depuis un fichier
  const handleRestore = async () => {
    if (!selectedFile) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Sélectionnez un fichier de sauvegarde",
        variant: "destructive",
      })
      return
    }

    setIsRestoring(true)
    setRestoreProgress(0)

    try {
      // Lire le contenu du fichier
      const fileContent = await selectedFile.text()
      
      // Valider le fichier
      const validation = BackupService.validateBackupFile(fileContent)
      if (!validation.valid) {
        toast({
          title: "Fichier invalide",
          description: validation.error,
          variant: "destructive",
        })
        return
      }

      setRestoreProgress(25)

      // Restaurer les données
      const result = await BackupService.restoreFromBackup(
        validation.data!,
        restoreOptions,
        'admin'
      )

      setRestoreProgress(100)

      if (result.success) {
        toast({
          title: "Restauration réussie",
          description: `${result.details.lottery_results} résultats, ${result.details.ml_models} modèles et ${result.details.ml_predictions} prédictions restaurés`,
        })
      } else {
        toast({
          title: "Restauration partielle",
          description: `Terminée avec ${result.details.errors.length} erreur(s)`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur de restauration",
        description: "Impossible de restaurer les données",
        variant: "destructive",
      })
    } finally {
      setIsRestoring(false)
      setRestoreProgress(0)
    }
  }

  // Créer une sauvegarde incrémentale
  const handleCreateIncrementalBackup = async () => {
    if (!lastBackup) {
      toast({
        title: "Aucune sauvegarde de référence",
        description: "Créez d'abord une sauvegarde complète",
        variant: "destructive",
      })
      return
    }

    setIsCreatingBackup(true)
    try {
      const incrementalBackup = await BackupService.createIncrementalBackup(
        lastBackup.timestamp,
        'admin'
      )
      
      await BackupService.downloadBackup(
        incrementalBackup,
        `lotysis-incremental-${new Date().toISOString().split('T')[0]}.json`
      )
      
      toast({
        title: "Sauvegarde incrémentale créée",
        description: `${incrementalBackup.metadata.total_records} nouveaux enregistrements`,
      })
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde incrémentale",
        description: "Impossible de créer la sauvegarde",
        variant: "destructive",
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Sauvegarde */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Sauvegarde des données
          </CardTitle>
          <CardDescription>
            Créez une sauvegarde complète ou incrémentale de vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="flex items-center gap-2"
            >
              {isCreatingBackup ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sauvegarde complète
            </Button>

            <Button
              variant="outline"
              onClick={handleCreateIncrementalBackup}
              disabled={isCreatingBackup || !lastBackup}
              className="flex items-center gap-2"
            >
              {isCreatingBackup ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sauvegarde incrémentale
            </Button>

            <Button
              variant="secondary"
              onClick={handleDownloadBackup}
              disabled={!lastBackup}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger dernière sauvegarde
            </Button>
          </div>

          {lastBackup && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Dernière sauvegarde créée</span>
              </div>
              <div className="mt-1 text-sm text-green-600">
                {new Date(lastBackup.timestamp).toLocaleString()} - 
                {lastBackup.metadata.total_records} enregistrements - 
                {lastBackup.metadata.backup_size}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Restauration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restauration des données
          </CardTitle>
          <CardDescription>
            Restaurez vos données depuis un fichier de sauvegarde
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sélection du fichier */}
          <div>
            <Label htmlFor="backup-file">Fichier de sauvegarde</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isRestoring}
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-1">
                Fichier sélectionné: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
          </div>

          {/* Options de restauration */}
          <div className="space-y-3">
            <Label>Options de restauration</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restore-results"
                  checked={restoreOptions.restoreLotteryResults}
                  onCheckedChange={(checked) =>
                    setRestoreOptions({ ...restoreOptions, restoreLotteryResults: !!checked })
                  }
                />
                <Label htmlFor="restore-results">Résultats de loterie</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restore-models"
                  checked={restoreOptions.restoreMLModels}
                  onCheckedChange={(checked) =>
                    setRestoreOptions({ ...restoreOptions, restoreMLModels: !!checked })
                  }
                />
                <Label htmlFor="restore-models">Modèles ML</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restore-predictions"
                  checked={restoreOptions.restorePredictions}
                  onCheckedChange={(checked) =>
                    setRestoreOptions({ ...restoreOptions, restorePredictions: !!checked })
                  }
                />
                <Label htmlFor="restore-predictions">Prédictions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restore-settings"
                  checked={restoreOptions.restoreSettings}
                  onCheckedChange={(checked) =>
                    setRestoreOptions({ ...restoreOptions, restoreSettings: !!checked })
                  }
                />
                <Label htmlFor="restore-settings">Paramètres</Label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwrite-existing"
                checked={restoreOptions.overwriteExisting}
                onCheckedChange={(checked) =>
                  setRestoreOptions({ ...restoreOptions, overwriteExisting: !!checked })
                }
              />
              <Label htmlFor="overwrite-existing">Écraser les données existantes</Label>
            </div>
          </div>

          {/* Progression */}
          {isRestoring && (
            <div className="space-y-2">
              <Label>Progression de la restauration</Label>
              <Progress value={restoreProgress} className="w-full" />
              <p className="text-sm text-gray-600">
                {restoreProgress}% terminé
              </p>
            </div>
          )}

          {/* Bouton de restauration */}
          <Button
            onClick={handleRestore}
            disabled={!selectedFile || isRestoring}
            className="flex items-center gap-2 w-full"
          >
            {isRestoring ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isRestoring ? 'Restauration en cours...' : 'Restaurer les données'}
          </Button>

          {/* Avertissement */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Attention</span>
            </div>
            <p className="mt-1 text-sm text-amber-600">
              La restauration peut écraser vos données existantes. Assurez-vous d'avoir une sauvegarde récente avant de procéder.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
