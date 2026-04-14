import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TempUnit = 'C' | 'F'

interface PrefsState {
  tempUnit: TempUnit
  setTempUnit: (u: TempUnit) => void
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
      setTempUnit: (u) => set({ tempUnit: u }),
    }),
    { name: 'trip-plan.prefs' }
  )
)
