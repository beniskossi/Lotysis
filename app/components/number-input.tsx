"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, RotateCcw, Save, History, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NumberInputProps {
  label: string
  required?: boolean
  maxNumbers?: number
  minNumber?: number
  maxNumber?: number
  value: number[]
  onChange: (numbers: number[]) => void
  placeholder?: string
  persistKey?: string // Clé pour la persistance locale
  allowHistory?: boolean // Permettre l'historique
  quickInput?: boolean // Mode saisie rapide
}

export function NumberInput({
  label,
  required = false,
  maxNumbers = 5,
  minNumber = 1,
  maxNumber = 90,
  value,
  onChange,
  placeholder = "Entrez un numéro...",
  persistKey,
  allowHistory = true,
  quickInput = true
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState("")
  const [history, setHistory] = useState<number[][]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [quickMode, setQuickMode] = useState(false)
  const [undoStack, setUndoStack] = useState<number[][]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Persistance locale
  useEffect(() => {
    if (persistKey) {
      const saved = localStorage.getItem(`numbers_${persistKey}`)
      if (saved) {
        try {
          const parsedNumbers = JSON.parse(saved)
          if (Array.isArray(parsedNumbers)) {
            onChange(parsedNumbers)
          }
        } catch (e) {
          console.warn('Erreur lors du chargement des numéros sauvegardés')
        }
      }

      // Charger l'historique
      const savedHistory = localStorage.getItem(`history_${persistKey}`)
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory)
          if (Array.isArray(parsedHistory)) {
            setHistory(parsedHistory.slice(-10)) // Garder seulement les 10 derniers
          }
        } catch (e) {
          console.warn('Erreur lors du chargement de l\'historique')
        }
      }
    }
  }, [persistKey])

  // Sauvegarder automatiquement
  useEffect(() => {
    if (persistKey && value.length > 0) {
      localStorage.setItem(`numbers_${persistKey}`, JSON.stringify(value))
    }
  }, [value, persistKey])

  // Focus automatique en mode rapide
  useEffect(() => {
    if (quickMode && inputRef.current) {
      inputRef.current.focus()
    }
  }, [quickMode, value])

  const saveToHistory = (numbers: number[]) => {
    if (allowHistory && numbers.length === maxNumbers) {
      const newHistory = [...history, numbers].slice(-10) // Garder 10 entrées max
      setHistory(newHistory)
      if (persistKey) {
        localStorage.setItem(`history_${persistKey}`, JSON.stringify(newHistory))
      }
    }
  }

  const saveToUndoStack = (numbers: number[]) => {
    setUndoStack(prev => [...prev, numbers].slice(-5)) // Garder 5 actions max
  }

  const addNumber = (num: number) => {
    setError("")
    
    // Vérifications
    if (value.length >= maxNumbers) {
      setError(`Maximum ${maxNumbers} numéros autorisés`)
      if (quickMode) {
        // En mode rapide, proposer de finaliser
        toast({
          title: "Séquence complète",
          description: `Vous avez saisi ${maxNumbers} numéros. Séquence prête !`,
        })
        saveToHistory(value)
      }
      return
    }
    
    if (num < minNumber || num > maxNumber) {
      setError(`Le numéro doit être entre ${minNumber} et ${maxNumber}`)
      return
    }
    
    if (value.includes(num)) {
      setError("Ce numéro a déjà été ajouté")
      return
    }
    
    // Sauvegarder l'état actuel pour undo
    saveToUndoStack(value)
    
    const newNumbers = [...value, num].sort((a, b) => a - b)
    onChange(newNumbers)
    setInputValue("")
    
    // En mode rapide, remettre le focus et donner feedback
    if (quickMode) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 50)
      
      if (newNumbers.length === maxNumbers) {
        toast({
          title: "Séquence complète !",
          description: `${maxNumbers} numéros saisis avec succès`,
        })
        saveToHistory(newNumbers)
        setQuickMode(false)
      }
    }
  }

  const removeNumber = (numToRemove: number) => {
    saveToUndoStack(value)
    const newNumbers = value.filter(num => num !== numToRemove)
    onChange(newNumbers)
    setError("")
  }

  const undoLastAction = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1]
      setUndoStack(prev => prev.slice(0, -1))
      onChange(lastState)
      setError("")
      toast({
        title: "Action annulée",
        description: "Dernière modification annulée",
      })
    }
  }

  const loadFromHistory = (numbers: number[]) => {
    saveToUndoStack(value)
    onChange(numbers)
    setShowHistory(false)
    setError("")
    toast({
      title: "Historique chargé",
      description: "Numéros chargés depuis l'historique",
    })
  }

  const saveCurrentToHistory = () => {
    if (value.length > 0) {
      saveToHistory(value)
      toast({
        title: "Sauvegardé",
        description: "Numéros ajoutés à l'historique",
      })
    }
  }

  const clearPersistentData = () => {
    if (persistKey) {
      localStorage.removeItem(`numbers_${persistKey}`)
      localStorage.removeItem(`history_${persistKey}`)
      setHistory([])
      setUndoStack([])
      onChange([])
      setInputValue("")
      setError("")
      toast({
        title: "Données effacées",
        description: "Toutes les données sauvegardées ont été supprimées",
      })
    }
  }

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const num = parseInt(inputValue)
      if (!isNaN(num)) {
        addNumber(num)
      }
    } else if (e.key === "Escape") {
      setInputValue("")
      setError("")
    } else if (e.key === " " && inputValue) {
      // Espace pour ajouter le numéro
      e.preventDefault()
      const num = parseInt(inputValue)
      if (!isNaN(num)) {
        addNumber(num)
      }
    } else if (e.ctrlKey && e.key === "z") {
      // Ctrl+Z pour annuler
      e.preventDefault()
      undoLastAction()
    }
  }

  // Saisie successive rapide - permet de saisir des numéros séparés par des espaces
  const handleBulkInput = (text: string) => {
    const numbers = text
      .split(/[\s,;]+/) // Séparer par espaces, virgules ou points-virgules
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= minNumber && n <= maxNumber)
      .filter(n => !value.includes(n)) // Éviter les doublons
      .slice(0, maxNumbers - value.length) // Ne pas dépasser la limite

    if (numbers.length > 0) {
      saveToUndoStack(value)
      const newNumbers = [...value, ...numbers].sort((a, b) => a - b)
      onChange(newNumbers)
      setInputValue("")
      setError("")
      
      toast({
        title: "Numéros ajoutés",
        description: `${numbers.length} numéro(s) ajouté(s) en une fois`,
      })
      
      if (newNumbers.length === maxNumbers) {
        saveToHistory(newNumbers)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    
    // Détecter la saisie successive (espaces, virgules)
    if (val.includes(' ') || val.includes(',') || val.includes(';')) {
      handleBulkInput(val)
      return
    }
    
    // Permettre seulement les chiffres pour la saisie simple
    if (val === "" || /^\d+$/.test(val)) {
      setInputValue(val)
      setError("")
    }
  }

  const handleAddClick = () => {
    const num = parseInt(inputValue)
    if (!isNaN(num)) {
      addNumber(num)
    }
  }

  // Génération rapide de numéros aléatoires
  const generateRandomNumbers = () => {
    saveToUndoStack(value)
    const randomNumbers: number[] = []
    while (randomNumbers.length < maxNumbers) {
      const randomNum = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber
      if (!randomNumbers.includes(randomNum)) {
        randomNumbers.push(randomNum)
      }
    }
    onChange(randomNumbers.sort((a, b) => a - b))
    setError("")
    toast({
      title: "Numéros générés",
      description: `${maxNumbers} numéros aléatoires générés`,
    })
  }

  const clearAll = () => {
    saveToUndoStack(value)
    onChange([])
    setInputValue("")
    setError("")
  }

  const getNumberColor = (num: number) => {
    if (num >= 1 && num <= 9) return "bg-white text-black border-2 border-gray-300"
    if (num >= 10 && num <= 19) return "bg-blue-600 text-white"
    if (num >= 20 && num <= 29) return "bg-green-600 text-white"
    if (num >= 30 && num <= 39) return "bg-indigo-600 text-white"
    if (num >= 40 && num <= 49) return "bg-yellow-600 text-white"
    if (num >= 50 && num <= 59) return "bg-pink-600 text-white"
    if (num >= 60 && num <= 69) return "bg-orange-600 text-white"
    if (num >= 70 && num <= 79) return "bg-gray-600 text-white"
    if (num >= 80 && num <= 90) return "bg-red-600 text-white"
    return "bg-gray-400 text-white"
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec contrôles avancés */}
      <div className="flex items-center justify-between">
        <Label className="font-medium flex items-center gap-2">
          {label} {required && <span className="text-red-500">*</span>}
          {quickInput && (
            <Badge 
              variant={quickMode ? "default" : "outline"} 
              className="text-xs cursor-pointer"
              onClick={() => setQuickMode(!quickMode)}
            >
              {quickMode ? "Mode Rapide" : "Mode Normal"}
            </Badge>
          )}
        </Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {value.length}/{maxNumbers}
          </Badge>
          {allowHistory && history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="h-6 px-2"
            >
              <History className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Historique (si activé) */}
      {showHistory && history.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Historique récent</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {history.slice(-5).reverse().map((nums, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => loadFromHistory(nums)}
              >
                <span className="text-sm font-mono">{nums.join(", ")}</span>
                <ArrowRight className="h-3 w-3 text-gray-400" />
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(false)}
            className="w-full h-6"
          >
            Fermer
          </Button>
        </div>
      )}

      {/* Instructions pour le mode rapide */}
      {quickMode && (
        <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          💡 Mode rapide activé : Tapez les numéros et appuyez sur Entrée ou Espace pour ajouter. 
          Saisissez plusieurs numéros séparés par des espaces (ex: "12 34 56").
        </div>
      )}

      {/* Numéros sélectionnés */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {value.map((num) => (
            <div
              key={num}
              className={`relative group w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${getNumberColor(num)} cursor-pointer transition-all hover:scale-110`}
              onClick={() => removeNumber(num)}
            >
              {num}
              <div className="absolute inset-0 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-90 transition-opacity">
                <X className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saisie de numéro */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyPress}
            placeholder={quickMode ? "Saisissez un ou plusieurs numéros (ex: 12 34 56)" : placeholder}
            className={error ? "border-red-500" : ""}
            disabled={value.length >= maxNumbers}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          {quickMode && (
            <p className="text-xs text-gray-500 mt-1">
              Raccourcis: Entrée/Espace = Ajouter | Échap = Effacer | Ctrl+Z = Annuler
            </p>
          )}
        </div>
        <Button
          type="button"
          onClick={handleAddClick}
          disabled={!inputValue || value.length >= maxNumbers}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Boutons d'actions */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateRandomNumbers}
            disabled={value.length === maxNumbers}
          >
            Aléatoire
          </Button>
          {value.length > 0 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}
              >
                Effacer tout
              </Button>
              {undoStack.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={undoLastAction}
                  title="Annuler la dernière action"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              {allowHistory && value.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={saveCurrentToHistory}
                  title="Sauvegarder dans l'historique"
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          {persistKey && (value.length > 0 || history.length > 0) && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={clearPersistentData}
              title="Effacer toutes les données sauvegardées"
            >
              Purger
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {required && value.length < maxNumbers && (
            <span>
              {maxNumbers - value.length} manquant(s)
            </span>
          )}
          {value.length === maxNumbers && (
            <Badge variant="default" className="text-xs">
              Complet ✓
            </Badge>
          )}
        </div>
      </div>
      
      {/* Indicateur de persistance */}
      {persistKey && value.length > 0 && (
        <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <Save className="h-3 w-3" />
          Sauvegardé automatiquement
        </div>
      )}
    </div>
  )
}
