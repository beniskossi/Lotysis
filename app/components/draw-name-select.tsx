"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const DRAW_SCHEDULE = {
  Lundi: {
    '10H': 'Reveil',
    '13H': 'Etoile',
    '16H': 'Akwaba',
    '18H15': 'Monday Special',
  },
  Mardi: {
    '10H': 'La Matinale',
    '13H': 'Emergence',
    '16H': 'Sika',
    '18H15': 'Lucky Tuesday',
  },
  Mercredi: {
    '10H': 'Premiere Heure',
    '13H': 'Fortune',
    '16H': 'Baraka',
    '18H15': 'Midweek',
  },
  Jeudi: {
    '10H': 'Kado',
    '13H': 'Privilege',
    '16H': 'Monni',
    '18H15': 'Fortune Thursday',
  },
  Vendredi: {
    '10H': 'Cash',
    '13H': 'Solution',
    '16H': 'Wari',
    '18H15': 'Friday Bonanza',
  },
  Samedi: {
    '10H': 'Soutra',
    '13H': 'Diamant',
    '16H': 'Moaye',
    '18H15': 'National',
  },
  Dimanche: {
    '10H': 'Benediction',
    '13H': 'Prestige',
    '16H': 'Awale',
    '18H15': 'Espoir',
  },
}

interface DrawNameSelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
}

export function DrawNameSelect({ value, onChange, label = "Nom du tirage", required = false }: DrawNameSelectProps) {
  // Créer une liste unique de tous les noms de tirages
  const allDraws = new Set<string>()
  Object.values(DRAW_SCHEDULE).forEach((day) => {
    Object.values(day).forEach((drawName) => allDraws.add(drawName))
  })
  
  const sortedDraws = Array.from(allDraws).sort()

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Sélectionnez un tirage" />
        </SelectTrigger>
        <SelectContent>
          {sortedDraws.map((drawName) => (
            <SelectItem key={drawName} value={drawName}>
              {drawName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
