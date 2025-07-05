"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

interface NumberInputProps {
  label: string
  required?: boolean
  maxNumbers?: number
  minNumber?: number
  maxNumber?: number
  value: number[]
  onChange: (numbers: number[]) => void
  placeholder?: string
}

export function NumberInput({
  label,
  required = false,
  maxNumbers = 5,
  minNumber = 1,
  maxNumber = 90,
  value,
  onChange,
  placeholder = "Entrez un numéro..."
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState("")

  const addNumber = (num: number) => {
    setError("")
    
    // Vérifications
    if (value.length >= maxNumbers) {
      setError(`Maximum ${maxNumbers} numéros autorisés`)
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
    
    const newNumbers = [...value, num].sort((a, b) => a - b)
    onChange(newNumbers)
    setInputValue("")
  }

  const removeNumber = (numToRemove: number) => {
    const newNumbers = value.filter(num => num !== numToRemove)
    onChange(newNumbers)
    setError("")
  }

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const num = parseInt(inputValue)
      if (!isNaN(num)) {
        addNumber(num)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Permettre seulement les chiffres
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
    const randomNumbers: number[] = []
    while (randomNumbers.length < maxNumbers) {
      const randomNum = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber
      if (!randomNumbers.includes(randomNum)) {
        randomNumbers.push(randomNum)
      }
    }
    onChange(randomNumbers.sort((a, b) => a - b))
    setError("")
  }

  const clearAll = () => {
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
      <div className="flex items-center justify-between">
        <Label className="font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">
          {value.length}/{maxNumbers}
        </Badge>
      </div>

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
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleInputKeyPress}
            placeholder={placeholder}
            className={error ? "border-red-500" : ""}
            disabled={value.length >= maxNumbers}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
      <div className="flex gap-2 justify-between">
        <div className="flex gap-2">
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAll}
            >
              Effacer tout
            </Button>
          )}
        </div>
        
        {required && value.length < maxNumbers && (
          <span className="text-sm text-gray-500 self-center">
            {maxNumbers - value.length} numéro(s) manquant(s)
          </span>
        )}
      </div>
    </div>
  )
}
