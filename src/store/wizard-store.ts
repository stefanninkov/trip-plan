import { create } from 'zustand'
import type { TripInputs, WizardStep, Destination } from '@/types/wizard'
import { DEFAULT_CURRENCY } from '@/constants/currencies'
import { toIsoDate } from '@/utils/date-helpers'

const DEFAULT_INPUTS: TripInputs = {
  origin: '',
  originCountry: '',
  destinations: [{ city: '', country: '', nights: 3 }],
  startDate: toIsoDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  endDate: toIsoDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
  travelers: 2,
  budgetLevel: 'mid',
  interests: [],
  pace: 'moderate',
  accommodationType: 'any',
  dietaryNeeds: '',
  mobilityNotes: '',
  homeCurrency: DEFAULT_CURRENCY,
  notes: '',
}

export const WIZARD_STEP_ORDER: WizardStep[] = [
  'origin',
  'destinations',
  'dates',
  'travelers',
  'advanced',
]

/**
 * Pure validation so consumers can subscribe to the underlying state
 * rather than a stable function reference.
 */
export function validateStep(step: WizardStep, inputs: TripInputs): boolean {
  switch (step) {
    case 'origin':
      return inputs.origin.trim().length >= 2 && inputs.originCountry.trim().length > 0
    case 'destinations':
      return (
        inputs.destinations.length > 0 &&
        inputs.destinations.every(
          (d) =>
            d.city.trim().length >= 2 &&
            d.country.trim().length > 0 &&
            d.nights > 0
        )
      )
    case 'dates':
      return (
        Boolean(inputs.startDate) &&
        Boolean(inputs.endDate) &&
        new Date(inputs.endDate).getTime() > new Date(inputs.startDate).getTime()
      )
    case 'travelers':
      return inputs.travelers >= 1
    case 'advanced':
      return true
    default:
      return false
  }
}

interface WizardStoreState {
  currentStep: WizardStep
  inputs: TripInputs
  setField: <K extends keyof TripInputs>(key: K, value: TripInputs[K]) => void
  setInputs: (inputs: TripInputs) => void
  addDestination: () => void
  updateDestination: (index: number, patch: Partial<Destination>) => void
  removeDestination: (index: number) => void
  toggleInterest: (interest: string) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: WizardStep) => void
  reset: () => void
}

export const useWizardStore = create<WizardStoreState>((set, get) => ({
  currentStep: 'origin',
  inputs: DEFAULT_INPUTS,

  setField: (key, value) =>
    set((s) => ({ inputs: { ...s.inputs, [key]: value } })),

  setInputs: (inputs) => set({ inputs, currentStep: 'origin' }),

  addDestination: () =>
    set((s) => ({
      inputs: {
        ...s.inputs,
        destinations: [...s.inputs.destinations, { city: '', country: '', nights: 2 }],
      },
    })),

  updateDestination: (index, patch) =>
    set((s) => ({
      inputs: {
        ...s.inputs,
        destinations: s.inputs.destinations.map((d, i) =>
          i === index ? { ...d, ...patch } : d
        ),
      },
    })),

  removeDestination: (index) =>
    set((s) => ({
      inputs: {
        ...s.inputs,
        destinations: s.inputs.destinations.filter((_, i) => i !== index),
      },
    })),

  toggleInterest: (interest) =>
    set((s) => {
      const has = s.inputs.interests.includes(interest)
      return {
        inputs: {
          ...s.inputs,
          interests: has
            ? s.inputs.interests.filter((x) => x !== interest)
            : [...s.inputs.interests, interest],
        },
      }
    }),

  nextStep: () => {
    const idx = WIZARD_STEP_ORDER.indexOf(get().currentStep)
    if (idx < WIZARD_STEP_ORDER.length - 1) {
      set({ currentStep: WIZARD_STEP_ORDER[idx + 1] })
    }
  },

  prevStep: () => {
    const idx = WIZARD_STEP_ORDER.indexOf(get().currentStep)
    if (idx > 0) {
      set({ currentStep: WIZARD_STEP_ORDER[idx - 1] })
    }
  },

  goToStep: (step) => set({ currentStep: step }),

  reset: () => set({ currentStep: 'origin', inputs: DEFAULT_INPUTS }),
}))
