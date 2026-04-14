import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

function typing(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null
  if (!t) return false
  const tag = t.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if ((t as HTMLElement).isContentEditable) return true
  return false
}

/**
 * Global keyboard shortcuts mounted at the app root. Two-key "g x"
 * sequences for navigation, plain keys for discrete actions. No
 * capturing while the user is typing in an input / textarea.
 */
export function useKeyboardShortcuts(): void {
  const navigate = useNavigate()

  useEffect(() => {
    let lastG = 0
    const onKey = (e: KeyboardEvent): void => {
      if (typing(e)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const now = Date.now()
      if (e.key === 'g') {
        lastG = now
        return
      }
      if (now - lastG < 1200) {
        // Inside a g-sequence
        if (e.key === 'h') navigate(ROUTES.home)
        else if (e.key === 'n') navigate(ROUTES.newTrip)
        else if (e.key === 'e') navigate(ROUTES.explore)
        else if (e.key === 't') navigate(ROUTES.myTrips)
        else if (e.key === 's') navigate(ROUTES.settings)
        else if (e.key === '?') navigate(ROUTES.guide)
        lastG = 0
        return
      }

      if (e.key === '?') navigate(ROUTES.guide)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigate])
}
