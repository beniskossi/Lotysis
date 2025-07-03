"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
      toast({
        title: "Application installée",
        description: "L'analyseur de loterie a été installé avec succès !",
      })
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [toast])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        toast({
          title: "Installation en cours",
          description: "L'application va être installée...",
        })
      }

      setDeferredPrompt(null)
      setShowInstallBanner(false)
    } catch (error) {
      console.error("Erreur lors de l'installation:", error)
      toast({
        title: "Erreur d'installation",
        description: "Impossible d'installer l'application.",
        variant: "destructive",
      })
    }
  }

  const dismissBanner = () => {
    setShowInstallBanner(false)
  }

  if (isInstalled) {
    return null
  }

  return (
    <>
      {/* Bouton d'installation dans la barre d'outils */}
      {deferredPrompt && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleInstallClick}
          className="flex items-center gap-2 bg-transparent"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Installer l'app</span>
        </Button>
      )}

      {/* Bannière d'installation */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-md mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Installer l'Analyseur de Loterie</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Accédez rapidement à vos analyses depuis votre écran d'accueil
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInstallClick}>
                  Installer
                </Button>
                <Button variant="outline" size="sm" onClick={dismissBanner}>
                  Plus tard
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={dismissBanner} className="p-1 h-auto">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
