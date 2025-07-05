"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, FileText, CheckCircle, AlertCircle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DrawNameSelect } from "./draw-name-select"

interface BatchResult {
  draw_name: string
  date: string
  gagnants: number[]
  machine?: number[]
  status: 'pending' | 'success' | 'error'
  error?: string
}

export function BatchInputPanel() {
  const [batchText, setBatchText] = useState("")
  const [selectedDraw, setSelectedDraw] = useState("")
  const [results, setResults] = useState<BatchResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const parseBatchInput = () => {
    const lines = batchText.trim().split('\n').filter(line => line.trim())
    const parsedResults: BatchResult[] = []

    for (const line of lines) {
      try {
        // Format attendu: "2025-01-06: 12 34 56 78 90 | 11 22 33 44 55" 
        // ou "2025-01-06: 12 34 56 78 90"
        const [datePart, numbersPart] = line.split(':')
        if (!datePart || !numbersPart) {
          throw new Error('Format invalide. Utilisez: "YYYY-MM-DD: numéros"')
        }

        const date = datePart.trim()
        const [gagnantsPart, machinePart] = numbersPart.split('|')
        
        const gagnants = gagnantsPart.trim()
          .split(/\s+/)
          .map(n => parseInt(n))
          .filter(n => !isNaN(n) && n >= 1 && n <= 90)

        if (gagnants.length !== 5) {
          throw new Error('Exactement 5 numéros gagnants requis')
        }

        let machine: number[] | undefined = undefined
        if (machinePart) {
          machine = machinePart.trim()
            .split(/\s+/)
            .map(n => parseInt(n))
            .filter(n => !isNaN(n) && n >= 1 && n <= 90)
          
          if (machine.length !== 5) {
            throw new Error('5 numéros machine requis si spécifiés')
          }
        }

        parsedResults.push({
          draw_name: selectedDraw,
          date,
          gagnants: gagnants.sort((a, b) => a - b),
          machine: machine?.sort((a, b) => a - b),
          status: 'pending'
        })

      } catch (error) {
        parsedResults.push({
          draw_name: selectedDraw,
          date: '',
          gagnants: [],
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur de parsing'
        })
      }
    }

    setResults(parsedResults)
  }

  const processBatch = async () => {
    if (!selectedDraw) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un tirage",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    const updatedResults = [...results]
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < updatedResults.length; i++) {
      const result = updatedResults[i]
      if (result.status === 'error') {
        errorCount++
        continue
      }

      try {
        const response = await fetch('/api/lottery-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            draw_name: result.draw_name,
            date: result.date,
            gagnants: result.gagnants,
            machine: result.machine,
          })
        })

        const apiResult = await response.json()

        if (apiResult.success) {
          updatedResults[i].status = 'success'
          successCount++
        } else {
          updatedResults[i].status = 'error'
          updatedResults[i].error = apiResult.error || 'Erreur serveur'
          errorCount++
        }
      } catch (error) {
        updatedResults[i].status = 'error'
        updatedResults[i].error = 'Erreur de connexion'
        errorCount++
      }

      // Petite pause pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setResults(updatedResults)
    setIsProcessing(false)

    toast({
      title: "Traitement terminé",
      description: `${successCount} succès, ${errorCount} erreurs`,
      variant: successCount > 0 ? "default" : "destructive"
    })
  }

  const exportTemplate = () => {
    const template = `# Template de saisie en lot
# Format: YYYY-MM-DD: num1 num2 num3 num4 num5 | machine1 machine2 machine3 machine4 machine5
# Les numéros machine sont optionnels (après le |)
# Exemple:
2025-01-06: 12 34 56 78 90 | 11 22 33 44 55
2025-01-07: 05 15 25 35 45
2025-01-08: 08 18 28 38 48 | 07 17 27 37 47`

    const blob = new Blob([template], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_saisie_lot.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAll = () => {
    setBatchText("")
    setResults([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Saisie en Lot
        </CardTitle>
        <CardDescription>
          Saisissez plusieurs résultats d'un coup en utilisant un format texte simple
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection du tirage */}
        <div>
          <DrawNameSelect
            value={selectedDraw}
            onChange={setSelectedDraw}
            required
          />
        </div>

        {/* Instructions et template */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Format:</strong> Une ligne par résultat. <br/>
            <code>YYYY-MM-DD: num1 num2 num3 num4 num5 | machine1 machine2 machine3 machine4 machine5</code><br/>
            Les numéros machine (après |) sont optionnels.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Télécharger template
          </Button>
        </div>

        {/* Zone de saisie */}
        <div>
          <Label htmlFor="batch-input">Données à traiter</Label>
          <Textarea
            id="batch-input"
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder={`Exemple:
2025-01-06: 12 34 56 78 90 | 11 22 33 44 55
2025-01-07: 05 15 25 35 45
2025-01-08: 08 18 28 38 48`}
            className="h-40 font-mono text-sm"
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button 
            onClick={parseBatchInput}
            disabled={!batchText.trim() || !selectedDraw}
          >
            Analyser
          </Button>
          {results.length > 0 && (
            <>
              <Button 
                onClick={processBatch}
                disabled={isProcessing || results.every(r => r.status === 'error')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {isProcessing ? 'Traitement...' : 'Enregistrer tout'}
              </Button>
              <Button variant="outline" onClick={clearAll}>
                Effacer
              </Button>
            </>
          )}
        </div>

        {/* Résultats du parsing */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Résultats analysés ({results.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded border flex items-center justify-between ${
                    result.status === 'error' ? 'bg-red-50 border-red-200' :
                    result.status === 'success' ? 'bg-green-50 border-green-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        result.status === 'error' ? 'destructive' :
                        result.status === 'success' ? 'default' :
                        'outline'
                      }>
                        {result.status === 'error' ? 'Erreur' :
                         result.status === 'success' ? 'Succès' :
                         'En attente'}
                      </Badge>
                      {result.date && <span className="text-sm font-mono">{result.date}</span>}
                    </div>
                    {result.status === 'error' ? (
                      <p className="text-red-600 text-sm mt-1">{result.error}</p>
                    ) : (
                      <div className="mt-1">
                        <span className="text-sm">
                          Gagnants: {result.gagnants.join(', ')}
                        </span>
                        {result.machine && (
                          <span className="text-sm text-gray-600 ml-3">
                            Machine: {result.machine.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-2">
                    {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {result.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Statistiques */}
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Total: {results.length}</span>
              <span className="text-green-600">
                Succès: {results.filter(r => r.status === 'success').length}
              </span>
              <span className="text-red-600">
                Erreurs: {results.filter(r => r.status === 'error').length}
              </span>
              <span className="text-gray-500">
                En attente: {results.filter(r => r.status === 'pending').length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
