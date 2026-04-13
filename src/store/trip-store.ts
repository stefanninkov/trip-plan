import { create } from 'zustand'
import type { TripPlan } from '@/types/trip-plan'

interface TripStoreState {
  currentTripId: string | null
  currentPlan: TripPlan | null
  setCurrent: (tripId: string, plan: TripPlan) => void
  clear: () => void
}

export const useTripStore = create<TripStoreState>((set) => ({
  currentTripId: null,
  currentPlan: null,
  setCurrent: (tripId, plan) => set({ currentTripId: tripId, currentPlan: plan }),
  clear: () => set({ currentTripId: null, currentPlan: null }),
}))
