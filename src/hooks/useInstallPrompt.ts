import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Capture the browser's `beforeinstallprompt` event so we can offer a
 * custom "Install app" button in settings. Returns the event (so the
 * caller can prompt()) plus an already-installed flag.
 */
export function useInstallPrompt(): {
  canInstall: boolean
  installed: boolean
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
} {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState<boolean>(() =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari quirk
      (navigator as unknown as { standalone?: boolean }).standalone === true)
  )

  useEffect(() => {
    const onBefore = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onBefore as EventListener)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore as EventListener)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!event) return 'unavailable'
    await event.prompt()
    const choice = await event.userChoice
    if (choice.outcome === 'accepted') {
      setInstalled(true)
    }
    setEvent(null)
    return choice.outcome
  }

  return { canInstall: Boolean(event) && !installed, installed, promptInstall }
}
