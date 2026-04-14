import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TempUnit = 'C' | 'F'
export type ThemeMode = 'dark' | 'light'

interface PrefsState {
  tempUnit: TempUnit
  theme: ThemeMode
  setTempUnit: (u: TempUnit) => void
  setTheme: (t: ThemeMode) => void
}

/**
 * User-facing preferences persisted in localStorage. Kept small and
 * separate from the auth / trip stores so preference changes don't
 * invalidate unrelated selectors.
 */
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      tempUnit: 'C',
      theme: 'dark',
      setTempUnit: (u) => set({ tempUnit: u }),
      setTheme: (t) => {
        applyTheme(t)
        set({ theme: t })
      },
    }),
    {
      name: 'trip-plan.prefs',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    }
  )
)

function applyTheme(t: ThemeMode): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = t
}
