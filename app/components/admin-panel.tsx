"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Upload, Download, Trash2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ModelManagementPanel } from "./model-management-panel"

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [newResult, setNewResult] = useState({
    draw_name: "",
    date: "",
    gagnants: "",
    machine: "",
  })
  const { toast } = useToast()

  const handleLogin = () => {
    // Simulation d'authentification simple
    if (password === "admin123") {
      setIsAuthenticated(true)
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté à l'interface administrateur.",
      })
    } else {
      toast({
        title: "Erreur de connexion",
        description: "Mot de passe incorrect.",
        variant: "destructive",
      })
    }
  }

  const handleAddResult = () => {
    if (!newResult.draw_name || !newResult.date || !newResult.gagnants) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      })
      return
    }

    const gagnants = newResult.gagnants
      .split(",")
      .map((n) => Number.parseInt(n.trim()))
      .filter((n) => !isNaN(n))
    const machine = newResult.machine
      ? newResult.machine
          .split(",")
          .map((n) => Number.parseInt(n.trim()))
          .filter((n) => !isNaN(n))
      : []

    if (gagnants.length !== 5) {
      toast({
        title: "Erreur",
        description: "Vous devez saisir exactement 5 numéros gagnants.",
        variant: "destructive",
      })
      return
    }

    // Ici, vous ajouteriez la logique pour sauvegarder en base
    toast({
      title: "Résultat ajouté",
      description: `Nouveau tirage ${newResult.draw_name} ajouté avec succès.`,
    })

    // Réinitialiser le formulaire
    setNewResult({
      draw_name: "",
      date: "",
      gagnants: "",
      machine: "",
    })
  }

  const handleExportData = () => {
    // Simulation d'export
    toast({
      title: "Export en cours",
      description: "Les données sont en cours d'export au format JSON.",
    })
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      toast({
        title: "Import en cours",
        description: `Import du fichier ${file.name} en cours...`,
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interface Administrateur</CardTitle>
          <CardDescription>Connexion requise pour accéder aux fonctionnalités d'administration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe administrateur"
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Se connecter
            </Button>
            <p className="text-sm text-gray-500">Mot de passe de démonstration: admin123</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Interface Administrateur
          <Badge variant="secondary">Connecté</Badge>
        </CardTitle>
        <CardDescription>Gestion des données de loterie et configuration système</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="add-result" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="add-result">Ajouter Résultat</TabsTrigger>
            <TabsTrigger value="manage-data">Gérer Données</TabsTrigger>
            <TabsTrigger value="models">Modèles ML</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="add-result" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="draw_name">Nom du tirage *</Label>
                <Input
                  id="draw_name"
                  value={newResult.draw_name}
                  onChange={(e) => setNewResult({ ...newResult, draw_name: e.target.value })}
                  placeholder="ex: Reveil, Etoile, etc."
                />
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newResult.date}
                  onChange={(e) => setNewResult({ ...newResult, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gagnants">Numéros gagnants * (5 numéros séparés par des virgules)</Label>
                <Input
                  id="gagnants"
                  value={newResult.gagnants}
                  onChange={(e) => setNewResult({ ...newResult, gagnants: e.target.value })}
                  placeholder="ex: 12, 25, 34, 67, 89"
                />
              </div>
              <div>
                <Label htmlFor="machine">Numéros machine (optionnel)</Label>
                <Input
                  id="machine"
                  value={newResult.machine}
                  onChange={(e) => setNewResult({ ...newResult, machine: e.target.value })}
                  placeholder="ex: 5, 18, 42, 73, 81"
                />
              </div>
            </div>

            <Button onClick={handleAddResult} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter le résultat
            </Button>
          </TabsContent>

          <TabsContent value="manage-data" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={handleExportData} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exporter JSON
              </Button>

              <div>
                <Input type="file" accept=".json" onChange={handleImportData} className="hidden" id="import-file" />
                <Button asChild className="flex items-center gap-2 w-full">
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Importer JSON
                  </label>
                </Button>
              </div>

              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Purger anciennes données
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques de la base de données</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">248</div>
                    <div className="text-sm text-gray-600">Total tirages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">32</div>
                    <div className="text-sm text-gray-600">Tirages différents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">1,240</div>
                    <div className="text-sm text-gray-600">Numéros enregistrés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">2.1 MB</div>
                    <div className="text-sm text-gray-600">Taille des données</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration API</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="api-url">URL de l'API</Label>
                    <Input
                      id="api-url"
                      defaultValue="https://lotobonheur.ci/api/results"
                      placeholder="URL de l'API des résultats"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sync-interval">Intervalle de synchronisation (minutes)</Label>
                    <Input id="sync-interval" type="number" defaultValue="30" placeholder="30" />
                  </div>
                  <Button className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Sauvegarder la configuration
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de prédiction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prediction-depth">Profondeur d'analyse (nombre de tirages)</Label>
                    <Input id="prediction-depth" type="number" defaultValue="100" placeholder="100" />
                  </div>
                  <div>
                    <Label htmlFor="confidence-threshold">Seuil de confiance minimum (%)</Label>
                    <Input id="confidence-threshold" type="number" defaultValue="60" placeholder="60" />
                  </div>
                  <Button className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Mettre à jour les paramètres
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="models">
            <ModelManagementPanel />
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsAuthenticated(false)} className="w-full">
            Se déconnecter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
